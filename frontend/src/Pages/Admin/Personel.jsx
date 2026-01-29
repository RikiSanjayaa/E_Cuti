import { Search, Filter, Download, X, Mail, Phone, MapPin, Calendar, TrendingUp, Upload, Loader2, Plus, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check, User, Briefcase, Shield, Award } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getLeaveColorClass, getLeaveColors } from '@/utils/leaveUtils';

import AddPersonnelModal from '@/components/AddPersonnelModal';
import ImportDetailsModal from '@/components/ImportDetailsModal';
import ConfirmationModal from '@/components/ConfirmationModal';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation(); // Prevent row click
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center ${copied
        ? 'bg-green-100 text-green-600'
        : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
        }`}
      title={copied ? "Tersalin!" : "Salin NRP"}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

export default function Personel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Import State
  const fileInputRef = useRef(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Add Personnel State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Notification Modal State (for errors/info)
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('nama');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filters State
  const [filterPangkat, setFilterPangkat] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [rankOptions, setRankOptions] = useState([]);
  const [jabatanOptions, setJabatanOptions] = useState([]);
  const [stats, setStats] = useState({
    total_personnel: 0,
    active_personnel: 0,
    on_leave: 0,
    new_personnel: 0
  });

  // Leave types for color lookup
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    fetchFilters();
    fetchStats();
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
      console.error("Failed to fetch leave types:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/personnel/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/personnel/filters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRankOptions(response.data.pangkat || []);
      setJabatanOptions(response.data.jabatan || []);
    } catch (error) {
      console.error("Failed to fetch filters:", error);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [currentPage, sortBy, sortOrder, searchQuery, itemsPerPage, filterPangkat, filterJabatan]);

  // Fetch Leave History when personel selected
  useEffect(() => {
    if (selectedPersonnel?.nrp) {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      // Using existing /api/leaves endpoint which supports search
      axios.get(`/api/leaves/?search=${selectedPersonnel.nrp}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setLeaveHistory(res.data);
          setHistoryLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch history:", err);
          setHistoryLoading(false);
        });
    } else {
      setLeaveHistory([]);
    }
  }, [selectedPersonnel]);

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (searchQuery) params.query = searchQuery;
      if (filterPangkat) params.pangkat = filterPangkat;
      if (filterJabatan) params.jabatan = filterJabatan;

      const response = await axios.get('/api/personnel/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setPersonnel(response.data);

      const total = parseInt(response.headers['x-total-count'] || '0', 10);
      const global = parseInt(response.headers['x-global-count'] || '0', 10);
      setTotalItems(total);
      if (!searchQuery) {
        // If no search, global total is same as total
        setGlobalTotal(total);
      } else if (global > 0) {
        // If search and we have global count from backend
        setGlobalTotal(global);
      }
      setTotalPages(Math.ceil(total / itemsPerPage));

    } catch (error) {
      console.error("Failed to fetch personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPangkat, filterJabatan]);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/personnel/import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data.data);

      fetchPersonnel();
      fetchStats();
      fetchFilters();

    } catch (error) {
      setModal({
        isOpen: true,
        type: 'danger',
        title: 'Import Gagal',
        message: error.response?.data?.detail || error.message
      });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        query: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await axios.get('/api/personnel/export', {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'personnel.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export personnel:", error);
      alert("Gagal mengunduh data personel.");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const filteredPersonnel = personnel; // Direct assignment as filtering is server-side now

  return (
    <div className="relative">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Personel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Direktori personel dan informasi cuti
            </p>
          </div>
          {(localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'admin') && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium w-full sm:w-auto justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Personel
            </button>
          )}
        </div>


        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Personel</p>
            <p className="text-3xl font-semibold text-foreground mt-2">{stats.total_personnel}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Personel Aktif</p>
            <p className="text-3xl font-semibold text-foreground mt-2">{stats.active_personnel}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Sedang Cuti</p>
            <p className="text-3xl font-semibold text-foreground mt-2">{stats.on_leave}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Personel Baru (Bulan Ini)</p>
            <p className="text-3xl font-semibold text-foreground mt-2">{stats.new_personnel}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NRP, atau jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Inline Filters */}
            <select
              value={filterPangkat}
              onChange={(e) => setFilterPangkat(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground min-w-[140px]"
            >
              <option value="">Semua Pangkat</option>
              {rankOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <select
              value={filterJabatan}
              onChange={(e) => setFilterJabatan(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground min-w-[140px]"
            >
              <option value="">Semua Jabatan</option>
              {jabatanOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <div className="flex gap-2">
              {localStorage.getItem('role') !== 'atasan' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    className="hidden"
                    accept=".xlsx, .xls"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm dark:bg-transparent dark:border dark:border-green-800 dark:text-green-500 dark:hover:bg-green-900/20"
                    disabled={importLoading}
                  >
                    {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import Excel
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Ekspor
                  </button>
                </>
              )}
            </div>
          </div>
        </div>



        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('nrp')}
                  >
                    <div className="flex items-center">
                      NRP
                      <SortIcon field="nrp" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('nama')}
                  >
                    <div className="flex items-center">
                      Nama
                      <SortIcon field="nama" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('pangkat')}
                  >
                    <div className="flex items-center">
                      Pangkat
                      <SortIcon field="pangkat" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('jabatan')}
                  >
                    <div className="flex items-center">
                      Jabatan
                      <SortIcon field="jabatan" />
                    </div>
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sisa Cuti
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
                ) : filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                      Tidak ada personel ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPersonnel.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setSelectedPersonnel(p)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{p.nrp}</span>
                          <CopyButton text={p.nrp} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {p.nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {p.pangkat}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {p.jabatan}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {p.balances ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(p.balances)
                              .sort(([a], [b]) => a === 'Melahirkan' ? 1 : b === 'Melahirkan' ? -1 : 0) // Melahirkan last
                              .slice(0, 7)
                              .map(([type, data]) => {
                                // Handle both old (int) and new (obj) structure just in case, though backend is updated
                                const remaining = typeof data === 'object' ? data.remaining : data;
                                return (
                                  <span key={type} className={`text-xs px-1.5 py-0.5 rounded border ${getLeaveColorClass(type, leaveTypes)}`}>
                                    {type.split(' ')[0]}: {remaining}
                                  </span>
                                );
                              })}
                            {Object.keys(p.balances).length > 7 && (
                              <span className="text-xs text-muted-foreground">+{Object.keys(p.balances).length - 7}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-card px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>

        {/* Detail Overlay & Panel */}

        {selectedPersonnel && createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setSelectedPersonnel(null)}
            />
            {/* Side Drawer Container - Fixed Right */}
            <div className="fixed right-0 inset-y-0 w-full md:w-[450px] bg-white shadow-2xl z-[110] overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">

              {/* Simple Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight" title={selectedPersonnel.nama}>
                    {selectedPersonnel.nama}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    {selectedPersonnel.pangkat}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPersonnel(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Grid (Clean Minimalist Design) */}
              <div className="px-6 pb-6 mt-2">

                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  {/* NRP */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                      NRP
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 tracking-wide">{selectedPersonnel.nrp}</span>
                      <CopyButton text={selectedPersonnel.nrp} />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                      Gender
                    </p>
                    <p className="font-semibold text-sm text-slate-800">
                      {selectedPersonnel.jenis_kelamin === 'L' ? 'Laki-laki' : selectedPersonnel.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                    </p>
                  </div>

                  {/* Jabatan */}
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Jabatan</p>
                    <p className="font-semibold text-sm text-slate-800 leading-snug">{selectedPersonnel.jabatan}</p>
                  </div>

                  {/* Per-Type Balances */}
                  <div className="col-span-2 pt-2 pb-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 mb-3">
                      <Calendar className="w-3 h-3" /> Sisa Kuota Cuti
                    </p>
                    {selectedPersonnel.balances && Object.keys(selectedPersonnel.balances).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {Object.entries(selectedPersonnel.balances)
                          .sort(([a], [b]) => a === 'Melahirkan' ? 1 : b === 'Melahirkan' ? -1 : 0)
                          .map(([type, data]) => {
                            const colors = getLeaveColors(type, leaveTypes);

                            // Handle integer (legacy/cached) vs object (new) structure
                            const isObj = typeof data === 'object';
                            const remaining = isObj ? data.remaining : data;

                            // Safe defaults for quota if using cached data
                            const defaultQuotas = {
                              'Cuti Tahunan': 12,
                              'Sakit': 14,
                              'Melahirkan': 90,
                              'Istimewa': 8,
                              'Keagamaan': 5,
                              'Di Luar Tanggungan Negara': 30,
                              'Alasan Penting': 10
                            };

                            const total = isObj ? data.quota : (defaultQuotas[type] || 12);

                            // Calculate Percentage based on REMAINING (Full bar = Full Quota)
                            const percent = Math.min(100, (remaining / total) * 100);

                            return (
                              <div key={type} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                  <span className={colors.text}>{type}</span>
                                  <span className="text-muted-foreground">
                                    Sisa: {remaining} / {total} Hari
                                  </span>
                                </div>
                                <div className={`h-2 w-full rounded-full ${colors.track} overflow-hidden`}>
                                  <div
                                    className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada data kuota</p>
                    )}
                  </div>
                </div>

                {/* Leave History Section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      Riwayat Izin
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">{leaveHistory.length} riwayat</span>
                  </div>

                  <div className="rounded-xl p-1 space-y-6">
                    {historyLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : leaveHistory.length > 0 ? (
                      (() => {
                        // Group by Year
                        const grouped = leaveHistory.reduce((acc, leave) => {
                          const year = new Date(leave.tanggal_mulai).getFullYear();
                          if (!acc[year]) acc[year] = [];
                          acc[year].push(leave);
                          return acc;
                        }, {});

                        // Sort Years Descending
                        const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

                        return sortedYears.map(year => {
                          const leaves = grouped[year];
                          const totalDays = leaves.reduce((sum, item) => sum + item.jumlah_hari, 0);
                          const totalCount = leaves.length;

                          return (
                            <div key={year} className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                              {/* Year Header */}
                              <div className="flex items-center gap-3 px-1">
                                <h4 className="text-lg font-bold text-slate-900">{year}</h4>
                                <div className="h-px bg-slate-200 flex-1" />
                                <div className="flex gap-3 text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                                  <span>{totalCount}x Izin</span>
                                  <span className="w-px bg-slate-300 h-3 self-center" />
                                  <span>Total {totalDays} Hari</span>
                                </div>
                              </div>

                              {/* Cards List */}
                              <div className="space-y-3">
                                {leaves.map((leave, idx) => {
                                  // Helper: Calculate End Date
                                  const startDate = new Date(leave.tanggal_mulai);
                                  const endDate = new Date(startDate);
                                  endDate.setDate(endDate.getDate() + (leave.jumlah_hari - 1));

                                  // Helper: Format Date
                                  const formatDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

                                  // Helper: ID formatting (Mock ID)
                                  const id = `LR-${year}-${String(leave.id || idx + 1).padStart(3, '0')}`;
                                  const createdDate = new Date(leave.created_at || new Date()).toLocaleDateString('id-ID');

                                  return (
                                    <div key={leave.id || idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                                      {/* Top Row */}
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getLeaveColorClass(leave.leave_type)}`}>
                                            {leave.leave_type?.name || '-'}
                                          </span>
                                          <span className="text-sm font-bold text-slate-900">{leave.jumlah_hari} hari</span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400">{id}</span>
                                      </div>

                                      {/* Date Range */}
                                      <div className="text-sm text-slate-600 font-medium mb-3">
                                        {formatDate(startDate)} s/d {formatDate(endDate)}
                                      </div>

                                      {/* Divider */}
                                      <div className="h-px bg-slate-100 my-3" />

                                      {/* Footer */}
                                      <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                        <span>Dicatat oleh Admin pada {createdDate}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-sm text-muted-foreground">Belum ada riwayat izin ditemukan</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>,
          document.body
        )}


        {/* Import Notification Modal */}
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={() => setModal({ ...modal, isOpen: false })}
          onConfirm={() => setModal({ ...modal, isOpen: false })}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          confirmText="Tutup"
          cancelText={null}
        />

        {/* Detailed Import Result Modal */}
        <ImportDetailsModal
          isOpen={!!importResult}
          onClose={() => setImportResult(null)}
          data={importResult}
        />

        {/* Add Personnel Modal */}
        <AddPersonnelModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(msg) => {
            fetchPersonnel();
            fetchStats();
            fetchFilters();
            setModal({
              isOpen: true,
              type: 'success',
              title: 'Berhasil',
              message: msg
            });
          }}
        />
      </div>
    </div >
  );

}