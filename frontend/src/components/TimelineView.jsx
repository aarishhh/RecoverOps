import React, { useState } from 'react';
import { formatDateTime, formatRelativeTime } from '../utils/formatDate';
import { 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Send, 
  User, 
  Bot 
} from 'lucide-react';

export default function TimelineView({ timeline = [], onAddEvent, isSubmitting }) {
  const [newUpdate, setNewUpdate] = useState('');
  const [authorName, setAuthorName] = useState('On-Call SRE');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUpdate.trim()) return;
    onAddEvent({
      message: newUpdate.trim(),
      author: authorName.trim() || 'On-Call Engineer',
      type: 'UPDATE',
    });
    setNewUpdate('');
  };

  // Sort timeline chronologically (earliest to latest or latest to earliest)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getEventIcon = (type) => {
    switch (type) {
      case 'RESOLVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'SEVERITY_CHANGE':
      case 'CRITICAL':
        return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'STATUS_CHANGE':
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      case 'SYSTEM':
        return <Bot className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'SEVERITY_CHANGE':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'STATUS_CHANGE':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'SYSTEM':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'INVESTIGATION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Activity Timeline ({timeline.length})</span>
        </h4>
        <span className="text-xs text-slate-500">Chronological order (Newest first)</span>
      </div>

      {/* Post new update box */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="mb-2.5 flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Your Name / Role (e.g. Sarah - SRE)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-850 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
          />
        </div>
        <textarea
          rows={2}
          placeholder="Post an investigation update, mitigation step, or note..."
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!newUpdate.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Posting...' : 'Post Update'}</span>
          </button>
        </div>
      </form>

      {/* Timeline items list */}
      {sortedTimeline.length === 0 ? (
        <p className="text-xs text-slate-500 italic text-center py-4">No activity logged yet.</p>
      ) : (
        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {sortedTimeline.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Timeline marker dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow">
                {getEventIcon(item.type)}
              </div>

              {/* Event card */}
              <div className="bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-lg p-3 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">
                      {item.author || 'System'}
                    </span>
                    {item.type && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getEventBadge(item.type)}`}>
                        {item.type}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono" title={formatDateTime(item.timestamp)}>
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </p>
                <div className="mt-1 text-[10px] text-slate-500 font-mono">
                  {formatDateTime(item.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
