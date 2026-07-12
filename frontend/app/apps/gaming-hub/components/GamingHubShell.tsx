"use client";

import { getAppRootUrl } from "@/lib/apps";
import { Books, CaretLeft, Compass, GameController } from "@phosphor-icons/react";
import { pillTabClass } from "./PillTabs";

export type MainTab = "discover" | "library";

export default function GamingHubShell({
  title,
  subtitle,
  activeMainTab,
  onMainTabChange,
  onBack,
  headerRight,
  children,
}: {
  title?: string;
  subtitle?: string;
  activeMainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onBack) onBack();
                else window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-violet-600" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
                <GameController size={18} weight="fill" className="text-violet-600 shrink-0" />
                <span className="truncate">{title ?? "Gaming Hub"}</span>
              </h1>
              {subtitle && (
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {headerRight}
          </div>

          <div className="flex mt-2">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
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
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
