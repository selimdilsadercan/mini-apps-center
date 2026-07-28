"use client";

import { useUser } from "@/contexts/AuthContext";
import { MINI_APPS, BUSINESS_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import React, { useMemo, Suspense } from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import HomeHeader from "@/components/home/HomeHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { ToolsTab } from "../components/ToolsTab";

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <ToolsPageContent />
    </Suspense>
  );
}

function ToolsPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const tApps = useTranslations("apps");
  const { isAdmin } = useIsAdmin();
  const { pinnedIds, togglePin, updateAppUsage, hasBusinesses, isDataLoaded } = useHome();

  const apps = useMemo(
    () =>
      [...MINI_APPS, ...BUSINESS_APPS].filter(
        (app) => app.isImplemented && !app.isCancelled
      ),
    []
  );

  const practicalApps = useMemo(() => {
    const order = ["pdf-tools", "daily-weather", "tasket", "siparis-takip"];
    return order
      .map((id) => apps.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
  }, [apps]);

  const devApps = useMemo(() => {
    const order = ["store-preview", "icon-export", "icon-set-guide", "feedback-board"];
    return order
      .map((id) => apps.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
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
        activeTab="wallet"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />

      <main className="px-4 md:px-8 pt-4 pb-20 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
        {loading ? (
          <HomeSkeleton />
        ) : (
          <ToolsTab
            practicalApps={practicalApps}
            devApps={devApps}
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
