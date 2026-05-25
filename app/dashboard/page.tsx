"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { StudyDashboard } from "@/components/dashboard/study-dashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
    } else if (!loading && user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudyDashboard />
    </Suspense>
  );
}

