"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, Star, ArrowClockwise } from "@phosphor-icons/react";
import { FilmCatalogItem } from "../film-data";
import {
  DiscoverSort,
  fetchPopularFilms,
  fetchTopRatedFilms,
  searchFilms,
  sortFilmsByYear,
} from "../film-api";

interface DiscoverTabProps {
  listIds: Set<string>;
  onSelect: (film: FilmCatalogItem) => void;
}

export default function DiscoverTab({
  listIds,
  onSelect,
}: DiscoverTabProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<DiscoverSort>("popular");
  const [movies, setMovies] = useState<FilmCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (debouncedQuery) {
        const result = await searchFilms(debouncedQuery);
        setMovies(result.movies);
        return;
      }

      if (sort === "rating") {
        const result = await fetchTopRatedFilms();
        setMovies(result.movies);
        return;
      }

      const result = await fetchPopularFilms();
      const items =
        sort === "year" ? sortFilmsByYear(result.movies) : result.movies;
      setMovies(items);
    } catch (e) {
      console.error("Failed to load films:", e);
      setError("Filmler yüklenemedi. Daha sonra tekrar dene.");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, sort]);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  const headerLabel = useMemo(() => {
    if (debouncedQuery) return `"${debouncedQuery}" araması`;
    if (sort === "popular") return "Güncel popüler filmler";
    if (sort === "rating") return "En yüksek puanlılar";
    return "Yıla göre sıralı";
  }, [debouncedQuery, sort]);

  const sortClass = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${
      active
        ? "bg-red-500 text-white border-red-500"
        : "bg-app-surface text-app-muted border-app-border hover:text-app-text"
    }`;

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Film, yönetmen ara..."
          className="w-full h-11 pl-9 pr-3 rounded-xl border border-app-border bg-app-surface text-sm text-app-text placeholder-app-muted outline-none focus:border-red-300 dark:focus:border-red-700 shadow-sm"
        />
      </div>

      {!debouncedQuery && (
        <div className="flex gap-2 flex-wrap">
          {(
            [
              ["popular", "Popüler"],
              ["rating", "Puan"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={sortClass(sort === key)}
            >
              {label}
            </button>
          ))}
        </div>
      )}


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
          <p className="text-sm font-bold text-app-muted">Sonuç bulunamadı</p>
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
                  {film.voteAverage.toFixed(1)} · {film.year}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
