import { Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle, X, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { DatePicker } from "../../components/ui/DatePicker";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import { addDays } from 'date-fns';
import { AddLeaveModal } from '@/components/AddLeaveModal';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { getLeaveColorClass } from '@/utils/leaveUtils';
import { useEntitySubscription, useNotifications } from '@/lib/NotificationContext';

export default function LeaveRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Types for filter dropdown
  const [leaveTypes, setLeaveTypes] = useState([]);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCreatedBy, setFilterCreatedBy] = useState('');
  const [adminUsers, setAdminUsers] = useState([]); // List of potential creators

  // States for Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { addToast } = useNotifications();

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchLeaves();
  }, [currentPage, sortBy, sortOrder, searchQuery, typeFilter, itemsPerPage, filterCreatedBy, filterStartDate, filterEndDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, filterCreatedBy, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchAdmins();
    fetchLeaveTypes();
  }, []);

  // Subscribe to real-time leave updates
  const handleLeaveChange = useCallback(() => {
    fetchLeaves();
  }, [currentPage, sortBy, sortOrder, searchQuery, typeFilter, itemsPerPage, filterCreatedBy, filterStartDate, filterEndDate]);

  useEntitySubscription('leaves', handleLeaveChange);

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

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const admins = response.data.filter(u => ['super_admin', 'admin'].includes(u.role));
      setAdminUsers(admins);
    } catch (error) {
      console.error("Failed to fetch admins", error);
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (searchQuery) params.search = searchQuery;
      if (typeFilter !== 'all') params.type_filter = typeFilter;
      if (filterCreatedBy) params.created_by = filterCreatedBy;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;

      const response = await axios.get('/api/leaves/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setLeaves(response.data);
        const total = parseInt(response.headers['x-total-count'] || '0', 10);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        setLeaves([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAdd = () => {
    setIsAddModalOpen(false);
    fetchLeaves();
  };

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setSelectedLeave(null);
    setIsEditModalOpen(false);
    fetchLeaves(); // Refresh data after edit
  };

  const handleView = (leave) => {
    setSelectedLeave(leave);
    setIsDetailModalOpen(true);
  };

  const handleDeleteClick = (leave) => {
    setSelectedLeave(leave);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLeave) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/leaves/${selectedLeave.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeaves();
      setIsDeleteModalOpen(false);
      setSelectedLeave(null);
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Data cuti berhasil dihapus'
      });
    } catch (error) {
      console.error("Failed to delete leave:", error);
      setIsDeleteModalOpen(false);
      addToast({
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.detail || 'Gagal menghapus data cuti'
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatSingleDate = (dateStr) => {
    return formatDate(dateStr, 'd MMM yyyy');
  };

  // formatDateTime is imported directly

  const getEndDate = (startDate, days) => {
    if (!startDate) return null;
    return addDays(new Date(startDate), days - 1);
  };



  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        search: searchQuery,
        type_filter: typeFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      const response = await axios.get('/api/leaves/export', {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leaves.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export leaves:", error);
      addToast({
        type: 'error',
        title: 'Gagal',
        message: 'Gagal mengunduh data riwayat cuti'
      });
    }
  };

  // Sort Helpers
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

  const filteredLeaves = leaves; // Server-side filtering now

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Riwayat Cuti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lihat dan kelola riwayat cuti personel
          </p>
        </div>
        {(localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'admin') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Izin Cuti
          </button>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NRP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-[180px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-md text-sm hover:bg-accent flex items-center gap-2 cursor-pointer transition-colors ${showFilters ? 'bg-accent text-accent-foreground border-primary/50' : 'border-input'}`}
            >
              <Filter className="w-4 h-4" />
              Filter Lainnya
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" />
              Ekspor
            </button>
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-dashed animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              {/* Date Range */}
              <div className="space-y-2">

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Dari Tanggal</label>
                    <DatePicker
                      value={filterStartDate}
                      onChange={setFilterStartDate}
                      placeholder="Pilih Tanggal Mulai"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Sampai Tanggal</label>
                    <DatePicker
                      value={filterEndDate}
                      onChange={setFilterEndDate}
                      placeholder="Pilih Tanggal Selesai"
                    />
                  </div>
                </div>
              </div>

              {/* Created By */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-muted-foreground block">Dicatat Oleh</label>
                  <Select value={filterCreatedBy || "all"} onValueChange={(val) => setFilterCreatedBy(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Admin</SelectItem>
                      {adminUsers.map(admin => (
                        <SelectItem key={admin.id} value={String(admin.id)}>
                          {admin.full_name || admin.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reset Actions */}
              <div className="flex items-end pb-0.5">
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterCreatedBy('');
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-2 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Tgl Entry
                    <SortIcon field="created_at" />
                  </div>
                </th>
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
                    Personel
                    <SortIcon field="nama" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('tanggal_mulai')}
                >
                  <div className="flex items-center">
                    Tanggal Mulai
                    <SortIcon field="tanggal_mulai" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tanggal Selesai
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('jumlah_hari')}
                >
                  <div className="flex items-center">
                    Durasi & Sisa
                    <SortIcon field="jumlah_hari" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('jenis_izin')}
                >
                  <div className="flex items-center">
                    Jenis Cuti
                    <SortIcon field="jenis_izin" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dicatat Oleh
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} onClick={() => handleView(leave)} className="hover:bg-gray-100 dark:hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDateTime(leave.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {leave.personnel?.nrp}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {leave.personnel?.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatSingleDate(leave.tanggal_mulai)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatSingleDate(getEndDate(leave.tanggal_mulai, leave.jumlah_hari))}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{leave.jumlah_hari} Hari</span>
                        <span className="text-xs text-muted-foreground">
                          Sisa: {leave.balance_remaining !== null && leave.balance_remaining !== undefined ? leave.balance_remaining : (leave.sisa_cuti !== undefined ? leave.sisa_cuti : '-')} Hari
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getLeaveColorClass(
                          leave.leave_type
                        )}`}
                      >
                        {leave.leave_type?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {leave.creator?.full_name || leave.creator?.username || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(localStorage.getItem('role') === 'super_admin' || localStorage.getItem('role') === 'admin') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(leave);
                              }}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(leave);
                              }}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
      </div >

      {/* Modals and Dialogs */}
      <AddLeaveModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAdd}
      />

      {/* Edit Modal (reuses Add Modal) */}
      <AddLeaveModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        initialData={selectedLeave}
      />

      {/* Detail Modal */}
      <LeaveDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        leave={selectedLeave}
      />

      {/* Delete Confirmation Dialog */}
      {/* Delete Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Cuti?"
        message="Apakah Anda yakin ingin menghapus data cuti ini? Tindakan ini tidak dapat dibatalkan."
        type="danger"
        confirmText="Hapus"
        isLoading={deleteLoading}
      />
    </div >
  );
}
