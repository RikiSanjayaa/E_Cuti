import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, CheckCircle, XCircle, Calendar, AlertCircle, Users, Palette, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { PRESET_COLORS, getLeaveColorClass } from '../../utils/leaveUtils';
import { useEntitySubscription, useNotifications } from '@/lib/NotificationContext';

export default function LeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const { addToast } = useNotifications();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    default_quota: 12,
    gender_specific: null,
    color: 'blue',
    is_active: true
  });

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Konfirmasi',
    onConfirm: () => { },
    isLoading: false
  });

  // Color dropdown state
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const colorDropdownRef = useRef(null);

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/leave-types/', {
        params: { include_inactive: true },
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch leave types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // Subscribe to real-time leave type updates
  const handleLeaveTypeChange = useCallback(() => {
    fetchLeaveTypes();
  }, []);

  useEntitySubscription('leave_types', handleLeaveTypeChange);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      default_quota: 12,
      gender_specific: null,
      color: 'blue',
      is_active: true
    });
    setEditingId(null);
    setShowModal(false);
    setMessage({ type: '', text: '' });
    setColorDropdownOpen(false);
  };

  const handleEdit = (leaveType) => {
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      default_quota: leaveType.default_quota,
      gender_specific: leaveType.gender_specific,
      color: leaveType.color || 'blue',
      is_active: leaveType.is_active
    });
    setEditingId(leaveType.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const successMessage = editingId ? 'Jenis cuti berhasil diperbarui' : 'Jenis cuti berhasil ditambahkan';

      if (editingId) {
        await axios.put(`/api/leave-types/${editingId}`, formData, { headers });
      } else {
        await axios.post('/api/leave-types/', formData, { headers });
      }

      fetchLeaveTypes();
      resetForm();
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: successMessage
      });
    } catch (error) {
      resetForm();
      addToast({
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.detail || 'Gagal menyimpan jenis cuti'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (leaveType) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Non-aktifkan Jenis Cuti',
      message: `Apakah Anda yakin ingin menonaktifkan "${leaveType.name}"? Jenis cuti ini tidak akan dapat dipilih untuk pengajuan baru, tetapi data historis tetap aman.`,
      confirmText: 'Non-aktifkan',
      cancelText: 'Batal',
      onConfirm: () => executeDelete(leaveType.id),
      onClose: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const executeDelete = async (id) => {
    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/leave-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLeaveTypes();
      setConfirmModal({ isOpen: false });
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Jenis cuti berhasil dinonaktifkan'
      });
    } catch (error) {
      console.error('Failed to delete leave type:', error);
      setConfirmModal({ isOpen: false });
      addToast({
        type: 'error',
        title: 'Gagal',
        message: 'Gagal menonaktifkan jenis cuti'
      });
    }
  };

  const handleReactivate = async (leaveType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/leave-types/${leaveType.id}`,
        { is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLeaveTypes();
      addToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Jenis cuti berhasil diaktifkan kembali'
      });
    } catch (error) {
      console.error('Failed to reactivate:', error);
      addToast({
        type: 'error',
        title: 'Gagal',
        message: 'Gagal mengaktifkan kembali jenis cuti'
      });
    }
  };

  const getGenderLabel = (gender) => {
    if (!gender) return 'Semua';
    return gender === 'P' ? 'Perempuan' : 'Laki-laki';
  };

  const getGenderBadge = (gender) => {
    if (!gender) return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    return gender === 'P'
      ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800'
      : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
  };

  // Calculate stats
  const activeTypes = leaveTypes.filter(lt => lt.is_active).length;
  const inactiveTypes = leaveTypes.filter(lt => !lt.is_active).length;
  const totalQuota = leaveTypes.filter(lt => lt.is_active).reduce((sum, lt) => sum + lt.default_quota, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jenis Cuti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola jenis cuti dan kuota default untuk setiap tipe
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Tambah Jenis Cuti
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jenis Aktif</p>
              <p className="text-2xl font-semibold text-foreground">{activeTypes}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <XCircle className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tidak Aktif</p>
              <p className="text-2xl font-semibold text-foreground">{inactiveTypes}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Kuota</p>
              <p className="text-2xl font-semibold text-foreground">{totalQuota} Hari</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Types Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nama Jenis Cuti
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kode
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kuota Default
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Gender
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada jenis cuti</p>
                  </td>
                </tr>
              ) : (
                leaveTypes.map((leaveType) => (
                  <tr key={leaveType.id} className={`hover:bg-muted/30 ${!leaveType.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getLeaveColorClass(leaveType)}`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{leaveType.name}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getLeaveColorClass(leaveType)}`}>
                            {PRESET_COLORS.find(c => c.value === leaveType.color)?.label || 'Default'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{leaveType.code}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{leaveType.default_quota}</span>
                      <span className="text-sm text-muted-foreground ml-1">hari</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${getGenderBadge(leaveType.gender_specific)}`}>
                        <Users className="w-3 h-3" />
                        {getGenderLabel(leaveType.gender_specific)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${leaveType.is_active
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        }`}>
                        {leaveType.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {leaveType.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(leaveType)}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {leaveType.is_active ? (
                          <button
                            onClick={() => handleDelete(leaveType)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                            title="Non-aktifkan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(leaveType)}
                            className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                            title="Aktifkan Kembali"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background dark:bg-card rounded-lg shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti Baru'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Jenis Cuti</label>
                <input
                  required
                  type="text"
                  placeholder="contoh: Cuti Tahunan"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kode</label>
                <input
                  required
                  type="text"
                  placeholder="contoh: cuti_tahunan"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring font-mono bg-transparent text-foreground"
                />
                <p className="text-xs text-muted-foreground">Kode unik untuk identifikasi internal (huruf kecil, tanpa spasi)</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kuota Default (Hari)</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="365"
                  value={formData.default_quota}
                  onChange={e => setFormData({ ...formData, default_quota: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Khusus Gender</label>
                <select
                  value={formData.gender_specific || ''}
                  onChange={e => setFormData({ ...formData, gender_specific: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
                >
                  <option value="">Semua Gender</option>
                  <option value="P">Khusus Perempuan</option>
                  <option value="L">Khusus Laki-laki</option>
                </select>
                <p className="text-xs text-muted-foreground">Jenis cuti khusus gender hanya muncul untuk personel dengan gender tersebut</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Warna Tag
                </label>
                <div className="relative" ref={colorDropdownRef}>
                  {/* Custom color dropdown trigger */}
                  <button
                    type="button"
                    onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {PRESET_COLORS.find(c => c.value === formData.color)?.label || 'Pilih Warna'}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full ${PRESET_COLORS.find(c => c.value === formData.color)?.sample || 'bg-gray-500'}`} />
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${colorDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Custom dropdown menu */}
                  {colorDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, color: color.value });
                            setColorDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors ${formData.color === color.value ? 'bg-muted' : ''
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            {formData.color === color.value && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                            <span className={formData.color === color.value ? 'font-medium' : ''}>
                              {color.label}
                            </span>
                          </span>
                          <div className={`w-5 h-5 rounded-full ${color.sample}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Warna ini akan ditampilkan di semua halaman untuk tag jenis cuti ini</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Aktif</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-md hover:bg-accent dark:hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Simpan Perubahan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
}
