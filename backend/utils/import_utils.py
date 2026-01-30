import pandas as pd
import re
from backend.models import Personnel
from sqlalchemy.orm import Session

def process_excel_file(file_path: str, db: Session):
    print(f"Reading Excel file: {file_path}")
    try:
        # Force NRP to string to preserve leading zeros
        df = pd.read_excel(file_path, header=None, dtype=str)
    except Exception as e:
        raise ValueError(f"Failed to read Excel file: {str(e)}")
    
    header_idx = -1
    for i, row in df.iterrows():
        row_values = [str(x).upper() for x in row.values]
        # Check for core columns: NO, NAMA, PANGKAT, NRP (flexible match)
        if "NO" in row_values and "NAMA" in row_values and any("NRP" in str(x) for x in row_values):
            header_idx = i
            print(f"Header found at row {i}")
            break
            
    if header_idx == -1:
        # Fallback: Try header=0 directly if standard format
        try:
             if "NAMA" in [str(x).upper() for x in df.iloc[0].values]:
                header_idx = 0
        except:
             pass
             
        if header_idx == -1:
             raise ValueError("Could not find header row with 'NO', 'NAMA', and 'NRP'")

    df.columns = df.iloc[header_idx]
    df = df[header_idx+1:]
    
    # Column mapping
    col_map = {}
    for col in df.columns:
        c_str = str(col).upper().strip()
        if "NO" == c_str: col_map['no'] = col
        elif "NAMA" in c_str: col_map['nama'] = col
        elif "PANGKAT" in c_str: col_map['pangkat'] = col
        elif "NRP" in c_str: col_map['nrp'] = col
        elif "JABATAN" in c_str: col_map['jabatan'] = col
        elif "BAG" in c_str or "BAGIAN" in c_str: col_map['bag'] = col
        elif "KELAMIN" in c_str or "JK" in c_str: col_map['jenis_kelamin'] = col
        
    print(f"Column Mapping: {col_map}")
    
    seen_nrps = set()
    stats = {"added": 0, "updated": 0, "skipped": 0, "total": 0}
    details = []
    
    for index, row in df.iterrows():
        # Validation: 'NO' must be present/numeric-ish or 'NRP' present
        # Skip purely empty rows
        if pd.isna(row[col_map.get('nrp', '')]) and pd.isna(row[col_map.get('nama', '')]):
            continue
            
        nrp_raw = str(row[col_map.get('nrp')]).strip()
        if not nrp_raw or nrp_raw.lower() == 'nan':
            continue
            
        # Clean NRP
        nrp = re.sub(r'[^0-9]', '', nrp_raw)
        if not nrp: continue

        if nrp in seen_nrps: continue
        seen_nrps.add(nrp)
        
        nama = str(row[col_map.get('nama')]).strip()
        pangkat = str(row[col_map.get('pangkat')]).strip()
        pangkat = str(row[col_map.get('pangkat')]).strip()
        jabatan = str(row[col_map.get('jabatan')]).strip()
        bag = str(row[col_map.get('bag')]).strip() if 'bag' in col_map else None
        jk = str(row[col_map.get('jenis_kelamin')]).strip() if 'jenis_kelamin' in col_map else None

        # Clean NaNs
        if nama.lower() == 'nan': nama = ""
        if pangkat.lower() == 'nan': pangkat = ""
        if jabatan.lower() == 'nan': jabatan = ""
        if bag and (bag.lower() == 'nan' or bag == ''): bag = None
        if jk and (jk.lower() == 'nan' or jk == ''): jk = None
        
        existing = db.query(Personnel).filter(Personnel.nrp == nrp).first()
        
        if existing:
            changes = []
            if existing.nama != nama: changes.append({"field": "Nama", "old": existing.nama, "new": nama})
            if existing.pangkat != pangkat: changes.append({"field": "Pangkat", "old": existing.pangkat, "new": pangkat})
            if existing.jabatan != jabatan: changes.append({"field": "Jabatan", "old": existing.jabatan, "new": jabatan})
            if bag and existing.bag != bag: changes.append({"field": "Bagian", "old": existing.bag, "new": bag})
            if jk and existing.jenis_kelamin != jk: changes.append({"field": "Jenis Kelamin", "old": existing.jenis_kelamin, "new": jk})
            
            if changes:
                existing.nama = nama
                existing.nama = nama
                existing.pangkat = pangkat
                existing.jabatan = jabatan
                if bag: existing.bag = bag
                if jk: existing.jenis_kelamin = jk
                
                stats["updated"] += 1
                details.append({"type": "updated", "nrp": nrp, "nama": nama, "changes": changes})
            else:
                stats["skipped"] += 1
        else:
            new_p = Personnel(
                nrp=nrp,
                nama=nama,
                pangkat=pangkat,
                jabatan=jabatan,
                bag=bag,
                jenis_kelamin=jk
            )
            db.add(new_p)
            stats["added"] += 1
            details.append({"type": "added", "nrp": nrp, "nama": nama, "pangkat": pangkat, "jabatan": jabatan})
            
        stats["total"] += 1

    db.commit()
    print(f"Import finished. Stats: {stats}")
    return {"stats": stats, "details": details}
