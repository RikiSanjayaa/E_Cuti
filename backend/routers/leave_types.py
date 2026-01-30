from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core import database, auth
from backend.core.websocket import manager
from backend import models, schemas

router = APIRouter(
    prefix="/api/leave-types",
    tags=["Leave Types"]
)

@router.get("/", response_model=List[schemas.LeaveType])
async def get_leave_types(
    gender: Optional[str] = None,
    include_inactive: bool = False,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Get all leave types.
    - gender: Filter by gender_specific field ('P' for female, 'L' for male)
              If provided, returns leave types that match the gender OR are not gender-specific
    - include_inactive: If True, includes inactive leave types
    """
    query = db.query(models.LeaveType)
    
    if not include_inactive:
        query = query.filter(models.LeaveType.is_active == True)
    
    if gender:
        # Return leave types that are either:
        # 1. Not gender-specific (gender_specific is None)
        # 2. Match the provided gender
        query = query.filter(
            (models.LeaveType.gender_specific == None) |
            (models.LeaveType.gender_specific == gender)
        )
    
    return query.order_by(models.LeaveType.name).all()

@router.get("/{leave_type_id}", response_model=schemas.LeaveType)
async def get_leave_type(
    leave_type_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a single leave type by ID"""
    leave_type = db.query(models.LeaveType).filter(models.LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")
    return leave_type

@router.post("/", response_model=schemas.LeaveType, status_code=status.HTTP_201_CREATED)
async def create_leave_type(
    request: Request,
    leave_type: schemas.LeaveTypeCreate,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    """Create a new leave type (admin only)"""
    # Check for existing name or code
    existing = db.query(models.LeaveType).filter(
        (models.LeaveType.name == leave_type.name) |
        (models.LeaveType.code == leave_type.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave type with this name or code already exists")
    
    new_leave_type = models.LeaveType(
        name=leave_type.name,
        code=leave_type.code,
        default_quota=leave_type.default_quota,
        gender_specific=leave_type.gender_specific,
        color=leave_type.color,
        is_active=leave_type.is_active
    )
    db.add(new_leave_type)
    db.commit()
    db.refresh(new_leave_type)
    
    # Audit log
    auth.log_audit(
        db,
        current_user.id,
        "CREATE_LEAVE_TYPE",
        "Leave Type Management",
        new_leave_type.name,
        "LeaveType",
        f"Created leave type: {new_leave_type.name} with quota {new_leave_type.default_quota} days",
        status="success",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Notify connected clients
    await manager.notify_change(
        entity="leave_types",
        action="create",
        username=current_user.username,
        entity_id=new_leave_type.id,
        details=f"Created {new_leave_type.name}"
    )
    
    return new_leave_type

@router.put("/{leave_type_id}", response_model=schemas.LeaveType)
async def update_leave_type(
    request: Request,
    leave_type_id: int,
    leave_type_update: schemas.LeaveTypeUpdate,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    """Update a leave type (admin only)"""
    leave_type = db.query(models.LeaveType).filter(models.LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")
    
    # Check for name/code conflicts if updating
    if leave_type_update.name or leave_type_update.code:
        conflict = db.query(models.LeaveType).filter(
            models.LeaveType.id != leave_type_id,
            (
                (models.LeaveType.name == leave_type_update.name) |
                (models.LeaveType.code == leave_type_update.code)
            )
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Another leave type with this name or code already exists")
    
    # Update fields
    update_data = leave_type_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(leave_type, field, value)
    
    db.commit()
    db.refresh(leave_type)
    
    # Audit log
    auth.log_audit(
        db,
        current_user.id,
        "UPDATE_LEAVE_TYPE",
        "Leave Type Management",
        leave_type.name,
        "LeaveType",
        f"Updated leave type: {leave_type.name}",
        status="success",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Notify connected clients
    await manager.notify_change(
        entity="leave_types",
        action="update",
        username=current_user.username,
        entity_id=leave_type.id,
        details=f"Updated {leave_type.name}"
    )
    
    return leave_type

@router.delete("/{leave_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leave_type(
    request: Request,
    leave_type_id: int,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    """
    Soft delete a leave type (sets is_active=False).
    This preserves historical data integrity.
    """
    leave_type = db.query(models.LeaveType).filter(models.LeaveType.id == leave_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")
    
    # Soft delete
    leave_type.is_active = False
    db.commit()
    
    # Audit log
    auth.log_audit(
        db,
        current_user.id,
        "DELETE_LEAVE_TYPE",
        "Leave Type Management",
        leave_type.name,
        "LeaveType",
        f"Deactivated leave type: {leave_type.name}",
        status="success",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Notify connected clients
    await manager.notify_change(
        entity="leave_types",
        action="delete",
        username=current_user.username,
        entity_id=leave_type_id,
        details=f"Deactivated {leave_type.name}"
    )
    
    return None
