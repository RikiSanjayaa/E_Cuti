import { Search, Filter, Download, X, Mail, Phone, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Personel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch all personnel
      const response = await axios.get('/api/personnel/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPersonnel(response.data);
    } catch (error) {
      console.error("Failed to fetch personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonnel = personnel.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    return (
      p.nama?.toLowerCase().includes(searchLower) ||
      p.nrp?.toLowerCase().includes(searchLower) ||
      p.jabatan?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Personel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Direktori personel dan informasi cuti
        </p>
      </div>

      {/* Summary Cards (Mock Data for now as backend doesn't aggregate this yet) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Personel</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{personnel.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Personel Aktif</p>
          <p className="text-3xl font-semibold text-foreground mt-2">{personnel.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Sedang Cuti</p>
          <p className="text-3xl font-semibold text-foreground mt-2">-</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pegawai Baru (Bulan Ini)</p>
          <p className="text-3xl font-semibold text-foreground mt-2">-</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NRP, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
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
                  Nama
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pangkat
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Jabatan
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Satker
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sisa Cuti
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                    Tidak ada personel ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedEmployee(p)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {p.nrp}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {p.pangkat}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {p.jabatan}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {p.satker}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-foreground">12 hari</span> {/* Mock Data */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredPersonnel.length} personel
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-input rounded text-sm hover:bg-accent disabled:opacity-50 cursor-pointer" disabled>
              Sebelumnya
            </button>
            <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm cursor-pointer">
              1
            </button>
            <button className="px-3 py-1 border border-input rounded text-sm hover:bg-accent disabled:opacity-50 cursor-pointer" disabled>
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Employee Detail Panel */}
      {selectedEmployee && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEmployee(null)}
          />

          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Detail Personel</h2>
                <p className="text-sm text-muted-foreground mt-1">{selectedEmployee.nrp}</p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Informasi Profil</h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                      {selectedEmployee.nama?.split(' ').slice(0, 2).map(n => n[0]).join('') || 'P'}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{selectedEmployee.nama}</p>
                      <p className="text-sm text-muted-foreground">{selectedEmployee.jabatan}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Satuan Kerja</p>
                        <p className="text-sm text-foreground">{selectedEmployee.satker}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pangkat</p>
                        <p className="text-sm text-foreground">{selectedEmployee.pangkat}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Balance (Mock) */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Saldo Cuti (Demo)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-700 mb-1">Cuti Tahunan</p>
                    <p className="text-2xl font-semibold text-blue-900">12</p>
                    <p className="text-xs text-blue-600 mt-1">hari tersisa</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-700 mb-1">Cuti Sakit</p>
                    <p className="text-2xl font-semibold text-red-900">10</p>
                    <p className="text-xs text-red-600 mt-1">hari tersisa</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
