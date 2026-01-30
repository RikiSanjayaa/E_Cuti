import {
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  FileText,
  Database,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  Calendar as CalendarIcon, // Rename to avoid conflict
  Loader2
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '@/utils/dateUtils';
import { AddLeaveModal } from '../../components/AddLeaveModal';
import { useEntitySubscription } from '@/lib/NotificationContext';
import { Calendar } from "@/components/ui/calendar";
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  const basePath = userRole === 'atasan' ? '/atasan' : '/admin';
  const canAddLeave = userRole === 'admin' || userRole === 'super_admin';

  const [statsData, setStatsData] = useState({
    total_leave_entries: 0,
    leaves_this_month: 0,
    total_personel: 0,
    average_duration: 0,
    recent_activity: [],
    leave_distribution: [],
    department_summary: [],
    top_frequent: [],
    calendar_leaves: []
  });
  const [loading, setLoading] = useState(true);
  const [isAddLeaveModalOpen, setIsAddLeaveModalOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);

  const fetchStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch holidays from API
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/holidays/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHolidays(res.data);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, []);

  // Subscribe to real-time updates for all entities
  useEntitySubscription('leaves', fetchStats);
  useEntitySubscription('personnel', fetchStats);
  useEntitySubscription('users', fetchStats);
  useEntitySubscription('leave_types', fetchStats);

  // Get icon and colors based on audit action type
  const getActivityStyle = (activity) => {
    const action = activity.action?.toLowerCase() || '';

    if (action.includes('create') || action.includes('add')) {
      return {
        Icon: Plus,
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        textColor: 'text-green-600 dark:text-green-500'
      };
    } else if (action.includes('update') || action.includes('edit') || action.includes('reset')) {
      return {
        Icon: Pencil,
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        textColor: 'text-blue-600 dark:text-blue-500'
      };
    } else if (action.includes('delete') || action.includes('remove')) {
      return {
        Icon: Trash2,
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-600 dark:text-red-500'
      };
    }

    return {
      Icon: FileText,
      bgColor: 'bg-primary/10 dark:bg-primary/20',
      textColor: 'text-primary dark:text-primary'
    };
  };

  // Get navigation path based on audit category (returns null if user doesn't have access)
  const getActivityPath = (activity) => {
    const category = activity.category?.toLowerCase() || '';
    const isAtasan = userRole === 'atasan';

    if (category.includes('leave') && !category.includes('type')) return `${basePath}/leaves`;
    if (category.includes('personnel') || category.includes('personel')) return `${basePath}/personel`;

    // These pages are only accessible by admin/super_admin
    if (category.includes('leave_type') || category.includes('leavetype')) {
      return isAtasan ? null : `${basePath}/leave-types`;
    }
    if (category.includes('user')) {
      return isAtasan ? null : `${basePath}/users`;
    }

    // Default: don't navigate for unknown categories
    return null;
  };

  // Handle click on activity row - navigate to corresponding page
  const handleActivityClick = (activity) => {
    const path = getActivityPath(activity);
    if (path) {
      navigate(path);
    }
  };

  const isHoliday = (day) => {
    return holidays.some(h => {
      // Parse YYYY-MM-DD string safely
      const [year, month, d] = h.date.split('-').map(Number);
      return d === day.getDate() &&
        (month - 1) === day.getMonth() &&
        year === day.getFullYear();
    });
  };

  const hasLeave = (day) => {
    return statsData.calendar_leaves?.some(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const current = new Date(day);
      current.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    });
  };

  const selectedLeaves = (() => {
    if (!date) return [];
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    return statsData.calendar_leaves?.filter(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return current >= start && current <= end;
    }) || [];
  })();

  const selectedHoliday = (() => {
    if (!date) return null;
    return holidays.find(h => {
      const [year, month, d] = h.date.split('-').map(Number);
      return d === date.getDate() &&
        (month - 1) === date.getMonth() &&
        year === date.getFullYear();
    });
  })();

  const stats = [
    {
      label: 'Total Pengajuan cuti',
      value: statsData.total_leave_entries.toLocaleString(),
      icon: Database,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      borderColor: 'border-blue-100 dark:border-blue-900/20'
    },
    {
      label: 'Entri baru bulan Ini',
      value: statsData.leaves_this_month.toLocaleString(),
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
      borderColor: 'border-emerald-100 dark:border-emerald-900/20'
    },
    {
      label: 'Rata-rata Durasi cuti',
      value: `${statsData.average_duration} hari`,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/10',
      borderColor: 'border-amber-100 dark:border-amber-900/20'
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Ringkasan & statistik manajemen cuti
          </p>
        </div>
        {canAddLeave && (
          <button
            onClick={() => setIsAddLeaveModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 font-medium group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Tambah Izin Cuti
          </button>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Column (Main Content) */}
        <div className="flex-1 w-full space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`bg-card border ${stat.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between`}
                >
                  <div className="flex justify-between items-start">
                    <div className={`${stat.bgColor} p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-2xl font-bold text-foreground tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-1">
                      {stat.change}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Activity Section */}
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
                  const user = activity.user ? (activity.user.full_name || activity.user.username) : 'System';
                  const actionText = `${activity.action || 'Aksi'} - ${activity.target || ''}`;
                  const dateStr = formatTimeAgo(activity.timestamp);
                  const { Icon, bgColor, textColor } = getActivityStyle(activity);
                  const isClickable = getActivityPath(activity) !== null;

                  return (
                    <div
                      key={activity.id || index}
                      onClick={() => handleActivityClick(activity)}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group ${isClickable ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center ${textColor} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {user}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {actionText}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          {dateStr}
                        </div>
                        {isClickable && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Grid: Distribution & Top 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Leave Distribution */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full">
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

            {/* Top 5 Personnel Paling Sering Izin / Cuti */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full flex flex-col">
              <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Top 5 Personel Paling Sering Izin
              </h3>

              <div className="flex flex-col justify-around flex-1 overflow-y-auto pr-2">
                {(!statsData.top_frequent || statsData.top_frequent.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada data.</p>
                ) : (
                  statsData.top_frequent.slice(0, 5).map((person, index) => (
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

        {/* Right Column (Sidebar) */}
        <div className="w-full xl:w-[350px] flex-shrink-0">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm h-full sticky top-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Kalender Cuti
            </h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border p-3"
                modifiers={{
                  holiday: (d) => isHoliday(d),
                  activeLeave: (d) => hasLeave(d),
                  weekend: (d) => d.getDay() === 0 || d.getDay() === 6
                }}
                modifiersClassNames={{
                  holiday: "text-red-500 font-bold",
                  activeLeave: "after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-blue-500 after:rounded-full"
                }}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-4">
              <div>
                <p className="font-medium text-base text-foreground">
                  {date ? date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Pilih tanggal'}
                </p>
                {selectedHoliday && (
                  <p className="text-sm text-red-500 font-semibold mt-1">
                    Libur Bersama: {selectedHoliday.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {selectedLeaves.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sedang Cuti:</p>
                    {selectedLeaves.map(leave => (
                      <div key={leave.id} className="text-sm bg-muted/50 p-3 rounded-lg flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full bg-${leave.color}-500 flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{leave.personnel_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{leave.leave_type}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  !selectedHoliday && <p className="text-sm text-muted-foreground italic">Tidak ada personel cuti pada tanggal ini.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {canAddLeave && (
        <AddLeaveModal
          isOpen={isAddLeaveModalOpen}
          onClose={() => setIsAddLeaveModalOpen(false)}
        />
      )}
    </div>
  );
}
