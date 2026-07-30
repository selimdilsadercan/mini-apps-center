"use client";

import React, { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import MekanlarShell, { type MekanlarTab } from "./components/MekanlarShell";

export default function WorkplacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <WorkplacesLayoutContent>{children}</WorkplacesLayoutContent>
    </Suspense>
  );
}

function WorkplacesLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPlaceDetail = pathname.startsWith("/apps/workplaces/place");
  const detailBackHref = searchParams.get("outdoorId")
    ? "/apps/outdoor-activities"
    : undefined;

  let activeTab: MekanlarTab = "explore";
  if (pathname.startsWith("/apps/workplaces/map")) activeTab = "map";
  else if (pathname.startsWith("/apps/workplaces/for-you")) activeTab = "forYou";

  return (
    <MekanlarShell
      activeTab={activeTab}
      showAppBar={!isPlaceDetail}
      backHref={detailBackHref}
    >
      {children}
    </MekanlarShell>
  );
}
