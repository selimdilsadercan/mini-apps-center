"use client";

import Link from "next/link";
import { Play, Star } from "@phosphor-icons/react";
import type { Series } from "../lib/types";
import { CATEGORY_LABELS } from "../lib/types";

const ACCENT = "#EF4444";

export default function FeaturedSeriesHero({ series }: { series: Series }) {
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/maxresdefault.jpg`
    : null;

  return (
    <Link
      href={`/apps/youtube-discover/seri?id=${series.id}`}
      className="group block relative rounded-2xl overflow-hidden border border-app-border shadow-lg active:scale-[0.99] transition-transform"
    >
      <div className="aspect-[16/10] bg-app-surface-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950/40 to-app-surface-muted" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

      <div className="absolute top-3 left-3">
        <span
          className="inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white"
          style={{ backgroundColor: ACCENT }}
        >
          Öne çıkan
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p
          className="text-[10px] font-black uppercase tracking-wider mb-1"
          style={{ color: ACCENT }}
        >
          {series.creator}
        </p>
        <h2 className="text-xl font-black text-white leading-tight line-clamp-2">
          {series.title}
        </h2>
        {series.description && (
          <p className="text-[12px] font-medium text-white/70 line-clamp-2 mt-1.5 leading-relaxed">
            {series.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2.5 text-[11px] font-bold text-white/80">
          <span>{series.episodeCount} bölüm</span>
          <span>·</span>
          <span>{CATEGORY_LABELS[series.category]}</span>
          {series.avgRating > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Star size={12} weight="fill" className="text-amber-400" />
                {series.avgRating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        <div
          className="inline-flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-wider"
          style={{ backgroundColor: ACCENT }}
        >
          <Play size={16} weight="fill" />
          İzlemeye başla
        </div>
      </div>
    </Link>
  );
}
