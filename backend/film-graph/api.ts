import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const tmdbApiKey = secret("TmdbApiKey");
const BASE_URL = "https://api.themoviedb.org/3";
const LANG = "tr-TR";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 1000 * 60 * 30;

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToCache<T>(key: string, data: T) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export interface FilmCatalogItem {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  overview: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  posterUrl?: string;
  backdropUrl?: string;
  directorId: string;
  directorName: string;
  actorIds: string[];
  castNames: string[];
  imdbId?: string;
}

interface ListFilmsResponse {
  movies: FilmCatalogItem[];
  page: number;
  totalPages: number;
}

interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
}

interface TmdbCredits {
  cast?: { id: number; name: string; profile_path?: string | null }[];
  crew?: { id: number; name: string; job: string; profile_path?: string | null }[];
}

function yearFromDate(releaseDate?: string): number {
  if (!releaseDate) return new Date().getFullYear();
  const year = new Date(releaseDate).getFullYear();
  return Number.isNaN(year) ? new Date().getFullYear() : year;
}

function mapBasicMovie(movie: TmdbMovie): FilmCatalogItem {
  return {
    id: String(movie.id),
    title: movie.title,
    originalTitle: movie.original_title || movie.title,
    year: yearFromDate(movie.release_date),
    overview: movie.overview || "",
    voteAverage: movie.vote_average || 0,
    voteCount: movie.vote_count || 0,
    popularity: movie.popularity || 0,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : undefined,
    backdropUrl: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : undefined,
    directorId: "",
    directorName: "",
    actorIds: [],
    castNames: [],
  };
}

function mapMovieWithCredits(
  movie: TmdbMovie,
  credits: TmdbCredits,
  imdbId?: string,
): FilmCatalogItem {
  const base = mapBasicMovie(movie);
  const director = credits.crew?.find((member) => member.job === "Director");
  const cast = credits.cast?.slice(0, 5) || [];

  return {
    ...base,
    directorId: director ? String(director.id) : "",
    directorName: director?.name || "",
    actorIds: cast.map((actor) => String(actor.id)),
    castNames: cast.map((actor) => actor.name),
    imdbId,
  };
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const key = tmdbApiKey();
  if (!key) {
    throw APIError.internal("TMDB API Key is not configured");
  }

  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${BASE_URL}${path}${separator}api_key=${key}`);
  if (!response.ok) {
    throw APIError.internal(`TMDB request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchTrendingAndPopular(page: number): Promise<ListFilmsResponse> {
  const cacheKey = `popular:${page}`;
  const cached = getFromCache<ListFilmsResponse>(cacheKey);
  if (cached) return cached;

  const [trending, popular] = await Promise.all([
    tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
      `/trending/movie/day?language=${LANG}&page=${page}`,
    ),
    tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
      `/movie/popular?language=${LANG}&region=TR&page=${page}`,
    ),
  ]);

  const merged = new Map<string, FilmCatalogItem>();
  [...trending.results, ...popular.results].forEach((movie) => {
    merged.set(String(movie.id), mapBasicMovie(movie));
  });

  const response: ListFilmsResponse = {
    movies: Array.from(merged.values()),
    page,
    totalPages: Math.max(trending.total_pages, popular.total_pages),
  };

  setToCache(cacheKey, response);
  return response;
}

/**
 * Güncel trend + popüler filmler (TMDB — IMDb chart ile örtüşen canlı veri)
 * GET /film-graph/popular?page=1
 */
export const getPopularFilms = api(
  { expose: true, method: "GET", path: "/film-graph/popular" },
  async ({ page = 1 }: { page?: number }): Promise<ListFilmsResponse> => {
    try {
      return await fetchTrendingAndPopular(page);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to fetch popular films: ${message}`);
    }
  },
);

/**
 * En yüksek puanlı filmler
 * GET /film-graph/top-rated?page=1
 */
export const getTopRatedFilms = api(
  { expose: true, method: "GET", path: "/film-graph/top-rated" },
  async ({ page = 1 }: { page?: number }): Promise<ListFilmsResponse> => {
    const cacheKey = `top-rated:${page}`;
    const cached = getFromCache<ListFilmsResponse>(cacheKey);
    if (cached) return cached;

    try {
      const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
        `/movie/top_rated?language=${LANG}&page=${page}`,
      );

      const response: ListFilmsResponse = {
        movies: data.results.map(mapBasicMovie),
        page,
        totalPages: data.total_pages,
      };

      setToCache(cacheKey, response);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to fetch top rated films: ${message}`);
    }
  },
);

/**
 * Film arama
 * GET /film-graph/search?query=inception&page=1
 */
