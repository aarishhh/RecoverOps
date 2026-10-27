import React from 'react';
import { STATUSES } from '../utils/constants';

export default function StatusBadge({ status, size = 'md' }) {
  const conf = STATUSES[status] || {
    label: status || 'Unknown',
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    dotClass: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${conf.badgeClass} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass} ${conf.isOpen ? 'animate-pulse' : ''}`} />
      <span>{conf.label}</span>
    </span>
  );
}
