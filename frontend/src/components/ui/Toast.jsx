import { useNotifications } from '@/lib/NotificationContext';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Toast notification component
 * Displays real-time notifications with auto-dismiss
 */
export function Toast({ toast, onDismiss, onRefresh }) {
  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgMap = {
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${bgMap[toast.type] || bgMap.info}`}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {iconMap[toast.type] || iconMap.info}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
      </div>

      <div className="flex items-center gap-1">
        {onRefresh && (
          <button
            onClick={() => onRefresh(toast)}
            className="p-1.5 rounded-md hover:bg-gray-200/50 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1.5 rounded-md hover:bg-gray-200/50 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}

/**
 * ToastContainer - Renders all active toast notifications
 * Positioned at top-right of screen
 */
export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
