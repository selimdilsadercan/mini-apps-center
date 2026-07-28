"use client";

import { useUser } from "@/contexts/AuthContext";
import { MINI_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import React, { useMemo, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "@/contexts/LanguageContext";
import HomeHeader from "@/components/home/HomeHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { createBrowserClient } from "@/lib/api";
import { LifeTab } from "../components/LifeTab";

const client = createBrowserClient();

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

export default function LifePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <LifePageContent />
    </Suspense>
  );
}

function LifePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const tApps = useTranslations("apps");
  const { isAdmin } = useIsAdmin();
  const { pinnedIds, togglePin, updateAppUsage, hasBusinesses, isDataLoaded } = useHome();

  const lifeQuery = useQuery({
    queryKey: ["hub", "life", user?.id],
    queryFn: () => client.hub.getLifeWidgets({ userId: user?.id }),
    enabled: isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const suggestions = lifeQuery.data?.suggestions || [];
  const activities = lifeQuery.data?.activities || [];

  const apps = useMemo(
    () => MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled),
    []
  );

  const lifeHomeApps = useMemo(() => {
    const order = ["ev-isleri", "eksik-var"];
    return apps
      .filter((app: MiniApp) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const lifeHealthApps = useMemo(() => {
    const order = ["rutinler", "meal-planner", "gym", "study"];
    return apps
      .filter((app: MiniApp) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const walletApps = useMemo(() => {
    return MINI_APPS.filter(
      (app: MiniApp) =>
        app.category === "Finans & Tasarruf" &&
        app.isImplemented &&
        !app.isCancelled
    );
  }, []);

  const handleAppClick = (app: MiniApp) => {
    navigateToMiniApp(app, router);
    void updateAppUsage(app.id);
  };

  const handleTogglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    void togglePin(appId);
  };

  const loading = !isLoaded || !isDataLoaded || lifeQuery.isLoading;

  return (
    <>
      <HomeHeader
        activeTab="life"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />

      <main className="px-4 md:px-8 pt-4 pb-20 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <LifeTab
            suggestions={suggestions}
            activities={activities}
            lifeHomeApps={lifeHomeApps}
            lifeHealthApps={lifeHealthApps}
            walletApps={walletApps}
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