export const searchFilms = api(
  { expose: true, method: "GET", path: "/film-graph/search" },
  async ({
    query,
    page = 1,
  }: {
    query: string;
    page?: number;
  }): Promise<ListFilmsResponse> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { movies: [], page: 1, totalPages: 0 };
    }

    const cacheKey = `search:${trimmed.toLowerCase()}:${page}`;
    const cached = getFromCache<ListFilmsResponse>(cacheKey);
    if (cached) return cached;

    try {
      const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
        `/search/movie?language=${LANG}&query=${encodeURIComponent(trimmed)}&page=${page}&include_adult=false`,
      );

      const response: ListFilmsResponse = {
        movies: data.results.map(mapBasicMovie),
        page,
        totalPages: data.total_pages,
      };

      setToCache(cacheKey, response);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to search films: ${message}`);
    }
  },
);

/**
 * Film detayı — oyuncu/yönetmen bilgisiyle
 * GET /film-graph/movie/:movieId
 */
export const getFilmDetails = api(
  { expose: true, method: "GET", path: "/film-graph/movie/:movieId" },
  async ({ movieId }: { movieId: string }): Promise<{ movie: FilmCatalogItem }> => {
    const cacheKey = `movie:${movieId}`;
    const cached = getFromCache<{ movie: FilmCatalogItem }>(cacheKey);
    if (cached) return cached;

    try {
      const [details, creditsData, externalIds] = await Promise.all([
        tmdbFetch<TmdbMovie>(`/movie/${movieId}?language=${LANG}`),
        tmdbFetch<TmdbCredits>(`/movie/${movieId}/credits?language=${LANG}`),
        tmdbFetch<{ imdb_id?: string | null }>(`/movie/${movieId}/external_ids`),
      ]);

      const movie = mapMovieWithCredits(
        details,
        creditsData,
        externalIds.imdb_id || undefined,
      );

      const response = { movie };
      setToCache(cacheKey, response);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to fetch film details: ${message}`);
    }
  },
);

// ==================== DB ENDPOINTS & DAILY SUGGESTIONS SYNC ====================

export interface DBUserFilm {
  movie_id: string;
  title: string;
  year: number;
  status: string;
  poster_url?: string;
  vote_average?: number;
}

export interface SyncUserFilmRequest {
  userId: string;
  movie: DBUserFilm;
}

export interface GetDailySuggestionsResponse {
  movie1: any;
  movie2: any;
}

export const getUserFilms = api(
  { expose: true, method: "GET", path: "/film-graph/user-films/:userId" },
  async ({ userId }: { userId: string }): Promise<{ films: DBUserFilm[] }> => {
    const { data, error } = await supabase
      .schema("film_graph")
      .from("user_films")
      .select("movie_id, title, year, status, poster_url, vote_average")
      .eq("user_id", userId);

    if (error) {
      console.error("getUserFilms db error:", error);
      throw APIError.internal("Filmler yüklenemedi");
    }

    return { films: data || [] };
  }
);

export const syncUserFilm = api(
  { expose: true, method: "POST", path: "/film-graph/user-films/sync" },
  async ({ userId, movie }: SyncUserFilmRequest): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .schema("film_graph")
      .from("user_films")
      .upsert({
        user_id: userId,
        movie_id: movie.movie_id,
        title: movie.title,
        year: movie.year,
        status: movie.status,
        poster_url: movie.poster_url || null,
        vote_average: movie.vote_average || null,
      }, {
        onConflict: "user_id,movie_id"
      });

    if (error) {
      console.error("syncUserFilm db error:", error);
      throw APIError.internal("Film senkronize edilemedi");
    }

    return { success: true };
  }
);

export const deleteUserFilm = api(
  { expose: true, method: "DELETE", path: "/film-graph/user-films/:userId/:movieId" },
  async ({ userId, movieId }: { userId: string; movieId: string }): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .schema("film_graph")
      .from("user_films")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) {
      console.error("deleteUserFilm db error:", error);
      throw APIError.internal("Film silinemedi");
    }

    return { success: true };
  }
);

export const ignoreFilm = api(
  { expose: true, method: "POST", path: "/film-graph/ignore" },
  async ({ userId, movieId }: { userId: string; movieId: string }): Promise<{ success: boolean }> => {
    // 1. Add to ignored
    const { error: ignoreError } = await supabase
      .schema("film_graph")
      .from("user_ignored")
      .upsert({
        user_id: userId,
        movie_id: movieId,
      }, {
        onConflict: "user_id,movie_id"
      });

    if (ignoreError) {
      console.error("ignoreFilm db error:", ignoreError);
      throw APIError.internal("Film yoksayılamadı");
    }

    // 2. Remove today's suggestion so it regenerates dynamically next time getDailySuggestions is called
    const todayStr = new Date().toISOString().split("T")[0];
    await supabase
      .schema("film_graph")
      .from("daily_suggestions")
      .delete()
      .eq("user_id", userId)
      .eq("suggestion_date", todayStr);

    return { success: true };
  }
);

