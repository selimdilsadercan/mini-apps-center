"use client";

import Link from "next/link";
import { Play, Headphones } from "@phosphor-icons/react";
import type { Series } from "../lib/types";

export default function SeriesPosterCard({ series }: { series: Series }) {
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <Link
      href={`/apps/youtube-discover/seri?id=${series.id}`}
      className="group w-[132px] shrink-0 active:scale-[0.98] transition-transform"
    >
      <div className="aspect-video rounded-xl overflow-hidden border border-app-border bg-app-surface-muted relative">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={series.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-app-muted">
            <Headphones size={28} weight="fill" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={22} weight="fill" className="text-white" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[8px] font-black text-white uppercase">
          {series.episodeCount} böl
        </div>
      </div>
      <h3 className="text-[12px] font-black text-app-text truncate mt-2 leading-tight">
        {series.title}
      </h3>
      <p className="text-[10px] font-bold text-app-muted truncate">{series.creator}</p>
    </Link>
  );
}
