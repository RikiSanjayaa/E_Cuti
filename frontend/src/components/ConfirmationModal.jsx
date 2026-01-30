import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning', // warning, danger, success, info
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isLoading = false
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'success': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'info': return <Info className="w-6 h-6 text-blue-600" />;
      default: return <AlertTriangle className="w-6 h-6 text-orange-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20';
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20';
      case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20';
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[10000] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card dark:bg-neutral-900 rounded-xl shadow-2xl z-[10000] p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 border border-white/20 dark:border-neutral-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/20' :
            type === 'success' ? 'bg-green-50 dark:bg-green-900/20' :
              type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20' :
                'bg-orange-50 dark:bg-orange-900/20'
            }`}>
            {getIcon()}
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            {cancelText && (
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors border border-border"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${getButtonStyles()} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Memproses...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
