import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const tmdbApiKey = secret("TmdbApiKey");
const BASE_URL = "https://api.themoviedb.org/3";
const LANG = "tr-TR";

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
