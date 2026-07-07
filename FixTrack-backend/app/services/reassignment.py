"""LangGraph workflow for automatic complaint reassignment.

Workflow:
1. check_overdue — scan for complaints assigned > 4 hours ago that are still pending/in_progress
2. find_next_tech — pick the next best available technician (excluding the current one)
3. execute_reassign — update the complaint record and adjust workload counts
4. send_notifications — notify old tech, new tech, and the student
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from langgraph.graph import StateGraph, END
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Complaint, ComplaintStatus, Technician
from app.services.assigner import assign_technician
from app.services.notifications import create_notification

logger = logging.getLogger(__name__)

# ── State ──────────────────────────────────────────────────────────────────


class ReassignmentState(dict):
    """Mutable state dict carried through the graph."""

    __slots__ = ()  # prevent instance __dict__ — we are a dict subclass

    @property
    def db(self) -> AsyncSession:
        return self["db"]

    @property
    def overdue_complaints(self) -> list[Complaint]:
        return self.get("overdue_complaints", [])

    @overdue_complaints.setter
    def overdue_complaints(self, value: list[Complaint]) -> None:
        self["overdue_complaints"] = value

    @property
    def current_index(self) -> int:
        return self.get("current_index", 0)

    @current_index.setter
    def current_index(self, value: int) -> None:
        self["current_index"] = value

    @property
    def current_complaint(self) -> Optional[Complaint]:
        return self.get("current_complaint")

    @current_complaint.setter
    def current_complaint(self, value: Optional[Complaint]) -> None:
        if value is not None:
            self["current_complaint"] = value

    @property
    def next_tech_id(self) -> Optional[int]:
        return self.get("next_tech_id")

    @next_tech_id.setter
    def next_tech_id(self, value: Optional[int]) -> None:
        self["next_tech_id"] = value

    @property
    def errors(self) -> list[str]:
        return self.get("errors", [])

    @errors.setter
    def errors(self, value: list[str]) -> None:
        self["errors"] = value

    @property
    def reassigned_count(self) -> int:
        return self.get("reassigned_count", 0)

    @reassigned_count.setter
    def reassigned_count(self, value: int) -> None:
        self["reassigned_count"] = value

    @property
    def completed(self) -> bool:
        return self.get("completed", False)

    @completed.setter
    def completed(self, value: bool) -> None:
        self["completed"] = value

    # ── helpers ──────────────────────────────────────────────────────────

    def add_error(self, msg: str) -> None:
        errors = self.errors
        errors.append(msg)
        self.errors = errors

    def increment_reassigned(self) -> None:
        self.reassigned_count = self.reassigned_count + 1


def make_initial_state(db: AsyncSession) -> ReassignmentState:
    return ReassignmentState(
        db=db,
        overdue_complaints=[],
        current_index=0,
        current_complaint=None,
        next_tech_id=None,
        errors=[],
        reassigned_count=0,
        completed=False,
    )


# ── Node functions ────────────────────────────────────────────────────────


async def check_overdue(state: ReassignmentState) -> dict[str, Any]:
    """Query complaints that have been assigned > 4 hours and are still active."""
    db = state.db
    deadline = datetime.now(timezone.utc)

    result = await db.execute(
        select(Complaint)
        .where(
            Complaint.assigned_to.isnot(None),
            Complaint.assigned_at.isnot(None),
            Complaint.assigned_at < deadline,  # moved the check to Python below
            Complaint.status.in_([ComplaintStatus.pending, ComplaintStatus.in_progress]),
        )
        .options(selectinload(Complaint.assigned_technician))
        .order_by(Complaint.assigned_at.asc())
    )
    all_overdue: list[Complaint] = []
    for c in result.scalars().all():
        # Check if assigned more than 4 hours ago
        if c.assigned_at is not None:
            elapsed = (deadline - c.assigned_at.replace(tzinfo=timezone.utc)).total_seconds()
            if elapsed >= 4 * 3600:
                all_overdue.append(c)

    logger.info("Found %s overdue complaints", len(all_overdue))
    return {
        "overdue_complaints": all_overdue,
        "current_index": 0,
        "reassigned_count": 0,
        "errors": [],
        "completed": len(all_overdue) == 0,
    }


async def find_next_tech(state: ReassignmentState) -> dict[str, Any]:
    """Pick the next best available technician for the current complaint."""
    complaint = state.current_complaint
    db = state.db
    if not complaint:
        return {"next_tech_id": None, "completed": True}

    # Fetch available technicians excluding the current one
    result = await db.execute(
        select(Technician).where(
            Technician.is_available == True,
            Technician.id != complaint.assigned_to,
        )
    )
    available_techs = result.scalars().all()

    if not available_techs:
        logger.warning("No alternative technicians available for complaint #%s", complaint.id)
        return {"next_tech_id": None}

    tech_dicts = [
        {
            "technician_id": t.id,
            "name": f"Tech #{t.id}",
            "skills": t.skills,
            "workload_count": t.workload_count,
        }
        for t in available_techs
    ]

    assigned_id = await assign_technician(
        category=complaint.category.value if hasattr(complaint.category, "value") else str(complaint.category),
        urgency=complaint.urgency.value if hasattr(complaint.urgency, "value") else str(complaint.urgency),
        hostel_block=complaint.hostel_block,
        technicians=tech_dicts,
    )

    return {"next_tech_id": assigned_id}


async def execute_reassign(state: ReassignmentState) -> dict[str, Any]:
    """Perform the actual reassignment in the database."""
    complaint = state.current_complaint
    next_tech_id = state.next_tech_id
    db = state.db

    if not complaint or not next_tech_id:
        logger.info("Skipping reassignment for complaint #%s — no next tech", complaint.id if complaint else "?")
        return {}

    old_tech_id = complaint.assigned_to

    # Update complaint
    complaint.status = ComplaintStatus.pending
    complaint.resolved_at = None
    complaint.assigned_to = next_tech_id
    complaint.assigned_at = datetime.now(timezone.utc)
    complaint.reassign_count = (complaint.reassign_count or 0) + 1

    # Adjust workload counts
    if old_tech_id:
        old_result = await db.execute(select(Technician).where(Technician.id == old_tech_id))
        old_tech = old_result.scalar_one_or_none()
        if old_tech:
            old_tech.workload_count = max(0, (old_tech.workload_count or 0) - 1)

    new_result = await db.execute(select(Technician).where(Technician.id == next_tech_id))
    new_tech = new_result.scalar_one_or_none()
    if new_tech:
        new_tech.workload_count = (new_tech.workload_count or 0) + 1

    await db.flush()

    logger.info(
        "Reassigned complaint #%s from tech #%s to tech #%s (reassign #%s)",
        complaint.id,
        old_tech_id,
        next_tech_id,
        complaint.reassign_count,
    )

    # Store old tech ID for notification node
    return {"_old_tech_id": old_tech_id}


async def send_notifications(state: ReassignmentState) -> dict[str, Any]:
    """Send notifications to all parties involved."""
    complaint = state.current_complaint
    next_tech_id = state.next_tech_id
    _old_tech_id = state.get("_old_tech_id")
    db = state.db

    if not complaint or not next_tech_id:
        return {}

    # Notify new technician
    new_result = await db.execute(select(Technician).where(Technician.id == next_tech_id))
    new_tech = new_result.scalar_one_or_none()
    if new_tech and new_tech.user_id:
        await create_notification(
            db,
            user_id=new_tech.user_id,
            title="New Task Assigned (Auto-reassignment)",
            message=f"Complaint '{complaint.title}' has been auto-reassigned to you.",
            complaint_id=complaint.id,
        )

    # Notify old technician
    if _old_tech_id:
        old_result = await db.execute(select(Technician).where(Technician.id == _old_tech_id))
        old_tech = old_result.scalar_one_or_none()
        if old_tech and old_tech.user_id:
            await create_notification(
                db,
                user_id=old_tech.user_id,
                title="Task Reassigned (Auto)",
                message=f"Complaint '{complaint.title}' was auto-reassigned due to no response.",
                complaint_id=complaint.id,
            )

    # Notify student
    await create_notification(
        db,
        user_id=complaint.student_id,
        title="Complaint Reassigned",
        message=f"Your complaint '{complaint.title}' has been reassigned to a new technician due to delayed response.",
        complaint_id=complaint.id,
    )

    state.increment_reassigned()
    return {}


async def next_complaint(state: ReassignmentState) -> dict[str, Any]:
    """Advance to the next overdue complaint or finish."""
    next_idx = state.current_index + 1
    overdue = state.overdue_complaints

    if next_idx >= len(overdue):
        return {
            "current_complaint": None,
            "current_index": next_idx,
            "completed": True,
        }

    return {
        "current_complaint": overdue[next_idx],
        "current_index": next_idx,
        "completed": False,
    }


async def should_continue(state: ReassignmentState) -> str:
    """Decide whether to process the next complaint or end."""
    if state.completed:
        return "end"
    if state.current_complaint is None:
        return "end"
    return "continue"


async def should_find_tech(state: ReassignmentState) -> str:
    """After finding next tech, decide: reassign or skip to next complaint."""
    if state.next_tech_id:
        return "reassign"
    return "skip"


# ── Build graph ───────────────────────────────────────────────────────────


def build_reassignment_graph():
    """Build and return the compiled LangGraph workflow."""
    workflow = StateGraph(ReassignmentState)

    # Register nodes
    workflow.add_node("check_overdue", check_overdue)
    workflow.add_node("find_next_tech", find_next_tech)
    workflow.add_node("execute_reassign", execute_reassign)
    workflow.add_node("send_notifications", send_notifications)
    workflow.add_node("next_complaint", next_complaint)

    # Set the entry point
    workflow.set_entry_point("check_overdue")

    # Edges from check_overdue
    workflow.add_conditional_edges(
        "check_overdue",
        should_continue,
        {"continue": "find_next_tech", "end": END},
    )

    # After finding next tech, either reassign or skip
    workflow.add_conditional_edges(
        "find_next_tech",
        should_find_tech,
        {"reassign": "execute_reassign", "skip": "next_complaint"},
    )

    # After reassignment, send notifications then move to next complaint
    workflow.add_edge("execute_reassign", "send_notifications")
    workflow.add_edge("send_notifications", "next_complaint")

    # After advancing to next complaint, loop back or finish
    workflow.add_conditional_edges(
        "next_complaint",
        should_continue,
        {"continue": "find_next_tech", "end": END},
    )

    return workflow.compile()
