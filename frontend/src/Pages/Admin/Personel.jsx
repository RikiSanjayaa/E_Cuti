import { Search, Filter, Download, X, Mail, Phone, MapPin, Calendar, TrendingUp, Upload, Loader2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

import AddPersonnelModal from '@/components/AddPersonnelModal';
import ImportDetailsModal from '@/components/ImportDetailsModal';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function Personel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);

  // Import State
  const fileInputRef = useRef(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Add Personnel State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notification Modal State (for errors/info)
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('nama');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchPersonnel();
  }, [currentPage, sortBy, sortOrder, searchQuery]);

  const fetchPersonnel = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        sort_by: sortBy,
        sort_order: sortOrder
      };

      if (searchQuery) params.query = searchQuery;

      const response = await axios.get('/api/personnel/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      setPersonnel(response.data);

      const total = parseInt(response.headers['x-total-count'] || '0', 10);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));

    } catch (error) {
      console.error("Failed to fetch personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/personnel/import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Use ImportDetailsModal for detailed success report
      setImportResult(response.data.data);

      fetchPersonnel();

    } catch (error) {
      setModal({
        isOpen: true,
        type: 'danger',
        title: 'Import Gagal',
        message: error.response?.data?.detail || error.message
      });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  const filteredPersonnel = personnel; // Direct assignment as filtering is server-side now

  return (
    <div className="relative">
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
            <p className="text-sm text-muted-foreground">Personel Baru (Bulan Ini)</p>
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
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <div className="bg-white/20 p-0.5 rounded">
                  <Plus className="w-3 h-3" />
                </div>
                Tambah
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                disabled={importLoading}
              >
                {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import Excel
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
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('nrp')}
                  >
                    <div className="flex items-center">
                      NRP
                      <SortIcon field="nrp" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('nama')}
                  >
                    <div className="flex items-center">
                      Nama
                      <SortIcon field="nama" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('pangkat')}
                  >
                    <div className="flex items-center">
                      Pangkat
                      <SortIcon field="pangkat" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('jabatan')}
                  >
                    <div className="flex items-center">
                      Jabatan
                      <SortIcon field="jabatan" />
                    </div>
                  </th>
                  <th
                    className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort('satker')}
                  >
                    <div className="flex items-center">
                      Satker
                      <SortIcon field="satker" />
                    </div>
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
                      onClick={() => setSelectedPersonnel(p)}
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
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <span className={p.sisa_cuti < 5 ? 'text-red-600' : 'text-green-600'}>
                          {p.sisa_cuti} hari
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-white px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>

        {/* Detail Overlay & Panel */}
        {selectedPersonnel && createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in duration-300"
              onClick={() => setSelectedPersonnel(null)}
            />
            <div className="fixed right-0 inset-y-0 w-full md:w-[600px] bg-white shadow-2xl z-[110] overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Detail Personel</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPersonnel.nrp}</p>
                </div>
                <button
                  onClick={() => setSelectedPersonnel(null)}
                  className="p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Informasi Profil</h3>
                  <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
                        {selectedPersonnel.nama?.split(' ').slice(0, 2).map(n => n[0]).join('') || 'P'}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">{selectedPersonnel.nama}</p>
                        <p className="text-sm text-muted-foreground">{selectedPersonnel.jabatan}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Satuan Kerja</p>
                          <p className="text-sm text-foreground">{selectedPersonnel.satker}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pangkat</p>
                          <p className="text-sm text-foreground">{selectedPersonnel.pangkat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4">Saldo Cuti</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs text-blue-700 mb-1">Sisa Cuti Tahunan</p>
                      <p className="text-2xl font-semibold text-blue-900">{selectedPersonnel.sisa_cuti ?? 12}</p>
                      <p className="text-xs text-blue-600 mt-1">hari tersisa dari 12 hari</p>
                    </div>
                    {/* Additional quota info could go here */}
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* Import Notification Modal */}
        <ConfirmationModal
          isOpen={modal.isOpen}
          onClose={() => setModal({ ...modal, isOpen: false })}
          onConfirm={() => setModal({ ...modal, isOpen: false })}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          confirmText="Tutup"
          cancelText={null}
        />

        {/* Detailed Import Result Modal */}
        <ImportDetailsModal
          isOpen={!!importResult}
          onClose={() => setImportResult(null)}
          data={importResult}
        />

        {/* Add Personnel Modal */}
        <AddPersonnelModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(msg) => {
            fetchPersonnel();
            setModal({
              isOpen: true,
              type: 'success',
              title: 'Berhasil',
              message: msg
            });
          }}
        />
      </div>
    </div >
  );

}
