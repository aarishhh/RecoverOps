import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="h-4 bg-slate-800 rounded w-16"></div>
      </div>
      <div className="divide-y divide-slate-800/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center gap-2">
                <div className="h-4 bg-slate-800 rounded w-20"></div>
                <div className="h-4 bg-slate-800 rounded w-16"></div>
                <div className="h-4 bg-slate-800 rounded w-24"></div>
              </div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-850 rounded w-1/2"></div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="h-8 bg-slate-800 rounded w-20"></div>
              <div className="h-8 bg-slate-800 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
