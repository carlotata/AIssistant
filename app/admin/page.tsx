"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { UsersIcon } from "@/components/icons/dashboard-icons";
import { UserManagement } from "@/components/admin/user-management";
import type { DashboardTab } from "@/types/dashboard";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
    } else if (!authLoading && user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900 dark:bg-slate-950 dark:text-white">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-400/5 blur-[120px] dark:bg-blue-400/10" />
        <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-400/5 blur-[120px] dark:bg-indigo-400/10" />
      </div>

      <DashboardHeader 
        tabs={[{ id: "users", label: "User Management", icon: "users" }]} 
        activeTabId="users" 
        onTabChange={() => {}} 
      />

      <main className="relative z-10 mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
              Admin Portal
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            User <span className="brand-text-gradient">Management</span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Review and manage user accounts, roles, and system access.
          </p>
        </header>

        <UserManagement />
      </main>
    </div>
  );
}
