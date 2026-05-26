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

  const { data, isLoading } = useQuery({
    queryKey: ["logs", userId],
    queryFn: async () => {
      const url = userId ? `/admin/logs/${userId}` : "/admin/logs";
      const res = await apiFetch<{ logs: SystemLog[] }>(url);
      return res.logs;
    },
  });

  if (isLoading) return <div className="text-slate-500 p-4">Loading logs...</div>;
  
  const filteredLogs = data?.filter(log => {
    const searchStr = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchStr) ||
      log.user?.name.toLowerCase().includes(searchStr) ||
      log.user?.email.toLowerCase().includes(searchStr)
    );
  }) || [];

  return (
    <div className="space-y-4">
      {/* Filter Input */}
      <div className="relative group">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter logs by action or user..."
          className="w-full rounded-lg bg-slate-950 px-10 py-2 text-xs text-white border border-white/5 outline-none focus:border-indigo-500/50 transition-all shadow-inner"
        />
      </div>

      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 p-4 italic text-center">No matching logs found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800 p-3 rounded-lg text-xs gap-2">
              <div className="min-w-0">
                <span className="text-white font-medium block sm:inline truncate">{log.action}</span>
                {log.user && (
                  <span className="text-slate-400 block sm:inline sm:ml-2 truncate italic sm:not-italic">
                    ({log.user.name} - {log.user.email})
                  </span>
                )}
              </div>
              <span className="text-slate-500 shrink-0 tabular-nums">{new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
