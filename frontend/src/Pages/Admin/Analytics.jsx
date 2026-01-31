import { Calendar, Download, FileSpreadsheet, FileText, Filter, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { format, addDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays, subYears } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Analytics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState(''); // Track active quick filter
  const [searchParams] = useSearchParams();
  const personnelId = searchParams.get('personnel_id');

  const [reportData, setReportData] = useState({
    total_records: 0,
    total_days: 0,
    unique_personel: 0,
    data: []
  });
  const [loading, setLoading] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave-types/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch leave types", error);
    }
  };

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setStartDate(format(firstDay, 'yyyy-MM-dd'));
    setEndDate(format(lastDay, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalytics();
    }
  }, [startDate, endDate, departmentFilter, leaveTypeFilter, personnelId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        start_date: startDate,
        end_date: endDate,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        leave_type: leaveTypeFilter !== 'all' ? leaveTypeFilter : undefined,
        personnel_id: personnelId || undefined
      };

      const response = await axios.get('/api/reports/summary', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (type) => {
    const now = new Date();
    let start, end;

    switch (type) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'last_3_months':
        end = now;
        start = subMonths(now, 3);
        break;
      case 'this_year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'last_year':
        const lastYear = subYears(now, 1);
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        break;
      default:
        setActiveFilter('');
        return;
    }
    setActiveFilter(type);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleExport = (formatType) => {
    // For Excel and PDF, use the Backend (Formatted with OpenPyXL or ReportLab)
    try {
      if (formatType === 'pdf') {
        generatePDF();
      } else {
        generateExcel();
      }
    } catch (error) {
      console.error("Export error", error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // -- Header --
    doc.setFontSize(18);
    doc.text('POLDA NUSA TENGGARA BARAT', 148.5, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('LAPORAN MANAJEMEN CUTI PERSONEL', 148.5, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Periode: ${format(new Date(startDate), 'dd MMMM yyyy', { locale: localeId })} - ${format(new Date(endDate), 'dd MMMM yyyy', { locale: localeId })}`, 148.5, 40, { align: 'center' });

    // -- Data Table --
    autoTable(doc, {
      startY: 55, // Moved up since summary is removed
      head: [['No', 'NRP', 'Nama', 'Jabatan', 'Jenis Cuti', 'Mulai', 'Selesai', 'Durasi']],
      body: reportData.data.map((item, index) => {
        const endDate = item.tanggal_mulai ? addDays(new Date(item.tanggal_mulai), (item.jumlah_hari || 1) - 1) : null;
        return [
          index + 1,
          item.personnel?.nrp || '-',
          item.personnel?.nama || '-',
          item.personnel?.jabatan || '-',
          item.leave_type?.name || '-',
          item.tanggal_mulai ? format(new Date(item.tanggal_mulai), 'dd MMM yyy') : '-',
          endDate ? format(endDate, 'dd MMM yyy') : '-',
          `${item.jumlah_hari} Hari`
        ];
      }),
      theme: 'plain', // Clean B&W look
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: 0
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: 0,
        lineWidth: 0.1,
        lineColor: 0
      },
      // Remove alternate row color for strict B&W professional look
      alternateRowStyles: { fillColor: [255, 255, 255] },
      foot: [['', '', '', '', '', '', 'Jumlah Personel', `${reportData.unique_personel} Orang`]],
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: 0
      },
      showFoot: 'lastPage'
    });

    // -- Signature Section --
    const finalY = doc.lastAutoTable.finalY + 20;

    // Check if we need a new page for signature
    if (finalY > 250) {
      doc.addPage();
    }

    const signatureY = finalY > 250 ? 40 : finalY;
    const signatureCenterX = 230; // Centered on the right side for Landscape A4 (297mm width)

    // -- Right Side Signature --
    const currentDate = format(new Date(), 'd MMMM yyyy', { locale: localeId });
    doc.text(`Mataram, ${currentDate}`, signatureCenterX, signatureY, { align: 'center' });
    doc.text('A.N. KARO LOGISTIK POLDA NTB', signatureCenterX, signatureY + 5, { align: 'center' });
    doc.text('KASUBAGRENMIN', signatureCenterX, signatureY + 10, { align: 'center' });

    // Space for signature/stamp

    doc.setFont('helvetica', 'bold');
    doc.text('ETEK RIAWAN, S.E.', signatureCenterX, signatureY + 40, { align: 'center' });

    // Manual Underline for Name
    const nameWidth = doc.getTextWidth('ETEK RIAWAN, S.E.');
    doc.setLineWidth(0.5);
    doc.line(signatureCenterX - (nameWidth / 2), signatureY + 41, signatureCenterX + (nameWidth / 2), signatureY + 41);

    doc.setFont('helvetica', 'normal');
    doc.text('KOMPOL NRP 73120869', signatureCenterX, signatureY + 46, { align: 'center' });

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      // doc.text(`Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: localeId })}`, 14, 285);
      // User requested B&W professional - maybe keep print time or remove if too cluttered? 
      // Keeping it small is usually standard for system reports.
      doc.text(`Halaman ${i} dari ${pageCount}`, 280, 200, { align: 'right' }); // Adjusted for Landscape width
    }

    doc.save(`Laporan_Cuti_${startDate}_${endDate}.pdf`);
  };

  const generateExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Prepare Data
    const data = reportData.data.map((item, index) => {
      const endDate = item.tanggal_mulai ? addDays(new Date(item.tanggal_mulai), (item.jumlah_hari || 1) - 1) : null;
      return {
        'No': index + 1,
        'NRP': item.personnel?.nrp,
        'Nama Personel': item.personnel?.nama,
        'Jabatan': item.personnel?.jabatan || '-',
        'Jenis Cuti': item.leave_type?.name,
        'Tanggal Mulai': item.tanggal_mulai ? format(new Date(item.tanggal_mulai), 'dd/MM/yyyy') : '-',
        'Tanggal Selesai': endDate ? format(endDate, 'dd/MM/yyyy') : '-',
        'Durasi (Hari)': item.jumlah_hari,
        'Keterangan': item.reason || '-'
      };
    });

    // 2. Create Search Sheet
    const ws = XLSX.utils.json_to_sheet(data);

    // 3. Add Summary Info at top (insert rows)
    XLSX.utils.sheet_add_aoa(ws, [
      ['LAPORAN MANAJEMEN CUTI PERSONEL'],
      [`Periode: ${startDate} s/d ${endDate}`],
      [''],
    ], { origin: 'A1' });

    // -- Sheet 1: Data Detail (Only this one now) --
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Cuti");

    // Save
    XLSX.writeFile(wb, `Laporan_Cuti_${startDate}_${endDate}.xlsx`);
  };
  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            overflow: visible !important;
          }
          /* Ensure table rows don't break awkwardly */
          tr {
            page-break-inside: avoid;
          }
          /* Hide custom scrollbars */
          ::-webkit-scrollbar {
            display: none;
          }
          /* Override Tailwind overflow classes for print */
          .overflow-x-auto, .overflow-hidden {
            overflow: visible !important;
          }
        }
      `}</style>
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold text-foreground">Analitik & Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {personnelId ? 'Laporan Riwayat Cuti Personel' : 'Buat dan ekspor laporan data cuti'}
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-card border border-border rounded-lg p-6 print:hidden">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Parameter Laporan</h2>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => applyQuickFilter('this_year')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFilter === 'this_year'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Tahun Ini
          </button>
          <button
            onClick={() => applyQuickFilter('this_month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFilter === 'this_month'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => applyQuickFilter('last_month')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFilter === 'last_month'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Bulan Lalu
          </button>
          <button
            onClick={() => applyQuickFilter('last_3_months')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFilter === 'last_3_months'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            3 Bulan Terakhir
          </button>
          <button
            onClick={() => applyQuickFilter('last_year')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeFilter === 'last_year'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Tahun Lalu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tanggal Mulai
            </label>
            <DatePicker
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setActiveFilter('');
              }}
              placeholder="Pilih Tanggal Mulai"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tanggal Selesai
            </label>
            <DatePicker
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setActiveFilter('');
              }}
              placeholder="Pilih Tanggal Selesai"
            />
          </div>



          {/* Leave Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Jenis Cuti
            </label>
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {leaveTypes.map(lt => (
                  <SelectItem key={lt.id} value={lt.code}>{lt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border justify-end">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-transparent dark:border dark:border-green-800 dark:text-green-500 dark:hover:bg-green-900/20 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor ke Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-transparent dark:border dark:border-red-800 dark:text-red-500 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Ekspor ke PDF
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Pengajuan Cuti</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.total_records}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Hari Cuti</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.total_days}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Jumlah Personel</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.unique_personel}</p>
        </div>
      </div>

      {/* Report Preview */}
      <div id="printable-report" className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Document Header */}
        <div className="bg-blue-50/50 dark:bg-slate-800/50 text-foreground px-6 py-8 text-center border-b border-border">
          <h2 className="text-2xl font-semibold mb-2">
            {personnelId && reportData.data.length > 0
              ? `Laporan Cuti: ${reportData.data[0].personnel?.nama}`
              : 'Laporan Manajemen Cuti'}
          </h2>
          <p className="text-sm opacity-90">Portal Pemerintah - Dokumen Resmi</p>
          <div className="mt-4 text-sm opacity-90">
            <p>Periode Laporan: {startDate} sampai {endDate}</p>
            <p className="mt-1">Dibuat pada: {format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })}</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  NRP
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nama
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jenis Cuti
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tanggal Mulai
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tanggal Selesai
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : reportData.data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada data laporan.
                  </td>
                </tr>
              ) : (
                reportData.data.map((record) => {
                  const endDate = record.tanggal_mulai ? addDays(new Date(record.tanggal_mulai), (record.jumlah_hari || 1) - 1) : null;
                  return (
                    <tr key={record.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {record.personnel?.nrp}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {record.personnel?.nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {record.personnel?.jabatan || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {record.leave_type?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {record.tanggal_mulai ? format(new Date(record.tanggal_mulai), 'd MMM yyyy', { locale: localeId }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {endDate ? format(endDate, 'd MMM yyyy', { locale: localeId }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {record.jumlah_hari} Hari
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary bg-muted/50">
                <td colSpan={7} className="px-6 py-4 text-sm font-semibold text-foreground text-right">
                  Total Hari Cuti:
                </td>
                <td className="px-6 py-4 text-sm font-bold text-foreground">
                  {reportData.total_days}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
