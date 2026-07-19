"use client";

import { useState } from "react";
import { Plus, ArrowsClockwise, Trash, Star, BookmarkSimple, CheckCircle, Check } from "@phosphor-icons/react";
import { ACCENT, Film } from "../film-data";

interface MyListTabProps {
  films: Film[];
  onAddClick: () => void;
  onResetClick: () => void;
  onFilmClick: (filmId: string) => void;
  onDeleteFilm: (filmId: string) => void;
  onToggleFilmStatus?: (filmId: string) => void;
  onTogglePriority?: (filmId: string) => void;
}

export default function MyListTab({
  films,
  onAddClick,
  onResetClick,
  onFilmClick,
  onDeleteFilm,
  onToggleFilmStatus,
  onTogglePriority,
}: MyListTabProps) {
  const [subTab, setSubTab] = useState<"want" | "watched">("want");
  const [priorityTab, setPriorityTab] = useState<"soon" | "later">("soon");

  const wantFilms = films.filter((f) => f.status !== "watched");
  const watchedFilms = films.filter((f) => f.status === "watched");

  const soonFilms = wantFilms.filter((f) => f.status === "soon" || f.status === "want" || !f.status);
  const laterFilms = wantFilms.filter((f) => f.status === "later");

  const currentFilms =
    subTab === "watched"
      ? watchedFilms
      : priorityTab === "soon"
      ? soonFilms
      : laterFilms;

  return (
    <div className="space-y-4">
      {/* İZLEMEK İSTİYORUM / İZLEDİM SEKMELERİ */}
      <div className="flex p-1 rounded-2xl bg-app-surface-muted border border-app-border">
        <button
          type="button"
          onClick={() => setSubTab("want")}
          className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === "want"
              ? "bg-app-surface text-app-text border border-app-border shadow-xs"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          <BookmarkSimple
            size={14}
            weight={subTab === "want" ? "fill" : "bold"}
          />
          <span>Kaydedilenler</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-app-surface-muted rounded-md text-app-muted border border-app-border ml-0.5">
            {wantFilms.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("watched")}
          className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === "watched"
              ? "bg-app-surface text-app-text border border-app-border shadow-xs"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          <CheckCircle
            size={14}
            weight={subTab === "watched" ? "fill" : "bold"}
          />
          <span>İzledim</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-app-surface-muted rounded-md text-app-muted border border-app-border ml-0.5">
            {watchedFilms.length}
          </span>
        </button>
      </div>

      {/* YAKIN ZAMAN / DAHA SONRA ALT SEKMELERİ */}
      {subTab === "want" && (
        <div className="flex p-0.5 rounded-xl bg-app-surface-muted border border-app-border w-fit">
          <button
            type="button"
            onClick={() => setPriorityTab("soon")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              priorityTab === "soon"
                ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Yakın Zaman İçin ({soonFilms.length})
          </button>
          <button
            type="button"
            onClick={() => setPriorityTab("later")}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              priorityTab === "later"
                ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Daha Sonra ({laterFilms.length})
          </button>
        </div>
      )}

      {/* Film Listesi */}
      {currentFilms.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-app-border bg-app-surface">
          <p className="text-3xl mb-2">{subTab === "want" ? "🍿" : "🎉"}</p>
          <p className="text-sm font-bold text-app-muted">
            {subTab === "want"
              ? priorityTab === "soon"
                ? "Yakın zamanda izlenecek filmin yok"
                : "Daha sonra izlenecek filmin yok"
              : "Henüz izlenmiş film eklemedin"}
          </p>
          <p className="text-xs text-app-muted mt-1">
            {subTab === "want"
              ? "Keşfet sekmesinden film ekleyebilirsin."
              : "İzlemek istediklerinden 'İzledim' olarak işaretleyebilirsin."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentFilms.map((film) => {
            const isWatched = film.status === "watched";
            return (
              <div
                key={film.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-2xl bg-app-surface border border-app-border shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onFilmClick(film.id)}
                  className="flex gap-3 flex-1 min-w-0 text-left active:scale-[0.99] cursor-pointer"
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-app-surface-muted shrink-0 border border-app-border">
                    {film.imgUrl ? (
                      <img src={film.imgUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        🎬
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <p className="text-sm font-bold text-app-text truncate">{film.title}</p>
                    <p className="text-[11px] text-app-muted mt-0.5">{film.year}</p>
                    {film.voteAverage != null && film.voteAverage > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={10} weight="fill" className="text-amber-500" />
                        <span className="text-[10px] font-bold text-app-muted">
                          {film.voteAverage.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Priority Toggle Button (Yakın Zaman <-> Daha Sonra) */}
                  {!isWatched && onTogglePriority && (
                    <button
                      type="button"
                      onClick={() => onTogglePriority(film.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-app-border bg-app-surface-muted text-app-muted hover:text-app-text text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                    >
                      {film.status === "later" ? "Yakın Zaman Yap" : "Daha Sonra"}
                    </button>
                  )}

                  {onToggleFilmStatus && (
                    <button
                      type="button"
                      onClick={() => onToggleFilmStatus(film.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isWatched
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-app-surface-muted text-app-muted hover:text-app-text border-app-border"
                      }`}
                    >
                      {isWatched ? (
                        <>
                          <Check size={12} weight="bold" />
                          <span>İzledim</span>
                        </>
                      ) : (
                        <>
                          <Check size={12} weight="bold" />
                          <span>İzledim Yap</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteFilm(film.id)}
                    className="w-8 h-8 rounded-xl border border-app-border flex items-center justify-center text-app-muted hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 transition-all cursor-pointer"
                    title="Sil"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
