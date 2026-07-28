"use client";

import React from "react";
import Link from "next/link";
import { CaretLeft, GraduationCap, ListChecks, MagnifyingGlass, BookOpen } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";

interface YKSShellProps {
  children: React.ReactNode;
  activeTab?: "explore" | "saved";
}

export default function YKSShell({ children, activeTab = "explore" }: YKSShellProps) {
  const tabClass = (tabName: "explore" | "saved") => {
    const isActive = activeTab === tabName;
    return `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
    }`;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 selection:bg-blue-500/20">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200/60 dark:border-zinc-800/80 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Geri butonu */}
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-all bg-white dark:bg-zinc-800 rounded-lg border border-gray-200/60 dark:border-zinc-700/80 active:scale-95 shadow-sm"
              title="Ana Sayfaya Dön"
            >
              <CaretLeft size={16} weight="bold" className="text-blue-600 dark:text-blue-400" />
            </button>

            {/* Başlık */}
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 dark:text-white flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0">
                <GraduationCap size={18} weight="fill" className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="truncate">
                YKS <span className="text-blue-600 dark:text-blue-400">TERCİH</span>
              </span>
            </h1>
          </div>

          {/* Header Segmented Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-gray-200/80 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-800/80 mt-2.5">
            <Link href="/apps/yks-tercih" className={tabClass("explore")}>
              <MagnifyingGlass size={14} weight="bold" />
              <span>Arama & Robot</span>
            </Link>

            <Link href="/apps/yks-tercih/saved" className={tabClass("saved")}>
              <ListChecks size={14} weight="bold" />
              <span>Tercih Listem</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Body Container */}
      <main className="max-w-5xl mx-auto px-4 pt-4 pb-16">{children}</main>
    </div>
  );
}
