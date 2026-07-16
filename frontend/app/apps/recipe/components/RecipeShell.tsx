"use client";

import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, ChefHat, Plus, Calendar } from "@phosphor-icons/react";

export type RecipeTab = "recipes" | "plan";

export default function RecipeShell({
  activeTab,
  children,
  onAdd,
}: {
  activeTab: RecipeTab;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-orange-100 dark:selection:bg-orange-950/40">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-orange-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <ChefHat size={18} weight="fill" className="text-orange-500 shrink-0" />
              <span className="truncate">
                Meal <span className="text-orange-500">Planner</span>
              </span>
            </h1>

            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="Yeni tarif ekle"
              >
                <Plus size={16} weight="bold" />
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
            <Link href="/apps/recipe" className={tabClass(activeTab === "recipes")}>
              <ChefHat size={14} weight={activeTab === "recipes" ? "fill" : "duotone"} />
              <span>Tarifler</span>
            </Link>
            <Link href="/apps/recipe/plan" className={tabClass(activeTab === "plan")}>
              <Calendar size={14} weight={activeTab === "plan" ? "fill" : "duotone"} />
              <span>Haftalık Plan</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>
    </div>
  );
}
