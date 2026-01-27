from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import database, models, schemas, auth

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit Logs"]
)

@router.get("/", response_model=List[schemas.AuditLog])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    action: Optional[str] = None,
    role: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.AuditLog).join(models.User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.AuditLog.details.ilike(search_term)) |
            (models.AuditLog.target.ilike(search_term)) |
            (models.User.username.ilike(search_term))
        )
    
    if action and action != 'all':
        query = query.filter(models.AuditLog.action.ilike(f"%{action}%"))
        
    if category and category != 'all':
        query = query.filter(models.AuditLog.category == category)
        
    if status and status != 'all':
        query = query.filter(models.AuditLog.status == status)
        
    if role and role != 'all':
        query = query.filter(models.User.role == role)
        
    # Sort by timestamp desc
    query = query.order_by(models.AuditLog.timestamp.desc())
    
    return query.offset(skip).limit(limit).all()
