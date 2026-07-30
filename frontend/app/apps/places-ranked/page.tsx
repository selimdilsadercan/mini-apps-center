"use client";

import Link from "next/link";
import { CaretLeft, Trophy } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import RankedLeaderboard from "../workplaces/components/RankedLeaderboard";

const ACCENT = "#7C3AED";

export default function PlacesRankedPage() {
  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-8">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-2">
          <Link
            href={getAppRootUrl()}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted hover:text-app-text transition-colors no-underline"
            aria-label="Geri"
          >
            <CaretLeft size={16} weight="bold" style={{ color: ACCENT }} />
          </Link>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden"
            style={{ backgroundColor: ACCENT }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <Trophy size={16} weight="fill" className="text-white relative z-10" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-black text-app-text tracking-tight truncate">Mekan Sıralaması</h1>
            <p className="text-[10px] font-bold text-app-muted truncate">Topluluk oylarına göre en iyiler</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-3">
        <RankedLeaderboard />
      </main>
    </div>
  );
}
