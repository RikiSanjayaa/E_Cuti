from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from .models import Role, LeaveType

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: Role
    email: Optional[str] = None
    status: Optional[str] = "active"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[Role] = None
    email: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class User(UserBase):
    id: int
    last_active: Optional[datetime] = None
    created_at: Optional[datetime] = None
    login_attempts: int = 0
    
    class Config:
        from_attributes = True

class PersonnelBase(BaseModel):
    nrp: str
    nama: str
    pangkat: str
    jabatan: str
    satker: str
    jenis_kelamin: Optional[str] = None

class PersonnelCreate(PersonnelBase):
    pass

class Personnel(PersonnelBase):
    id: int
    sisa_cuti: Optional[int] = 12
    
    class Config:
        from_attributes = True

class LeaveCreate(BaseModel):
    nrp: str
    jenis_izin: LeaveType
    jumlah_hari: int
    tanggal_mulai: date
    alasan: str
    
class LeaveHistory(BaseModel):
    id: int
    personnel_id: int
    jenis_izin: LeaveType
    jumlah_hari: int
    tanggal_mulai: date
    alasan: str
    file_path: Optional[str] = None
    created_at: datetime
    created_by: int
    
    personnel: Optional[Personnel] = None
    creator: Optional[User] = None
    sisa_cuti: Optional[int] = None # Allow computed field
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_leaves_today: int
    total_leave_entries: int
    leaves_this_month: int
    total_personel: int
    average_duration: float
    top_frequent: List[dict]
    recent_activity: List[LeaveHistory]

class AuditLogBase(BaseModel):
    action: str
    category: str
    target: str
    target_type: str
    details: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str

class AuditLogCreate(AuditLogBase):
    user_id: int

class AuditLog(AuditLogBase):
    id: int
    user_id: int
    timestamp: datetime
    user: Optional[User] = None
    
    class Config:
        from_attributes = True

class AnalyticsSummary(BaseModel):
    total_records: int
    total_days: int
    unique_personel: int
    data: List[LeaveHistory]
