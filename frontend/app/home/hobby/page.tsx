"use client";

import { useUser } from "@/contexts/AuthContext";
import { MINI_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import React, { useMemo, Suspense } from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import HomeHeader from "@/components/home/HomeHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { HobbyTab } from "../components/HobbyTab";

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

export default function HobbyPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HobbyPageContent />
    </Suspense>
  );
}

function HobbyPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const tApps = useTranslations("apps");
  const { isAdmin } = useIsAdmin();
  const { pinnedIds, togglePin, updateAppUsage, hasBusinesses, isDataLoaded } = useHome();

  const apps = useMemo(
    () => MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled),
    []
  );

  const hobbyMediaApps = useMemo(() => {
    const order = ["series-track", "read-tracker", "youtube-series", "film-graph", "buyuk-maclar"];
    return apps
      .filter((app: MiniApp) => app.category === "Eğlence & Hobi" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const hobbyGamesApps = useMemo(() => {
    const order = ["game-companion", "iskambil", "kalimba", "memedex", "gaming-hub", "tournament-manager"];
    return apps
      .filter((app: MiniApp) => app.category === "Eğlence & Hobi" && order.includes(app.id))
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
        activeTab="hobby"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />

      <main className="px-4 md:px-8 pt-4 pb-20 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <HobbyTab
            hobbyMediaApps={hobbyMediaApps}
            hobbyGamesApps={hobbyGamesApps}
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
