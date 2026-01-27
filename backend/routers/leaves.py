from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import date
import shutil
import uuid
import os
from typing import Optional
from .. import database, models, auth, schemas

router = APIRouter(
    prefix="/api/leaves",
    tags=["Leaves"]
)

VALID_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
UPLOAD_DIR = "uploads/evidence"

@router.get("/recent", response_model=list[schemas.LeaveHistory])
async def get_recent_leaves(
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    return db.query(models.LeaveHistory)\
        .filter(models.LeaveHistory.created_by == current_user.id)\
        .order_by(models.LeaveHistory.created_at.desc())\
        .limit(5)\
        .all()

@router.get("/", response_model=list[schemas.LeaveHistory])
async def get_all_leaves(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    return db.query(models.LeaveHistory)\
        .order_by(models.LeaveHistory.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()

@router.post("/", response_model=schemas.LeaveHistory)
async def create_leave(
    nrp: str = Form(...),
    jenis_izin: str = Form(...),
    jumlah_hari: int = Form(...),
    tanggal_mulai: date = Form(...),
    alasan: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_admin), # Restricted to Admin
    db: Session = Depends(database.get_db)
):
    # 1. Verify Personnel
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel with this NRP not found")

    # 2. File Handling
    file_path = None
    if file:
        if file.content_type not in VALID_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, PDF")
        
        # Generate unique filename
        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = f"{UPLOAD_DIR}/{unique_filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    # 3. Create Leave Record
    new_leave = models.LeaveHistory(
        personnel_id=personnel.id,
        jenis_izin=jenis_izin,
        jumlah_hari=jumlah_hari,
        tanggal_mulai=tanggal_mulai,
        alasan=alasan,
        file_path=file_path,
        created_by=current_user.id
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    # 4. Audit Log
    audit_log = models.AuditLog(
        user_id=current_user.id,
        action="INPUT_IZIN",
        details=f"Input izin for NRP {nrp}: {jenis_izin} ({jumlah_hari} days)"
    )
    db.add(audit_log)
    db.commit()
    
    return new_leave
