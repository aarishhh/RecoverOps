import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Server, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  FileText, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import SeverityBadge from './SeverityBadge';
import TimelineView from './TimelineView';
import { formatDateTime, formatRelativeTime } from '../utils/formatDate';

export default function IncidentDetailDrawer({
  incident,
  isOpen,
  onClose,
  onEdit,
  onResolveClick,
  onAddTimelineEvent,
  onStatusChange,
  onDelete,
  isSubmitting,
}) {
  if (!isOpen || !incident) return null;

  const isResolved = incident.status === 'RESOLVED';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/90 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {incident.id}
              </span>
              <SeverityBadge severity={incident.severity} size="sm" />
              <StatusBadge status={incident.status} size="sm" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 leading-snug">
              {incident.title}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {!isResolved ? (
              <button
                type="button"
                onClick={() => onResolveClick(incident)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve Incident</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolved & Closed
              </span>
            )}

            <button
              type="button"
              onClick={() => onEdit(incident)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Status Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Status:</span>
              <select
                value={incident.status}
                onChange={(e) => onStatusChange(incident.id, e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="INVESTIGATING">Investigating</option>
                <option value="IDENTIFIED">Identified</option>
                <option value="MONITORING">Monitoring</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => onDelete(incident.id)}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
              title="Delete incident"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-850">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Affected Service</span>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                <Server className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">{incident.affectedService}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Assignee</span>
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{incident.assignee || 'Unassigned'}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Reported At</span>
              <span className="text-xs font-mono text-slate-300 block mt-0.5 truncate" title={formatDateTime(incident.createdAt)}>
                {formatRelativeTime(incident.createdAt)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Last Updated</span>
              <span className="text-xs font-mono text-slate-300 block mt-0.5 truncate" title={formatDateTime(incident.updatedAt)}>
                {formatRelativeTime(incident.updatedAt)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Description & User Impact</span>
            </h4>
            <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {incident.description || 'No description provided.'}
            </div>
          </div>

          {/* Root Cause & Resolution (if resolved or populated) */}
          {(incident.rootCause || incident.resolutionNotes || isResolved) && (
            <div className="space-y-4">
              {incident.rootCause && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Root Cause</span>
                  </h4>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-200/90 leading-relaxed whitespace-pre-wrap">
                    {incident.rootCause}
                  </div>
                </div>
              )}

              {incident.resolutionNotes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolution Notes & Remediation</span>
                  </h4>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-200/90 leading-relaxed whitespace-pre-wrap">
                    {incident.resolutionNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timestamps detail info */}
          <div className="text-[11px] font-mono text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Created: {formatDateTime(incident.createdAt)}</span>
            <span>Updated: {formatDateTime(incident.updatedAt)}</span>
          </div>

          {/* Activity Timeline */}
          <div className="pt-4 border-t border-slate-800">
            <TimelineView
              timeline={incident.timeline || []}
              onAddEvent={(event) => onAddTimelineEvent(incident.id, event)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
