"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface SystemLog {
  id: number;
  action: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export function LogView({ userId }: { userId?: number }) {
  const [filter, setFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", userId],
    queryFn: async () => {
      const url = userId ? `/admin/logs/${userId}` : "/admin/logs";
      const res = await apiFetch<{ logs: SystemLog[] }>(url);
      return res.logs;
    },
  });

  if (isLoading) return <div className="text-slate-500 p-4 text-xs italic">Loading logs...</div>;

  const CATEGORIES = {
    AUTH: ["login", "logout", "registered", "logged"],
    CHAT: ["conversation", "message", "assistant"],
    SYSTEM: ["admin", "role", "created user", "deleted user", "deleted conversation"],
  };

  const filteredLogs = data?.filter(log => {
    const actionLower = log.action.toLowerCase();
    
    // Category Filter
    if (activeCategory) {
      const keywords = CATEGORIES[activeCategory as keyof typeof CATEGORIES];
      if (!keywords.some(k => actionLower.includes(k))) return false;
    }

    // Search Filter
    const searchStr = filter.toLowerCase();
    return (
      actionLower.includes(searchStr) ||
      log.user?.name.toLowerCase().includes(searchStr) ||
      log.user?.email.toLowerCase().includes(searchStr)
    );
  }) || [];

  return (
    <div className="space-y-3">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {filteredLogs.length} Records Found
        </span>
        <button 
          onClick={() => {
            setShowFilter(!showFilter);
            if (showFilter) {
              setActiveCategory(null);
              setFilter("");
            }
          }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
            showFilter ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="hidden sm:inline">{showFilter ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>

      {/* Filter Section (Toggleable) */}
      {showFilter && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: null, label: 'All' },
              { id: 'AUTH', label: 'Auth' },
              { id: 'CHAT', label: 'AI Chat' },
              { id: 'SYSTEM', label: 'System' }
            ].map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${
                  activeCategory === cat.id 
                    ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                    : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Refine search..."
              className="w-full rounded-lg bg-slate-950 px-9 py-2 text-xs text-white border border-white/10 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 p-4 italic text-center">No matching logs found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-start justify-between bg-slate-900/50 p-3 rounded-lg text-[11px] gap-2 border border-white/5">
              <div className="min-w-0 flex-1">
                <p className="text-slate-200 font-medium wrap-break-word">{log.action}</p>
                {log.user && (
                  <p className="text-slate-500 mt-0.5 break-all">
                    {log.user.name} • {log.user.email}
                  </p>
                )}
              </div>
              <div className="text-slate-600 shrink-0 tabular-nums text-[10px] sm:text-right">
                {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
