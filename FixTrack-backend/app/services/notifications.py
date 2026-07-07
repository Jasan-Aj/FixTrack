from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: int,
    title: str,
    message: str,
    complaint_id: int | None = None,
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        complaint_id=complaint_id,
    )
    db.add(notification)
