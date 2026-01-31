import { useNotifications } from '@/lib/NotificationContext';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useState } from 'react';

/**
 * Toast notification component
 * Mobile-style notification: wide, compact, slides from top
 */
export function Toast({ toast, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);

  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
  };

  const bgMap = {
    success: 'bg-emerald-50 border-emerald-300/50 dark:bg-emerald-950/90 dark:border-emerald-700/50',
    warning: 'bg-amber-50 border-amber-300/50 dark:bg-amber-950/90 dark:border-amber-700/50',
    error: 'bg-red-50 border-red-300/50 dark:bg-red-950/90 dark:border-red-700/50',
    info: 'bg-blue-50 border-blue-300/50 dark:bg-blue-950/90 dark:border-blue-700/50'
  };

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-sm
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${bgMap[toast.type] || bgMap.info}
        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
      style={{ width: 'min(90vw, 480px)' }}
    >
      <div className="flex-shrink-0">
        {iconMap[toast.type] || iconMap.info}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {toast.title}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {toast.message}
        </span>
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

/**
 * ToastContainer - Renders all active toast notifications
 * Positioned at top-center of screen, mobile notification style
 */
export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            toast={toast}
            onDismiss={removeToast}
          />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
