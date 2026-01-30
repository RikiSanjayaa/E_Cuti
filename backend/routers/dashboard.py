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
            
    # Top 10 Personnel with most leaves
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

    # Recent Activity (Top 5) - from Audit Logs for all entity types
    from sqlalchemy.orm import joinedload
    recent_activity = db.query(models.AuditLog)\
        .options(joinedload(models.AuditLog.user))\
        .order_by(models.AuditLog.timestamp.desc()).limit(5).all()
    
    # Statistics Counts
    total_leaves = db.query(models.LeaveHistory).count()

    current_month_start = today.replace(day=1)
    current_month_start_dt = datetime(current_month_start.year, current_month_start.month, 1)
    leaves_this_month = db.query(models.LeaveHistory).filter(models.LeaveHistory.created_at >= current_month_start_dt).count()

    total_personel = db.query(models.Personnel).count()

    avg_duration = db.query(func.avg(models.LeaveHistory.jumlah_hari)).scalar() or 0.0

    # Leave Distribution
    leave_dist_query = db.query(
        models.LeaveType.name,
        models.LeaveType.color,
        func.count(models.LeaveHistory.id).label('count')
    ).join(models.LeaveHistory, models.LeaveType.id == models.LeaveHistory.leave_type_id)\
     .group_by(models.LeaveType.name, models.LeaveType.color).all()
    
    leave_distribution = []
    total_entries_dist = sum(item[2] for item in leave_dist_query)
    
    for name, color, count in leave_dist_query:
        leave_distribution.append({
            "type": name,
            "count": count,
            "total": total_entries_dist,
            "color": f"bg-{color}-500" if color else "bg-blue-500"
        })

    # Department Summary (Grouped by Jabatan)
    entries_per_jabatan = db.query(
        models.Personnel.jabatan,
        func.count(models.LeaveHistory.id).label('entries')
    ).join(models.LeaveHistory, models.Personnel.id == models.LeaveHistory.personnel_id)\
     .group_by(models.Personnel.jabatan).all()
     
    personnel_per_jabatan = db.query(
        models.Personnel.jabatan,
        func.count(models.Personnel.id).label('personnel_count')
    ).group_by(models.Personnel.jabatan).all()
    
    dept_map = {}
    for jabatan, entries in entries_per_jabatan:
        dept_map[jabatan] = {"dept": jabatan, "entries": entries, "personel": 0}
        
    for jabatan, p_count in personnel_per_jabatan:
        if jabatan not in dept_map:
            dept_map[jabatan] = {"dept": jabatan, "entries": 0, "personel": 0}
        dept_map[jabatan]["personel"] = p_count
        
    department_summary = list(dept_map.values())
    department_summary.sort(key=lambda x: x['entries'], reverse=True)
    department_summary = department_summary[:5]

    # Calendar Leaves (from recent_leaves)
    calendar_leaves_data = []
    for leave in recent_leaves:
        # Calculate end date
        end_date = leave.tanggal_mulai + timedelta(days=leave.jumlah_hari - 1)
        
        # Determine color
        color_name = "blue"
        if leave.leave_type:
            color_name = leave.leave_type.color or "blue"
            
        calendar_leaves_data.append({
            "id": leave.id,
            "personnel_name": leave.personnel.nama if leave.personnel else "Unknown",
            "leave_type": leave.leave_type.name if leave.leave_type else "Cuti",
            "start_date": leave.tanggal_mulai,
            "end_date": end_date,
            "color": color_name
        })

    return {
        "total_leaves_today": active_count,
        "total_leave_entries": total_leaves,
        "leaves_this_month": leaves_this_month,
        "total_personel": total_personel,
        "average_duration": round(avg_duration, 1),
        "top_frequent": top_frequent,
        "recent_activity": recent_activity,
        "leave_distribution": leave_distribution,
        "department_summary": department_summary,
        "calendar_leaves": calendar_leaves_data
    }
