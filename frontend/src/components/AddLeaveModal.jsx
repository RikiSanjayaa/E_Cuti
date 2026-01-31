import { X, FileText, User, AlertCircle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { getLeaveColorClass } from '@/utils/leaveUtils';
import { useNotifications } from '@/lib/NotificationContext';
import { DatePicker } from '@/components/ui/date-picker';
import { addDays, format, isWeekend } from 'date-fns';

export function AddLeaveModal({ isOpen, onClose, initialData = null }) {
  const [nrp, setNrp] = useState('');
  const [personel, setPersonnel] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [days, setDays] = useState('');
  const [context, setContext] = useState('');
  const [file, setFile] = useState(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useNotifications();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const isEditMode = !!initialData;

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      if (!personel) {
        setLeaveTypes([]);
        return;
      }

      setLoadingLeaveTypes(true);
      try {
        const token = localStorage.getItem('token');
        // Pass gender filter to get only applicable leave types
        const gender = personel.gender || '';
        const res = await axios.get(`/api/leave-types/${gender ? `?gender=${gender}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaveTypes(res.data);
      } catch (error) {
        console.error("Error fetching leave types:", error);
        setLeaveTypes([]);
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, [personel]);

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

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return '';

    // We treat the date string as a literal calendar date in the user's locale
    const parseDate = (dateStr) => {
      const parts = dateStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };

    const startDateObj = parseDate(start);
    const endDateObj = parseDate(end);

    if (endDateObj < startDateObj) return '';

    let count = 0;
    let current = new Date(startDateObj);

    while (current <= endDateObj) {
      const dayOfWeek = current.getDay();

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some(h => h.date === formattedDate);

      // Count only if not weekend and not holiday
      if (!isWeekend && !isHoliday) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count.toString();
  };

  useEffect(() => {
    if (startDate && finishDate) {
      const calculatedDays = calculateWorkingDays(startDate, finishDate);
      setDays(calculatedDays);
    } else if (startDate && !finishDate) {
      // Only start date provided - default to 1 day leave
      setDays('1');
    }
  }, [startDate, finishDate, holidays]);

  // Helper function to calculate end date based on start date and working days
  const calculateEndDate = (start, daysCount) => {
    if (!start || !daysCount || parseInt(daysCount) <= 0) return '';

    const parseDate = (dateStr) => {
      const parts = dateStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };

    let currentDate = parseDate(start);
    if (isNaN(currentDate.getTime())) return '';

    let daysAdded = 0;
    const targetDays = parseInt(daysCount);
    let lastWorkingDate = new Date(currentDate);

    let loops = 0;
    while (daysAdded < targetDays && loops < 365) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const dayOfWeek = currentDate.getDay();
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some(h => h.date === formattedDate);

      if (!isWeekendDay && !isHoliday) {
        daysAdded++;
        lastWorkingDate = new Date(currentDate);
      }

      currentDate.setDate(currentDate.getDate() + 1);
      loops++;
    }

    // Format as YYYY-MM-DD
    const endYear = lastWorkingDate.getFullYear();
    const endMonth = String(lastWorkingDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(lastWorkingDate.getDate()).padStart(2, '0');
    return `${endYear}-${endMonth}-${endDay}`;
  };

  useEffect(() => {
    if (initialData && isOpen) {
      setNrp(initialData.personnel?.nrp || '');
      setStartDate(initialData.tanggal_mulai || '');
      setRemoveExistingFile(false);
      setDays(initialData.jumlah_hari?.toString() || '');
      setContext(initialData.alasan || '');

      // Set personnel first so that leaveTypes can be fetched
      setPersonnel(initialData.personnel ? {
        name: initialData.personnel.nama,
        nrp: initialData.personnel.nrp,
        position: initialData.personnel.jabatan ? `${initialData.personnel.pangkat} - ${initialData.personnel.jabatan}` : '',
        gender: initialData.personnel.jenis_kelamin,
        balances: initialData.personnel.balances || {}
      } : null);

      // Calculate and set the finish date based on start date and working days
      if (initialData.tanggal_selesai) {
        setFinishDate(initialData.tanggal_selesai);
      } else if (initialData.tanggal_mulai && initialData.jumlah_hari) {
        const calculatedEndDate = calculateEndDate(initialData.tanggal_mulai, initialData.jumlah_hari);
        setFinishDate(calculatedEndDate);
      } else {
        setFinishDate('');
      }
    } else if (!isOpen) {
      resetForm();
    }
  }, [initialData, isOpen, holidays]);

  // Set leaveTypeId after leaveTypes have loaded (for edit mode)
  useEffect(() => {
    if (isEditMode && initialData && leaveTypes.length > 0 && !leaveTypeId) {
      const typeId = initialData.leave_type_id || initialData.leave_type?.id;
      if (typeId) {
        setLeaveTypeId(String(typeId));
      }
    }
  }, [isEditMode, initialData, leaveTypes]);

  const handlePersonnelSearch = async () => {
    if (!nrp || nrp.length < 4) {
      setPersonnel(null);
      return;
    }

    try {
      setSearchError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/personnel/${nrp}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPersonnel({
        name: res.data.nama,
        nrp: res.data.nrp,
        position: `${res.data.pangkat} - ${res.data.jabatan}`,
        gender: res.data.jenis_kelamin,
        balances: res.data.balances || {}
      });

    } catch (error) {
      console.error("Error fetching personel:", error);
      setPersonnel(null);
      setSearchError('Personnel not found.');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (nrp && nrp.length >= 4) handlePersonnelSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [nrp]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!leaveTypeId) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        message: 'Mohon pilih jenis cuti terlebih dahulu'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nrp', nrp);
      formData.append('leave_type_id', leaveTypeId);
      formData.append('jumlah_hari', days);
      formData.append('tanggal_mulai', startDate);
      if (finishDate) {
        formData.append('tanggal_selesai', finishDate);
      }
      formData.append('alasan', context);

      // Handle file: send new file if selected, and removal flag if existing should be removed
      // Both can be true: user deletes existing file, then selects a new one
      if (file) {
        formData.append('file', file);
      }
      if (removeExistingFile) {
        formData.append('remove_existing_file', 'true');
      }

      const token = localStorage.getItem('token');

      if (isEditMode) {
        await axios.post(`/api/leaves/${initialData.id}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        await axios.post('/api/leaves/', formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      resetForm();
      onClose();
      // Success notification is handled by WebSocket to avoid duplication
    } catch (error) {
      console.error("Submission error:", error);
      const errorData = error.response?.data?.detail;
      let errorMsg = 'Gagal menyimpan data cuti.';

      if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (Array.isArray(errorData)) {
        errorMsg = errorData.map(err => `${err.loc[err.loc.length - 1]}: ${err.msg}`).join(', ');
      }

      resetForm();
      onClose();
      addToast({
        type: 'error',
        title: 'Gagal',
        message: errorMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNrp('');
    setPersonnel(null);
    setSearchError('');
    setLeaveTypeId('');
    setStartDate('');
    setFinishDate('');
    setDays('');
    setContext('');
    setFile(null);
    setRemoveExistingFile(false);
    setLeaveTypes([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getSelectedTypeBalance = () => {
    if (!leaveTypeId || !personel || !leaveTypes.length) return null;
    const selectedType = leaveTypes.find(lt => lt.id === parseInt(leaveTypeId));
    if (!selectedType || !personel.balances) return null;

    const balance = personel.balances[selectedType.name];
    let remaining = 0;

    if (balance === undefined || balance === null) {
      remaining = selectedType.default_quota;
    } else {
      remaining = typeof balance === 'object' ? balance.remaining : balance;
    }

    if (isEditMode && initialData && parseInt(leaveTypeId) === initialData.leave_type_id) {
      remaining += parseInt(initialData.jumlah_hari) || 0;
    }

    return remaining;
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-card dark:bg-neutral-900 rounded-lg shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Catatan Cuti' : 'Tambah Catatan Cuti'}</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">{isEditMode ? 'Perbarui data cuti personel' : 'Catat entri cuti baru untuk personel'}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">


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
                      className="w-full pl-9 pr-4 py-2 border border-input dark:border-neutral-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground dark:placeholder-neutral-500"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                </div>
                {searchError && (
                  <p className="text-xs text-red-500 mt-1">{searchError}</p>
                )}

                {/* Personnel Preview Card with Per-Type Balances */}
                {personel && (
                  <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
                        {personel.name ? personel.name.charAt(0) : 'P'}
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold text-foreground">{personel.name}</p>
                        <p className="text-xs text-muted-foreground">NRP: {personel.nrp}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <p className="text-xs text-foreground bg-muted/50 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-border">
                            {personel.position}
                          </p>
                          {personel.gender && (
                            <p className="text-xs text-foreground bg-muted/50 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-border">
                              {personel.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>

                    {personel.balances && Object.keys(personel.balances).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-primary/10">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Sisa Kuota Cuti:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(personel.balances).map(([type, data]) => {
                            const remaining = typeof data === 'object' ? data.remaining : data;
                            return (
                              <div
                                key={type}
                                className={`text-xs px-2 py-1.5 rounded border ${getLeaveColorClass(type, leaveTypes)}`}
                              >
                                <span className="font-medium">{type}:</span> {remaining} hari
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 animate-in slide-in-from-top duration-300">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Langkah 2: Rincian Cuti
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jenis Cuti <span className="text-red-500">*</span>
                </label>
                <Select
                  value={leaveTypeId ? leaveTypeId.toString() : ""}
                  onValueChange={(val) => setLeaveTypeId(val)}
                  disabled={isSubmitting || loadingLeaveTypes || !personel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!personel ? 'Pilih personel terlebih dahulu' : loadingLeaveTypes ? 'Memuat jenis cuti...' : 'Pilih jenis cuti'} />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(lt => (
                      <SelectItem key={lt.id} value={lt.id.toString()}>
                        {lt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {leaveTypeId && personel && getSelectedTypeBalance() !== null && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300 animate-in fade-in">
                    Sisa kuota: <strong>{getSelectedTypeBalance()}</strong> hari
                  </div>
                )}
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Pilih tanggal mulai"
                    disabled={isSubmitting}
                    modifiers={{
                      holiday: (d) => holidays.some(h => {
                        const hDate = new Date(h.date);
                        return hDate.getDate() === d.getDate() &&
                          hDate.getMonth() === d.getMonth() &&
                          hDate.getFullYear() === d.getFullYear();
                      })
                    }}
                    modifiersClassNames={{
                      holiday: "text-red-500 font-bold"
                    }}
                  />
                </div >

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tanggal Selesai
                  </label>
                  <DatePicker
                    value={finishDate}
                    onChange={setFinishDate}
                    placeholder="Pilih tanggal selesai"
                    disabled={isSubmitting || !startDate}
                    minDate={startDate ? (() => {
                      const parts = startDate.split("-");
                      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    })() : undefined}
                    modifiers={{
                      holiday: (d) => holidays.some(h => {
                        const hDate = new Date(h.date);
                        return hDate.getDate() === d.getDate() &&
                          hDate.getMonth() === d.getMonth() &&
                          hDate.getFullYear() === d.getFullYear();
                      })
                    }}
                    modifiersClassNames={{
                      holiday: "text-red-500 font-bold"
                    }}
                  />
                </div >
              </div >

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jumlah Hari Kerja <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Hitung otomatis"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground dark:placeholder-neutral-500 ${days && getSelectedTypeBalance() !== null && parseInt(days) > getSelectedTypeBalance()
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-input dark:border-neutral-800'
                    }`}
                  required
                  disabled={isSubmitting}
                />
                {days && getSelectedTypeBalance() !== null && parseInt(days) > getSelectedTypeBalance() && (
                  <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Melebihi sisa kuota ({getSelectedTypeBalance()} hari)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dokumen Bukti (PDF/Gambar)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/20 dark:file:text-violet-300 dark:hover:file:bg-violet-900/30"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {isEditMode && initialData?.file_path && !removeExistingFile && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-800">
                      <FileIcon className="w-4 h-4" />
                      <span className="flex-1 truncate">
                        {initialData.file_path.split('/').pop()}
                      </span>
                      <a
                        href={`/api/static/${initialData.file_path.replace(/^uploads\//, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                        title="Lihat Dokumen"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setRemoveExistingFile(true)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                    className="w-full pl-9 pr-4 py-2 border border-input dark:border-neutral-800 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-transparent text-foreground dark:placeholder-neutral-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div >

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-input dark:border-neutral-800 rounded-md text-sm hover:bg-accent dark:hover:bg-neutral-800 text-foreground dark:text-neutral-300 cursor-pointer"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary dark:bg-white text-primary-foreground dark:text-black rounded-md hover:bg-primary/90 dark:hover:bg-gray-200 border border-transparent dark:border-transparent text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Catatan Cuti'}
              </button>
            </div>
          </form >
        </div >
      </div >
    </>,
    document.body
  );
}
