"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Megaphone, Plus } from "@phosphor-icons/react";

export type EventsTab = "upcoming" | "past";

const ACCENT = "#00aeef";

export default function EventsShell({
  activeTab,
  onTabChange,
  onAdd,
  children,
}: {
  activeTab: EventsTab;
  onTabChange: (tab: EventsTab) => void;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  const tabClass = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-sky-100">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
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

          <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
            <button type="button" onClick={() => onTabChange("upcoming")} className={tabClass(activeTab === "upcoming")}>
              <span className="normal-case">Yaklaşan</span>
            </button>
            <button type="button" onClick={() => onTabChange("past")} className={tabClass(activeTab === "past")}>
              <span className="normal-case">Geçmiş</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
