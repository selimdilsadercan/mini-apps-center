"use client";

import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Broom } from "@phosphor-icons/react";

export default function EvIsleriShell({
  title,
  subtitle,
  onBack,
  headerRight,
  children,
}: {
  title?: string;
  subtitle?: string;
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
              <CaretLeft size={14} weight="bold" className="text-teal-600" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
                <Broom size={18} weight="fill" className="text-teal-600 shrink-0" />
                <span className="truncate">{title ?? "Ev İşleri"}</span>
              </h1>
              {subtitle && (
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>

            {headerRight}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
