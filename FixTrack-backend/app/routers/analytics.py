from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.db.models import Complaint, ComplaintStatus, Technician, User, UserRole
from app.db.schemas import AnalyticsOut
from app.routers.auth import get_current_user, require_role
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("", response_model=AnalyticsOut)
async def get_analytics(
    user: User = Depends(require_role(UserRole.admin)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Complaint))
    complaints = result.scalars().all()

    by_category: dict[str, int] = {}
    by_status: dict[str, int] = {}
    total_hours = 0.0
    resolved_count = 0

    for c in complaints:
        by_category[c.category.value] = by_category.get(c.category.value, 0) + 1
        by_status[c.status.value] = by_status.get(c.status.value, 0) + 1
        if c.status == ComplaintStatus.completed and c.resolved_at and c.created_at:
            delta = c.resolved_at - c.created_at
            total_hours += delta.total_seconds() / 3600
            resolved_count += 1

    avg_resolution = round(total_hours / resolved_count, 2) if resolved_count > 0 else None

    tech_result = await db.execute(
        select(Technician).options(selectinload(Technician.user))
    )
    techs = tech_result.scalars().all()
    workload = []
    for t in techs:
        workload.append({
            "technician_id": t.id,
            "name": t.user.name if t.user else f"Tech #{t.id}",
            "workload_count": t.workload_count,
            "is_available": t.is_available,
        })

    return AnalyticsOut(
        complaints_by_category=by_category,
        complaints_by_status=by_status,
        avg_resolution_hours=avg_resolution,
        technician_workload=workload,
    )
