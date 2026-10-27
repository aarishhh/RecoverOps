import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save, PlusCircle, Check } from 'lucide-react';
import { SEVERITIES, STATUSES, SERVICES, TEAM_MEMBERS } from '../utils/constants';

export default function IncidentModal({ isOpen, onClose, onSave, incident = null, isSaving }) {
  const isEditing = Boolean(incident);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    affectedService: SERVICES[0],
    customService: '',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    assignee: TEAM_MEMBERS[0].name,
    rootCause: '',
    resolutionNotes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (incident) {
      const isKnownService = SERVICES.includes(incident.affectedService);
      setFormData({
        title: incident.title || '',
        description: incident.description || '',
        affectedService: isKnownService ? incident.affectedService : 'Other',
        customService: isKnownService ? '' : incident.affectedService || '',
        severity: incident.severity || 'HIGH',
        status: incident.status || 'INVESTIGATING',
        assignee: incident.assignee || 'Unassigned',
        rootCause: incident.rootCause || '',
        resolutionNotes: incident.resolutionNotes || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        affectedService: SERVICES[0],
        customService: '',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        assignee: TEAM_MEMBERS[0].name,
        rootCause: '',
        resolutionNotes: '',
      });
    }
    setErrors({});
  }, [incident, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Incident title is required.';
    } else if (formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters.';
    }

    if (formData.affectedService === 'Other' && !formData.customService.trim()) {
      errs.service = 'Please specify the custom service name.';
    }

    if (!formData.severity) {
      errs.severity = 'Severity is required.';
    }

    if (!formData.status) {
      errs.status = 'Status is required.';
    }

    if (formData.status === 'RESOLVED' && !formData.resolutionNotes.trim()) {
      errs.resolutionNotes = 'Resolution notes are required when status is Resolved.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalService = formData.affectedService === 'Other' 
      ? formData.customService.trim() 
      : formData.affectedService;

    onSave({
      title: formData.title.trim(),
      description: formData.description.trim(),
      affectedService: finalService,
      severity: formData.severity,
      status: formData.status,
      assignee: formData.assignee.trim() || 'Unassigned',
      rootCause: formData.rootCause.trim(),
      resolutionNotes: formData.resolutionNotes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {isEditing ? <Save className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                {isEditing ? `Edit Incident: ${incident.id}` : 'Create New Incident'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update operational details and root cause.' : 'Declare a production issue and mobilize responders.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Incident Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., API Gateway 502 Bad Gateway spike in us-east-1"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full bg-slate-950 border ${
                errors.title ? 'border-red-500' : 'border-slate-800'
              } rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Incident Summary & User Impact
            </label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, affected components, customer blast radius, and observed metric anomalies..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          </div>

          {/* Two-column layout: Service & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Affected Service */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Affected Service <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.affectedService}
                onChange={(e) => setFormData({ ...formData, affectedService: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other (Custom Service)...</option>
              </select>

              {formData.affectedService === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom service name"
                  value={formData.customService}
                  onChange={(e) => setFormData({ ...formData, customService: e.target.value })}
                  className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              )}
              {errors.service && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.service}
                </p>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Severity Level <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                {Object.values(SEVERITIES).map((sev) => (
                  <option key={sev.value} value={sev.value}>
                    {sev.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Two-column layout: Status & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Current Status <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                {Object.values(STATUSES).map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Incident Commander / Assignee
              </label>
              <select
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
              >
                {TEAM_MEMBERS.map((tm) => (
                  <option key={tm.name} value={tm.name}>
                    {tm.name} {tm.role ? `(${tm.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Root cause and resolution notes (shown during edit or when resolving) */}
          {(isEditing || formData.status === 'RESOLVED') && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Root Cause Analysis
                </label>
                <textarea
                  rows={2}
                  placeholder="Root cause identified (e.g. Memory leak, connection leak, bad deployment)"
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Resolution Notes {formData.status === 'RESOLVED' && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  rows={2}
                  placeholder="Steps taken to fix and restore normal operations..."
                  value={formData.resolutionNotes}
                  onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.resolutionNotes && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.resolutionNotes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Declare Incident'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
