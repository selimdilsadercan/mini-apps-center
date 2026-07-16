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
    return (
      <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 h-[72px] animate-pulse" />
    );
  }

  return (
    <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: "#6366F1" }}
        >
          <Sun size={20} weight="bold" className="text-white" />
        </div>
        <span className="text-[12px] font-black text-app-text">{t("theme")}</span>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-app-surface-muted border border-app-border shrink-0">
        {OPTIONS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            title={t(`theme${id.charAt(0).toUpperCase()}${id.slice(1)}` as "themeLight" | "themeDark" | "themeSystem")}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              theme === id
                ? "bg-app-tab-active text-app-text shadow-sm"
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
