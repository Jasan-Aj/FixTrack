import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Complaint, ComplaintCategory, ComplaintStatus, Feedback, Technician, Urgency, User, UserRole
from app.db.schemas import (
    ComplaintCreate,
    ComplaintOut,
    ComplaintStatusUpdate,
    FeedbackCreate,
    FeedbackOut,
)
from app.routers.auth import get_current_user, require_role
from app.services.assigner import assign_technician
from app.services.classifier import classify_complaint
from app.services.notifications import create_notification

router = APIRouter()


@router.get("", response_model=list[ComplaintOut])
async def list_complaints(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Complaint).options(selectinload(Complaint.student), selectinload(Complaint.feedback))
    if user.role == UserRole.student:
        query = query.where(Complaint.student_id == user.id)
    result = await db.execute(query)
    return [ComplaintOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=ComplaintOut, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    body: ComplaintCreate,
    user: User = Depends(require_role(UserRole.student)),
    db: AsyncSession = Depends(get_db),
):
    # Classify complaint using LLM
    llm_result = await classify_complaint(body.title, body.description)

    try:
        final_category = ComplaintCategory(llm_result.get("category", body.category.value if isinstance(body.category, ComplaintCategory) else body.category or "other"))
    except ValueError:
        final_category = ComplaintCategory.other
    try:
        final_urgency = Urgency(llm_result.get("urgency", body.urgency.value if isinstance(body.urgency, Urgency) else body.urgency or "medium"))
    except ValueError:
        final_urgency = Urgency.medium

    hostel_block = llm_result.get("hostel_block") or body.hostel_block or user.hostel_block or ""

    complaint = Complaint(
        student_id=user.id,
        title=body.title,
        description=body.description,
        category=final_category,
        urgency=final_urgency,
        hostel_block=hostel_block,
        room_no=body.room_no or user.room_no or "",
        image_urls=body.image_urls,
    )
    db.add(complaint)
    await db.flush()

    # Assign technician via LLM
    result = await db.execute(select(Technician).where(Technician.is_available == True))
    available_techs = result.scalars().all()

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
        category=final_category.value,
        urgency=final_urgency.value,
        hostel_block=hostel_block,
        technicians=tech_dicts,
    )

    if assigned_id is not None:
        assigned_tech = await db.get(Technician, assigned_id)
        if assigned_tech:
            complaint.assigned_to = assigned_tech.id
            complaint.assigned_at = datetime.utcnow()
            assigned_tech.workload_count = (assigned_tech.workload_count or 0) + 1

    await db.commit()
    await db.refresh(complaint, ["student", "feedback"])

    # Create notifications
    await create_notification(
        db,
        user_id=user.id,
        title="Complaint Submitted",
        message=f"Your '{final_category.value}' complaint '{body.title}' has been submitted successfully.",
        complaint_id=complaint.id,
    )

    if complaint.assigned_to:
        tech_result = await db.execute(
            select(Technician).where(Technician.id == complaint.assigned_to)
        )
        assigned_tech = tech_result.scalar_one_or_none()
        if assigned_tech and assigned_tech.user_id:
            await create_notification(
                db,
                user_id=assigned_tech.user_id,
                title="New Task Assigned",
                message=f"New {final_category.value} complaint: {body.title}",
                complaint_id=complaint.id,
            )

    logger.info(
        "Complaint #%s created, classified as %s, assigned to tech #%s",
        complaint.id,
        final_category.value,
        complaint.assigned_to,
    )

    return ComplaintOut.model_validate(complaint)


@router.patch("/{complaint_id}/status", response_model=ComplaintOut)
async def update_status(
    complaint_id: int,
    body: ComplaintStatusUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id).options(
            selectinload(Complaint.student),
            selectinload(Complaint.feedback),
        )
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    if user.role == UserRole.student and complaint.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your complaint")

    if user.role == UserRole.student and body.status != ComplaintStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only cancel complaints",
        )

    old_status = complaint.status
    complaint.status = body.status
    if body.status == ComplaintStatus.completed:
        complaint.resolved_at = datetime.utcnow()
    elif body.status == ComplaintStatus.in_progress and user.role == UserRole.technician:
        complaint.assigned_to = user.technician.id

    await db.flush()

    # Create notifications for status changes
    if body.status != old_status:
        if body.status == ComplaintStatus.in_progress:
            # Notify student that complaint is being worked on
            await create_notification(
                db,
                user_id=complaint.student_id,
                title="Complaint In Progress",
                message=f"Your complaint '{complaint.title}' is now being worked on.",
                complaint_id=complaint.id,
            )
        elif body.status == ComplaintStatus.completed:
            # Notify student that complaint is resolved
            await create_notification(
                db,
                user_id=complaint.student_id,
                title="Complaint Resolved",
                message=f"Your complaint '{complaint.title}' has been resolved.",
                complaint_id=complaint.id,
            )
        elif body.status == ComplaintStatus.cancelled and user.role == UserRole.student:
            # Notify assigned technician that complaint was cancelled
            if complaint.assigned_to:
                tech_result = await db.execute(
                    select(Technician).where(Technician.id == complaint.assigned_to)
                )
                assigned_tech = tech_result.scalar_one_or_none()
                if assigned_tech:
                    await create_notification(
                        db,
                        user_id=assigned_tech.user_id,
                        title="Complaint Cancelled",
                        message=f"Complaint '{complaint.title}' was cancelled by the student.",
                        complaint_id=complaint.id,
                    )

    await db.commit()
    await db.refresh(complaint)
    return ComplaintOut.model_validate(complaint)


@router.post("/{complaint_id}/feedback", response_model=FeedbackOut)
async def create_feedback(
    complaint_id: int,
    body: FeedbackCreate,
    user: User = Depends(require_role(UserRole.student)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id).options(selectinload(Complaint.student))
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    if complaint.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your complaint")
    if complaint.status != ComplaintStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only give feedback on completed complaints",
        )

    existing = await db.execute(select(Feedback).where(Feedback.complaint_id == complaint_id))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback already provided",
        )

    feedback = Feedback(complaint_id=complaint_id, rating=body.rating, comment=body.comment)
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return FeedbackOut.model_validate(feedback)
