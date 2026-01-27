from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from datetime import date, timedelta
from typing import List
from .. import database, models, auth, schemas

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    today = date.today()
    
    # 1. Total Leaves Today
    # Logic: personnel is on leave if today is within [start_date, start_date + days - 1]
    # Since sqlite doesn't support complex date math easily in SQL without extensions, we might fetch active leaves approx.
    # Or fetch all recent leaves and filter in python, or use basic SQL date comparison string.
    # SQLite stores dates as strings 'YYYY-MM-DD'.
    # We can fetch leaves that started recently (e.g. last 365 days) and filter.
    # Or simpler: count where tanggal_mulai <= today. Filtering end date is harder in pure SQL if we have to add 'jumlah_hari'.
    # For now, let's fetch active leaves via Python filter to be accurate.
    
    # Heuristic: fetch leaves starting within last 90 days.
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
    recent_activity = db.query(models.LeaveHistory).order_by(models.LeaveHistory.created_at.desc()).limit(15).all()
    
    return {
        "total_leaves_today": active_count,
        "top_frequent": top_frequent,
        "recent_activity": recent_activity
    }
