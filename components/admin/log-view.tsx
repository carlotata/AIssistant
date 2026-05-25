"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface SystemLog {
  id: number;
  action: string;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

export function LogView({ userId }: { userId?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["logs", userId],
    queryFn: async () => {
      const url = userId ? `/admin/logs/${userId}` : "/admin/logs";
      const res = await apiFetch<{ logs: SystemLog[] }>(url);
      return res.logs;
    },
  });

  if (isLoading) return <div className="text-slate-500 p-4">Loading logs...</div>;
  if (!data || data.length === 0) return <div className="text-slate-500 p-4">No logs found.</div>;

  return (
    <div className="space-y-2">
      {data.map((log) => (
        <div key={log.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg text-xs">
          <div>
            <span className="text-white font-medium">{log.action}</span>
            {log.user && (
              <span className="text-slate-400 ml-2">
                ({log.user.name} - {log.user.email})
              </span>
            )}
          </div>
          <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
