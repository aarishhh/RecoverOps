import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResolveModal({ incident, isOpen, onClose, onResolve, isSubmitting }) {
  const [rootCause, setRootCause] = useState(incident?.rootCause || '');
  const [resolutionNotes, setResolutionNotes] = useState(incident?.resolutionNotes || '');
  const [author, setAuthor] = useState(incident?.assignee || 'Lead Engineer');
  const [error, setError] = useState('');

  if (!isOpen || !incident) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rootCause.trim()) {
      setError('Please provide the identified Root Cause before resolving.');
      return;
    }
    if (!resolutionNotes.trim()) {
      setError('Please provide the Resolution Notes detailing how this was mitigated.');
      return;
    }

    setError('');
    onResolve({
      rootCause: rootCause.trim(),
      resolutionNotes: resolutionNotes.trim(),
      author: author.trim() || 'Lead Engineer',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Resolve Incident</h3>
              <p className="text-xs text-slate-400 font-mono">{incident.id} — {incident.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Root Cause <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="What was the underlying technical reason for this failure? (e.g., Memory leak in session pool, Redis connection exhaustion)"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Resolution Notes & Remediation <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="What steps were taken to mitigate the incident and prevent recurrence? (e.g., Scaled worker pool, rolled back commit #fa39a, added circuit breaker)"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Resolved By (Engineer Name)
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Resolving...' : 'Confirm Resolution'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
