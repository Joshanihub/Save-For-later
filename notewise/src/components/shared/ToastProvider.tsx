import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import useToastStore, { ToastMessage } from '../../store/toastStore';

const Toast = ({ toast }: { toast: ToastMessage }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    error: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 border rounded-xl shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-right-full fade-in duration-300 ${bgColors[toast.type]}`}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 ml-4 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};
