import React from 'react';
import { 
  ShieldAlert, 
  Plus, 
  RotateCcw
} from 'lucide-react';
import { getApiBaseUrl } from '../services/api';

export default function Navbar({
  onNewIncident,
  onResetData,
  apiStatus,
}) {
  const apiUrl = getApiBaseUrl();
  const isLive = Boolean(apiUrl && apiStatus?.connected);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white font-sans">
                  Recover<span className="text-indigo-400">Ops</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                  Serverless
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Incident Command System
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-3">
            {/* Clean Read-Only System Operational Pill */}
            <div
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isLive || !apiUrl
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Operational</span>
            </div>

            {/* Reset demo data (only in local mode when no URL is provided) */}
            {!apiUrl && (
              <button
                type="button"
                onClick={onResetData}
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
                title="Reset sample dataset"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Data</span>
              </button>
            )}

            {/* Declare Incident Primary Button */}
            <button
              type="button"
              onClick={onNewIncident}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Report Incident</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
