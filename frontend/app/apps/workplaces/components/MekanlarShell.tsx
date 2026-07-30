"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, Coffee } from "@phosphor-icons/react";
import { getDirectoryUrl } from "@/lib/apps";
import { useTranslations } from "@/contexts/LanguageContext";
import MekanlarAppBar from "./MekanlarAppBar";
import VenueRelatedAppsBadges from "./VenueRelatedAppsBadges";

const ACCENT = "#D97706";

/** Places macro-app — bottom app bar for own sections; linked mini-apps as header badges */
export type MekanlarTab = "explore" | "map" | "forYou";

interface MekanlarShellProps {
  children: React.ReactNode;
  activeTab?: MekanlarTab;
  title?: string;
  showAppBar?: boolean;
  backHref?: string;
}

export default function MekanlarShell({
  children,
  activeTab = "explore",
  title,
  showAppBar = true,
  backHref,
}: MekanlarShellProps) {
  const router = useRouter();
  const t = useTranslations("workplaces");

  const handleBack = () => {
    if (!showAppBar) {
      router.push(backHref ?? "/apps/workplaces");
      return;
    }
    window.location.href = getDirectoryUrl();
  };

  const isMapTab = activeTab === "map";

  return (
    <div
      className={
        isMapTab
          ? "h-dvh flex flex-col overflow-hidden bg-app-bg text-app-text selection:bg-amber-500/20"
          : "min-h-screen bg-app-bg text-app-text selection:bg-amber-500/20"
      }
    >
      <header className={`${isMapTab ? "shrink-0" : ""} sticky top-0 z-30 app-chrome-top`}>
        <div className="px-4 py-2.5 max-w-5xl mx-auto w-full flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            title={showAppBar ? t("appBar.backToHub") : t("detail.backToList")}
          >
            <CaretLeft size={16} weight="bold" style={{ color: ACCENT }} />
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden"
              style={{ backgroundColor: ACCENT }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <Coffee size={16} weight="fill" className="text-white relative z-10" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-app-text tracking-tight truncate leading-tight">
                {title ?? t("title")}
              </h1>
              {!title && (
                <p className="text-[10px] font-bold text-app-muted truncate">{t("subtitle")}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main
        className={
          isMapTab
            ? "flex-1 min-h-0 overflow-hidden w-full max-w-none px-0 pt-0 pb-0"
            : `max-w-5xl mx-auto px-4 pt-3 ${showAppBar ? "pb-24" : "pb-16"}`
        }
      >
        {showAppBar && activeTab === "explore" && (
          <div className="mb-3">
            <VenueRelatedAppsBadges />
          </div>
        )}
        {children}
      </main>

      {showAppBar && <MekanlarAppBar activeTab={activeTab} />}
    </div>
  );
}
