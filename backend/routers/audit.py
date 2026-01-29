from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from backend.core import database, auth
from backend import models, schemas
import io
import pandas as pd

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Logs"]
)

@router.get("/export")
async def export_audit_logs(
    search: Optional[str] = None,
    action: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None, # Renamed to avoid confusion with logging status
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user)).join(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.AuditLog.details.ilike(search_term)) |
            (models.AuditLog.target.ilike(search_term)) |
            (models.User.username.ilike(search_term))
        )
    
    if start_date:
        query = query.filter(models.AuditLog.timestamp >= start_date)
        
    if end_date:
        from datetime import datetime, timedelta
        try:
            dt_end = datetime.strptime(end_date, "%Y-%m-%d")
            dt_end_next = dt_end + timedelta(days=1)
            query = query.filter(models.AuditLog.timestamp < dt_end_next)
        except ValueError:
            pass

    if action and action != 'all':
        query = query.filter(models.AuditLog.action.ilike(f"%{action}%"))
        
    if category and category != 'all':
        query = query.filter(models.AuditLog.category == category)
        
    if status_filter and status_filter != 'all':
        query = query.filter(models.AuditLog.status == status_filter)
        
    if role and role != 'all':
        query = query.filter(models.User.role == role)
        
    logs = query.order_by(models.AuditLog.timestamp.desc()).all()
    
    # Create DataFrame
    data = []
    for log in logs:
        data.append({
            "Timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "User": log.user.username if log.user else "Unknown",
            "Role": log.user.role if log.user else "Unknown",
            "Action": log.action,
            "Category": log.category,
            "Target": log.target,
            "Details": log.details,
            "Status": log.status,
            "IP Address": log.ip_address,
            "User Agent": log.user_agent
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Audit Logs', index=False)
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="audit_logs.xlsx"'
    }
    
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.get("/", response_model=List[schemas.AuditLog])
async def get_audit_logs(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    action: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.AuditLog).options(joinedload(models.AuditLog.user)).join(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.AuditLog.details.ilike(search_term)) |
            (models.AuditLog.target.ilike(search_term)) |
            (models.User.username.ilike(search_term))
        )
    
    if start_date:
        query = query.filter(models.AuditLog.timestamp >= start_date)
        
    if end_date:
        # Assuming end_date is just YYYY-MM-DD, we want to include the whole day
        from datetime import datetime, timedelta
        try:
            # If format is YYYY-MM-DD
            dt_end = datetime.strptime(end_date, "%Y-%m-%d")
            dt_end_next = dt_end + timedelta(days=1)
            query = query.filter(models.AuditLog.timestamp < dt_end_next)
        except ValueError:
            pass

    if action and action != 'all':
        query = query.filter(models.AuditLog.action.ilike(f"%{action}%"))
        
    if category and category != 'all':
        query = query.filter(models.AuditLog.category == category)
        
    if status and status != 'all':
        query = query.filter(models.AuditLog.status == status)
        
    if role and role != 'all':
        query = query.filter(models.User.role == role)
        
    # Get total count before pagination
    total = query.count()
    response.headers["X-Total-Count"] = str(total)

    # Sort
    if sort_by:
        # Validate sort field to prevent injection (basic check)
        valid_sort_fields = {
            "timestamp": models.AuditLog.timestamp,
            "user": models.User.username,
            "action": models.AuditLog.action,
            "category": models.AuditLog.category,
            "target": models.AuditLog.target,
            "status": models.AuditLog.status,
            "ip_address": models.AuditLog.ip_address
        }
        
        sort_column = valid_sort_fields.get(sort_by, models.AuditLog.timestamp)
        
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
    else:
        # Default
        query = query.order_by(models.AuditLog.timestamp.desc())
    
    return query.offset(skip).limit(limit).all()

