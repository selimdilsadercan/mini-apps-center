"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import {
  buildKimGelirPrefillUrl,
  type NeYapsakSuggestion,
} from "../lib/maras-sources";

const PRESET_ACCENT: Record<string, string> = {
  movie: "#D97706",
  study: "#2563EB",
  concert: "#FF1493",
  standup: "#7C3AED",
  festival: "#0F766E",
};

export function NeYapsakSuggestionRow({
  suggestion,
  compact = false,
}: {
  suggestion: NeYapsakSuggestion;
  compact?: boolean;
}) {
  const accent = PRESET_ACCENT[suggestion.presetId] || "#FF5252";

  return (
    <Link
      href={buildKimGelirPrefillUrl(suggestion)}
      className={`group flex items-center gap-3 transition-all active:scale-[0.99] ${
        compact
          ? "px-4 py-3 border-t border-app-border hover:bg-app-surface-muted/40"
          : "p-3 rounded-2xl border border-app-border bg-app-surface hover:border-app-muted/50 hover:shadow-sm"
      }`}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base border"
        style={{
          backgroundColor: `${accent}14`,
          borderColor: `${accent}28`,
        }}
      >
        {suggestion.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-app-text truncate">{suggestion.title}</p>
        <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">{suggestion.subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 text-[9px] font-black uppercase tracking-wider" style={{ color: accent }}>
        <span>Plan</span>
        <ArrowRight size={12} weight="bold" className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
