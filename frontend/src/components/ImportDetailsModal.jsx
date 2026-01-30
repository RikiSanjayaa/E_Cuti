import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, RefreshCw, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

export default function ImportDetailsModal({ isOpen, onClose, data }) {
    if (!isOpen || !data) return null;

    const [activeTab, setActiveTab] = useState('updated'); // 'updated' | 'added'

    const { stats, details } = data;

    const updatedRecords = details.filter(d => d.type === 'updated');
    const addedRecords = details.filter(d => d.type === 'added');

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card rounded-xl shadow-2xl z-50 flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            Import Selesai
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Rincian hasil proses import data personel.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="p-6 grid grid-cols-4 gap-4 bg-card">
                    <StatCard label="Total" value={stats.total} color="bg-gray-100 text-gray-700" />
                    <StatCard label="Baru" value={stats.added} color="bg-green-100 text-green-700" />
                    <StatCard label="Update" value={stats.updated} color="bg-blue-100 text-blue-700" />
                    <StatCard label="Sama" value={stats.skipped} color="bg-gray-100 text-gray-500" />
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-100 flex gap-6">
                    <TabButton
                        active={activeTab === 'updated'}
                        onClick={() => setActiveTab('updated')}
                        count={updatedRecords.length}
                        label="Perubahan Data"
                        icon={<RefreshCw className="w-4 h-4" />}
                    />
                    <TabButton
                        active={activeTab === 'added'}
                        onClick={() => setActiveTab('added')}
                        count={addedRecords.length}
                        label="Data Baru"
                        icon={<UserPlus className="w-4 h-4" />}
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
                    {activeTab === 'updated' && (
                        <div className="space-y-4">
                            {updatedRecords.length === 0 ? (
                                <EmptyState message="Tidak ada data yang diperbarui." />
                            ) : (
                                updatedRecords.map((item, idx) => (
                                    <div key={idx} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.nama}</p>
                                                <p className="text-xs text-gray-500 font-mono">NRP: {item.nrp}</p>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                                {item.changes.length} Perubahan
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {item.changes.map((change, cIdx) => (
                                                <div key={cIdx} className="text-sm grid grid-cols-[100px_1fr_20px_1fr] items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                                                    <span className="text-gray-500 font-medium">{change.field}</span>
                                                    <span className="text-red-600 line-through opacity-70 truncate" title={change.old}>{change.old}</span>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    <span className="text-green-600 font-medium truncate" title={change.new}>{change.new}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'added' && (
                        <div className="space-y-3">
                            {addedRecords.length === 0 ? (
                                <EmptyState message="Tidak ada data baru ditambahkan." />
                            ) : (
                                addedRecords.map((item, idx) => (
                                    <div key={idx} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                                NEW
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.nama}</p>
                                                <div className="flex gap-2 text-xs text-gray-500">
                                                    <span>{item.nrp}</span>
                                                    <span>•</span>
                                                    <span>{item.pangkat}</span>
                                                    <span>•</span>
                                                    <span>{item.jabatan}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-card rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-all shadow-lg shadow-gray-900/10 active:scale-[0.99]"
                    >
                        Tutup
                    </button>
                </div>

            </div>
        </>,
        document.body
    );
}

function StatCard({ label, value, color }) {
    return (
        <div className={`p-3 rounded-lg text-center ${color}`}>
            <p className="text-xs font-semibold uppercase opacity-70 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    )
}

function TabButton({ active, onClick, count, label, icon }) {
    return (
        <button
            onClick={onClick}
            className={`pb-3 pt-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-all ${active
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
        >
            {icon}
            {label}
            <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {count}
            </span>
        </button>
    )
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm">{message}</p>
        </div>
    )
}
