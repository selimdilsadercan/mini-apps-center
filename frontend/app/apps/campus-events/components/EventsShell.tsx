"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Megaphone, Plus, Calendar, Clock } from "@phosphor-icons/react";

export type EventsTab = "upcoming" | "past";

const ACCENT = "#00aeef";

export default function EventsShell({
  activeTab,
  onTabChange,
  onAdd,
  searchBar,
  children,
}: {
  activeTab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
  onAdd?: () => void;
  searchBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-sky-100 dark:selection:bg-sky-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <Megaphone size={18} weight="fill" className="shrink-0" style={{ color: ACCENT }} />
              <span className="truncate">Events</span>
            </h1>

            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="shrink-0 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all"
                style={{ backgroundColor: ACCENT }}
                aria-label="Etkinlik ekle"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
              <button type="button" onClick={() => onTabChange("upcoming")} className={tabClass(activeTab === "upcoming")}>
                <Calendar size={13} weight={activeTab === "upcoming" ? "fill" : "bold"} className={activeTab === "upcoming" ? "text-sky-500" : "text-app-muted"} />
                <span className="normal-case">Yaklaşan</span>
              </button>
              <button type="button" onClick={() => onTabChange("past")} className={tabClass(activeTab === "past")}>
                <Clock size={13} weight={activeTab === "past" ? "fill" : "bold"} className={activeTab === "past" ? "text-sky-500" : "text-app-muted"} />
                <span className="normal-case">Geçmiş</span>
              </button>
            </div>
          </div>

          {searchBar}
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
