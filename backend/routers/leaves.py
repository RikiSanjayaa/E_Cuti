from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Response
from fastapi.responses import StreamingResponse
import io
import pandas as pd
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func, or_, and_
from datetime import date, datetime
import shutil
import uuid
import os
from typing import Optional
from backend.core import database, auth
from backend.core.websocket import manager
from backend import models, schemas

router = APIRouter(
    prefix="/api/leaves",
    tags=["Leaves"]
)

@router.get("/export")
async def export_leaves(
    search: str = None,
    type_filter: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.LeaveHistory).join(models.Personnel).join(models.LeaveType)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Personnel.nama.ilike(search_term)) |
            (models.Personnel.nrp.ilike(search_term))
        )
        
    if type_filter and type_filter != 'all':
        query = query.filter(models.LeaveType.code == type_filter)
        
    if sort_by:
        valid_sort_fields = {
            "created_at": models.LeaveHistory.created_at,
            "tanggal_mulai": models.LeaveHistory.tanggal_mulai,
            "jumlah_hari": models.LeaveHistory.jumlah_hari,
            "jenis_izin": models.LeaveType.name,
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
         
    leaves = query.options(joinedload(models.LeaveHistory.leave_type)).all()
    
    data = []
    for leave in leaves:
        data.append({
            "Tgl Entry": leave.created_at.strftime("%Y-%m-%d %H:%M") if leave.created_at else "-",
            "NRP": leave.personnel.nrp if leave.personnel else "-",
            "Personel": leave.personnel.nama if leave.personnel else "-",
            "Jenis Cuti": leave.leave_type.name if leave.leave_type else "-",
            "Tanggal Mulai": leave.tanggal_mulai.strftime("%Y-%m-%d"),
            "Jumlah Hari": leave.jumlah_hari,
            "Alasan": leave.alasan
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Riwayat Cuti', index=False)
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="riwayat_cuti.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

VALID_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]
UPLOAD_DIR = "uploads/evidence"

@router.get("/recent", response_model=list[schemas.LeaveHistory])
async def get_recent_leaves(
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    return db.query(models.LeaveHistory)\
        .options(joinedload(models.LeaveHistory.personnel), joinedload(models.LeaveHistory.leave_type))\
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
    created_by: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role not in ["super_admin", "admin", "atasan"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    query = db.query(models.LeaveHistory)\
        .join(models.Personnel)\
        .join(models.LeaveType)\
        .options(joinedload(models.LeaveHistory.personnel), joinedload(models.LeaveHistory.leave_type))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Personnel.nama.ilike(search_term)) |
            (models.Personnel.nrp.ilike(search_term))
        )
        
    if type_filter and type_filter != 'all':
        query = query.filter(models.LeaveType.code == type_filter)
        
    if created_by:
        query = query.filter(models.LeaveHistory.created_by == created_by)
        
    if start_date:
        query = query.filter(models.LeaveHistory.tanggal_mulai >= start_date)
        
    if end_date:
        query = query.filter(models.LeaveHistory.tanggal_mulai <= end_date)
    
    # Total Count
    total = query.count()
    response.headers["X-Total-Count"] = str(total)
    
    # Sorting
    if sort_by:
        valid_sort_fields = {
            "created_at": models.LeaveHistory.created_at,
            "tanggal_mulai": models.LeaveHistory.tanggal_mulai,
            "jenis_izin": models.LeaveType.name,
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

    # Calculate sisa_cuti for each leave
    for leave in leaves:
        if not leave.personnel or not leave.leave_type:
            continue
            
        current_year = leave.tanggal_mulai.year
        
        # Calculate used quota for this specific year/person/type
        used_q = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
            .filter(
                models.LeaveHistory.personnel_id == leave.personnel_id,
                models.LeaveHistory.leave_type_id == leave.leave_type_id,
                extract('year', models.LeaveHistory.tanggal_mulai) == current_year
            ).scalar()
            
        used = used_q or 0
        quota = leave.leave_type.default_quota
        leave.sisa_cuti = max(0, quota - used)

    return leaves

@router.post("/", response_model=schemas.LeaveHistory)
async def create_leave(
    request: Request,
    nrp: str = Form(...),
    leave_type_id: int = Form(...),
    jumlah_hari: int = Form(...),
    tanggal_mulai: date = Form(...),
    alasan: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    # 1. Verify Personnel
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel with this NRP not found")

    # 2. Verify Leave Type
    leave_type = db.query(models.LeaveType).filter(
        models.LeaveType.id == leave_type_id,
        models.LeaveType.is_active == True
    ).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found or inactive")
    
    # 3. Check gender-specific leave type
    if leave_type.gender_specific:
        if personnel.jenis_kelamin != leave_type.gender_specific:
            raise HTTPException(
                status_code=400, 
                detail=f"Leave type '{leave_type.name}' is only available for personnel with gender '{leave_type.gender_specific}'"
            )

    # 4. Calculate remaining quota for THIS SPECIFIC leave type
    current_year = tanggal_mulai.year
    
    used_q = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
        .filter(
            models.LeaveHistory.personnel_id == personnel.id,
            models.LeaveHistory.leave_type_id == leave_type_id,
            extract('year', models.LeaveHistory.tanggal_mulai) == current_year
        ).scalar()
        
    used = used_q or 0
    remaining = leave_type.default_quota - used
    
    if remaining < jumlah_hari:
        raise HTTPException(
            status_code=400, 
            detail=f"Kuota {leave_type.name} tidak mencukupi. Sisa: {remaining} hari, Pengajuan: {jumlah_hari} hari."
        )

    # 5. File Handling
    file_path = None
    if file:
        if file.content_type not in VALID_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, PDF")
        
        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = f"{UPLOAD_DIR}/{unique_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    # 6. Create Leave Record
    # Snapshot the remaining balance AFTER this leave
    balance_after = remaining - jumlah_hari
    
    new_leave = models.LeaveHistory(
        personnel_id=personnel.id,
        leave_type_id=leave_type_id,
        jumlah_hari=jumlah_hari,
        tanggal_mulai=tanggal_mulai,
        alasan=alasan,
        file_path=file_path,
        created_by=current_user.id,
        balance_remaining=balance_after
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    # Load relationships for response
    db.refresh(new_leave, ['leave_type', 'personnel'])
    
    # 7. Audit Log
    auth.log_audit(
        db, 
        current_user.id, 
        "INPUT_IZIN", 
        "Leave Management", 
        nrp, 
        "Personnel", 
        f"Input izin for NRP {nrp}: {leave_type.name} ({jumlah_hari} days)",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # 8. Notify connected clients
    await manager.notify_change(
        entity="leaves",
        action="create",
        username=current_user.username,
        entity_id=new_leave.id,
        details=f"New leave for {personnel.nama}"
    )
    
    return new_leave

@router.post("/{leave_id}", response_model=schemas.LeaveHistory)
@router.put("/{leave_id}", response_model=schemas.LeaveHistory)
async def update_leave(
    request: Request,
    leave_id: int,
    nrp: str = Form(...),
    leave_type_id: int = Form(...),
    jumlah_hari: int = Form(...),
    tanggal_mulai: date = Form(...),
    alasan: str = Form(...),
    file: Optional[UploadFile] = File(None),
    remove_existing_file: bool = Form(False),
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    leave = db.query(models.LeaveHistory).filter(models.LeaveHistory.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave record not found")
        
    # Verify Personnel
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel with this NRP not found")

    # Verify Leave Type
    leave_type = db.query(models.LeaveType).filter(
        models.LeaveType.id == leave_type_id,
        models.LeaveType.is_active == True
    ).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found or inactive")
    
    # Check gender-specific
    if leave_type.gender_specific and personnel.jenis_kelamin != leave_type.gender_specific:
        raise HTTPException(
            status_code=400, 
            detail=f"Leave type '{leave_type.name}' is only available for personnel with gender '{leave_type.gender_specific}'"
        )

    # Validate Quota on Update (exclude current record)
    current_year = tanggal_mulai.year
    
    used_q = db.query(func.sum(models.LeaveHistory.jumlah_hari))\
        .filter(
            models.LeaveHistory.personnel_id == personnel.id,
            models.LeaveHistory.leave_type_id == leave_type_id,
            extract('year', models.LeaveHistory.tanggal_mulai) == current_year,
            models.LeaveHistory.id != leave_id
        ).scalar()
        
    used = used_q or 0
    remaining = leave_type.default_quota - used
    
    if remaining < jumlah_hari:
        raise HTTPException(
            status_code=400, 
            detail=f"Kuota {leave_type.name} tidak mencukupi untuk update. Sisa: {remaining} hari, Pengajuan baru: {jumlah_hari} hari."
        )

    # Update fields
    leave.personnel_id = personnel.id
    leave.leave_type_id = leave_type_id
    leave.jumlah_hari = jumlah_hari
    leave.tanggal_mulai = tanggal_mulai
    leave.alasan = alasan
    
    # Handle File Update/Removal
    old_file_path = leave.file_path
    
    # If user explicitly requested to remove the file OR is replacing with a new one
    if remove_existing_file or file:
        # Delete old file from disk if it exists
        if old_file_path and os.path.exists(old_file_path):
            try:
                os.remove(old_file_path)
            except OSError:
                pass  # Ignore deletion errors, continue with update
        leave.file_path = None
    
    # Upload new file if provided
    if file:
        if file.content_type not in VALID_FILE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPG, PNG, PDF")

        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        file_path = f"{UPLOAD_DIR}/{unique_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        leave.file_path = file_path

    db.commit()
    db.refresh(leave)
    
    # Load relationships for response
    db.refresh(leave, ['leave_type', 'personnel'])

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

    # Notify connected clients
    await manager.notify_change(
        entity="leaves",
        action="update",
        username=current_user.username,
        entity_id=leave.id,
        details=f"Updated leave for {personnel.nama}"
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
    
    # Delete attached file from disk if it exists
    if leave.file_path and os.path.exists(leave.file_path):
        try:
            os.remove(leave.file_path)
        except OSError:
            pass  # Ignore deletion errors, continue with record deletion
    
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
    
    # Notify connected clients
    await manager.notify_change(
        entity="leaves",
        action="delete",
        username=current_user.username,
        entity_id=leave_id,
        details=f"Deleted leave record"
    )
    
    return None
