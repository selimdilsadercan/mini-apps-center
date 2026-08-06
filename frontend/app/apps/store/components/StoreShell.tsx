"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Storefront } from "@phosphor-icons/react";

export default function StoreShell({
  title,
  headerRight,
  children,
  tabs,
}: {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  tabs?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-amber-100 dark:selection:bg-amber-950/40">
      <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-amber-600 dark:text-amber-500" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
                <Storefront size={18} weight="fill" className="text-amber-600 dark:text-amber-500 shrink-0" />
                <span className="truncate">
                  {title ? (
                    <>
                      {title} <span className="text-amber-600 dark:text-amber-500">BUTİK</span>
                    </>
                  ) : (
                    <>
                      KATALOG <span className="text-amber-600 dark:text-amber-500">MAĞAZASI</span>
                    </>
                  )}
                </span>
              </h1>
            </div>

            {headerRight}
          </div>

          {tabs && <div className="mt-3">{tabs}</div>}
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
