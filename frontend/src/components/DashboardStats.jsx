import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Layers } from 'lucide-react';

export default function DashboardStats({ incidents = [], activeStatus, activeSeverity, onFilterSelect }) {
  const total = incidents.length;
  const openIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const openCount = openIncidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  const stats = [
    {
      id: 'total',
      label: 'Total Incidents',
      value: total,
      subtext: `${total} logged in system`,
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      active: !activeStatus && !activeSeverity,
      onClick: () => onFilterSelect({ status: '', severity: '' }),
    },
    {
      id: 'open',
      label: 'Open Incidents',
      value: openCount,
      subtext: `${openCount} active investigations`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      active: activeStatus === 'OPEN',
      onClick: () => onFilterSelect({ status: 'OPEN', severity: '' }),
    },
    {
      id: 'critical',
      label: 'Critical (P0)',
      value: criticalCount,
      subtext: criticalCount > 0 ? 'Requires immediate action' : 'No active P0 blockers',
      icon: ShieldAlert,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
      badge: criticalCount > 0 ? 'P0' : null,
      active: activeSeverity === 'CRITICAL',
      onClick: () => onFilterSelect({ severity: 'CRITICAL', status: '' }),
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: resolvedCount,
      subtext: `${resolutionRate}% resolution rate`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      active: activeStatus === 'RESOLVED',
      onClick: () => onFilterSelect({ status: 'RESOLVED', severity: '' }),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.id}
            type="button"
            onClick={stat.onClick}
            className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
              stat.active
                ? 'bg-slate-800/90 border-indigo-500/60 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <div className={`p-2 rounded-lg border ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
                {stat.value}
              </span>
              {stat.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  {stat.badge}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400 truncate">
              {stat.subtext}
            </p>
          </button>
        );
      })}
    </div>
  );
}
