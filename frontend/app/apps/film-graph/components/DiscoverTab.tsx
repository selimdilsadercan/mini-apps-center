"use client";

import { useCallback, useEffect, useState } from "react";
import { Ticket, Compass, Star } from "@phosphor-icons/react";
import { FilmCatalogItem, DiscoverSubTab, ACCENT } from "../film-data";
import {
  fetchPopularFilms,
  fetchTopRatedFilms,
} from "../film-api";
import SessionsTab from "./SessionsTab";

interface DiscoverTabProps {
  listIds: Set<string>;
  onSelect: (film: FilmCatalogItem) => void;
  discoverSubTab: DiscoverSubTab;
  onDiscoverSubTabChange: (sub: DiscoverSubTab) => void;
  onFilmClick?: (tmdbId: string) => void;
}

export default function DiscoverTab({
  listIds,
  onSelect,
  discoverSubTab,
  onDiscoverSubTabChange,
  onFilmClick,
}: DiscoverTabProps) {
  const [movies, setMovies] = useState<FilmCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovies = useCallback(async () => {
    if (discoverSubTab === "sessions") return;
    setLoading(true);
    setError(null);
    try {
      if (discoverSubTab === "toprated") {
        const result = await fetchTopRatedFilms();
        setMovies(result.movies);
      } else {
        const result = await fetchPopularFilms();
        setMovies(result.movies);
      }
    } catch (e) {
      console.error("Failed to load films:", e);
      setError("Filmler yüklenemedi. Daha sonra tekrar dene.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [discoverSubTab]);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const subTabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer ${
      active
        ? "text-white border-transparent"
        : "bg-app-surface text-app-muted border-app-border hover:text-app-text"
    }`;

  return (
    <div className="space-y-4">
      {/* Sub-tab bar: Vizyon | Popüler | Yüksek Puan */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onDiscoverSubTabChange("sessions")}
          className={subTabClass(discoverSubTab === "sessions")}
          style={discoverSubTab === "sessions" ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
        >
          <Ticket size={11} weight={discoverSubTab === "sessions" ? "fill" : "bold"} />
          Vizyon
        </button>
        <button
          type="button"
          onClick={() => onDiscoverSubTabChange("popular")}
          className={subTabClass(discoverSubTab === "popular")}
          style={discoverSubTab === "popular" ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
        >
          <Compass size={11} weight={discoverSubTab === "popular" ? "fill" : "bold"} />
          Popüler
        </button>
        <button
          type="button"
          onClick={() => onDiscoverSubTabChange("toprated")}
          className={subTabClass(discoverSubTab === "toprated")}
          style={discoverSubTab === "toprated" ? { backgroundColor: ACCENT, borderColor: ACCENT } : {}}
        >
          <Star size={11} weight={discoverSubTab === "toprated" ? "fill" : "bold"} />
          Yüksek Puan
        </button>
      </div>

      {/* Sessions view */}
      {discoverSubTab === "sessions" && (
        <SessionsTab onFilmClick={onFilmClick} />
      )}

      {/* Film grid view (popular or top rated) */}
      {discoverSubTab !== "sessions" && (
        <>
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-1.5 animate-pulse">
                  <div className="aspect-[2/3] rounded-xl bg-app-surface-muted" />
                  <div className="h-3 rounded bg-app-surface-muted" />
                  <div className="h-2 w-2/3 rounded bg-app-surface-muted" />
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-app-border bg-app-surface">
              <p className="text-3xl mb-2">🎬</p>
              <p className="text-sm font-bold text-app-muted">Film bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {movies.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  onClick={() => onSelect(film)}
                  className="text-left group active:scale-[0.98] transition-transform"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-app-surface-muted border border-app-border shadow-sm">
                    {film.posterUrl ? (
                      <img
                        src={film.posterUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎬
                      </div>
                    )}
                    {listIds.has(film.id) && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-app-text mt-1.5 line-clamp-2 leading-tight">
                    {film.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} weight="fill" className="text-amber-500" />
                    <span className="text-[10px] font-bold text-app-muted">
                      {film.imdbRating ? `${parseFloat(String(film.imdbRating)).toFixed(1)}` : "-"} · {film.year}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
