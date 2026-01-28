import pandas as pd
import re
from .models import Personnel
from sqlalchemy.orm import Session

def parse_pangkat_nrp(value):
    """
    Parses various formats:
    - 'KOMBES POL / 69030314' -> ('KOMBES POL', '69030314')
    - 'AKBP NRP 73110596' -> ('AKBP', '73110596')
    - 'PENDA (III A)\n1996...' -> ('PENDA (III A)', '1996...')
    """
    if not isinstance(value, str):
        return str(value), ""
    
    # 1. Try splitting by slash (Standard)
    if '/' in value:
        parts = value.split('/')
        if len(parts) >= 2:
            pangkat = parts[0].strip()
            nrp = re.sub(r'[^0-9]', '', parts[1]) # Clean non-digits
            if nrp: return pangkat, nrp

    # 2. Regex Search for 8-18 consecutive digits (NRP or NIP)
    match = re.search(r'(\d{8,18})', value)
    if match:
        nrp = match.group(1)
        # Remove NRP/NIP from string to get Rankin
        pangkat = re.sub(r'NRP|NIP|\d|\n', '', value, flags=re.IGNORECASE).strip()
        # Clean up extra punctuation
        pangkat = re.sub(r'[./,]+$', '', pangkat).strip()
        return pangkat, nrp
    
    return value, "" # Fallback

def process_excel_file(file_path: str, db: Session):
    print(f"Reading Excel file: {file_path}")
    df = pd.read_excel(file_path, header=None)
    print(f"Excel read. Rows: {len(df)}")
    
    header_idx = -1
    for i, row in df.iterrows():
        # Check if row contains "NO" and "NAMA"
        row_values = [str(x).upper() for x in row.values]
        if "NO" in row_values and "NAMA" in row_values:
            header_idx = i
            print(f"Header found at row {i}")
            break
            
    if header_idx == -1:
        raise ValueError("Could not find header row with 'NO' and 'NAMA'")
        
    # 2. Slice dataframe
    df.columns = df.iloc[header_idx]
    df = df[header_idx+1:]
    print("Dataframe sliced.")
    
    # 3. Iterate and create objects
    personnel_list = []
    
    col_map = {}
    for col in df.columns:
        c_str = str(col).upper()
        if "NO" == c_str.strip():
            col_map['no'] = col
        elif "NAMA" in c_str:
            col_map['nama'] = col
        elif "PANGKAT" in c_str or "NRP" in c_str:
            col_map['pangkat_nrp'] = col
        elif "JABATAN" in c_str:
            col_map['jabatan'] = col
            
    print(f"Column Mapping: {col_map}")
    
    seen_nrps = set()
    stats = {
        "added": 0,
        "updated": 0,
        "skipped": 0,
        "total": 0
    }
    
    details = []
    
    for index, row in df.iterrows():
        # Filter rows where NO is empty or not a number (skip sub-headers)
        no_val = row[col_map.get('no')]
        if pd.isna(no_val):
            continue
            
        try:
            int(no_val) # Try converting to int to ensure it's a data row
        except:
            continue
            
        raw_pangkat_nrp = row[col_map.get('pangkat_nrp')]
        pangkat, nrp = parse_pangkat_nrp(raw_pangkat_nrp)
        
        # Skip if NRP is empty
        if not nrp:
            continue
            
        # Check if we already processed this NRP in this file
        if nrp in seen_nrps:
            print(f"Skipping duplicate NRP in file: {nrp}")
            continue
        seen_nrps.add(nrp)
        
        nama = str(row[col_map.get('nama')]).strip()
        jabatan = str(row[col_map.get('jabatan')]).strip()
        pangkat = str(pangkat).strip()
        
        existing = db.query(Personnel).filter(Personnel.nrp == nrp).first()
        if existing:
            # Check if any field is different
            changes = []
            if existing.nama != nama:
                changes.append({"field": "Nama", "old": existing.nama, "new": nama})
            if existing.pangkat != pangkat:
                changes.append({"field": "Pangkat", "old": existing.pangkat, "new": pangkat})
            if existing.jabatan != jabatan:
                changes.append({"field": "Jabatan", "old": existing.jabatan, "new": jabatan})
            
            if changes:
                print(f"[UPDATE] NRP {nrp}: {changes}")
                
                existing.nama = nama
                existing.pangkat = pangkat
                existing.jabatan = jabatan
                existing.satker = "Polda NTB"
                
                stats["updated"] += 1
                details.append({
                    "type": "updated",
                    "nrp": nrp,
                    "nama": nama,
                    "changes": changes
                })
            else:
                stats["skipped"] += 1
        else:
            new_p = Personnel(
                nrp=nrp,
                nama=nama,
                pangkat=pangkat,
                jabatan=jabatan,
                satker="Polda NTB"
            )
            db.add(new_p)
            stats["added"] += 1
            details.append({
                "type": "added",
                "nrp": nrp,
                "nama": nama,
                "pangkat": pangkat,
                "jabatan": jabatan
            })
            
        stats["total"] += 1
        if stats["total"] % 10 == 0:
            print(f"Processed {stats['total']} records...")
        
    db.commit()
    print(f"Commit successful. Stats: {stats}")
    return {"stats": stats, "details": details}
