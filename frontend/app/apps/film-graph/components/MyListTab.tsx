"use client";

import { Plus, ArrowsClockwise, Trash, Star } from "@phosphor-icons/react";
import { ACCENT, Film } from "../film-data";

interface MyListTabProps {
  films: Film[];
  onAddClick: () => void;
  onResetClick: () => void;
  onFilmClick: (filmId: string) => void;
  onDeleteFilm: (filmId: string) => void;
}

export default function MyListTab({
  films,
  onAddClick,
  onResetClick,
  onFilmClick,
  onDeleteFilm,
}: MyListTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">
          Listem ({films.length})
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAddClick}
          className="flex-1 h-10 rounded-xl text-white text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.99]"
          style={{ backgroundColor: ACCENT }}
        >
          <Plus size={14} weight="bold" />
          Film Ekle
        </button>
        <button
          type="button"
          onClick={onResetClick}
          className="h-10 px-3 rounded-xl border border-app-border bg-app-surface text-app-muted text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1 active:scale-[0.99] hover:text-app-text"
        >
          <ArrowsClockwise size={14} weight="bold" />
        </button>
      </div>

      {films.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-app-border bg-app-surface">
          <p className="text-3xl mb-2">🎬</p>
          <p className="text-sm font-bold text-app-muted">Listen boş</p>
          <p className="text-xs text-app-muted mt-1">
            Keşfet sekmesinden film ekle veya manuel ekle.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {films.map((film) => (
            <div
              key={film.id}
              className="group flex gap-3 p-3 rounded-2xl bg-app-surface border border-app-border shadow-sm"
            >
              <button
                type="button"
                onClick={() => onFilmClick(film.id)}
                className="flex gap-3 flex-1 min-w-0 text-left active:scale-[0.99]"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-app-surface-muted shrink-0">
                  {film.imgUrl ? (
                    <img src={film.imgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      🎬
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
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
              <button
                type="button"
                onClick={() => onDeleteFilm(film.id)}
                className="shrink-0 w-8 h-8 rounded-lg border border-app-border flex items-center justify-center text-app-muted hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
