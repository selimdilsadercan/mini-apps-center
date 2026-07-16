"use client";

import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Basket, MagnifyingGlass, BookmarkSimple } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";

export type ChocolateDBTab = "discover" | "saved";

const ACCENT = "#7B3F00";

const translations = {
  tr: {
    title: "ChocolateDB",
    discoverTab: "Keşfet",
    savedTab: "Listelerim",
  },
  en: {
    title: "ChocolateDB",
    discoverTab: "Discover",
    savedTab: "My Lists",
  },
};

export default function ChocolateDBShell({
  activeTab,
  children,
}: {
  activeTab: ChocolateDBTab;
  children: React.ReactNode;
}) {
  const { locale: lang } = useLanguage();
  const t = translations[lang];

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-amber-100 dark:selection:bg-amber-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <Basket size={18} weight="fill" style={{ color: ACCENT }} className="shrink-0" />
              <span className="truncate">{t.title}</span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
            <Link href="/apps/chocolate-db" className={tabClass(activeTab === "discover")}>
              <MagnifyingGlass size={14} weight={activeTab === "discover" ? "fill" : "duotone"} />
              <span>{t.discoverTab}</span>
            </Link>
            <Link href="/apps/chocolate-db/saved" className={tabClass(activeTab === "saved")}>
              <BookmarkSimple size={14} weight={activeTab === "saved" ? "fill" : "duotone"} />
              <span>{t.savedTab}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
