import { Search, Download, Shield, Filter, Calendar, RefreshCw, Lock, AlertTriangle, Eye, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatDateTime } from '@/utils/dateUtils';
import { Pagination } from '../../components/Pagination';
import { useEntitySubscription } from '@/lib/NotificationContext';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (actionFilter !== 'all') params.action = actionFilter;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const token = localStorage.getItem('token');
      const response = await axios.get('/api/audit/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setLogs(response.data);

      // Handle Pagination Headers
      const total = parseInt(response.headers['x-total-count'] || '0', 10);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));

    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change (except pagination/sort dependencies)
    setCurrentPage(1);
  }, [actionFilter, roleFilter, categoryFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, roleFilter, categoryFilter, statusFilter, startDate, endDate, currentPage, sortBy, sortOrder, itemsPerPage]);

  // Subscribe to real-time updates for all entities (audit logs track everything)
  const handleAuditChange = useCallback(() => {
    fetchLogs();
  }, [actionFilter, roleFilter, categoryFilter, statusFilter, startDate, endDate, currentPage, sortBy, sortOrder, itemsPerPage]);

  useEntitySubscription('audit', handleAuditChange);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc'); // Default to asc for new field
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1 text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    if (action.includes('VIEW') || action.includes('EXPORT')) return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
    if (action.includes('LOGIN') || action.includes('FAILED')) return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    if (action.includes('IMPORT')) return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const getStatusBadge = (status) => {
    if (status === 'success') return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    if (status === 'failure') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    if (status === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
    return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return '✓';
    if (status === 'failure') return '✗';
    if (status === 'warning') return '⚠';
    return '•';
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Authentication': return 'Autentikasi';
      case 'Personnel Management': return 'Manajemen Personel';
      case 'Leave Management': return 'Manajemen Cuti';
      case 'User Management': return 'Manajemen Pengguna';
      case 'Reporting': return 'Pelaporan';
      default: return category;
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        action: actionFilter,
        role: roleFilter,
        category: categoryFilter,
        status_filter: statusFilter, // Matches backend parameter name
        start_date: startDate,
        end_date: endDate
      };

      const response = await axios.get('/api/audit/export', {
        params,
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit_logs.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export logs:", error);
      alert("Gagal mengunduh data audit logs.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Log Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jejak aktivitas sistem lengkap untuk transparansi dan kepatuhan
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm hover:bg-accent"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>



      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Kegiatan</p>
              <p className="text-2xl font-semibold text-foreground">{logs.length}</p>
            </div>
          </div>
        </div>
        {/* Placeholder stats - normally would come from API summary endpoint */}
        {/* Card 2: Kegiatan Hari Ini */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kegiatan Hari Ini</p>
              <p className="text-2xl font-semibold text-foreground">
                {logs.filter(l => {
                  const today = new Date();
                  const logDate = new Date(l.timestamp);
                  return logDate.getDate() === today.getDate() &&
                    logDate.getMonth() === today.getMonth() &&
                    logDate.getFullYear() === today.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Aksi Gagal */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aksi Gagal</p>
              <p className="text-2xl font-semibold text-foreground">
                {logs.filter(l => l.status === 'failure' || l.status === 'warning').length}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Autentikasi */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <Lock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Autentikasi</p>
              <p className="text-2xl font-semibold text-foreground">
                {logs.filter(l => l.category === 'Authentication').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters in Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Date Filters */}
          <div className="flex gap-2 flex-1 xl:flex-none">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground dark:[color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Role Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Peran</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background dark:bg-neutral-900 dark:[color-scheme:dark]"
              >
                <option value="all">Semua Peran</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="atasan">Atasan</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Kategori</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background dark:bg-neutral-900 dark:[color-scheme:dark]"
              >
                <option value="all">Semua Kategori</option>
                <option value="User Management">Manajemen Pengguna</option>
                <option value="Leave Management">Manajemen Cuti</option>
                <option value="Personnel Management">Manajemen Personel</option>
                <option value="Reporting">Pelaporan</option>
                <option value="Authentication">Autentikasi</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background dark:bg-neutral-900 dark:[color-scheme:dark]"
              >
                <option value="all">Semua Status</option>
                <option value="success">Berhasil</option>
                <option value="failure">Gagal</option>
                <option value="warning">Peringatan</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setRoleFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md h-[38px]"
            >
              Reset
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2 h-[38px] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Ekspor
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center">
                    Waktu
                    <SortIcon field="timestamp" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('user')}
                >
                  <div className="flex items-center">
                    Pengguna
                    <SortIcon field="user" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Peran</th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center">
                    Tindakan
                    <SortIcon field="action" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Kategori
                    <SortIcon field="category" />
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('target')}
                >
                  <div className="flex items-center">
                    Target
                    <SortIcon field="target" />
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
                  onClick={() => handleSort('ip_address')}
                >
                  <div className="flex items-center">
                    IP Address
                    <SortIcon field="ip_address" />
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 group">
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{log.user?.full_name || log.user?.username}</span>
                        <span className="text-xs text-muted-foreground">{log.user?.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {log.user?.role}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getActionBadge(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {getCategoryLabel(log.category)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{log.target}</span>
                        <span className="text-xs text-muted-foreground">{log.target_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getStatusBadge(log.status)}`}>
                        <span className="mr-1">{getStatusIcon(log.status)}</span>
                        {log.status === 'success' ? 'Berhasil' : log.status === 'failure' ? 'Gagal' : 'Peringatan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate" title={log.user_agent || '-'}>
                      {log.user_agent ? (
                        <span className="text-xs">{log.user_agent.length > 50 ? log.user_agent.substring(0, 50) + '...' : log.user_agent}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    Tidak ada log audit yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-card">
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
    </div>
  );
}
