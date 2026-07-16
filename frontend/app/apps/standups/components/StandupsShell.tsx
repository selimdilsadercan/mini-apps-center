"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Microphone, Plus } from "@phosphor-icons/react";

const ACCENT = "#FF9800";

export default function StandupsShell({
  onDashboard,
  children,
}: {
  onDashboard?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-orange-100 dark:selection:bg-orange-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
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
              <Microphone size={18} weight="fill" style={{ color: ACCENT }} className="shrink-0" />
              <span className="truncate">Standups</span>
            </h1>

            {onDashboard && (
              <button
                type="button"
                onClick={onDashboard}
                className="shrink-0 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: ACCENT }}
                aria-label="Yönetim paneli"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-2 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
