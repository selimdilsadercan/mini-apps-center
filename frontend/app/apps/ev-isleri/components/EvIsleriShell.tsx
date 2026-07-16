"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, CaretDown, Broom } from "@phosphor-icons/react";

export default function EvIsleriShell({
  title,
  onTitleClick,
  headerRight,
  children,
}: {
  title?: string;
  onTitleClick?: () => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-teal-100 dark:selection:bg-teal-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-teal-500" />
            </button>

            {onTitleClick ? (
              <button
                onClick={onTitleClick}
                className="flex-1 min-w-0 text-left flex items-center gap-1.5 active:opacity-80"
              >
                <Broom size={18} weight="fill" className="text-teal-500 shrink-0" />
                <span className="text-base font-black tracking-tight uppercase leading-none text-app-text truncate">
                  {title ?? "Ev İşleri"}
                </span>
                <CaretDown size={14} weight="bold" className="text-app-muted shrink-0" />
              </button>
            ) : (
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
                  <Broom size={18} weight="fill" className="text-teal-500 shrink-0" />
                  <span className="truncate">{title ?? "Ev İşleri"}</span>
                </h1>
              </div>
            )}

            {headerRight}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
