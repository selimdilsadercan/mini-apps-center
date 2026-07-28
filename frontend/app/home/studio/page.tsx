"use client";

import { useUser } from "@/contexts/AuthContext";
import { MINI_APPS, BUSINESS_APPS, MiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, Suspense } from "react";
import { useTranslations } from "@/contexts/LanguageContext";
import HomeHeader from "@/components/home/HomeHeader";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Drawer } from "vaul";
import {
  Wrench,
  Storefront,
  GraduationCap,
  Code,
  ChatTeardropDots,
} from "@phosphor-icons/react";

// Subcomponents
import { StudioTab, type StudioPackage } from "../components/StudioTab";

const STUDIO_CONTACT_URL = "https://t.me/superapp_support";

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <StudioPageContent />
    </Suspense>
  );
}

function StudioPageContent() {
  const { user, isLoaded } = useUser();
  const { isAdmin } = useIsAdmin();
  const [studioSheetPkg, setStudioSheetPkg] = useState<StudioPackage | null>(null);

  // App Lists
  const proBusinessApps = useMemo(() => {
    const order = ["business-page", "digital-menu", "stamp-card", "campus-events"];
    return BUSINESS_APPS.filter(
      (app: MiniApp) => app.isImplemented && !app.isCancelled && order.includes(app.id)
    ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  const proServiceApps = useMemo(() => {
    const order = ["tutor-crm", "standups", "board-game-clubs"];
    return BUSINESS_APPS.filter(
      (app: MiniApp) => app.isImplemented && !app.isCancelled && order.includes(app.id)
    ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  const proDevApps = useMemo(() => {
    const order = ["tasket", "store-preview", "icon-export", "feedback-board", "icon-set-guide"];
    const all = [...MINI_APPS, ...BUSINESS_APPS];
    return order
      .map((id) => all.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
  }, []);

  const proGeneralApps = useMemo(() => {
    const order = ["pdf-tools", "daily-weather", "tournament-manager"];
    const all = [...MINI_APPS, ...BUSINESS_APPS];
    return order
      .map((id) => all.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
  }, []);

  const studioPackages = useMemo<StudioPackage[]>(
    () => [
      {
        id: "general",
        name: "Genel araçlar",
        description: "Günlük işlerini kolaylaştıracak ve verimliliğini artıracak araçlar.",
        icon: Wrench,
        color: "#10B981",
        apps: proGeneralApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "business",
        name: "İşletmeler için",
        description: "İşletmeni büyütmek için ihtiyacın olan tüm araçlar bir arada.",
        icon: Storefront,
        color: "#6366F1",
        apps: proBusinessApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "service",
        name: "Eğitmenler & topluluklar için",
        description: "Öğrenci, üye ve etkinlik yönetimini tek yerden.",
        icon: GraduationCap,
        color: "#0ea5e9",
        apps: proServiceApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "dev",
        name: "Geliştiriciler için",
        description: "Uygulamanı yayına hazırlayan araçlar.",
        icon: Code,
        color: "#7C3AED",
        apps: proDevApps,
        targetAudience: "",
        benefits: [],
      },
    ],
    [proGeneralApps, proBusinessApps, proServiceApps, proDevApps]
  );

  return (
    <>
      <HomeHeader
        activeTab="wallet"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={false}
      />

      <main className="px-4 md:px-8 pt-4 pb-20 md:pb-12 max-w-lg md:max-w-4xl mx-auto w-full">
        <StudioTab
          studioPackages={studioPackages}
          onSelectPackage={setStudioSheetPkg}
        />
      </main>

      {/* Studio contact bottom sheet */}
      <Drawer.Root
        open={!!studioSheetPkg}
        onOpenChange={(o) => {
          if (!o) setStudioSheetPkg(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[190]" />
          <Drawer.Content className="bg-app-surface flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[200] max-w-lg mx-auto border-t border-app-border">
            <Drawer.Title className="sr-only">Stüdyo Detayı</Drawer.Title>
            <Drawer.Description className="sr-only">Stüdyo paketi detayları ve uygulamaları</Drawer.Description>
            {studioSheetPkg && (
              <div className="flex flex-col min-h-0 p-6 pb-8">
                <div className="w-12 h-1.5 bg-app-border rounded-full self-center mb-6 shrink-0" />
                <div className="flex items-center gap-4 shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: studioSheetPkg.color }}
                  >
                    <studioSheetPkg.icon size={28} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-black text-app-text tracking-tight">
                      {studioSheetPkg.name}
                    </h2>
                    <p className="text-app-muted text-[12px] font-medium leading-snug">
                      {studioSheetPkg.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-y-auto min-h-0">
                  {studioSheetPkg.apps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <div
                        key={app.id}
                        className="flex items-center gap-3 py-3 border-b border-app-border/60 last:border-0"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: app.color }}
                        >
                          <Icon size={20} weight="fill" className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-app-text text-[14px] tracking-tight truncate">
                            {app.name}
                          </p>
                          <p className="text-app-muted text-[11px] font-medium leading-tight line-clamp-2 mt-0.5">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <a
                  href={STUDIO_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 shrink-0 w-full flex items-center justify-center gap-2 bg-app-text text-app-bg py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  <ChatTeardropDots size={16} weight="fill" />
                  İletişime Geç
                </a>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
