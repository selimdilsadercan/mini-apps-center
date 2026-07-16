"use client";

import { getAppRootUrl } from "@/lib/apps";
import { Books, CaretLeft, Compass, GameController } from "@phosphor-icons/react";
import { pillTabClass } from "./PillTabs";

export type MainTab = "discover" | "library";

export default function GamingHubShell({
  title,
  activeMainTab,
  onMainTabChange,
  onBack,
  headerRight,
  showMainTabs = true,
  children,
}: {
  title?: string;
  activeMainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  showMainTabs?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onBack) onBack();
                else window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-violet-600" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
                <GameController size={18} weight="fill" className="text-violet-600 shrink-0" />
                <span className="truncate">{title ?? "Gaming Hub"}</span>
              </h1>
            </div>

            {headerRight}
          </div>

          {showMainTabs && (
          <div className="flex mt-2">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
              <button
                type="button"
                onClick={() => onMainTabChange("discover")}
                className={pillTabClass(activeMainTab === "discover")}
              >
                <Compass size={14} weight={activeMainTab === "discover" ? "fill" : "duotone"} />
                <span>Keşfet</span>
              </button>
              <button
                type="button"
                onClick={() => onMainTabChange("library")}
                className={pillTabClass(activeMainTab === "library")}
              >
                <Books size={14} weight={activeMainTab === "library" ? "fill" : "duotone"} />
                <span>Kütüphanem</span>
              </button>
            </div>
          </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
