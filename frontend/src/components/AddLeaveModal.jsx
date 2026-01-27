import { X, Search, Calendar, FileText, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export function AddLeaveModal({ isOpen, onClose }) {
  const [nrp, setNrp] = useState('');
  const [employee, setEmployee] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState('');
  const [context, setContext] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Handle personnel search
  const handleEmployeeSearch = async () => {
    if (!nrp || nrp.length < 4) {
      setEmployee(null);
      return;
    }

    try {
      setSearchError('');
      // In a real app we'd have a search endpoint. For now assuming we just validate NRP exists 
      // via a separate call or just let the leave submission fail if not found.
      // However, to show details we probably need a dedicated endpoint or search list.
      // Let's assume we can fetch basic info. Since we don't have a dedicated search API yet,
      // we might skip the detailed preview OR we could implement a quick search endpoint.
      // For this step, let's just allow proceeding if NRP is entered, maybe showing a "Verifying..." state on submit.
      // Or better: Let's assume the user knows the NRP.

      // Temporary: Just set a mock employee so UI feedback works, 
      // effectively trusting the user input until submission.
      // Ideally: Fetch from /api/personnel/{nrp} if it exists.

      // Fetch employee data
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/personnel/${nrp}`, {
          headers: { Authorization: `Bearer ${token}` }
      });

      setEmployee({
        name: res.data.nama,
        nrp: res.data.nrp,
        position: `${res.data.pangkat} - ${res.data.jabatan} (${res.data.satker})`,
        quota: res.data.sisa_cuti
      });

    } catch (error) {
      console.error("Error fetching employee:", error);
      setEmployee(null);
      setSearchError('Employee not found.');
    }
  };

  // Auto-search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleEmployeeSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [nrp]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('nrp', nrp);
      formData.append('jenis_izin', leaveType);
      formData.append('jumlah_hari', days);
      formData.append('tanggal_mulai', startDate);
      formData.append('alasan', context);
      if (file) {
        formData.append('file', file);
      }

      const token = localStorage.getItem('token');
      await axios.post('/api/leaves/', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(error.response?.data?.detail || 'Failed to submit leave record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNrp('');
    setEmployee(null);
    setSearchError('');
    setLeaveType('');
    setStartDate('');
    setDays('');
    setContext('');
    setFile(null);
    setSubmitSuccess(false);
    setSubmitError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-primary text-primary-foreground px-6 py-4 flex items-center justify-between border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Tambah Catatan Cuti</h2>
            <p className="text-sm opacity-90 mt-1">Catat entri cuti baru untuk personel</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-primary-foreground/10 rounded-md transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Catatan cuti berhasil dibuat!</p>
                </div>
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Kesalahan</p>
                  <p className="text-sm text-red-700 mt-1">{submitError}</p>
                </div>
              </div>
            )}

            {/* Step 1: Employee Search */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Langkah 1: NRP Personel
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Masukkan NRP Personel"
                      value={nrp}
                      onChange={(e) => setNrp(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                </div>
                {searchError && (
                    <p className="text-xs text-red-500 mt-1">{searchError}</p>
                )}
                
                {/* Employee Preview Card */}
                {employee && (
                    <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
                            {employee.name ? employee.name.charAt(0) : 'P'}
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="font-semibold text-foreground">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">NRP: {employee.nrp}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <p className="text-xs text-muted-foreground bg-white/50 px-2 py-0.5 rounded-full border border-border">
                                    {employee.position}
                                </p>
                                <p className={`text-xs px-2 py-0.5 rounded-full border ${employee.quota > 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    Sisa Cuti: {employee.quota} Hari
                                </p>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                )}
              </div>
            </div>

            {/* Step 2: Leave Details */}
            <div className="space-y-4 animate-in slide-in-from-top duration-300">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Langkah 2: Rincian Cuti
                </label>
              </div>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jenis Cuti <span className="text-red-500">*</span>
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Pilih jenis cuti</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Istimewa">Istimewa</option>
                  <option value="Keagamaan">Keagamaan</option>
                  <option value="Melahirkan">Melahirkan</option>
                  <option value="Di Luar Tanggungan Negara">Di Luar Tanggungan Negara</option>
                  <option value="Alasan Penting">Alasan Penting</option>
                </select>
              </div>

              {/* Date and Days */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Jumlah Hari <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Hari"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Upload Evidence */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dokumen Bukti (PDF/Gambar)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              {/* Context/Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alasan / Catatan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <textarea
                    placeholder="Masukkan alasan..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent cursor-pointer"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Catatan Cuti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
