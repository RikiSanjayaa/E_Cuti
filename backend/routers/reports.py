from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta
import pandas as pd
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, KeepTogether
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
        from sqlalchemy import extract
        query = query.filter(extract('month', models.LeaveHistory.tanggal_mulai) == month)
        query = query.filter(extract('year', models.LeaveHistory.tanggal_mulai) == year)
    elif year:
        from sqlalchemy import extract
        query = query.filter(extract('year', models.LeaveHistory.tanggal_mulai) == year)
        
    leaves = query.all()
    
    # Prepare data for report
    data_list = []
    
    for idx, leave in enumerate(leaves, 1):
        # 1. Clean up Enum (LeaveType)
        jenis_izin_str = leave.jenis_izin.value if hasattr(leave.jenis_izin, 'value') else str(leave.jenis_izin)
        
        # 2. Format Date
        tgl_str = leave.tanggal_mulai.strftime("%d %b %Y") if leave.tanggal_mulai else "-"
        
        # 3. Combine for cleaner output
        jenis_izin_display = f"{jenis_izin_str}\n(Mulai: {tgl_str})\n({leave.jumlah_hari} hari)"

        data_list.append({
            "NO": idx,
            "NAMA": leave.personnel.nama,
            "PANGKAT": leave.personnel.pangkat,
            "NRP/NIP": leave.personnel.nrp,
            "JABATAN": leave.personnel.jabatan,
            "JENIS IZIN": jenis_izin_display,
            "KETERANGAN": leave.alasan
        })
        
    if not data_list:
        raise HTTPException(status_code=404, detail="No data found for the selected period")

    if format == "excel":
        df = pd.DataFrame(data_list)
        stream = BytesIO()
        # Basic Excel Export using pandas default (uses openpyxl if installed)
        df.to_excel(stream, index=False, sheet_name='Laporan Izin')
        stream.seek(0)
        
        filename = f"Laporan_Izin_{year}_{month if month else 'All'}.xlsx"
        return StreamingResponse(
            stream, 
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    elif format == "pdf":
        buffer = BytesIO()
        # Custom Page Layout
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=landscape(A4),
            leftMargin=30,
            rightMargin=30,
            topMargin=30, 
            bottomMargin=30
        )
        elements = []
        
        styles = getSampleStyleSheet()
        
        # 1. KOP SURAT (Header)
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=12,
            alignment=1, # Center
            leading=14
        )
        
        # Standard Polri Header Format (Centered)
        elements.append(Paragraph("KEPOLISIAN NEGARA REPUBLIK INDONESIA", header_style))
        elements.append(Paragraph("DAERAH NUSA TENGGARA BARAT", header_style))
        elements.append(Paragraph("<u>RO BIRO LOGISTIK</u>", header_style))
        elements.append(Spacer(1, 10))
        
        # Title
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Heading1'],
            fontName='Times-Bold',
            fontSize=14,
            alignment=1, # Center
            leading=18,
            spaceAfter=20
        )
        
        report_title = f"LAPORAN DATA IZIN/CUTI PERSONEL"
        period_text = f"PERIODE: {month}/{year}" if month else f"TAHUN {year}"
        
        elements.append(Paragraph(report_title, title_style))
        elements.append(Paragraph(period_text, ParagraphStyle('SubTitle', parent=title_style, fontSize=12)))
        elements.append(Spacer(1, 15))
        
        # 2. TABLE DATA
        headers = ["NO", "NAMA", "PANGKAT", "NRP/NIP", "JABATAN", "JENIS IZIN", "KETERANGAN"]
        
        # Style for Table Content
        cell_style = ParagraphStyle(
            'CellStyle',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=10,
            leading=12
        )
        
        # Header Style for Table
        header_cell_style = ParagraphStyle(
            'HeaderCellStyle',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=10,
            alignment=1, # Center
            leading=12
        )
        
        # Wrap headers in Paragraphs too (for consistency)
        table_data = [[Paragraph(h, header_cell_style) for h in headers]]
        
        for idx, item in enumerate(leaves, 1):
            # Handle Enum display (clean string)
            jenis_izin_str = item.jenis_izin.value if hasattr(item.jenis_izin, 'value') else str(item.jenis_izin)
            
            # Format Date: 27 Jan 2026
            tgl_str = item.tanggal_mulai.strftime("%d %b %Y") if item.tanggal_mulai else "-"
            
            row = [
                str(idx),
                Paragraph(item.personnel.nama, cell_style),  # Wrapped
                item.personnel.pangkat,
                Paragraph(str(item.personnel.nrp), cell_style), # Wrapped just in case
                Paragraph(item.personnel.jabatan, cell_style), # Wrapped
                Paragraph(f"{jenis_izin_str}<br/>Tgl: {tgl_str}<br/>({item.jumlah_hari} hari)", cell_style), # Wrapped
                Paragraph(item.alasan, cell_style) # Wrapped
            ]
            table_data.append(row)
            
        # Column Widths (Adjusted for better fit)
        # Total available width ~780
        col_widths = [30, 180, 100, 80, 120, 110, 160]
        
        t = Table(table_data, colWidths=col_widths, repeatRows=1)
        
        # Professional Black & White Style
        report_table_style = TableStyle([
            # Alignment
            ('VALIGN', (0, 0), (-1, -1), 'TOP'), # Top align content
            ('ALIGN', (0, 0), (0, -1), 'CENTER'), # NO column Center
            
            # Borders (Black, Thin)
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ])
        t.setStyle(report_table_style)
        elements.append(t)
        elements.append(Spacer(1, 30))
        
        # 3. SIGNATURE BLOCK (Tanda Tangan)
        
        date_str = date.today().strftime("%d %B %Y")
        
        sig_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=11,
            alignment=1, # Center
            leading=14
        )
        
        sig_header = f"Mataram, {date_str}<br/>A.N. KARO LOGISTIK POLDA NTB<br/>KASUBAGRENMIN"
        sig_name = f"<br/><br/><br/><br/><br/><u><b>ETEK RIAWAN, S.E.</b></u><br/>KOMPOL NRP 73120869"
        
        # Create a 2-column table, signature in right column
        sig_data = [[
            "", # Left empty
            Paragraph(sig_header + sig_name, sig_style) # Right
        ]]
        
        sig_table = Table(sig_data, colWidths=[400, 250])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ]))
        
        elements.append(KeepTogether(sig_table))
        
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"Laporan_Izin_{year}_{month if month else 'All'}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
