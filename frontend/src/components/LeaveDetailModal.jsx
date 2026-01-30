import { X, User, Calendar, FileText, Clock, Shield } from 'lucide-react';
import { createPortal } from 'react-dom';
import { formatDate } from '@/utils/dateUtils';
import { getLeaveColorClass } from '@/utils/leaveUtils';

export function LeaveDetailModal({ isOpen, onClose, leave }) {
    if (!isOpen || !leave) return null;

    // formatDate is imported directly



    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/50 z-[10050] animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div 
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] bg-card dark:bg-neutral-900 rounded-lg shadow-2xl z-[10051] overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-card px-6 py-4 flex items-center justify-between border-b border-border">
                    <h2 className="text-xl font-semibold">Detail Pengajuan Cuti</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-6">
                    {/* Personnel Info */}
                    <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-lg border border-slate-100 dark:border-neutral-800">
                        <div className="flex items-start gap-3">
                            <div className="bg-white dark:bg-neutral-800 p-2 rounded-full border border-slate-200 dark:border-neutral-700 shadow-sm">
                                <User className="w-5 h-5 text-slate-600 dark:text-neutral-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{leave.personnel?.nama}</p>
                                <div className="flex flex-col text-sm text-muted-foreground mt-1">
                                    <span>NRP: {leave.personnel?.nrp}</span>
                                    <span>{leave.personnel?.pangkat} - {leave.personnel?.jabatan}</span>
                                    {leave.personnel?.bag && <span>{leave.personnel?.bag}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leave Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rincian Izin</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Jenis Cuti
                                </p>
                                <span className={`inline-block px-2 py-1 rounded-md text-sm font-medium border ${getLeaveColorClass(leave.leave_type)}`}>
                                    {leave.leave_type?.name || '-'}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Tanggal Mulai
                                </p>
                                <p className="font-medium">{formatDate(leave.tanggal_mulai)}</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Tanggal Selesai
                                </p>
                                <p className="font-medium">
                                    {leave.tanggal_mulai ? formatDate(new Date(leave.tanggal_mulai).setDate(new Date(leave.tanggal_mulai).getDate() + (leave.jumlah_hari - 1))) : '-'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Dicatat Oleh
                                </p>
                                <p className="font-medium text-sm">
                                    {leave.creator?.full_name || leave.creator?.username || 'System'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Durasi
                                </p>
                                <p className="font-medium">{leave.jumlah_hari} Hari</p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Sisa Cuti
                                </p>
                                <p className="font-medium text-sm">
                                    {leave.sisa_cuti !== undefined ? `${leave.sisa_cuti} Hari` : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1 pt-2">
                            <p className="text-xs text-muted-foreground">Alasan / Keterangan</p>
                            <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-md p-3 text-sm leading-relaxed">
                                {leave.alasan || '-'}
                            </div>
                        </div>

                        {leave.file_path && (
                            <div className="space-y-1 pt-2">
                                <p className="text-xs text-muted-foreground">Dokumen Bukti</p>
                                <a
                                    href={`http://localhost:8000/static/${leave.file_path.replace(/^uploads\//, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-100 dark:border-blue-800 w-full"
                                >
                                    <FileText className="w-4 h-4" />
                                    Lihat Dokumen Terlampir
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
