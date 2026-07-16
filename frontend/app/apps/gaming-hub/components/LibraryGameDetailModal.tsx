"use client";

import { X, GameController, ListChecks } from "@phosphor-icons/react";
import type { gaming_hub } from "@/lib/client";
import GameCover from "./GameCover";

const STATUS_LABELS: Record<gaming_hub.GameStatus, string> = {
  wishlist: "İstek listesi",
  backlog: "Beklemede",
  playing: "Oynanıyor",
  completed: "Tamamlandı",
};

const GAME_MODE_LABELS: Record<gaming_hub.GameMode, string> = {
  single: "Tek kişilik",
  multi: "Çok oyunculu",
};

function formatPlayTime(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-app-muted font-semibold shrink-0">{label}</span>
      <span className="text-app-text font-bold text-right">{value}</span>
    </div>
  );
}

export default function LibraryGameDetailModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: gaming_hub.LibraryItem | null;
  onClose: () => void;
}) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl border-t border-app-border shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-app-border shrink-0" />

        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
          <h2 className="text-sm font-black text-app-text uppercase tracking-wide">Oyun Detayı</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-app-border bg-app-surface text-app-muted active:scale-95"
            aria-label="Kapat"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="bg-app-surface rounded-2xl border border-app-border shadow-sm p-4">
            <div className="flex gap-4">
              <GameCover
                coverUrl={item.coverUrl}
                title={item.gameName}
                igdbId={item.igdbId}
                className="w-24 h-32 rounded-xl shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-2.5">
                <div>
                  <p className="text-base font-black text-app-text leading-snug line-clamp-3">
                    {item.gameName}
                  </p>
                  <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-1">
                    {item.platform}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <InfoRow label="Durum" value={STATUS_LABELS[item.status]} />
                  <InfoRow label="Mod" value={GAME_MODE_LABELS[item.gameMode]} />
                  <InfoRow label="Oynama süresi" value={formatPlayTime(item.playTime)} />
                  {item.rating != null && (
                    <InfoRow label="Puan" value={`${item.rating} / 5`} />
                  )}
                </div>
              </div>
            </div>

            {item.notes?.trim() && (
              <div className="mt-4 pt-4 border-t border-app-border">
                <p className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-1.5">
                  Notlar
                </p>
                <p className="text-xs text-app-muted leading-relaxed whitespace-pre-wrap">
                  {item.notes}
                </p>
              </div>
            )}
          </div>

          <section className="mt-4">
            <div className="flex items-center gap-1.5 mb-2.5 px-0.5">
              <ListChecks size={14} className="text-app-muted" weight="duotone" />
              <h3 className="text-xs font-bold text-app-muted">Günlük Görevler</h3>
            </div>

            <div className="bg-app-surface rounded-2xl border border-app-border shadow-sm p-4">
              <div className="text-center py-6">
                <GameController size={28} className="mx-auto text-app-muted mb-2" weight="duotone" />
                <p className="text-xs font-bold text-app-muted">Henüz günlük görev yok</p>
                <p className="text-[10px] text-app-muted mt-1">
                  Bu oyun için görevler yakında burada görünecek.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
