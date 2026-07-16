"use client";

import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";
import {
  CaretLeft,
  Headphones,
  Compass,
  BookmarkSimple,
  GearSix,
} from "@phosphor-icons/react";

export type YTDBTab = "kesfet" | "listem";

const ACCENT = "#EF4444";

export default function YTDBShell({
  activeTab,
  children,
  detailTitle,
  detailBackHref = "/apps/youtube-discover/kesfet",
  onAdmin,
}: {
  activeTab?: YTDBTab;
  children: React.ReactNode;
  detailTitle?: string;
  detailBackHref?: string;
  onAdmin?: () => void;
}) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-red-100 dark:selection:bg-red-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = detailTitle ? detailBackHref : getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <Headphones size={18} weight="fill" style={{ color: ACCENT }} className="shrink-0" />
              <span className="truncate">
                {detailTitle ?? (
                  <>
                    <span style={{ color: ACCENT }}>YT</span>DB
                  </>
                )}
              </span>
            </h1>

            {onAdmin && !detailTitle && (
              <button
                type="button"
                onClick={onAdmin}
                className="shrink-0 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: ACCENT }}
                aria-label="Yönetim paneli"
              >
                <GearSix size={16} weight="bold" />
              </button>
            )}
          </div>

          {!detailTitle && activeTab && (
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
              <Link href="/apps/youtube-discover/kesfet" className={tabClass(activeTab === "kesfet")}>
                <Compass size={14} weight={activeTab === "kesfet" ? "fill" : "duotone"} />
                <span>Keşfet</span>
              </Link>
              <Link href="/apps/youtube-discover/listem" className={tabClass(activeTab === "listem")}>
                <BookmarkSimple size={14} weight={activeTab === "listem" ? "fill" : "duotone"} />
                <span>Listem</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-2 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
