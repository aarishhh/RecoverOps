import React from 'react';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import { formatRelativeTime } from '../utils/formatDate';
import { Server, User, Clock, ChevronRight, CheckCircle2, MoreHorizontal } from 'lucide-react';

export default function IncidentList({
  incidents,
  onSelectIncident,
  onResolveClick,
  onEditClick,
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider">
            <tr>
              <th className="py-3.5 px-4 w-28">Incident ID</th>
              <th className="py-3.5 px-4">Title & Service</th>
              <th className="py-3.5 px-4 w-32">Severity</th>
              <th className="py-3.5 px-4 w-32">Status</th>
              <th className="py-3.5 px-4 w-36">Assignee</th>
              <th className="py-3.5 px-4 w-32">Updated</th>
              <th className="py-3.5 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {incidents.map((incident) => {
              const isResolved = incident.status === 'RESOLVED';
              return (
                <tr
                  key={incident.id}
                  onClick={() => onSelectIncident(incident)}
                  className="hover:bg-slate-850/70 cursor-pointer transition-colors group"
                >
                  {/* ID */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400 group-hover:text-indigo-300">
                    {incident.id}
                  </td>

                  {/* Title & Service */}
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="font-medium text-slate-100 group-hover:text-white line-clamp-1">
                      {incident.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-0.5 text-[11px]">
                      <Server className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{incident.affectedService}</span>
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={incident.severity} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={incident.status} size="sm" />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300 truncate">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{incident.assignee || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Updated Time */}
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{formatRelativeTime(incident.updatedAt || incident.createdAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {!isResolved ? (
                        <button
                          type="button"
                          onClick={() => onResolveClick(incident)}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
                          title="Quick resolve incident"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">Closed</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectIncident(incident)}
                        className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-800">
        {incidents.map((incident) => {
          const isResolved = incident.status === 'RESOLVED';
          return (
            <div
              key={incident.id}
              onClick={() => onSelectIncident(incident)}
              className="p-4 hover:bg-slate-850/60 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {incident.id}
                </span>
                <div className="flex items-center gap-1.5">
                  <SeverityBadge severity={incident.severity} size="sm" />
                  <StatusBadge status={incident.status} size="sm" />
                </div>
              </div>

              <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                {incident.title}
              </h4>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Server className="w-3 h-3 text-slate-500" />
                  {incident.affectedService}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  {incident.assignee || 'Unassigned'}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formatRelativeTime(incident.updatedAt || incident.createdAt)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-850 text-xs" onClick={(e) => e.stopPropagation()}>
                {!isResolved ? (
                  <button
                    type="button"
                    onClick={() => onResolveClick(incident)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Resolved</span>
                )}

                <button
                  type="button"
                  onClick={() => onSelectIncident(incident)}
                  className="text-xs text-indigo-400 font-medium inline-flex items-center gap-0.5"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
