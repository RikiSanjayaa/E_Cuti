from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List
import json
import pandas as pd
from backend.core import database, auth
from backend import models, schemas

router = APIRouter(
    prefix="/api/personnel",
    tags=["Personnel"]
)

@router.get("/", response_model=List[schemas.Personnel])
async def get_all_personnel(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    query: str = None,
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
        
    # Total Count
    total = q.count()
    response.headers["X-Total-Count"] = str(total)
    
    # Sorting
    if sort_by:
        valid_sort_fields = {
            "nama": models.Personnel.nama,
            "nrp": models.Personnel.nrp,
            "jabatan": models.Personnel.jabatan,
            "pangkat": models.Personnel.pangkat,
            "satker": models.Personnel.satker
        }
        
        sort_column = valid_sort_fields.get(sort_by, models.Personnel.nama)
        
        if sort_order == "desc":
            q = q.order_by(sort_column.desc())
        else:
            q = q.order_by(sort_column.asc())
    else:
        q = q.order_by(models.Personnel.nama.asc())

    personnel_list = q.offset(skip).limit(limit).all()
    
    # Calculate Sisa Cuti for each personnel in specific page
    if personnel_list:
        from datetime import datetime
        from sqlalchemy import extract, func
        
        current_year = datetime.now().year
        personnel_ids = [p.id for p in personnel_list]
        
        # Query total used days for ALL leave types in current year
        usage_query = db.query(
            models.LeaveHistory.personnel_id,
            func.sum(models.LeaveHistory.jumlah_hari).label('total_days')
        ).filter(
            models.LeaveHistory.personnel_id.in_(personnel_ids),
            extract('year', models.LeaveHistory.tanggal_mulai) == current_year
        ).group_by(models.LeaveHistory.personnel_id).all()
        
        usage_map = {res[0]: res[1] for res in usage_query}
        
        for p in personnel_list:
            used = usage_map.get(p.id, 0) or 0 # Handle None if sum returns None
            p.sisa_cuti = max(0, 12 - used)
            
    return personnel_list

@router.post("/", response_model=schemas.Personnel, status_code=status.HTTP_201_CREATED)
async def create_personnel(
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
        satker=personnel.satker
    )
    
    db.add(new_personnel)
    db.commit()
    db.refresh(new_personnel)
    
    # Log audit
    auth.log_audit(
        db,
        current_user.id,
        "CREATE_PERSONNEL",
        "Personnel Management",
        new_personnel.nrp,
        "Personnel",
        f"Created new personnel: {new_personnel.nama}",
        status="success"
    )
    
    return new_personnel

@router.get("/{nrp}", response_model=schemas.Personnel)
async def get_personnel_by_nrp(nrp: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel not found")
        
    # Calculate Leave Quota (Assuming 12 days/year) - ALL TYPES INCLUDED
    from datetime import datetime
    from sqlalchemy import extract
    current_year = datetime.now().year
    
    used_leave = db.query(models.LeaveHistory)\
        .filter(models.LeaveHistory.personnel_id == personnel.id)\
        .filter(extract('year', models.LeaveHistory.tanggal_mulai) == current_year)\
        .all()
        
    total_used = sum([l.jumlah_hari for l in used_leave])
    personnel.sisa_cuti = 12 - total_used
    
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
                else:
                    new_p = models.Personnel(
                        nrp=nrp,
                        nama=item.get("nama"),
                        pangkat=item.get("pangkat"),
                        jabatan=item.get("jabatan"),
                        satker="Polda NTB"
                    )
                    db.add(new_p)
                count += 1
            db.commit()
            return {"message": f"Imported {count} records from JSON"}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use the provided Excel format or JSON.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
