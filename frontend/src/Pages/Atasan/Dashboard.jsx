import {
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  Database
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AtasanDashboard() {
  const [statsData, setStatsData] = useState({
    total_leave_entries: 0,
    leaves_this_month: 0,
    total_personel: 0,
    average_duration: 0,
    recent_activity: [],
    top_frequent: []
  });
  const [loading, setLoading] = useState(true);

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
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
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

  if (loading) {
    return <div className="p-6">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan manajemen cuti dan absensi personel
          </p>
        </div>
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
            Riwayat pengajuan cuti terbaru
          </p>
        </div>
        <div className="divide-y divide-border">
          {statsData.recent_activity.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada aktivitas terbaru.</div>
          ) : (
            statsData.recent_activity.map((activity, index) => {
              const user = activity.creator ? (activity.creator.full_name || activity.creator.username) : 'System';
              const action = `${activity.jenis_izin} - ${activity.personnel.nama}`;
              const dateStr = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Top 10 Personel Paling Sering Izin</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.top_frequent} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="nama" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e293b" radius={[0, 4, 4, 0]}>
                  {statsData.top_frequent?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
