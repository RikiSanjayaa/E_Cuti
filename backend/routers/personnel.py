from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response, Request
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Dict
import json
import pandas as pd
from backend.core import database, auth
from backend.core.websocket import manager
from backend import models, schemas
from datetime import date, timedelta, datetime
from backend.utils import import_utils

router = APIRouter(
    prefix="/api/personnel",
    tags=["Personnel"]
)

def calculate_personnel_balances(db: Session, personnel: models.Personnel, year: int = None) -> Dict[str, Dict[str, int]]:
    """
    Calculate remaining leave balances for each leave type for a given personnel.
    Only includes leave types applicable to the personnel's gender.
    Returns: {"Type": {"remaining": 5, "used": 7, "quota": 12}}
    """
    if year is None:
        year = datetime.now().year
    
    # Get all active leave types applicable to this personnel
    leave_types = db.query(models.LeaveType).filter(
        models.LeaveType.is_active == True,
        (models.LeaveType.gender_specific == None) |
        (models.LeaveType.gender_specific == personnel.jenis_kelamin)
    ).all()
    
    # Get usage per leave type for the year
    usage_query = db.query(
        models.LeaveHistory.leave_type_id,
        func.sum(models.LeaveHistory.jumlah_hari).label('total_days')
    ).filter(
        models.LeaveHistory.personnel_id == personnel.id,
        extract('year', models.LeaveHistory.tanggal_mulai) == year
    ).group_by(models.LeaveHistory.leave_type_id).all()
    
    usage_map = {res[0]: res[1] or 0 for res in usage_query}
    
    balances = {}
    for lt in leave_types:
        used = usage_map.get(lt.id, 0)
        remaining = max(0, lt.default_quota - used)
        balances[lt.name] = {
            "remaining": remaining,
            "quota": lt.default_quota,
            "used": used
        }
    
    return balances

