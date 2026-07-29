"use client";

import React from "react";
import Link from "next/link";
import { CaretLeft, Stethoscope, ListChecks, MagnifyingGlass } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";

interface TUSShellProps {
  children: React.ReactNode;
  activeTab?: "explore" | "saved";
}

export default function TUSShell({ children, activeTab = "explore" }: TUSShellProps) {
  const tabClass = (tabName: "explore" | "saved") => {
    const isActive = activeTab === tabName;
    return `inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] ${
      isActive
        ? "bg-app-tab-active text-app-text shadow-sm"
        : "text-app-muted hover:text-app-text"
    }`;
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text selection:bg-red-500/20">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 shadow-sm cursor-pointer"
              title="Ana Sayfaya Dön"
            >
              <CaretLeft size={16} weight="bold" className="text-red-600 dark:text-red-400" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-100 dark:border-red-900/50 flex items-center justify-center shrink-0">
                <Stethoscope size={18} weight="fill" className="text-red-600 dark:text-red-400" />
              </div>
              <span className="truncate">
                TUS <span className="text-red-600 dark:text-red-400">TERCİH</span>
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
            <Link href="/apps/tus-tercih" className={tabClass("explore")}>
              <MagnifyingGlass size={14} weight={activeTab === "explore" ? "fill" : "bold"} />
              <span>Arama</span>
            </Link>

            <Link href="/apps/tus-tercih/saved" className={tabClass("saved")}>
              <ListChecks size={14} weight={activeTab === "saved" ? "fill" : "bold"} />
              <span>Tercih Listem</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-4 pb-16">{children}</main>
    </div>
  );
}
