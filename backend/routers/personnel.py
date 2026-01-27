from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import json
import pandas as pd
from .. import database, models, auth, schemas

router = APIRouter(
    prefix="/api/personnel",
    tags=["Personnel"]
)

@router.get("/{nrp}", response_model=schemas.Personnel)
async def get_personnel_by_nrp(nrp: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    personnel = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel not found")
    return personnel

@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_personnel(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_admin), db: Session = Depends(database.get_db)):
    # Supported formats: JSON or CSV (via pandas)
    content_type = file.content_type
    
    try:
        if "json" in content_type:
            content = await file.read()
            data = json.loads(content)
            # Expecting detailed list of dicts
        elif "csv" in content_type or "excel" in content_type or file.filename.endswith(".xlsx"):
            # For excel/csv, stick to pandas
            contents = await file.read()
            # Save to temp file to read with pandas? Or BytesIO
            from io import BytesIO
            if file.filename.endswith(".csv"):
                df = pd.read_csv(BytesIO(contents))
            else:
                df = pd.read_excel(BytesIO(contents))
            data = df.to_dict(orient="records")
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Use JSON, CSV or Excel.")
            
        count = 0
        for item in data:
            # Map columns to model. Ideally validate with Pydantic first.
            # Simple mapping: nrp, nama, pangkat, jabatan, satker
            nrp = str(item.get("nrp") or item.get("NRP"))
            if not nrp:
                continue
                
            existing = db.query(models.Personnel).filter(models.Personnel.nrp == nrp).first()
            if existing:
                # Update? Or skip. Let's update.
                existing.nama = item.get("nama") or item.get("NAMA")
                existing.pangkat = item.get("pangkat") or item.get("PANGKAT")
                existing.jabatan = item.get("jabatan") or item.get("JABATAN")
                existing.satker = item.get("satker") or item.get("SATKER")
            else:
                new_personnel = models.Personnel(
                    nrp=nrp,
                    nama=item.get("nama") or item.get("NAMA"),
                    pangkat=item.get("pangkat") or item.get("PANGKAT"),
                    jabatan=item.get("jabatan") or item.get("JABATAN"),
                    satker=item.get("satker") or item.get("SATKER")
                )
                db.add(new_personnel)
            count += 1
        
        db.commit()
        return {"message": f"Successfully imported/updated {count} personnel records"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
