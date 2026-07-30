"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminQueuePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/apps/workplaces");
  }, [router]);

  return null;
}
