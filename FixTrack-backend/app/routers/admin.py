from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Complaint, ComplaintStatus, Technician, User, UserRole
from app.db.schemas import (
    AdminCreateUser,
    ComplaintOut,
    ComplaintReassign,
    TechnicianCreate,
    TechnicianOut,
    TechnicianProfileOut,
    UserOut,
)
from app.routers.auth import get_current_user, pwd_context, require_role
from app.services.notifications import create_notification
from app.services.reassignment import build_reassignment_graph, make_initial_state

router = APIRouter()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: AdminCreateUser,
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        role=body.role,
        name=body.name,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    if body.role == UserRole.technician:
        tech = Technician(user_id=new_user.id, skills=body.skills)
        db.add(tech)
        await db.commit()
    return UserOut.model_validate(new_user)


@router.get("/technicians", response_model=list[TechnicianOut])
async def list_technicians(
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Technician).options(selectinload(Technician.user))
    )
    return [TechnicianOut.model_validate(t) for t in result.scalars().all()]


@router.post("/technicians", response_model=TechnicianOut, status_code=status.HTTP_201_CREATED)
async def create_technician(
    body: TechnicianCreate,
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Technician).where(Technician.user_id == body.user_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Technician already exists")
    tech = Technician(user_id=body.user_id, skills=body.skills)
    db.add(tech)
    await db.commit()
    result = await db.execute(
        select(Technician).options(selectinload(Technician.user)).where(Technician.id == tech.id)
    )
    tech = result.scalar_one()
    return TechnicianOut.model_validate(tech)


@router.delete("/technicians/{tech_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_technician(
    tech_id: int,
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Technician).where(Technician.id == tech_id))
    tech = result.scalar_one_or_none()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    await db.delete(tech)
    await db.commit()


@router.get("/complaints", response_model=list[ComplaintOut])
async def all_complaints(
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).options(selectinload(Complaint.student), selectinload(Complaint.feedback))
    )
    return [ComplaintOut.model_validate(c) for c in result.scalars().all()]


@router.patch("/complaints/{complaint_id}/reassign", response_model=ComplaintOut)
async def reassign_complaint(
    complaint_id: int,
    body: ComplaintReassign,
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id).options(selectinload(Complaint.student), selectinload(Complaint.feedback))
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    tech_result = await db.execute(
        select(Technician).where(Technician.id == body.technician_id)
    )
    new_tech = tech_result.scalar_one_or_none()
    if not new_tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    old_tech_id = complaint.assigned_to

    # Reset status to pending so the new technician can accept the task
    complaint.status = ComplaintStatus.pending
    complaint.resolved_at = None
    complaint.assigned_to = body.technician_id
    complaint.assigned_at = datetime.utcnow()
    complaint.reassign_count = (complaint.reassign_count or 0) + 1

    # Adjust workload counts
    if old_tech_id and old_tech_id != body.technician_id:
        old_tech_result = await db.execute(
            select(Technician).where(Technician.id == old_tech_id)
        )
        old_tech = old_tech_result.scalar_one_or_none()
        if old_tech:
            old_tech.workload_count = max(0, (old_tech.workload_count or 0) - 1)
            await create_notification(
                db,
                user_id=old_tech.user_id,
                title="Task Reassigned",
                message=f"Complaint '{complaint.title}' has been reassigned to another technician.",
                complaint_id=complaint.id,
            )

    new_tech.workload_count = (new_tech.workload_count or 0) + 1

    await create_notification(
        db,
        user_id=new_tech.user_id,
        title="New Task Assigned",
        message=f"Complaint '{complaint.title}' has been reassigned to you.",
        complaint_id=complaint.id,
    )

    await create_notification(
        db,
        user_id=complaint.student_id,
        title="Complaint Reassigned",
        message=f"Your complaint '{complaint.title}' has been reassigned to a new technician.",
        complaint_id=complaint.id,
    )

    await db.commit()
    await db.refresh(complaint)
    return ComplaintOut.model_validate(complaint)


@router.get("/technicians/{tech_id}/profile", response_model=TechnicianProfileOut)
async def technician_profile(
    tech_id: int,
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Technician)
        .where(Technician.id == tech_id)
        .options(selectinload(Technician.user))
    )
    tech = result.scalar_one_or_none()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    # Count completed complaints
    completed_count_result = await db.execute(
        select(Complaint).where(
            Complaint.assigned_to == tech_id,
            Complaint.status == ComplaintStatus.completed,
        )
    )
    completed_count = len(completed_count_result.scalars().all())

    profile_data = TechnicianProfileOut(
        id=tech.id,
        user_id=tech.user_id,
        skills=tech.skills,
        is_available=tech.is_available,
        workload_count=tech.workload_count,
        completed_count=completed_count,
        user=UserOut.model_validate(tech.user) if tech.user else None,
    )
    return profile_data


@router.post("/check-overdue")
async def check_overdue_complaints(
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    """Trigger the auto-reassignment workflow for overdue complaints.

    Complaints assigned more than 4 hours ago that are still pending
    or in-progress will be reassigned to the next best available technician.
    """
    graph = build_reassignment_graph()
    initial_state = make_initial_state(db)

    final_state = await graph.ainvoke(initial_state)
    await db.commit()

    return {
        "checked": True,
        "total_overdue": len(final_state.get("overdue_complaints", [])),
        "reassigned": final_state.get("reassigned_count", 0),
        "errors": final_state.get("errors", []),
    }
