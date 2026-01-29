from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from datetime import date, timedelta
from typing import List
from backend.core import database, auth
from backend import models, schemas
from datetime import datetime

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    today = date.today()
    cutoff = today - timedelta(days=90)
    recent_leaves = db.query(models.LeaveHistory).filter(models.LeaveHistory.tanggal_mulai >= cutoff).all()
    
    active_count = 0
    for leave in recent_leaves:
        start = leave.tanggal_mulai
        end = start + timedelta(days=leave.jumlah_hari - 1)
        if start <= today <= end:
            active_count += 1
            
    # 2. Top 10 Frequent (Most leaves count)
    # Group by personnel_id
    top_frequent_query = db.query(
        models.LeaveHistory.personnel_id,
        func.count(models.LeaveHistory.id).label('count')
    ).group_by(models.LeaveHistory.personnel_id).order_by(desc('count')).limit(10).all()
    
    top_frequent = []
    for pid, count in top_frequent_query:
        personnel = db.query(models.Personnel).filter(models.Personnel.id == pid).first()
        if personnel:
            top_frequent.append({
                "nrp": personnel.nrp,
                "nama": personnel.nama,
                "count": count
            })

    # 3. Recent Activity (15 latest)
    from sqlalchemy.orm import joinedload
    recent_activity = db.query(models.LeaveHistory)\
        .options(joinedload(models.LeaveHistory.personnel), joinedload(models.LeaveHistory.leave_type))\
        .order_by(models.LeaveHistory.created_at.desc()).limit(15).all()
    
    # 4. Total Leave Entries
    total_leaves = db.query(models.LeaveHistory).count()

    # 5. Recorded This Month
    current_month_start = today.replace(day=1)
    # Convert date to datetime for comparison with created_at
    current_month_start_dt = datetime(current_month_start.year, current_month_start.month, 1)
    leaves_this_month = db.query(models.LeaveHistory).filter(models.LeaveHistory.created_at >= current_month_start_dt).count()

    # 6. Total Personel
    total_personel = db.query(models.Personnel).count()

    # 7. Average Duration
    avg_duration = db.query(func.avg(models.LeaveHistory.jumlah_hari)).scalar() or 0.0

    return {
        "total_leaves_today": active_count,
        "total_leave_entries": total_leaves,
        "leaves_this_month": leaves_this_month,
        "total_personel": total_personel,
        "average_duration": round(avg_duration, 1),
        "top_frequent": top_frequent,
        "recent_activity": recent_activity
    }
