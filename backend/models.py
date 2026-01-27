from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Enum, Date, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class Role(str, enum.Enum):
    super_admin = "super_admin"
    atasan = "atasan"

class LeaveType(str, enum.Enum):
    cuti_tahunan = "Cuti Tahunan"
    sakit = "Sakit"
    istimewa = "Istimewa"
    keagamaan = "Keagamaan"
    melahirkan = "Melahirkan"
    di_luar_tanggungan = "Di Luar Tanggungan Negara"
    alasan_penting = "Alasan Penting"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(Role))
    full_name = Column(String)

class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    nrp = Column(String, unique=True, index=True)
    nama = Column(String)
    pangkat = Column(String)
    jabatan = Column(String)
    satker = Column(String)

    leaves = relationship("LeaveHistory", back_populates="personnel")

class LeaveHistory(Base):
    __tablename__ = "leave_history"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"))
    jenis_izin = Column(Enum(LeaveType))
    jumlah_hari = Column(Integer)
    tanggal_mulai = Column(Date)
    alasan = Column(Text)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    personnel = relationship("Personnel", back_populates="leaves")
    creator = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")
