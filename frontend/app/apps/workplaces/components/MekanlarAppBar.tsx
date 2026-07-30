"use client";

import Link from "next/link";
import { Compass, Heart, MapPin } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import type { MekanlarTab } from "./MekanlarShell";

const ACCENT = "#D97706";

const NAV_ITEMS: {
  id: MekanlarTab;
  href: string;
  icon: typeof Compass;
  labelKey: string;
}[] = [
  { id: "explore", href: "/apps/workplaces", icon: Compass, labelKey: "tabs.explore" },
  { id: "map", href: "/apps/workplaces/map", icon: MapPin, labelKey: "tabs.map" },
  { id: "forYou", href: "/apps/workplaces/for-you", icon: Heart, labelKey: "tabs.forYou" },
];

interface MekanlarAppBarProps {
  activeTab: MekanlarTab;
}

export default function MekanlarAppBar({ activeTab }: MekanlarAppBarProps) {
  const t = useTranslations("workplaces");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[1100] app-chrome-bottom"
      aria-label={t("appBar.label")}
    >
      <div className="max-w-5xl mx-auto flex items-stretch px-2 pt-1.5 pb-safe-area-inset-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-colors no-underline min-w-0 ${
                isActive ? "text-app-text" : "text-app-muted hover:text-app-text"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? "bg-amber-100/80 dark:bg-amber-950/40" : ""
                }`}
              >
                <Icon
                  size={20}
                  weight={isActive ? "fill" : "bold"}
                  style={isActive ? { color: ACCENT } : undefined}
                />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-tight truncate max-w-full px-0.5 ${
                  isActive ? "text-app-text" : ""
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
