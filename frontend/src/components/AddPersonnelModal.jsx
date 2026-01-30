import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, UserPlus, Save, Loader2 } from 'lucide-react';
import { useNotifications } from '@/lib/NotificationContext';

export default function AddPersonnelModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    nrp: '',
    nama: '',
    pangkat: '',
    jabatan: ''
  });

  const [loading, setLoading] = useState(false);

  const { addToast } = useNotifications();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/personnel/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFormData({ nrp: '', nama: '', pangkat: '', jabatan: '' });
      onSuccess("Personel berhasil ditambahkan!");
      onClose();
    } catch (err) {
      onClose();
      addToast({
        type: 'error',
        title: 'Gagal',
        message: err.response?.data?.detail || "Gagal menambahkan personel"
      });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card rounded-xl shadow-2xl z-50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Tambah Personel Baru
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Masukkan data lengkap personel secara manual.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">NRP / NIP <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="nrp"
              value={formData.nrp}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="Contoh: 12345678"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nama Lengkap <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="Nama lengkap beserta gelar"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pangkat <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="pangkat"
                value={formData.pangkat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="Contoh: BRIPKA"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jabatan <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="jabatan"
                value={formData.jabatan}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="Contoh: BA UR TU"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Personel
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
