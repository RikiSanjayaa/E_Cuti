import { Search, Download, Shield, Filter, Calendar, RefreshCw, Lock, AlertTriangle, Eye, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (actionFilter !== 'all') params.action = actionFilter;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const token = localStorage.getItem('token');
      const response = await axios.get('/api/audit/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, actionFilter, roleFilter, categoryFilter, statusFilter]);

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'bg-green-50 text-green-700 border-green-200';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('UPDATE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('VIEW') || action.includes('EXPORT')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('LOGIN') || action.includes('FAILED')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (action.includes('IMPORT')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusBadge = (status) => {
    if (status === 'success') return 'bg-green-100 text-green-800 border-green-300';
    if (status === 'failure') return 'bg-red-100 text-red-800 border-red-300';
    if (status === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return '✓';
    if (status === 'failure') return '✗';
    if (status === 'warning') return '⚠';
    return '•';
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Kegiatan</p>
              <p className="text-2xl font-semibold text-foreground">{logs.length}</p>
            </div>
          </div>
        </div>
        {/* Placeholder stats - normally would come from API summary endpoint */}
        <div className="bg-white border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-3 rounded-lg">
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

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 space-y-4">
        {/* Search and Quick Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan pengguna, tindakan, target, atau detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter Lanjutan
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent flex items-center gap-2">
              <Download className="w-4 h-4" />
              Ekspor Log
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Peran Pengguna
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Semua Peran</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="atasan">Atasan</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Leave Management">Manajemen Cuti</option>
                  <option value="Employee Management">Manajemen Personel</option>
                  <option value="Reporting">Pelaporan</option>
                  <option value="Authentication">Autentikasi</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">Semua Status</option>
                  <option value="success">Berhasil</option>
                  <option value="failure">Gagal</option>
                  <option value="warning">Peringatan</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setActionFilter('all');
                  setRoleFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                Hapus Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Waktu</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengguna</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Peran</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tindakan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Kategori</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Target</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 group">
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: idLocale })}
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
                      {log.category}
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    Tidak ada log audit yang ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
