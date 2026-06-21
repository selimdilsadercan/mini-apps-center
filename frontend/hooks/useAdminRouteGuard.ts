"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function useAdminRouteGuard() {
  const router = useRouter();
  const { isAdmin, loading } = useIsAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/home");
    }
  }, [isAdmin, loading, router]);

  return { isAdmin, loading };
}
