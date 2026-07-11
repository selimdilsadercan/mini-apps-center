"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, FilmStrip, Plus, Television, VideoCamera } from "@phosphor-icons/react";

export type SeriesTrackTab = "tv-flow" | "my-series";

export default function SeriesTrackShell({
  activeTab,
  onTabChange,
  onAdd,
  children,
}: {
  activeTab: SeriesTrackTab;
  onTabChange: (tab: SeriesTrackTab) => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-red-100">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-red-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <VideoCamera size={18} weight="fill" className="text-red-500 shrink-0" />
              <span className="truncate">
                Series<span className="text-red-500">Track</span>
              </span>
            </h1>

            <button
              type="button"
              onClick={onAdd}
              className="shrink-0 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all"
              aria-label="Dizi ekle"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>

          <div className="flex">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
              <button
                type="button"
                onClick={() => onTabChange("tv-flow")}
                className={tabClass(activeTab === "tv-flow")}
              >
                <Television size={13} weight={activeTab === "tv-flow" ? "fill" : "bold"} className={activeTab === "tv-flow" ? "text-red-500" : "text-gray-400"} />
                <span className="normal-case">Episode Club</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange("my-series")}
                className={tabClass(activeTab === "my-series")}
              >
                <FilmStrip size={13} weight={activeTab === "my-series" ? "fill" : "bold"} className={activeTab === "my-series" ? "text-red-500" : "text-gray-400"} />
                <span className="normal-case">Dizi Kütüphanem</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
