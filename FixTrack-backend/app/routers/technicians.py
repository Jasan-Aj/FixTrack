from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Complaint, ComplaintStatus, Technician, User, UserRole
from app.db.schemas import ComplaintOut
from app.routers.auth import get_current_user, require_role
from app.services.notifications import create_notification
from app.db.schemas import TechnicianOut

router = APIRouter()


async def _get_technician(user: User, db: AsyncSession) -> Technician:
    """Fetch the technician profile for the current user."""
    result = await db.execute(
        select(Technician).where(Technician.user_id == user.id)
    )
    tech = result.scalar_one_or_none()
    if not tech:
        raise HTTPException(status_code=400, detail="Technician profile not found")
    return tech


@router.get("/tasks", response_model=list[ComplaintOut])
async def my_tasks(
    user: User = Depends(require_role(UserRole.technician)),
    db: AsyncSession = Depends(get_db),
):
    tech = await _get_technician(user, db)
    result = await db.execute(
        select(Complaint)
        .where(Complaint.assigned_to == tech.id)
        .options(selectinload(Complaint.student), selectinload(Complaint.feedback))
    )
    return [ComplaintOut.model_validate(c) for c in result.scalars().all()]


@router.patch("/tasks/{task_id}/status", response_model=ComplaintOut)
async def update_task_status(
    task_id: int,
    status: ComplaintStatus,
    user: User = Depends(require_role(UserRole.technician)),
    db: AsyncSession = Depends(get_db),
):
    tech = await _get_technician(user, db)
    result = await db.execute(
        select(Complaint).where(Complaint.id == task_id).options(selectinload(Complaint.student), selectinload(Complaint.feedback))
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Task not found")
    if complaint.assigned_to != tech.id:
        raise HTTPException(status_code=403, detail="Not assigned to you")

    if status == ComplaintStatus.in_progress and complaint.status == ComplaintStatus.pending:
        complaint.status = ComplaintStatus.in_progress
        await create_notification(
            db,
            user_id=complaint.student_id,
            title="Complaint In Progress",
            message=f"Your complaint '{complaint.title}' is now being worked on.",
            complaint_id=complaint.id,
        )
    elif status == ComplaintStatus.completed and complaint.status == ComplaintStatus.in_progress:
        complaint.status = ComplaintStatus.completed
        complaint.resolved_at = datetime.utcnow()
        tech.workload_count = max(0, tech.workload_count - 1)
        await create_notification(
            db,
            user_id=complaint.student_id,
            title="Complaint Resolved",
            message=f"Your complaint '{complaint.title}' has been resolved.",
            complaint_id=complaint.id,
        )
        await db.flush()
    else:
        raise HTTPException(status_code=400, detail="Invalid status transition")

    await db.commit()
    await db.refresh(complaint)
    return ComplaintOut.model_validate(complaint)


@router.get("/profile", response_model=TechnicianOut)
async def my_profile(
    user: User = Depends(require_role(UserRole.technician)),
    db: AsyncSession = Depends(get_db),
):
    tech = await _get_technician(user, db)
    # Re-fetch with user relationship loaded
    result = await db.execute(
        select(Technician)
        .where(Technician.id == tech.id)
        .options(selectinload(Technician.user))
    )
    tech = result.scalar_one()
    return TechnicianOut.model_validate(tech)


@router.patch("/availability", response_model=TechnicianOut)
async def toggle_availability(
    is_available: bool,
    user: User = Depends(require_role(UserRole.technician)),
    db: AsyncSession = Depends(get_db),
):
    tech = await _get_technician(user, db)
    tech.is_available = is_available
    await db.commit()
    await db.refresh(tech)
    # Re-fetch with user loaded for response
    result = await db.execute(
        select(Technician)
        .where(Technician.id == tech.id)
        .options(selectinload(Technician.user))
    )
    tech = result.scalar_one()
    return TechnicianOut.model_validate(tech)
