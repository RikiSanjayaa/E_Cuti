import { Search, UserPlus, Shield, Lock, Unlock, Key, Mail, MoreVertical, AlertCircle, CheckCircle, XCircle, Loader2, Eye, EyeOff, Briefcase, UserX, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { Pagination } from '../../components/Pagination';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDateTime, formatDate } from '@/utils/dateUtils';
import ResetPasswordModal from '../../components/ResetPasswordModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useEntitySubscription, useNotifications } from '@/lib/NotificationContext';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);


  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Confirmation Modal State (for Status & Success Messages)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Konfirmasi',
    onConfirm: () => { },
    isLoading: false
  });

  // Reset Password Modal State
  const [resetModal, setResetModal] = useState({
    isOpen: false,
    userId: null,
    username: '',
    isLoading: false
  });

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'admin',
    password: '',
    status: 'active'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { addToast } = useNotifications();

  // Fetch Current User
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleResetPasswordClick = (user) => {
    setResetModal({
      isOpen: true,
      userId: user.id,
      username: user.username,
      isLoading: false
    });
  };

  const executeResetPassword = async (newPassword) => {
    setResetModal(prev => ({ ...prev, isLoading: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/users/${resetModal.userId}/reset-password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResetModal({ isOpen: false, userId: null, username: '', isLoading: false });
      // Success notification is handled by WebSocket to avoid duplication
    } catch (error) {
      setResetModal({ isOpen: false, userId: null, username: '', isLoading: false });
      addToast({
        type: 'error',
        title: 'Gagal',
        message: 'Gagal mereset password: ' + (error.response?.data?.detail || error.message)
      });
    }
  };

  // Status Toggle Logic (unchanged except using confirmModal)
  const executeToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setConfirmModal(prev => ({ ...prev, isLoading: true }));

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/users/${user.id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      setConfirmModal({ isOpen: false });
      // Success notification is handled by WebSocket to avoid duplication
    } catch (error) {
      console.error('Failed to update status:', error);
      setConfirmModal({ isOpen: false });
      addToast({
        type: 'error',
        title: 'Gagal',
        message: 'Gagal mengubah status pengguna'
      });
    }
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const isDeactivating = newStatus === 'inactive';

    setConfirmModal({
      isOpen: true,
      type: isDeactivating ? 'danger' : 'success',
      title: isDeactivating ? 'Non-aktifkan Pengguna' : 'Aktifkan Pengguna',
      message: `Apakah Anda yakin ingin mengubah status pengguna ini menjadi ${isDeactivating ? 'Non-Aktif' : 'Aktif'}? ${isDeactivating ? 'Pengguna tidak akan bisa login lagi.' : 'Pengguna akan dapat mengakses sistem kembali.'}`,
      confirmText: isDeactivating ? 'Non-aktifkan' : 'Aktifkan',
      cancelText: 'Batal',
      onConfirm: () => executeToggleStatus(user),
      onClose: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const fetchUsers = async () => {
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
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get('/api/users/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      const total = parseInt(response.headers['x-total-count'] || '0', 10);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, currentPage, sortBy, sortOrder, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Subscribe to real-time user updates
  const handleUserChange = useCallback(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, currentPage, sortBy, sortOrder, itemsPerPage]);

  useEntitySubscription('users', handleUserChange);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowForm(false);
      setFormData({ username: '', full_name: '', role: 'admin', password: '', status: 'active' });
      fetchUsers();
      // Success notification is handled by WebSocket to avoid duplication
    } catch (error) {
      setShowForm(false);
      addToast({
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.detail || 'Gagal menambahkan pengguna'
      });
    } finally {
      setFormLoading(false);
    }
  };



  const getStatusBadge = (status) => {
    if (status === 'active') return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (status === 'inactive') return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    if (status === 'locked') return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'active') return <CheckCircle className="w-3.5 h-3.5" />;
    if (status === 'inactive') return <XCircle className="w-3.5 h-3.5" />;
    if (status === 'locked') return <Lock className="w-3.5 h-3.5" />;
    return null;
  };

  const getRoleBadge = (role) => {
    if (role === 'super_admin') return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
    if (role === 'admin') return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    if (role === 'atasan') return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const totalAdmins = users.filter(u => ['admin', 'super_admin'].includes(u.role)).length;
  const totalAtasan = users.filter(u => u.role === 'atasan').length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun pengguna, peran, dan hak akses
          </p>
        </div>
        {currentUser?.role === 'super_admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 font-medium group"
          >
            <UserPlus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            {showForm ? 'Batal' : 'Tambah Pengguna Baru'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="relative">
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-semibold mb-4">Tambah Pengguna Baru</h2>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <input
                  required
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:[color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md pr-10 bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 dark:[color-scheme:dark]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran</label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="atasan">Atasan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-md hover:bg-accent"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Admin */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Admin</p>
              <p className="text-2xl font-semibold text-foreground">{totalAdmins}</p>
            </div>
          </div>
        </div>

        {/* Total Atasan */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <Briefcase className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Atasan</p>
              <p className="text-2xl font-semibold text-foreground">{totalAtasan}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pengguna Aktif</p>
              <p className="text-2xl font-semibold text-foreground">{activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tidak Aktif</p>
              <p className="text-2xl font-semibold text-foreground">{inactiveUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-[180px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Peran</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="atasan">Atasan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center">
                    Pengguna
                    <SortIcon field="username" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Peran
                    <SortIcon field="role" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('last_active')}
                >
                  <div className="flex items-center">
                    Terakhir Aktif
                    <SortIcon field="last_active" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                        {user.full_name ? user.full_name.charAt(0) : user.username.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.full_name || user.username}</p>

                        <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusBadge(user.status)}`}>
                      {getStatusIcon(user.status)}
                      {user.status === 'active' ? 'Aktif' : user.status === 'inactive' ? 'Tidak Aktif' : 'Terkunci'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">
                        {formatDate(user.last_active, 'dd MMM yyyy')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(user.last_active, 'HH:mm')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Determine if current user can reset this user's password
                        const canResetPassword = () => {
                          if (!currentUser) return false;
                          // Super admin can reset anyone
                          if (currentUser.role === 'super_admin') return true;
                          // Admin can reset their own password
                          if (currentUser.id === user.id) return true;
                          // Admin can reset atasan passwords
                          if (currentUser.role === 'admin' && user.role === 'atasan') return true;
                          // Admin cannot reset other admin or super_admin passwords
                          return false;
                        };

                        const canReset = canResetPassword();
                        const getResetTitle = () => {
                          if (canReset) return "Reset Password";
                          if (currentUser?.role === 'admin') {
                            if (user.role === 'super_admin') return "Tidak dapat mereset Super Admin";
                            if (user.role === 'admin') return "Tidak dapat mereset Admin lain";
                          }
                          return "Tidak memiliki akses";
                        };

                        return (
                          <button
                            onClick={() => handleResetPasswordClick(user)}
                            className={`p-1.5 rounded border transition-colors ${canReset
                              ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 cursor-pointer'
                              : 'opacity-50 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800 cursor-not-allowed'
                              }`}
                            title={getResetTitle()}
                            disabled={!canReset}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={user.role === 'super_admin' || currentUser?.role !== 'super_admin'}
                        className={`p-1.5 rounded-md border transition-colors ${user.status === 'active'
                          ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                          : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                          } ${user.role === 'super_admin' || currentUser?.role !== 'super_admin' ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : ''}`}
                        title={
                          user.role === 'super_admin'
                            ? "Super Admin tidak dapat dinonaktifkan"
                            : currentUser?.role !== 'super_admin'
                              ? "Hanya Super Admin"
                              : (user.status === 'active' ? "Non-aktifkan Pengguna" : "Aktifkan Pengguna")
                        }
                      >
                        {user.status === 'active' ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      <ResetPasswordModal
        isOpen={resetModal.isOpen}
        username={resetModal.username}
        onClose={() => setResetModal({ ...resetModal, isOpen: false })}
        onConfirm={executeResetPassword}
        isLoading={resetModal.isLoading}
      />
    </div>
  );
}
