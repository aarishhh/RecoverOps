import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { SEVERITIES, STATUSES, SERVICES } from '../utils/constants';

export default function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  severity,
  setSeverity,
  service,
  setService,
  onReset,
  totalResults,
}) {
  const hasActiveFilters = Boolean(search || status || severity || service);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Severity Filter */}
        <div className="w-full lg:w-44">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            {Object.values(SEVERITIES).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-44">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open (Active)</option>
            {Object.values(STATUSES).map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Affected Service Filter */}
        <div className="w-full lg:w-48">
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 truncate"
          >
            <option value="">All Services</option>
            {SERVICES.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active filter pills summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-slate-500">
            <Filter className="w-3 h-3" />
            Filtered to {totalResults} {totalResults === 1 ? 'incident' : 'incidents'}:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Query: "{search}"
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearch('')} />
            </span>
          )}

          {severity && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Severity: {severity}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSeverity('')} />
            </span>
          )}

          {status && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Status: {status}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setStatus('')} />
            </span>
          )}

          {service && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Service: {service}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setService('')} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
