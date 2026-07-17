"use client";

import { getAppRootUrl } from "@/lib/apps";
import {
  CaretLeft,
  ProjectorScreen,
  MagnifyingGlass,
  BookmarkSimple,
  Graph,
} from "@phosphor-icons/react";
import { ACCENT, FilmTab } from "../film-data";

interface FilmGraphShellProps {
  activeTab: FilmTab;
  onTabChange: (tab: FilmTab) => void;
  children: React.ReactNode;
  graphLayout?: boolean;
}

export default function FilmGraphShell({
  activeTab,
  onTabChange,
  children,
  graphLayout = false,
}: FilmGraphShellProps) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active
        ? "bg-app-tab-active text-app-text shadow-sm"
        : "text-app-muted hover:text-app-text"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-red-100 dark:selection:bg-red-950/40">
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
              <ProjectorScreen
                size={18}
                weight="fill"
                style={{ color: ACCENT }}
                className="shrink-0"
              />
              <span className="truncate">
                Film <span style={{ color: ACCENT }}>Keşfet</span>
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
            <button
              type="button"
              onClick={() => onTabChange("discover")}
              className={tabClass(activeTab === "discover")}
            >
              <MagnifyingGlass size={14} weight={activeTab === "discover" ? "fill" : "bold"} />
              Keşfet
            </button>
            <button
              type="button"
              onClick={() => onTabChange("list")}
              className={tabClass(activeTab === "list")}
            >
              <BookmarkSimple size={14} weight={activeTab === "list" ? "fill" : "bold"} />
              Listem
            </button>
            <button
              type="button"
              onClick={() => onTabChange("graph")}
              className={tabClass(activeTab === "graph")}
            >
              <Graph size={14} weight={activeTab === "graph" ? "fill" : "bold"} />
              Graph
            </button>
          </div>
        </div>
      </header>

      <main
        className={
          graphLayout
            ? "flex-1 min-h-0 w-full"
            : "flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full"
        }
      >
        {children}
      </main>
    </div>
  );
}
