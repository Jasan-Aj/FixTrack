from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_serializer

from app.db.models import ComplaintCategory, ComplaintStatus, Urgency, UserRole


def _serialize_dt(v: datetime | None) -> str | None:
    if v is None:
        return None
    if v.tzinfo is None:
        return v.isoformat() + "Z"
    return v.isoformat()


class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    name: str
    hostel_block: Optional[str] = None
    room_no: Optional[str] = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.student
    hostel_block: Optional[str] = None
    room_no: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: ComplaintCategory
    urgency: Urgency
    hostel_block: str
    room_no: str
    image_urls: list[str] = []


class FeedbackOut(BaseModel):
    id: int
    complaint_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("created_at")
    def serialize_dt(self, v: datetime | None) -> str | None:
        return _serialize_dt(v)


class ComplaintOut(BaseModel):
    id: int
    student_id: int
    title: str
    description: str
    category: ComplaintCategory
    urgency: Urgency
    hostel_block: str
    room_no: str
    image_urls: list[str]
    status: ComplaintStatus
    assigned_to: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    student: Optional[UserOut] = None
    feedback: Optional[FeedbackOut] = None

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "resolved_at")
    def serialize_dt(self, v: datetime | None) -> str | None:
        return _serialize_dt(v)


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintReassign(BaseModel):
    technician_id: int


class AdminCreateUser(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    skills: list[str] = []


class TechnicianCreate(BaseModel):
    user_id: int
    skills: list[str] = []


class TechnicianOut(BaseModel):
    id: int
    user_id: int
    skills: list[str]
    is_available: bool
    workload_count: int
    user: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = None


class TechnicianProfileOut(BaseModel):
    id: int
    user_id: int
    skills: list[str]
    is_available: bool
    workload_count: int
    completed_count: int
    user: Optional[UserOut] = None

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    complaint_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("created_at")
    def serialize_dt(self, v: datetime | None) -> str | None:
        return _serialize_dt(v)


class AnalyticsOut(BaseModel):
    complaints_by_category: dict[str, int]
    complaints_by_status: dict[str, int]
    avg_resolution_hours: Optional[float] = None
    technician_workload: list[dict]
