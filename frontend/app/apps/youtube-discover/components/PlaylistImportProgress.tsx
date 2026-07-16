"use client";

import { CircleNotch, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { PlaylistImportJob } from "../lib/playlistImport";

const ACCENT = "#EF4444";

const PHASE_LABELS = {
  resolving: "Oynatma listesi okunuyor…",
  creating: "Seri oluşturuluyor…",
  importing: "Bölümler ve tarihler ekleniyor…",
  done: "Tamamlandı",
  error: "Hata",
} as const;

export default function PlaylistImportProgress({ job }: { job: PlaylistImportJob }) {
  const progress =
    job.total > 0 ? Math.min(100, Math.round(((job.done + job.skipped) / job.total) * 100)) : 0;
  const isActive = job.phase === "resolving" || job.phase === "creating" || job.phase === "importing";

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-500">
            {PHASE_LABELS[job.phase]}
          </p>
          <p className="text-[12px] font-bold text-app-text truncate mt-0.5">{job.seriesTitle}</p>
          {job.currentTitle && job.phase === "importing" && (
            <p className="text-[10px] font-medium text-app-muted truncate mt-0.5">
              {job.currentTitle}
            </p>
          )}
        </div>
        {isActive ? (
          <CircleNotch size={18} className="animate-spin shrink-0 mt-0.5" style={{ color: ACCENT }} />
        ) : job.phase === "done" ? (
          <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <WarningCircle size={18} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
        )}
      </div>

      {job.total > 0 && (
        <>
          <div className="h-1.5 rounded-full bg-app-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: ACCENT }}
            />
          </div>
          <p className="text-[10px] font-bold text-app-muted">
            {job.done} eklendi
            {job.skipped > 0 ? ` · ${job.skipped} atlandı` : ""}
            {" · "}
            {job.total} video
          </p>
        </>
      )}

      {job.error && <p className="text-[10px] font-medium text-red-500">{job.error}</p>}
    </div>
  );
}
