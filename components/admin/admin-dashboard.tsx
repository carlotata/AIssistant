"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminSidebar } from "./admin-sidebar";
import { UserManagement } from "./user-management";
import { LogView } from "./log-view";

import { Logo } from "@/components/shared/logo";

export function AdminDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [activeView, setActiveView] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden relative">
      <AdminSidebar 
        onNavigate={(view) => {
            setActiveView(view);
            setSidebarOpen(false);
        }}
        onLogout={async () => await logout()}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={activeView}
      />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
      )}

      <main className="flex-1 overflow-hidden flex flex-col relative min-w-0 bg-slate-950/50">
        <header className="sticky top-0 z-10 border-b border-white/5 p-4 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-white/5 lg:hidden text-slate-400 hover:text-white transition-colors"
                    aria-label="Open sidebar"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 truncate">
                    {activeView === "users" ? "User Management" : "System Activity"}
                </h2>
            </div>
        </header>
        
        <div className="p-4 sm:p-8 lg:p-12 flex-1 overflow-y-auto scrollbar-hide">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeView === "users" ? (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-2xl sm:text-4xl font-black text-white">Platform Users</h3>
                            <p className="text-slate-400 text-sm">Review, manage and moderate all registered student and admin accounts.</p>
                        </div>
                        <UserManagement />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-2xl sm:text-4xl font-black text-white">System Logs</h3>
                            <p className="text-slate-400 text-sm">Real-time audit trail of all administrative and system-wide actions.</p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-900 p-4 sm:p-8 shadow-2xl backdrop-blur-sm">
                            <LogView />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
