"use client";

import { Drawer } from "vaul";
import { FilmCatalogItem, ACCENT } from "../film-data";
import {
  Star,
  Graph,
  Plus,
  Check,
  CheckCircle,
  BookmarkSimple,
  Trash,
  X,
  User,
} from "@phosphor-icons/react";

interface FilmDetailDrawerProps {
  film: FilmCatalogItem | null;
  loading?: boolean;
  inList: boolean;
  filmStatus?: "want" | "watched" | "soon" | "later" | null;
  onClose: () => void;
  onAddToList: (status?: "want" | "watched") => void;
  onToggleStatus?: () => void;
  onRemoveFromList?: () => void;
  onOpenGraph: () => void;
}

export default function FilmDetailDrawer({
  film,
  loading = false,
  inList,
  filmStatus,
  onClose,
  onAddToList,
  onToggleStatus,
  onRemoveFromList,
  onOpenGraph,
}: FilmDetailDrawerProps) {
  return (
    <Drawer.Root open={!!film} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 top-0 z-50 mx-auto flex h-[100dvh] w-full max-w-xl flex-col bg-app-surface text-app-text shadow-2xl outline-none overflow-hidden">
          {film && (
            <div className="flex-1 overflow-y-auto pb-10">
              {/* BACKDROP HEADER (SeriesTrack Style) */}
              <div className="relative h-56 md:h-64 w-full overflow-hidden shrink-0 bg-app-surface-muted">
                {film.backdropUrl ? (
                  <img
                    src={film.backdropUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : film.posterUrl ? (
                  <img
                    src={film.posterUrl}
                    alt=""
                    className="w-full h-full object-cover blur-md scale-110 opacity-40"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-600/30 to-purple-900/40" />
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-app-surface/40 to-black/30" />

                {/* Top Action Controls */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-20">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:bg-black/60"
                  >
                    <X size={18} weight="bold" />
                  </button>

                  {inList && onRemoveFromList && (
                    <button
                      type="button"
                      onClick={onRemoveFromList}
                      className="w-9 h-9 rounded-xl bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:bg-rose-500/40"
                      title="Listeden Kaldır"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  )}
                </div>
              </div>

              {/* MAIN CONTENT AREA */}
              <div className="px-5 pb-8 -mt-16 relative z-10 space-y-5">
                {/* Floating Poster & Info Header */}
                <div className="flex gap-4 items-end">
                  <div className="w-28 md:w-32 aspect-[2/3] rounded-2xl overflow-hidden border-2 border-app-surface shadow-2xl bg-app-surface-muted shrink-0 relative">
                    {film.posterUrl ? (
                      <img
                        src={film.posterUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🎬
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <Drawer.Title className="text-xl md:text-2xl font-black text-app-text leading-tight tracking-tight">
                      {film.title}
                    </Drawer.Title>

                    {film.originalTitle && film.originalTitle !== film.title && (
                      <p className="text-[11px] text-app-muted font-bold truncate mt-0.5">
                        {film.originalTitle}
                      </p>
                    )}

                    {/* Rating & Meta Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {film.imdbRating && film.imdbRating > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                          <Star size={13} weight="fill" />
                          <span>{film.imdbRating.toFixed(1)} IMDb</span>
                        </span>
                      )}

                      {film.year > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-app-surface-muted border border-app-border text-app-muted text-xs font-bold">
                          {film.year}
                        </span>
                      )}

                      {film.imdbId && (
                        <a
                          href={`https://www.imdb.com/title/${film.imdbId}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 text-xs font-black hover:underline"
                        >
                          IMDb ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* STATUS BAR (SeriesTrack Segmented Bar) */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">
                    İzleme Durumu
                  </p>

                  {inList ? (
                    <div className="flex p-1 rounded-2xl bg-app-surface-muted border border-app-border">
                      <button
                        type="button"
                        onClick={() => {
                          if (filmStatus === "watched" && onToggleStatus) {
                            onToggleStatus();
                          }
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          filmStatus !== "watched"
                            ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                            : "text-app-muted hover:text-app-text"
                        }`}
                      >
                        <BookmarkSimple
                          size={14}
                          weight={filmStatus !== "watched" ? "fill" : "bold"}
                          style={{ color: filmStatus !== "watched" ? ACCENT : undefined }}
                        />
                        <span>İzlemek İstiyorum</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (filmStatus !== "watched" && onToggleStatus) {
                            onToggleStatus();
                          }
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          filmStatus === "watched"
                            ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                            : "text-app-muted hover:text-app-text"
                        }`}
                      >
                        <CheckCircle
                          size={14}
                          weight={filmStatus === "watched" ? "fill" : "bold"}
                          className={filmStatus === "watched" ? "text-emerald-500" : undefined}
                        />
                        <span>İzledim</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onAddToList("want")}
                        className="flex-1 h-11 rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all cursor-pointer shadow-md"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Plus size={16} weight="bold" />
                        <span>Listeme Ekle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddToList("watched")}
                        className="h-11 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all cursor-pointer hover:bg-emerald-500/20"
                      >
                        <Check size={16} weight="bold" />
                        <span>İzledim Olarak Ekle</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* GRAPH ACTION BUTTON */}
                <button
                  type="button"
                  onClick={onOpenGraph}
                  disabled={!inList}
                  className="w-full h-11 rounded-2xl border border-app-border bg-app-surface-muted hover:bg-app-border/40 text-app-text text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Graph size={16} weight="bold" style={{ color: ACCENT }} />
                  <span>Graph Bağlantılarını Gör</span>
                </button>

                {/* OVERVIEW / STORY */}
                {film.overview && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">
                      Özet
                    </p>
                    <p className="text-xs md:text-sm text-app-text/90 leading-relaxed font-medium">
                      {film.overview}
                    </p>
                  </div>
                )}

                {/* DIRECTOR & CAST BADGES */}
                {(film.directorName || film.castNames.length > 0) && (
                  <div className="space-y-2.5 pt-1 border-t border-app-border/60">
                    {film.directorName && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">
                          Yönetmen
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-surface-muted border border-app-border text-xs font-bold text-app-text">
                          <User size={13} weight="bold" style={{ color: ACCENT }} />
                          {film.directorName}
                        </span>
                      </div>
                    )}

                    {film.castNames.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">
                          Oyuncular
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {film.castNames.map((actor) => (
                            <span
                              key={actor}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-surface-muted border border-app-border text-xs font-bold text-app-text"
                            >
                              <User size={12} className="text-app-muted" />
                              {actor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {loading && (
                  <div className="py-2 text-center text-xs text-app-muted font-bold animate-pulse">
                    Film detayları yükleniyor...
                  </div>
                )}
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
