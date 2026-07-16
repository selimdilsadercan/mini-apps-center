"use client";

import { CheckCircle, Circle, Play } from "@phosphor-icons/react";
import type { Episode } from "../lib/types";
import { episodeThumbnailUrl, formatEpisodeDate } from "../lib/format";

export default function EpisodeListRow({
  episode,
  displayNumber,
  isWatched,
  onPlay,
  onToggleWatched,
}: {
  episode: Episode;
  displayNumber?: number;
  isWatched: boolean;
  onPlay: () => void;
  onToggleWatched: () => void;
}) {
  const dateLabel = formatEpisodeDate(episode.publishedAt);

  return (
    <div
      className={`flex items-start gap-3 p-2.5 rounded-2xl border transition-all ${
        isWatched
          ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40"
          : "bg-app-surface border-app-border shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={onPlay}
        className="w-[120px] aspect-video rounded-xl overflow-hidden shrink-0 border border-app-border bg-app-surface-muted relative group"
      >
        <img
          src={episodeThumbnailUrl(episode)}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play size={22} weight="fill" className="text-white" />
        </div>
      </button>

      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black text-red-500">
            #{displayNumber ?? episode.episodeNumber}
          </span>
          {dateLabel && (
            <span className="text-[8px] font-medium text-app-muted">{dateLabel}</span>
          )}
        </div>
        <button type="button" onClick={onPlay} className="text-left w-full">
          <p
            className={`text-[12px] font-bold line-clamp-2 leading-snug ${
              isWatched ? "text-app-muted line-through" : "text-app-text"
            }`}
          >
            {episode.title}
          </p>
        </button>
      </div>

      <button
        type="button"
        onClick={onToggleWatched}
        className={`shrink-0 flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1.5 rounded-xl border transition-all active:scale-95 ${
          isWatched
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "bg-app-surface-muted border-app-border text-app-muted hover:text-app-text"
        }`}
        aria-label={isWatched ? "İzlenmedi olarak işaretle" : "İzledim olarak işaretle"}
      >
        {isWatched ? (
          <CheckCircle size={16} weight="fill" />
        ) : (
          <Circle size={16} weight="bold" />
        )}
        <span className="text-[8px] font-black uppercase tracking-wide">
          {isWatched ? "İzlendi" : "İzledim"}
        </span>
      </button>
    </div>
  );
}
