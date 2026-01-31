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
    name = Column(String(100), unique=True, nullable=False)  # e.g., "Cuti Tahunan"
    code = Column(String(50), unique=True, nullable=False)  # e.g., "cuti_tahunan"
    default_quota = Column(Integer, nullable=False)     # e.g., 12 days
    gender_specific = Column(String(1), nullable=True)     # 'P' for female-only, None for all
    color = Column(String(20), nullable=True, default="blue")  # Preset color: blue, red, green, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(Enum(Role))
    full_name = Column(String(100))
    email = Column(String(100), unique=True, nullable=True)
    status = Column(String(20), default="active")
    last_active = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    login_attempts = Column(Integer, default=0)

class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    nrp = Column(String(20), unique=True, index=True)
    nama = Column(String(100))
    pangkat = Column(String(50))
    jabatan = Column(String(100))
    bag = Column(String(100), nullable=True)

    jenis_kelamin = Column(String(1), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    leaves = relationship("LeaveHistory", back_populates="personnel", cascade="all, delete-orphan")

class LeaveHistory(Base):
    __tablename__ = "leave_history"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"))
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"))
    jumlah_hari = Column(Integer)
    tanggal_mulai = Column(Date)
    tanggal_selesai = Column(Date, nullable=True)
    alasan = Column(Text)
    file_path = Column(String(255), nullable=True)
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
    action = Column(String(50))
    category = Column(String(50))
    target = Column(String(100))
    target_type = Column(String(50))
    details = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    status = Column(String(20))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
