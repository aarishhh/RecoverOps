import React from 'react';
import { ShieldCheck, SearchX, PlusCircle, RotateCcw } from 'lucide-react';

export default function EmptyState({ isFiltered, onResetFilters, onCreateNew }) {
  if (isFiltered) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-10 text-center max-w-md mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">No matching incidents found</h3>
        <p className="text-sm text-slate-400 mb-5">
          No incidents match your current search query and filter criteria.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear all filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
        <ShieldCheck className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100 mb-1">All systems operational</h3>
      <p className="text-sm text-slate-400 mb-6">
        There are currently no active incidents recorded in the system. When operational issues arise, report them immediately to coordinate response.
      </p>
      <button
        type="button"
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 transition-all"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Create First Incident</span>
      </button>
    </div>
  );
}
