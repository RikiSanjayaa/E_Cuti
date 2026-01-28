import { Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle, X, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { AddLeaveModal } from '@/components/AddLeaveModal';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';

export default function LeaveRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchLeaves();
  }, [currentPage, sortBy, sortOrder, searchQuery, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

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
      // Refresh list
      fetchLeaves();
      setIsDeleteModalOpen(false);
      setSelectedLeave(null);
    } catch (error) {
      console.error("Failed to delete leave:", error);
      alert("Gagal menghapus data cuti.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (type) => {
    const styles = {
      'Cuti Tahunan': 'bg-blue-50 text-blue-700 border-blue-200',
      'Sakit': 'bg-red-50 text-red-700 border-red-200',
      'Istimewa': 'bg-purple-50 text-purple-700 border-purple-200',
      'Melahirkan': 'bg-green-50 text-green-700 border-green-200',
      'Keagamaan': 'bg-orange-50 text-orange-700 border-orange-200',
      'Di Luar Tanggungan Negara': 'bg-gray-50 text-gray-700 border-gray-200',
      'Alasan Penting': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    };
    return styles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatLeaveDateRange = (startDate, days) => {
    if (!startDate) return '-';
    const start = new Date(startDate);
    const end = addDays(start, days - 1); // Subtract 1 because start day is day 1
    return `${format(start, 'd MMM yyyy', { locale: localeId })} - ${format(end, 'd MMM yyyy', { locale: localeId })}`;
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
        {localStorage.getItem('role') !== 'atasan' && (
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
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NRP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            <button className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2 cursor-pointer">
              <Filter className="w-4 h-4" />
              Filter Lainnya
            </button>
            <button className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" />
              Ekspor
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
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
                    Personel
                    <SortIcon field="nama" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('tanggal_mulai')}
                >
                  <div className="flex items-center">
                    Tanggal (Mulai - Selesai)
                    <SortIcon field="tanggal_mulai" />
                  </div>
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
                  <td colSpan="8" className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {leave.personnel?.nrp}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {leave.personnel?.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatLeaveDateRange(leave.tanggal_mulai, leave.jumlah_hari)}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <div className="flex flex-col">
                        <span className="font-medium">{leave.jumlah_hari} Hari</span>
                        <span className="text-xs text-muted-foreground">
                          Sisa: {leave.sisa_cuti !== undefined ? leave.sisa_cuti : '-'} Hari
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(
                          leave.jenis_izin
                        )}`}
                      >
                        {leave.jenis_izin}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {leave.creator?.full_name || leave.creator?.username || 'System'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(leave)}
                          className="p-1 hover:bg-accent rounded cursor-pointer"
                          title="Lihat detail"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {localStorage.getItem('role') !== 'atasan' && (
                          <>
                            <button
                              onClick={() => handleEdit(leave)}
                              className="p-1 hover:bg-blue-50 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(leave)}
                              className="p-1 hover:bg-red-50 rounded cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
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
        <div className="border-t border-border bg-white px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
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
      {
        isDeleteModalOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
              onClick={() => !deleteLoading && setIsDeleteModalOpen(false)}
            />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg shadow-xl z-50 p-6 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Hapus Data Cuti?</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Apakah Anda yakin ingin menghapus data cuti ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
}
