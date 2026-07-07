import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    technician = "tech"
    admin = "admin"


class ComplaintStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ComplaintCategory(str, enum.Enum):
    plumbing = "plumbing"
    electrical = "electrical"
    wifi = "wifi"
    carpentry = "carpentry"
    cleaning = "cleaning"
    other = "other"


class Urgency(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    name = Column(String(255), nullable=False)
    hostel_block = Column(String(10), nullable=True)
    room_no = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    technician = relationship("Technician", back_populates="user", uselist=False)
    complaints = relationship("Complaint", back_populates="student")


class Technician(Base):
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    skills = Column(ARRAY(String), default=[], nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    workload_count = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="technician")
    assigned_complaints = relationship("Complaint", back_populates="assigned_technician")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), nullable=False)
    urgency = Column(Enum(Urgency), nullable=False)
    hostel_block = Column(String(10), nullable=False)
    room_no = Column(String(20), nullable=False)
    image_urls = Column(JSONB, default=list, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.pending, nullable=False)
    assigned_to = Column(Integer, ForeignKey("technicians.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    reassign_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="complaints")
    assigned_technician = relationship("Technician", back_populates="assigned_complaints")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="feedback")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")
    complaint = relationship("Complaint")
