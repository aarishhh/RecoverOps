import React from 'react';
import { SEVERITIES } from '../utils/constants';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function SeverityBadge({ severity, showIcon = true, size = 'md' }) {
  const conf = SEVERITIES[severity] || {
    label: severity || 'Unknown',
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    dotClass: 'bg-slate-400',
  };

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-xs px-2.5 py-1 font-medium';

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconClass = 'w-3 h-3 mr-1';
    if (severity === 'CRITICAL') return <AlertCircle className={iconClass} />;
    if (severity === 'HIGH' || severity === 'MEDIUM') return <AlertTriangle className={iconClass} />;
    return <Info className={iconClass} />;
  };

  return (
    <span className={`inline-flex items-center rounded-md font-mono ${conf.badgeClass} ${sizeClasses}`}>
      {renderIcon()}
      <span>{conf.label}</span>
    </span>
  );
}
