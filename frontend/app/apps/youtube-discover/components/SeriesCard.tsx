'use client';

import Link from "next/link";
import { Star, PlayCircle } from "@phosphor-icons/react";
import { Series } from "../lib/types";

export default function SeriesCard({ series }: { series: Series }) {
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/maxresdefault.jpg`
    : null;

  return (
    <Link href={`/apps/youtube-discover/seri?id=${series.id}`} className="group block h-full">
      <div className="relative h-full flex flex-col overflow-hidden rounded-[2rem] bg-slate-900/40 border border-white/5 transition-all duration-500 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-950/20 active:scale-[0.98]">
        
        {/* Thumbnail Area */}
        <div className="relative aspect-video overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${series.gradient || 'from-zinc-800 to-black'} opacity-40`} />
          
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={series.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${series.youtubeId}/hqdefault.jpg`;
              }}
            />
          ) : (
             <div className="h-full w-full flex items-center justify-center text-6xl">
                {series.emoji}
             </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          
          {/* Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-xl bg-black/60 px-2.5 py-1.5 text-[11px] font-black text-white backdrop-blur-md border border-white/10">
            <Star weight="fill" className="h-3.5 w-3.5 text-amber-400" />
            {series.avgRating.toFixed(1)}
          </div>

          {series.status === "devam-ediyor" && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-xl bg-red-600/90 px-2.5 py-1.5 text-[10px] font-black text-white backdrop-blur-md uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Yayında
            </div>
          )}

          {/* Play Icon on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
             <div className="p-4 bg-white/20 rounded-full backdrop-blur-xl border border-white/30 shadow-2xl">
                <PlayCircle size={40} weight="fill" className="text-white" />
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col flex-1">
          <div className="mb-2">
            <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase opacity-80">
              {series.creator}
            </span>
            <h3 className="text-lg font-black text-white leading-tight mt-0.5 line-clamp-1">
              {series.title}
            </h3>
          </div>
          
          <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {series.episodeCount} Bölüm
             </span>
             <span className="text-[11px] font-bold text-slate-500">
                {series.year}
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
