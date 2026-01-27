import { Search, Filter, Download, MoreVertical, Eye, Edit, Trash2, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { AddLeaveModal } from '@/components/AddLeaveModal';
import { LeaveDetailModal } from '@/components/LeaveDetailModal';

export default function LeaveRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leaves/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setLeaves(response.data);
      } else {
        setLeaves([]);
      }
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
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

  const filteredLeaves = leaves.filter(leave => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      leave.personnel?.nama?.toLowerCase().includes(searchLower) ||
      leave.personnel?.nrp?.toLowerCase().includes(searchLower);

    const matchesType = typeFilter === 'all' || leave.jenis_izin === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Riwayat Cuti</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat dan kelola riwayat cuti personel
        </p>
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
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  NRP
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Personel
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Satker
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tanggal Mulai
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durasi
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jenis Cuti
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
                      {leave.personnel?.satker || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {format(new Date(leave.tanggal_mulai), 'd MMM yyyy', { locale: localeId })}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {leave.jumlah_hari} Hari
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
                        <button className="p-1 hover:bg-accent rounded cursor-pointer">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Placeholder for now */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredLeaves.length} hasil
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-input rounded text-sm hover:bg-accent disabled:opacity-50 cursor-pointer" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm cursor-pointer">
              1
            </button>
            {/* Pagination Logic to be implemented */}
            <button className="px-3 py-1 border border-input rounded text-sm hover:bg-accent disabled:opacity-50 cursor-pointer" disabled>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modals and Dialogs */}
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
      {isDeleteModalOpen && (
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
      )}
    </div>
  );
}