export const getDailySuggestions = api(
  { expose: true, method: "GET", path: "/film-graph/daily-suggestions/:userId" },
  async ({ userId }: { userId: string }): Promise<GetDailySuggestionsResponse> => {
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if suggestions for today already exist
    const { data: suggestionData, error: suggestionError } = await supabase
      .schema("film_graph")
      .from("daily_suggestions")
      .select("movie_1, movie_2")
      .eq("user_id", userId)
      .eq("suggestion_date", todayStr)
      .maybeSingle();

    if (!suggestionError && suggestionData) {
      const { data: savedFilms } = await supabase
        .schema("film_graph")
        .from("user_films")
        .select("movie_id, status")
        .eq("user_id", userId);

      const savedList = savedFilms || [];
      const savedIds = new Set(savedList.map((f) => f.movie_id));
      const watchedIds = new Set(savedList.filter((f) => f.status === "watched").map((f) => f.movie_id));

      const m1 = suggestionData.movie_1;
      const m2 = suggestionData.movie_2;

      // If either suggested movie is now watched, delete suggestion so it regenerates
      if (
        (m1 && watchedIds.has(String(m1.id))) ||
        (m2 && watchedIds.has(String(m2.id)))
      ) {
        await supabase
          .schema("film_graph")
          .from("daily_suggestions")
          .delete()
          .eq("user_id", userId)
          .eq("suggestion_date", todayStr);
      } else {
        return {
          movie1: m1 ? { ...m1, isSaved: savedIds.has(String(m1.id)) } : null,
          movie2: m2 ? { ...m2, isSaved: savedIds.has(String(m2.id)) } : null,
        };
      }
    }

    // Otherwise, generate suggestions:
    // Load user saved films and ignored list
    const [savedFilmsRes, ignoredRes, popularRes] = await Promise.all([
      supabase.schema("film_graph").from("user_films").select("movie_id, title, year, status, poster_url, vote_average").eq("user_id", userId),
      supabase.schema("film_graph").from("user_ignored").select("movie_id").eq("user_id", userId),
      fetchTrendingAndPopular(1),
    ]);

    const savedList = savedFilmsRes.data || [];
    const ignoredIds = (ignoredRes.data || []).map((i) => i.movie_id);

    const wantCandidates = savedList.filter(
      (f) => f.status === "want" && !ignoredIds.includes(f.movie_id)
    );

    const discoveryCandidates = (popularRes.movies || []).filter((m) => {
      const mId = String(m.id);
      const isSaved = savedList.some((f) => f.movie_id === mId);
      const isIgnored = ignoredIds.includes(mId);
      const isLowQuality = (m.voteAverage || 0) < 5.5 || (m.voteCount || 0) < 50;
      return !isSaved && !isIgnored && !isLowQuality;
    });

    const selected: any[] = [];
    const getDeterministicSeed = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };
    const todaySeed = getDeterministicSeed(userId + todayStr);

    // 1. Saved Movie candidate
    if (wantCandidates.length > 0) {
      const chosen = wantCandidates[todaySeed % wantCandidates.length];
      selected.push({
        id: chosen.movie_id,
        title: chosen.title,
        year: chosen.year,
        voteAverage: chosen.vote_average,
        posterUrl: chosen.poster_url,
        isSaved: true,
      });
    }

    // 2. Discovery Movie candidate
    const remainingDiscovery = discoveryCandidates.filter(
      (m) => !selected.some((s) => String(s.id) === String(m.id))
    );

    if (remainingDiscovery.length > 0) {
      const chosen = remainingDiscovery[todaySeed % remainingDiscovery.length];
      selected.push({
        id: String(chosen.id),
        title: chosen.title,
        year: chosen.year,
        voteAverage: chosen.voteAverage,
        posterUrl: chosen.posterUrl,
        isSaved: false,
      });
    }

    // Fallback if needed
    if (selected.length < 2 && remainingDiscovery.length > 1) {
      const chosen = remainingDiscovery[(todaySeed + 1) % remainingDiscovery.length];
      selected.push({
        id: String(chosen.id),
        title: chosen.title,
        year: chosen.year,
        voteAverage: chosen.voteAverage,
        posterUrl: chosen.posterUrl,
        isSaved: false,
      });
    }

    const movie1 = selected[0] || null;
    const movie2 = selected[1] || null;

    // Save to daily suggestion table
    if (movie1 || movie2) {
      await supabase
        .schema("film_graph")
        .from("daily_suggestions")
        .upsert({
          user_id: userId,
          suggestion_date: todayStr,
          movie_1: movie1,
          movie_2: movie2,
        }, {
          onConflict: "user_id,suggestion_date"
        });
    }

    return { movie1, movie2 };
  }
);
