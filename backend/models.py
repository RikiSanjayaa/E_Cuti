from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum, Date, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .core.database import Base

from datetime import datetime

class Role(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    atasan = "atasan"

class LeaveType(Base):
    """Database-driven leave types with configurable quotas"""
    __tablename__ = "leave_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)  # e.g., "Cuti Tahunan"
    code = Column(String, unique=True, nullable=False)  # e.g., "cuti_tahunan"
    default_quota = Column(Integer, nullable=False)     # e.g., 12 days
    gender_specific = Column(String, nullable=True)     # 'P' for female-only, None for all
    color = Column(String, nullable=True, default="blue")  # Preset color: blue, red, green, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    description = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(Role))
    full_name = Column(String)
    email = Column(String, unique=True, nullable=True)
    status = Column(String, default="active")
    last_active = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    login_attempts = Column(Integer, default=0)

class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    nrp = Column(String, unique=True, index=True)
    nama = Column(String)
    pangkat = Column(String)
    jabatan = Column(String)
    bag = Column(String, nullable=True)

    jenis_kelamin = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    leaves = relationship("LeaveHistory", back_populates="personnel")

class LeaveHistory(Base):
    __tablename__ = "leave_history"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"))
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"))
    jumlah_hari = Column(Integer)
    tanggal_mulai = Column(Date)
    alasan = Column(Text)
    file_path = Column(String, nullable=True)
    balance_remaining = Column(Integer, nullable=True) # Snapshot of balance after this leave
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    personnel = relationship("Personnel", back_populates="leaves")
    leave_type = relationship("LeaveType")
    creator = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    category = Column(String)
    target = Column(String)
    target_type = Column(String)
    details = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    status = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
