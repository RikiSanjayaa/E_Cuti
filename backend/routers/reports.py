from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta
import pandas as pd
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from .. import database, models, auth

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"]
)

@router.get("/summary")
async def get_analytics_summary(
    start_date: date = Query(None),
    end_date: date = Query(None),
    department: str = Query(None),
    leave_type: str = Query(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.LeaveHistory).join(models.Personnel)
    
    if start_date:
        query = query.filter(models.LeaveHistory.tanggal_mulai >= start_date)
    if end_date:
        query = query.filter(models.LeaveHistory.tanggal_mulai <= end_date)
    if department and department != 'all':
        query = query.filter(models.Personnel.satker == department)
    if leave_type and leave_type != 'all':
        query = query.filter(models.LeaveHistory.jenis_izin == leave_type)
        
    leaves = query.all()
    
    total_days = sum(l.jumlah_hari for l in leaves)
    unique_personel = len(set(l.personnel_id for l in leaves))
    
    return {
        "total_records": len(leaves),
        "total_days": total_days,
        "unique_personel": unique_personel,
        "data": leaves
    }

@router.get("/export")
async def export_report(
    format: str = Query(..., regex="^(pdf|excel)$"),
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=2000),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    # Filter data
    query = db.query(models.LeaveHistory).join(models.Personnel)
    
    if month and year:
        # Filter by start date in month/year
        # SQLite: strftime('%m', tanggal_mulai)
        # But sqlalchemy has extract
        from sqlalchemy import extract
        query = query.filter(extract('month', models.LeaveHistory.tanggal_mulai) == month)
        query = query.filter(extract('year', models.LeaveHistory.tanggal_mulai) == year)
    elif year:
        from sqlalchemy import extract
        query = query.filter(extract('year', models.LeaveHistory.tanggal_mulai) == year)
        
    leaves = query.all()
    
    # Prepare data for report
    # Format: NO | NAMA | PANGKAT | NRP/NIP | JABATAN | JUMLAH CUTI / IJIN | KETERANGAN
    data_list = []
    for idx, leave in enumerate(leaves, 1):
        data_list.append({
            "NO": idx,
            "NAMA": leave.personnel.nama,
            "PANGKAT": leave.personnel.pangkat,
            "NRP/NIP": leave.personnel.nrp,
            "JABATAN": leave.personnel.jabatan,
            "JUMLAH CUTI / IJIN": f"{leave.jenis_izin} ({leave.jumlah_hari} hari)",
            "KETERANGAN": leave.alasan
        })
        
    if not data_list:
        raise HTTPException(status_code=404, detail="No data found for the selected period")

    if format == "excel":
        df = pd.DataFrame(data_list)
        stream = BytesIO()
        with pd.ExcelWriter(stream, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Laporan Izin')
        stream.seek(0)
        
        filename = f"Laporan_Izin_{year}_{month if month else 'All'}.xlsx"
        return StreamingResponse(
            stream, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    elif format == "pdf":
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            alignment=1, # Center
            fontSize=14,
            spaceAfter=20
        )
        
        # Header / Kop Surat
        elements.append(Paragraph("KEPOLISIAN NEGARA REPUBLIK INDONESIA", title_style))
        elements.append(Paragraph("DAERAH NUSA TENGGARA BARAT", title_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"LAPORAN DATA IZIN/CUTI PERSONEL - {year}{f'/{month}' if month else ''}", styles['Heading2']))
        elements.append(Spacer(1, 20))
        
        # Table
        # Headers matching the requested format
        headers = ["NO", "NAMA", "PANGKAT", "NRP/NIP", "JABATAN", "JUMLAH CUTI / IJIN", "KETERANGAN"]
        table_data = [headers]
        
        for item in data_list:
            row = [
                item["NO"],
                item["NAMA"],
                item["PANGKAT"],
                str(item["NRP/NIP"]),
                item["JABATAN"],
                item["JUMLAH CUTI / IJIN"],
                item["KETERANGAN"]
            ]
            table_data.append(row)
            
        t = Table(table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)
        
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"Laporan_Izin_{year}_{month if month else 'All'}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
