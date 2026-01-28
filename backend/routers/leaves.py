from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Response
from sqlalchemy.orm import Session, joinedload
from datetime import date
import shutil
import uuid
import os
from typing import Optional
from backend.core import database, auth
from backend import models, schemas

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
        .options(joinedload(models.LeaveHistory.personnel))\
        .filter(models.LeaveHistory.created_by == current_user.id)\
        .order_by(models.LeaveHistory.created_at.desc())\
        .limit(5)\
        .all()

@router.get("/", response_model=list[schemas.LeaveHistory])
async def get_all_leaves(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role not in ["super_admin", "atasan"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    query = db.query(models.LeaveHistory).join(models.Personnel).options(joinedload(models.LeaveHistory.personnel))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Personnel.nama.ilike(search_term)) |
            (models.Personnel.nrp.ilike(search_term))
        )
        
    if type_filter and type_filter != 'all':
        query = query.filter(models.LeaveHistory.jenis_izin == type_filter)
    
    # Total Count
    total = query.count()
    response.headers["X-Total-Count"] = str(total)
    
    # Sorting
    if sort_by:
        valid_sort_fields = {
            "created_at": models.LeaveHistory.created_at,
            "tanggal_mulai": models.LeaveHistory.tanggal_mulai,
            "jenis_izin": models.LeaveHistory.jenis_izin,
            "jumlah_hari": models.LeaveHistory.jumlah_hari,
            "nama": models.Personnel.nama,
            "nrp": models.Personnel.nrp
        }
        
        sort_column = valid_sort_fields.get(sort_by, models.LeaveHistory.created_at)
        
        if sort_order == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(models.LeaveHistory.created_at.desc())

    leaves = query.offset(skip).limit(limit).all()

    # Calculate Progressive Sisa Cuti (Snapshot) for each leave record
    if leaves:
        from sqlalchemy import extract, func, or_, and_
        from datetime import datetime
        
        for leave in leaves:
            current_year = leave.tanggal_mulai.year
            
            # Query TOTAL usage for this personnel in this year UP TO this specific leave
            # Condition: (Same year) AND (start_date < this_start OR (start_date == this_start AND created_at <= this_created))
            
            usage_up_to_now = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
                .filter(
                    models.LeaveHistory.personnel_id == leave.personnel_id,
                    extract('year', models.LeaveHistory.tanggal_mulai) == current_year,
                    or_(
                        models.LeaveHistory.tanggal_mulai < leave.tanggal_mulai,
                        and_(
                            models.LeaveHistory.tanggal_mulai == leave.tanggal_mulai,
                            models.LeaveHistory.created_at <= leave.created_at
                        )
                    )
                ).scalar()
            
            used = usage_up_to_now or 0
            leave.sisa_cuti = max(0, 12 - used)

    return leaves

@router.post("/", response_model=schemas.LeaveHistory)
async def create_leave(
    request: Request,
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

    # 1.5 Calculate Quota for ALL leave types (Universal 12 Days Rule)
    # Note: Removed "if jenis_izin == models.LeaveType.cuti_tahunan" check
    from sqlalchemy import extract, func
    from datetime import datetime
    current_year = datetime.now().year
    
    used_q = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
        .filter(
            models.LeaveHistory.personnel_id == personnel.id,
            extract('year', models.LeaveHistory.tanggal_mulai) == current_year
        ).scalar()
        
    used = used_q or 0
    remaining = 12 - used
    if remaining < jumlah_hari:
            raise HTTPException(status_code=400, detail=f"Sisa cuti tidak mencukupi. Sisa: {remaining} hari, Pengajuan: {jumlah_hari} hari.")

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
    auth.log_audit(
        db, 
        current_user.id, 
        "INPUT_IZIN", 
        "Leave Management", 
        nrp, 
        "Personnel", 
        f"Input izin for NRP {nrp}: {jenis_izin} ({jumlah_hari} days)",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return new_leave

@router.put("/{leave_id}", response_model=schemas.LeaveHistory)
async def update_leave(
    request: Request,
    leave_id: int,
    nrp: str = Form(...),
    jenis_izin: str = Form(...),
    jumlah_hari: int = Form(...),
    tanggal_mulai: date = Form(...),
    alasan: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    leave = db.query(models.LeaveHistory).filter(models.LeaveHistory.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
        
    # Verify Personnel if changed (optional logic, but good for consistency)
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel with this NRP not found")

    # Validate Quota on Update (Universal 12 Days Rule)
    # Note: Removed "if jenis_izin == models.LeaveType.cuti_tahunan" check
    from sqlalchemy import extract, func
    from datetime import datetime
    current_year = datetime.now().year
    
    used_q = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
        .filter(
            models.LeaveHistory.personnel_id == personnel.id,
            extract('year', models.LeaveHistory.tanggal_mulai) == current_year,
            models.LeaveHistory.id != leave_id  # Exclude self
        ).scalar()
        
    used = used_q or 0
    remaining = 12 - used
    if remaining < jumlah_hari:
            raise HTTPException(status_code=400, detail=f"Sisa cuti tidak mencukupi untuk update. Sisa: {remaining} hari, Pengajuan baru: {jumlah_hari} hari.")

    # Update fields
    leave.personnel_id = personnel.id
    leave.jenis_izin = jenis_izin
    leave.jumlah_hari = jumlah_hari
    leave.tanggal_mulai = tanggal_mulai
    leave.alasan = alasan
    
    # Handle File Update
    if file:
        if file.content_type not in VALID_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, PDF")
        
        # Delete old file if exists (optional but recommended to save space)
        # if leave.file_path and os.path.exists(leave.file_path):
        #     os.remove(leave.file_path)

        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = f"{UPLOAD_DIR}/{unique_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        leave.file_path = file_path

    db.commit()
    db.refresh(leave)

    auth.log_audit(
        db, 
        current_user.id, 
        "UPDATE_IZIN", 
        "Leave Management", 
        str(leave_id), 
        "LeaveHistory", 
        f"Updated leave for NRP {nrp}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )

    return leave

@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_leave(
    request: Request,
    leave_id: int,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    leave = db.query(models.LeaveHistory).filter(models.LeaveHistory.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
    
    db.delete(leave)
    db.commit()
    
    auth.log_audit(
        db, 
        current_user.id, 
        "DELETE_IZIN", 
        "Leave Management", 
        str(leave_id), 
        "LeaveHistory", 
        f"Deleted leave record ID {leave_id}",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    return None