@router.get("/stats")
async def get_personnel_stats(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    today = date.today()
    
    # 1. Total Personnel
    total_personnel = db.query(models.Personnel).count()
    
    # 2. On Leave (Sedang Cuti)
    cutoff = today - timedelta(days=120) 
    recent_leaves = db.query(models.LeaveHistory).filter(models.LeaveHistory.tanggal_mulai >= cutoff).all()
    
    on_leave_count = 0
    for leave in recent_leaves:
        start = leave.tanggal_mulai
        end = start + timedelta(days=leave.jumlah_hari - 1)
        if start <= today <= end:
            on_leave_count += 1

    # 3. New Personnel (This Month)
    current_month_start = today.replace(day=1)
    new_personnel_count = db.query(models.Personnel).filter(models.Personnel.created_at >= current_month_start).count()
    
    return {
        "total_personnel": total_personnel,
        "active_personnel": total_personnel - on_leave_count,
        "on_leave": on_leave_count,
        "new_personnel": new_personnel_count
    }

@router.get("/export")
async def export_personnel(
    query: str = None,
    pangkat: str = None,
    jabatan: str = None,
    bag: str = None,
    sort_by: str = "nama",
    sort_order: str = "asc",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    q = db.query(models.Personnel)
    
    if query:
        search = f"%{query}%"
        q = q.filter(
            (models.Personnel.nama.ilike(search)) |
            (models.Personnel.nrp.ilike(search)) |
            (models.Personnel.jabatan.ilike(search))
        )

    if pangkat:
        q = q.filter(models.Personnel.pangkat == pangkat)

    if jabatan:
        q = q.filter(models.Personnel.jabatan.ilike(f"%{jabatan}%"))

    if bag:
        q = q.filter(models.Personnel.bag.ilike(f"%{bag}%"))

    if sort_by:
        valid_sort_fields = {
            "nama": models.Personnel.nama,
            "nrp": models.Personnel.nrp,
            "jabatan": models.Personnel.jabatan,
            "pangkat": models.Personnel.pangkat,
        }
        sort_column = valid_sort_fields.get(sort_by, models.Personnel.nama)
        if sort_order == "desc":
            q = q.order_by(sort_column.desc())
        else:
            q = q.order_by(sort_column.asc())
    else:
        q = q.order_by(models.Personnel.nama.asc())

    personnel_list = q.all()
    
    # Get all leave types for column headers
    leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()

    # Create DataFrame with per-type balances
    data = []
    for p in personnel_list:
        balances = calculate_personnel_balances(db, p)
        row = {
            "NRP": p.nrp,
            "Nama": p.nama,
            "Pangkat": p.pangkat,
            "Jabatan": p.jabatan,
            "Bagian": p.bag,
            "Jenis Kelamin": p.jenis_kelamin or "-"
        }
        # Add balance columns
        for lt in leave_types:
            if lt.name in balances:
                # Balances is now a dict: {"remaining": X, ...}
                row[f"Sisa {lt.name}"] = balances[lt.name]["remaining"]
        data.append(row)
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name='Personnel', index=False)
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="personnel.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.get("/filters")
async def get_personnel_filters(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    pangkats = db.query(models.Personnel.pangkat).distinct().filter(models.Personnel.pangkat != None).all()
    jabatans = db.query(models.Personnel.jabatan).distinct().filter(models.Personnel.jabatan != None).all()
    bags = db.query(models.Personnel.bag).distinct().filter(models.Personnel.bag != None).all()
    
    return {
        "pangkat": sorted([p[0] for p in pangkats if p[0]]),
        "jabatan": sorted([j[0] for j in jabatans if j[0]]),
        "bag": sorted([b[0] for b in bags if b[0]])
    }

@router.get("/", response_model=List[schemas.Personnel])
async def get_all_personnel(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    query: str = None,
    pangkat: str = None,
    jabatan: str = None,
    bag: str = None,
    sort_by: str = "nama",
    sort_order: str = "asc",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    q = db.query(models.Personnel)
    
    if query:
        search = f"%{query}%"
        q = q.filter(
            (models.Personnel.nama.ilike(search)) |
            (models.Personnel.nrp.ilike(search)) |
            (models.Personnel.jabatan.ilike(search))
        )

    if pangkat:
        q = q.filter(models.Personnel.pangkat == pangkat)

    if jabatan:
        q = q.filter(models.Personnel.jabatan.ilike(f"%{jabatan}%"))

    if bag:
        q = q.filter(models.Personnel.bag.ilike(f"%{bag}%"))
        
    # Total Count (Filtered)
    total = q.count()
    response.headers["X-Total-Count"] = str(total)
    
    # Global Count (Unfiltered)
    global_total = db.query(models.Personnel).count()
    response.headers["X-Global-Count"] = str(global_total)
    
    # Sorting
    if sort_by:
        valid_sort_fields = {
            "nama": models.Personnel.nama,
            "nrp": models.Personnel.nrp,
            "jabatan": models.Personnel.jabatan,
            "pangkat": models.Personnel.pangkat,
            "bag": models.Personnel.bag,
        }
        
        sort_column = valid_sort_fields.get(sort_by, models.Personnel.nama)
        
        if sort_order == "desc":
            q = q.order_by(sort_column.desc())
        else:
            q = q.order_by(sort_column.asc())
    else:
        q = q.order_by(models.Personnel.nama.asc())

    personnel_list = q.offset(skip).limit(limit).all()
    
    # Calculate per-type balances for each personnel
    for p in personnel_list:
        p.balances = calculate_personnel_balances(db, p)
            
    return personnel_list

@router.post("/", response_model=schemas.Personnel, status_code=status.HTTP_201_CREATED)
async def create_personnel(
    request: Request,
    personnel: schemas.PersonnelCreate,
    current_user: models.User = Depends(auth.get_current_admin),
    db: Session = Depends(database.get_db)
):
    # Check if NRP already exists
    existing = db.query(models.Personnel).filter(models.Personnel.nrp == personnel.nrp).first()
    if existing:
        raise HTTPException(status_code=400, detail="NRP already exists")
    
    new_personnel = models.Personnel(
        nrp=personnel.nrp,
        nama=personnel.nama,
        pangkat=personnel.pangkat,
        jabatan=personnel.jabatan,
        bag=personnel.bag,
        jenis_kelamin=personnel.jenis_kelamin
    )
    
    db.add(new_personnel)
    db.commit()
    db.refresh(new_personnel)
    
    # Calculate balances for response
    new_personnel.balances = calculate_personnel_balances(db, new_personnel)
    
    # Log audit
    auth.log_audit(
        db,
        current_user.id,
        "CREATE_PERSONNEL",
        "Personnel Management",
        new_personnel.nrp,
        "Personnel",
        f"Created new personnel: {new_personnel.nama}",
        status="success",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Notify connected clients
    await manager.notify_change(
        entity="personnel",
        action="create",
        username=current_user.username,
        entity_id=new_personnel.id,
        details=f"Created personnel {new_personnel.nama}"
    )
    
    return new_personnel

@router.get("/{nrp}", response_model=schemas.Personnel)
async def get_personnel_by_nrp(nrp: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel not found")
    
    # Calculate per-type balances
    personnel.balances = calculate_personnel_balances(db, personnel)
    
    return personnel

@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_personnel(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin), db: Session = Depends(database.get_db)):
    content_type = file.content_type
    
    try:
        # Custom Excel Parser for Polda Format
        if "excel" in content_type or file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
            import shutil
            import tempfile
            import os

            
            # Save to temp file because import_utils needs path (and excel reading is complex)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name
                
            try:
                result = import_utils.process_excel_file(tmp_path, db)
                stats = result["stats"]
                return {
                    "message": f"Process complete. Total: {stats['total']}, Added: {stats['added']}, Updated: {stats['updated']}, Skipped: {stats['skipped']}",
                    "data": result
                }
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Excel parsing error: {str(e)}")
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        # Fallback for simple JSON
        elif "json" in content_type:
            content = await file.read()
            data = json.loads(content)
            count = 0
            for item in data:
                nrp = str(item.get("nrp") or item.get("NRP"))
                if not nrp: continue
                
                existing = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
                if existing:
                    existing.nama = item.get("nama")
                    existing.pangkat = item.get("pangkat")
                    existing.jabatan = item.get("jabatan")
                    existing.bag = item.get("bag")
                    existing.jenis_kelamin = item.get("jenis_kelamin")
                else:
                    new_p = models.Personnel(
                        nrp=nrp,
                        nama=item.get("nama"),
                        pangkat=item.get("pangkat"),
                        jabatan=item.get("jabatan"),
                        bag=item.get("bag"),
                        jenis_kelamin=item.get("jenis_kelamin")
                    )
                    db.add(new_p)
                count += 1
            db.commit()
            return {"message": f"Imported {count} records from JSON"}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use the provided Excel format or JSON.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
