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

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class PersonnelBase(BaseModel):
    nrp: str
    nama: str
    pangkat: str
    jabatan: str
    satker: str

class Personnel(PersonnelBase):
    id: int
    
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
    
    personnel: Personnel
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_leaves_today: int
    top_frequent: List[dict]
    recent_activity: List[LeaveHistory]
