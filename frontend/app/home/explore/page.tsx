"use client";

import { useUser } from "@/contexts/AuthContext";
import { MINI_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import React, { useMemo, Suspense } from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import HomeHeader from "@/components/home/HomeHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { ExploreTab } from "../components/ExploreTab";

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <ExplorePageContent />
    </Suspense>
  );
}

function ExplorePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const tApps = useTranslations("apps");
  const { isAdmin } = useIsAdmin();
  const { pinnedIds, togglePin, updateAppUsage, hasBusinesses, isDataLoaded } = useHome();

  const apps = useMemo(
    () => MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled),
    []
  );

  const explorePlacesApps = useMemo(() => {
    const order = ["workplaces", "outdoor-activities", "digital-menu", "stamp-card"];
    return apps
      .filter((app: MiniApp) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const exploreEventsApps = useMemo(() => {
    const order = ["campus-events", "concert-list"];
    return apps
      .filter((app: MiniApp) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const handleAppClick = (app: MiniApp) => {
    navigateToMiniApp(app, router);
    void updateAppUsage(app.id);
  };

  const handleTogglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    void togglePin(appId);
  };

  const loading = !isLoaded || !isDataLoaded;

  return (
    <>
      <HomeHeader
        activeTab="explore"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />

      <main className="px-4 md:px-8 pt-4 pb-20 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <ExploreTab
            explorePlacesApps={explorePlacesApps}
            exploreEventsApps={exploreEventsApps}
            tApps={tApps}
            pinnedIds={pinnedIds}
            togglePin={handleTogglePin}
            handleAppClick={handleAppClick}
          />
        )}
      </main>
    </>
  );
}
