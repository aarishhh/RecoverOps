import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  if (!notification) return null;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const { type = 'info', message, title } = notification;

  const typeConfig = {
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/90 text-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    error: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/90 text-red-100',
      icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
    },
    info: {
      border: 'border-indigo-500/40',
      bg: 'bg-slate-900/90 text-slate-100',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    },
  }[type] || {
    border: 'border-slate-700',
    bg: 'bg-slate-900 text-slate-100',
    icon: <Info className="w-5 h-5 text-slate-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slide-up">
      <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 ${typeConfig.bg} ${typeConfig.border}`}>
        {typeConfig.icon}
        <div className="flex-1 text-xs">
          {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
          <p className="leading-relaxed">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
