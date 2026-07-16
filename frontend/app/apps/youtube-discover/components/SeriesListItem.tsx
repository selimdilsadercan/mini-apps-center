"use client";

import Link from "next/link";
import { Play, Star, Headphones, BookmarkSimple } from "@phosphor-icons/react";
import type { Series } from "../lib/types";
import { CATEGORY_LABELS } from "../lib/types";

const ACCENT = "#EF4444";

export default function SeriesListItem({
  series,
  progress,
  inWatchlist,
  onToggleWatchlist,
}: {
  series: Series;
  progress?: number;
  inWatchlist?: boolean;
  onToggleWatchlist?: () => void;
}) {
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-3 flex gap-2 active:scale-[0.99] transition-transform hover:border-red-500/30 hover:shadow-md">
      <Link href={`/apps/youtube-discover/seri?id=${series.id}`} className="flex flex-1 gap-3 min-w-0">
        <div className="w-[96px] aspect-video rounded-xl bg-app-surface-muted border border-app-border overflow-hidden shrink-0 relative">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={series.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-app-muted">
              <Headphones size={24} weight="fill" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Play size={20} weight="fill" className="text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-[14px] font-black text-app-text leading-tight truncate">
            {series.title}
          </h3>
          <p
            className="text-[10px] font-black uppercase tracking-wider mt-0.5 truncate"
            style={{ color: ACCENT }}
          >
            {series.creator}
          </p>
          <div className="flex items-center gap-2 mt-1 text-app-muted">
            {series.avgRating > 0 && (
              <>
                <Star size={11} weight="fill" className="text-amber-400 shrink-0" />
                <span className="text-[10px] font-bold">{series.avgRating.toFixed(1)}</span>
                <span className="text-[10px] font-bold">·</span>
              </>
            )}
            <span className="text-[10px] font-bold truncate">
              {series.episodeCount} bölüm · {CATEGORY_LABELS[series.category]}
            </span>
          </div>
          {progress !== undefined && progress > 0 && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-app-surface-muted">
              <div
                className="h-full rounded-full bg-red-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      {onToggleWatchlist && (
        <button
          type="button"
          onClick={onToggleWatchlist}
          className={`shrink-0 self-center flex flex-col items-center justify-center gap-0.5 w-11 py-2 rounded-xl border transition-all active:scale-95 ${
            inWatchlist
              ? "text-white border-red-500"
              : "text-app-muted border-app-border bg-app-surface-muted hover:text-app-text"
          }`}
          style={inWatchlist ? { backgroundColor: ACCENT } : undefined}
          aria-label={inWatchlist ? "Takibi bırak" : "Takip et"}
        >
          <BookmarkSimple size={16} weight={inWatchlist ? "fill" : "bold"} />
          <span className="text-[7px] font-black uppercase tracking-wide">
            {inWatchlist ? "Takipte" : "Takip"}
          </span>
        </button>
      )}
    </article>
  );
}
