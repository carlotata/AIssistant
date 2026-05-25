"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminSidebar } from "./admin-sidebar";
import { UserManagement } from "./user-management";
import { LogView } from "./log-view";

export function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeView, setActiveView] = useState("users");

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <AdminSidebar 
        onNavigate={setActiveView}
        onLogout={async () => await logout()}
      />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="sticky top-0 z-10 border-b border-white/5 p-4 bg-slate-950/80 backdrop-blur-sm">
            <h2 className="text-xl font-bold capitalize">
                {activeView === "users" ? "User Management" : "System Logs"}
            </h2>
        </header>
        <div className="p-8 flex-1">
            {activeView === "users" ? (
                <UserManagement />
            ) : (
                <div className="rounded-xl border border-white/5 bg-slate-900 p-6">
                    <LogView />
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
