import {
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  FileText,
  Database,
  Plus
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatTimeAgo } from '@/utils/dateUtils';
import { AddLeaveModal } from '../../components/AddLeaveModal';

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    total_leave_entries: 0,
    leaves_this_month: 0,
    total_personel: 0,
    average_duration: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setStatsData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      label: 'Total Pengajuan Cuti',
      value: statsData.total_leave_entries.toLocaleString(),
      change: 'Total catatan',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Tercatat Bulan Ini',
      value: statsData.leaves_this_month.toLocaleString(),
      change: 'Entri baru',
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Total Personel',
      value: statsData.total_personel.toLocaleString(),
      change: 'Personel aktif',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Rata-rata Durasi Cuti',
      value: `${statsData.average_duration} hari`,
      change: 'per pengajuan',
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const getStatusColor = (type) => {
    // Basic mapping based on leave type or status if available
    // For now using consistently green for created
    return 'text-green-600';
  };

  const getStatusIcon = (type) => {
    return CheckCircle;
  };

  if (loading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan manajemen cuti dan absensi
          </p>
        </div>
        <button
          onClick={() => setIsAddLeaveModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm text-sm font-medium w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Izin Cuti
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-semibold mt-2 text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.change}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tindakan sistem dan pembaruan terbaru
          </p>
        </div>
        <div className="divide-y divide-border">
          {statsData.recent_activity.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada aktivitas terbaru.</div>
          ) : (
            statsData.recent_activity.map((activity, index) => {
              const user = activity.creator ? (activity.creator.full_name || activity.creator.username) : 'System';
              const action = `${activity.leave_type?.name || 'Cuti'} - ${activity.personnel?.nama}`;
              const dateStr = formatTimeAgo(activity.created_at);

              return (
                <div
                  key={activity.id || index}
                  className="px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-green-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {action}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {dateStr}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Stats - Hardcoded for demo visualization as backend doesn't provide this yet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Distribusi Jenis Cuti (Data Demo)</h3>
          <div className="space-y-3">
            {[
              { type: 'Cuti Tahunan', count: 542, total: 1247, color: 'bg-blue-500' },
              { type: 'Sakit', count: 385, total: 1247, color: 'bg-red-500' },
              { type: 'Alasan Penting', count: 198, total: 1247, color: 'bg-purple-500' },
              { type: 'Melahirkan', count: 122, total: 1247, color: 'bg-green-500' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-foreground">{item.type}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${(item.count / item.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Ringkasan Departemen (Data Demo)</h3>
          <div className="space-y-4">
            {[
              { dept: 'Human Resources', entries: 245, personel: 42 },
              { dept: 'Finance', entries: 198, personel: 38 },
              { dept: 'Operations', entries: 412, personel: 156 },
              { dept: 'IT Services', entries: 268, personel: 89 },
              { dept: 'Administration', entries: 124, personel: 52 },
            ].map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{dept.dept}</span>
                <div className="flex gap-4">
                  <span className="text-sm text-muted-foreground">
                    <span className="text-blue-600">{dept.entries}</span> entries
                  </span>
                  <span className="text-sm text-muted-foreground">
                    <span className="text-purple-600">{dept.personel}</span> personel
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddLeaveModal
        isOpen={isAddLeaveModalOpen}
        onClose={() => setIsAddLeaveModalOpen(false)}
      />
    </div>
  );
}
