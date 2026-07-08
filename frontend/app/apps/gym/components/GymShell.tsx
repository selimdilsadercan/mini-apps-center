"use client";

import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Barbell, User } from "@phosphor-icons/react";

export type GymTab = "workout" | "profile";

export default function GymShell({
  activeTab,
  children,
}: {
  activeTab: GymTab;
  children: React.ReactNode;
}) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-violet-100">
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-gray-200/40">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-violet-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <Barbell size={18} weight="fill" className="text-violet-500 shrink-0" />
              <span className="truncate">
                <span className="text-violet-500">Gym</span>
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
            <Link href="/apps/gym" className={tabClass(activeTab === "workout")}>
              <Barbell size={14} weight={activeTab === "workout" ? "fill" : "duotone"} />
              <span>Antrenman</span>
            </Link>
            <Link href="/apps/gym/profile" className={tabClass(activeTab === "profile")}>
              <User size={14} weight={activeTab === "profile" ? "fill" : "duotone"} />
              <span>Profil</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
