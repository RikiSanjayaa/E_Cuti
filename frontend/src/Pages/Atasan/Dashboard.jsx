import {
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  FileText,
  Database,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatTimeAgo } from '@/utils/dateUtils';

export default function Dashboard() {
  const [statsData, setStatsData] = useState({
    total_leave_entries: 0,
    leaves_this_month: 0,
    total_personel: 0,
    average_duration: 0,
    recent_activity: [],
    leave_distribution: [],
    department_summary: [],
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
  }, []);

  const stats = [
    {
      label: 'Total Pengajuan',
      value: statsData.total_leave_entries.toLocaleString(),
      change: 'Total semua catatan',
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      borderColor: 'border-blue-100 dark:border-blue-900/20'
    },
    {
      label: 'Bulan Ini',
      value: statsData.leaves_this_month.toLocaleString(),
      change: 'Entri baru bulan ini',
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
      borderColor: 'border-emerald-100 dark:border-emerald-900/20'
    },
    {
      label: 'Total Personel',
      value: statsData.total_personel.toLocaleString(),
      change: 'Personel terdaftar',
      icon: Users,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-900/10',
      borderColor: 'border-violet-100 dark:border-violet-900/20'
    },
    {
      label: 'Rata-rata Durasi',
      value: `${statsData.average_duration} hari`,
      change: 'Per pengajuan cuti',
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      borderColor: 'border-amber-100 dark:border-amber-900/20'
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan & statistik manajemen cuti
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-card border ${stat.borderColor} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stat.bgColor} ${stat.color}`}>
                  Live
                </span>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1 mb-2">
                  {stat.label}
                </p>
                <p className="text-xs text-muted-foreground/80">
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Aktivitas Terbaru
                </h2>
                <p className="text-sm text-muted-foreground">5 aktivitas terakhir dalam sistem</p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {statsData.recent_activity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p>Belum ada aktivitas terbaru.</p>
                </div>
              ) : (
                statsData.recent_activity.map((activity, index) => {
                  const user = activity.creator ? (activity.creator.full_name || activity.creator.username) : 'System';
                  const action = `${activity.leave_type?.name || 'Cuti'} - ${activity.personnel?.nama}`;
                  const dateStr = formatTimeAgo(activity.created_at);

                  return (
                    <div
                      key={activity.id || index}
                      className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {action}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {dateStr}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leave Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Distribusi Jenis Cuti
              </h3>
            </div>

            <div className="space-y-5">
              {statsData.leave_distribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data cuti.</p>
              ) : (
                statsData.leave_distribution.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{item.type}</span>
                      <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                        {item.count}
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`${item.color || 'bg-primary'} h-2.5 rounded-full transition-all duration-500 ease-out group-hover:opacity-80`}
                        style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Top 10 Personnel */}
        <div className="xl:col-span-1">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top 10 Personel Paling Sering Izin / Cuti
            </h3>

            <div className="space-y-6">
              {(!statsData.top_frequent || statsData.top_frequent.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada data.</p>
              ) : (
                statsData.top_frequent.map((person, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex-shrink-0 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={person.nama}>
                          {person.nama}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {person.nrp}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 bg-muted/30 px-2 py-1 rounded-md">
                      <span className="text-sm font-bold text-primary">{person.count}</span>
                      <span className="text-xs text-muted-foreground">cuti</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
