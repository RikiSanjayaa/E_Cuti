from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..core.database import get_db
from ..models import Holiday, User, Role
from ..core.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/holidays",
    tags=["holidays"],
    responses={404: {"description": "Not found"}},
)

# Pydantic Schemas
class HolidayBase(BaseModel):
    date: date
    description: str
    is_active: bool = True

class HolidayCreate(HolidayBase):
    pass

class HolidayResponse(HolidayBase):
    id: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[HolidayResponse])
def get_holidays(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Holiday).filter(Holiday.is_active == True)
    
    if start_date:
        query = query.filter(Holiday.date >= start_date)
    if end_date:
        query = query.filter(Holiday.date <= end_date)
        
    return query.order_by(Holiday.date).all()

@router.post("/", response_model=HolidayResponse)
def create_holiday(
    holiday: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin/atasan can manage holidays? Or just admin? Let's say Admin for now.
    if current_user.role not in [Role.admin, Role.super_admin]:
        raise HTTPException(status_code=403, detail="Not authorized to manage holidays")
        
    existing = db.query(Holiday).filter(Holiday.date == holiday.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Holiday for this date already exists")
        
    db_holiday = Holiday(**holiday.dict())
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

@router.delete("/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [Role.admin, Role.super_admin]:
        raise HTTPException(status_code=403, detail="Not authorized to manage holidays")
        
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
        
    db.delete(holiday)
    db.commit()
    return {"message": "Holiday deleted"}
