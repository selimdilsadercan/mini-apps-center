"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Desktop } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";

const OPTIONS = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Desktop },
] as const;

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("profile");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return ( <div className="bg-app-surface rounded-3xl border border-app-border shadow-sm p-4 h-[52px] animate-pulse" />
    );
  }

  return (
    <div className="bg-app-surface rounded-3xl border border-app-border shadow-sm p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
          <Sun size={18} weight="bold" />
        </div>
        <span className="text-xs font-black text-app-text">{t("theme")}</span>
      </div>

      <div className="flex items-center bg-app-muted border border-app-border rounded-2xl p-1 shrink-0">
        {OPTIONS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            title={t(`theme${id.charAt(0).toUpperCase()}${id.slice(1)}` as "themeLight" | "themeDark" | "themeSystem")}
            className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              theme === id
                ? "bg-app-surface text-app-text shadow-sm"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            <Icon size={16} weight={theme === id ? "fill" : "bold"} />
          </button>
        ))}
      </div>
    </div>
  );
}
