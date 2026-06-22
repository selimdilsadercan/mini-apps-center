"use client";

import { useAdminRouteGuard } from "@/hooks/useAdminRouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, loading } = useAdminRouteGuard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
