import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, FileText, Activity } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function AtasanDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 5 seconds (Real-time feeling)
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Memuat Dasbor...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Monitoring</h2>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Personel Izin Hari Ini</CardTitle>
            <Users className="h-4 w-4 text-blue-100" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.total_leaves_today || 0}</div>
            <p className="text-xs text-blue-100 mt-1">Personel sedang tidak di tempat</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aktivitas (Recents)</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recent_activity?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Data terbaru ditampilkan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Top 10 Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Top 10 Personel Paling Sering Izin</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.top_frequent} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nama" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e293b" radius={[0, 4, 4, 0]}>
                    {stats?.top_frequent?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_activity?.length === 0 ? <p className="text-center text-sm text-gray-500">Belum ada data.</p> : null}
              {stats?.recent_activity?.slice(0, 7).map((log) => ( // Show top 7 to fit
                <div key={log.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{log.personnel?.nama || 'Loading...'}</p>
                    <p className="text-xs text-muted-foreground">{log.jenis_izin} - {log.jumlah_hari} Hari</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
