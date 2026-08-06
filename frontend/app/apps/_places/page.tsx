"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Places app merged into Workplaces — redirect legacy links. */
export default function PlacesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      router.replace(`/apps/workplaces/place?placeId=${encodeURIComponent(id)}`);
      return;
    }
    router.replace("/apps/workplaces");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 text-sm">
      Yönlendiriliyor...
    </div>
  );
}
