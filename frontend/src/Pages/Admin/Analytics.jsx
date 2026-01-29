import { Calendar, Download, FileSpreadsheet, FileText, Filter, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function Analytics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [reportData, setReportData] = useState({
    total_records: 0,
    total_days: 0,
    unique_personel: 0,
    data: []
  });
  const [loading, setLoading] = useState(false);

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
  }, [startDate, endDate, departmentFilter, leaveTypeFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        start_date: startDate,
        end_date: endDate,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        leave_type: leaveTypeFilter !== 'all' ? leaveTypeFilter : undefined
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

  const handleExport = (formatType) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      format: formatType,
      // API expects month/year for simple export, but let's assume we update it to support dates or use the existing logic
      // For now, let's just trigger the existing export which is month-based.
      // TODO: Update backend to support date range export if needed.
      // Current backend supports month/year. Let's try to extract month/year from start date.
      month: new Date(startDate).getMonth() + 1,
      year: new Date(startDate).getFullYear()
    });

    // Direct download
    window.location.href = `/api/reports/export?${params.toString()}&token=${token}`;
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analitik & Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buat dan ekspor laporan data cuti
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Parameter Laporan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tanggal Mulai
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tanggal Selesai
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>



          {/* Leave Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Jenis Cuti
            </label>
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Semua Jenis</option>
              <option value="Cuti Tahunan">Cuti Tahunan</option>
              <option value="Sakit">Sakit</option>
              <option value="Istimewa">Istimewa</option>
              <option value="Melahirkan">Melahirkan</option>
              <option value="Keagamaan">Keagamaan</option>
              <option value="Di Luar Tanggungan Negara">Di Luar Tanggungan Negara</option>
              <option value="Alasan Penting">Alasan Penting</option>
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Dokumen</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.total_records}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Hari Cuti</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.total_days}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Personel Unik</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{reportData.unique_personel}</p>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Document Header */}
        <div className="bg-blue-50/50 dark:bg-slate-800/50 text-foreground px-6 py-8 text-center border-b border-border">
          <h2 className="text-2xl font-semibold mb-2">Laporan Manajemen Cuti</h2>
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
                  Jenis Cuti
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : reportData.data.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada data laporan.
                  </td>
                </tr>
              ) : (
                reportData.data.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {record.personnel?.nrp}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {record.personnel?.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {record.jenis_izin}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(record.tanggal_mulai), 'd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {record.jumlah_hari} Hari
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary bg-muted/50">
                <td colSpan={5} className="px-6 py-4 text-sm font-semibold text-foreground text-right">
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
