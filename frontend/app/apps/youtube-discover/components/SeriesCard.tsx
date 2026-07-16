"use client";

import Link from "next/link";
import { PlayCircle, Star } from "@phosphor-icons/react";
import { Series, CATEGORY_LABELS } from "../lib/types";

const ACCENT = "#EF4444";

export default function SeriesCard({ series }: { series: Series }) {
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <Link
      href={`/apps/youtube-discover/seri?id=${series.id}`}
      className="group block active:scale-[0.98] transition-transform"
    >
      <article className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden hover:border-red-500/30 hover:shadow-md transition-all">
        <div className="relative aspect-video overflow-hidden bg-app-surface-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={series.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl">
              {series.emoji ?? "🎧"}
            </div>
          )}

          {series.status === "devam-ediyor" && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-black text-white uppercase tracking-wider"
              style={{ backgroundColor: ACCENT }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Yayında
            </div>
          )}

          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-app-surface/90 backdrop-blur-sm px-2 py-1 text-[10px] font-black text-app-text border border-app-border">
            <Star weight="fill" className="h-3 w-3 text-amber-400" />
            {series.avgRating.toFixed(1)}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <PlayCircle size={36} weight="fill" className="text-white drop-shadow-lg" />
          </div>
        </div>

        <div className="p-3">
          <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: ACCENT }}>
            {series.creator}
          </p>
          <h3 className="text-[13px] font-black text-app-text leading-tight mt-0.5 line-clamp-2">
            {series.title}
          </h3>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-app-muted uppercase tracking-wider">
            <span>{series.episodeCount} bölüm</span>
            <span>{CATEGORY_LABELS[series.category]}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
