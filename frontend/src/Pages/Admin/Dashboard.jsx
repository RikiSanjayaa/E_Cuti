import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Upload } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function AdminDashboard() {
  const [nrp, setNrp] = useState('');
  const [personnel, setPersonnel] = useState(null);
  const [loadingPersonnel, setLoadingPersonnel] = useState(false);
  
  const [formData, setFormData] = useState({
    jenis_izin: '',
    jumlah_hari: '',
    tanggal_mulai: '',
    alasan: ''
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [recentInputs, setRecentInputs] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

  // Auto-fill Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (nrp.length >= 4) {
        setLoadingPersonnel(true);
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API_URL}/personnel/${nrp}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setPersonnel(res.data);
        } catch (err) {
          setPersonnel(null);
        } finally {
          setLoadingPersonnel(false);
        }
      } else {
        setPersonnel(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [nrp]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (val) => {
    setFormData(prev => ({ ...prev, jenis_izin: val }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personnel) {
        setMessage({ type: 'error', text: 'NRP Invalid / Data Personel Tidak Ditemukan' });
        return;
    }
    setSubmitting(true);
    
    try {
      const data = new FormData();
      data.append('nrp', nrp);
      data.append('jenis_izin', formData.jenis_izin);
      data.append('jumlah_hari', formData.jumlah_hari);
      data.append('tanggal_mulai', formData.tanggal_mulai);
      data.append('alasan', formData.alasan);
      if (file) {
        data.append('file', file);
      }

      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/leaves/`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: 'Data Izin Berhasil Disimpan' });
      
      // Reset Form
      setFormData({ jenis_izin: '', jumlah_hari: '', tanggal_mulai: '', alasan: '' });
      setFile(null);
      setNrp('');
      setPersonnel(null);
      fetchRecents(); // Refresh list

    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Gagal menyimpan data' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchRecents = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/leaves/recent`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const mappedLogs = res.data.map(item => ({
            id: item.id,
            nama: item.personnel.nama,
            jenis_izin: item.jenis_izin,
            tanggal: new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        setRecentInputs(mappedLogs);
    } catch(err) {
        console.error("Failed to fetch recents", err);
    }
  };

  useEffect(() => {
      fetchRecents();
      
      // Poll every 5 seconds to keep the log updated real-time
      const interval = setInterval(fetchRecents, 5000);
      return () => clearInterval(interval);
  }, []);

  const handleImport = async (e) => {
      const importFile = e.target.files[0];
      if (!importFile) return;

      const data = new FormData();
      data.append('file', importFile);
      
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/personnel/import`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert('Import Berhasil!');
      } catch (err) {
        alert('Import Gagal: ' + (err.response?.data?.detail || err.message));
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Input Izin Personel</h2>
        <div className="flex gap-2">
            <Label htmlFor="import-file" className="bg-slate-900 text-white px-4 py-2 rounded cursor-pointer hover:bg-slate-800 text-sm">
                Import Data Personel (JSON/Excel)
            </Label>
            <Input id="import-file" type="file" className="hidden" onChange={handleImport} accept=".json,.csv,.xlsx" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Input */}
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nrp">NRP / NIP</Label>
                <div className="relative">
                    <Input 
                      id="nrp" 
                      placeholder="Masukkan NRP..." 
                      value={nrp} 
                      onChange={(e) => setNrp(e.target.value)} 
                      autoComplete="off"
                    />
                    {loadingPersonnel && <span className="absolute right-3 top-2 text-xs text-gray-500">Searching...</span>}
                </div>
              </div>
              
              {/* Personnel Preview Card inside Form */}
              {personnel && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-sm space-y-1">
                    <p><strong>Nama:</strong> {personnel.nama}</p>
                    <p><strong>Pangkat:</strong> {personnel.pangkat}</p>
                    <p><strong>Jabatan:</strong> {personnel.jabatan}</p>
                    <p><strong>Satker:</strong> {personnel.satker}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Izin</Label>
                    <Select onValueChange={handleSelectChange} value={formData.jenis_izin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                        <SelectItem value="Sakit">Sakit</SelectItem>
                        <SelectItem value="Istimewa">Istimewa</SelectItem>
                        <SelectItem value="Keagamaan">Keagamaan</SelectItem>
                        <SelectItem value="Melahirkan">Melahirkan</SelectItem>
                        <SelectItem value="Di Luar Tanggungan Negara">Di Luar Tanggungan</SelectItem>
                        <SelectItem value="Alasan Penting">Alasan Penting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jumlah_hari">Jumlah Hari</Label>
                    <Input 
                        id="jumlah_hari" 
                        type="number" 
                        value={formData.jumlah_hari}
                        onChange={handleInputChange}
                        min="1"
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                <Input 
                    id="tanggal_mulai" 
                    type="date" 
                    value={formData.tanggal_mulai} 
                    onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alasan">Alasan / Keterangan</Label>
                <Textarea 
                    id="alasan" 
                    placeholder="Jelaskan alasan izin..." 
                    value={formData.alasan}
                    onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Dokumen Pendukung (Opsional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                    <Input 
                        id="file" 
                        type="file" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        accept=".jpg,.png,.pdf"
                    />
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">{file ? file.name : "Click to upload or drag file"}</span>
                </div>
              </div>

              {message && (
                  <div className={`p-3 rounded text-sm ${message.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {message.text}
                  </div>
              )}

              <Button type="submit" className="w-full bg-slate-900" disabled={submitting || !personnel}>
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Side: Logs / Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>5 Input Terakhir Anda</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Jenis</TableHead>
                                <TableHead>Waktu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentInputs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-gray-500">Belum ada data input sesi ini.</TableCell>
                                </TableRow>
                            ) : (
                                recentInputs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.nama}</TableCell>
                                        <TableCell>{log.jenis_izin}</TableCell>
                                        <TableCell>{log.tanggal}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="bg-blue-900 text-white border-none">
                <CardHeader>
                    <CardTitle className="text-white">Petunjuk Penggunaan</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 opacity-90">
                    <p>1. Ketik NRP anggota, data akan muncul otomatis.</p>
                    <p>2. Pastikan file bukti (surat sakit/ijin) sudah disiapkan dalam format JPG/PDF.</p>
                    <p>3. Jika data personel tidak ditemukan, gunakan fitur <strong>Import Data</strong> di pojok kanan atas.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
