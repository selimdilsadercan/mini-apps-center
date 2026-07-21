import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { catalog } from "~encore/clients";

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
  imdbRating?: number;
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
  try {
    const res = await catalog.getPopularFilms({ page });
    return res;
  } catch (err) {
    console.error("Failed to fetch trending and popular from catalog service:", err);
    return { movies: [], page, totalPages: 0 };
  }
}

async function fetchTopRated(page: number): Promise<ListFilmsResponse> {
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
    console.error("Failed to fetch top rated films:", error);
    return { movies: [], page, totalPages: 0 };
  }
}

/**
 * Güncel trend + popüler filmler (TMDB — IMDb chart ile örtüşen canlı veri)
 * GET /film-graph/popular?page=1
 */
export const getPopularFilms = api(
  { expose: true, method: "GET", path: "/film-graph/popular" },
  async ({ page = 1 }: { page?: number }): Promise<ListFilmsResponse> => {
    try {
      const res = await catalog.getPopularFilms({ page });
      return {
        movies: res.movies as FilmCatalogItem[],
        page: res.page,
        totalPages: res.totalPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to fetch popular films from catalog: ${message}`);
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

    try {
      const res = await catalog.searchFilms({ query: trimmed, page });
      return {
        movies: res.movies as FilmCatalogItem[],
        page: res.page,
        totalPages: res.totalPages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to search films via catalog: ${message}`);
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
    try {
      const res = await catalog.getFilmDetails({ movieId });
      return {
        movie: res.movie as FilmCatalogItem,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw APIError.internal(`Failed to fetch film details via catalog: ${message}`);
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
  movie3: any;
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

/**
 * Bugünün film önerilerini sıfırlar (veritabanından siler, böylece dinamik olarak yeniden üretilir)
 * POST /film-graph/daily-suggestions/reset
 */
export const resetDailySuggestions = api(
  { expose: true, method: "POST", path: "/film-graph/daily-suggestions/reset" },
  async ({ userId }: { userId: string }): Promise<{ success: boolean }> => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Generate new suggestions using a random seed and save them
    await generateSuggestions(userId, todayStr, true);

    return { success: true };
  }
);

async function enrichWithImdbRating(movie: any): Promise<any> {
  if (!movie) return null;
  try {
    // 1. Check local DB cache first
    const { data: cached } = await supabase
      .schema("catalog")
      .from("movies")
      .select("imdb_rating, imdb_id")
      .eq("id", movie.id)
      .maybeSingle();

    if (cached && cached.imdb_rating) {
      return {
        ...movie,
        imdbRating: String(cached.imdb_rating),
      };
    }

    // 2. Fetch from external sources if not cached
    const imdbId = cached?.imdb_id || (await tmdbFetch<{ imdb_id?: string | null }>(`/movie/${movie.id}/external_ids`)).imdb_id;
    
    if (imdbId) {
      const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=fc1fef96&i=${imdbId}`);
      if (omdbRes.ok) {
        const omdbData = (await omdbRes.json()) as { Response?: string; imdbRating?: string };
        if (omdbData.Response !== "False" && omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
          const ratingNum = Number(omdbData.imdbRating) || 0;
          
          // Save to local catalog.movies cache
          await supabase
            .schema("catalog")
            .from("movies")
            .upsert({
              id: movie.id,
              title: movie.title,
              year: movie.year,
              imdb_id: imdbId,
              imdb_rating: ratingNum,
              vote_average: movie.voteAverage || null,
              poster_url: movie.posterUrl || null,
            }, { onConflict: "id" });

          return {
            ...movie,
            imdbRating: omdbData.imdbRating,
          };
        }
      }
    }
  } catch (err) {
    console.error(`Failed to fetch IMDb rating for movie ${movie.id}:`, err);
  }
  return movie;
}

async function generateSuggestions(userId: string, todayStr: string, forceRandom: boolean = false): Promise<GetDailySuggestionsResponse> {
  // Load user saved films, ignored list, popular list, and top-rated list
  const [savedFilmsRes, ignoredRes, popularRes, topRatedRes] = await Promise.all([
    supabase.schema("film_graph").from("user_films").select("movie_id, title, year, status, poster_url, vote_average").eq("user_id", userId),
    supabase.schema("film_graph").from("user_ignored").select("movie_id").eq("user_id", userId),
    fetchTrendingAndPopular(1),
    fetchTopRated(1),
  ]);

  const savedList = savedFilmsRes.data || [];
  const ignoredIds = (ignoredRes.data || []).map((i) => i.movie_id);

  // Candidates definitions
  // 1. Want/Saved Candidates
  const wantCandidates = savedList.filter(
    (f) => f.status === "want" && !ignoredIds.includes(f.movie_id)
  );

  // 2. Popular Candidates
  const popularCandidates = (popularRes.movies || []).filter((m) => {
    const mId = String(m.id);
    const isSaved = savedList.some((f) => f.movie_id === mId);
    const isIgnored = ignoredIds.includes(mId);
    const isLowQuality = (m.voteAverage || 0) < 5.5 || (m.voteCount || 0) < 50;
    return !isSaved && !isIgnored && !isLowQuality;
  });

  // 3. Top Rated / High IMDb Candidates
  const topRatedCandidates = (topRatedRes.movies || []).filter((m) => {
    const mId = String(m.id);
    const isSaved = savedList.some((f) => f.movie_id === mId);
    const isIgnored = ignoredIds.includes(mId);
    const isLowQuality = (m.voteAverage || 0) < 6.5 || (m.voteCount || 0) < 100;
    return !isSaved && !isIgnored && !isLowQuality;
  });

  const selected: any[] = [];
  const selectedIds = new Set<string>();

  const getDeterministicSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };
  const todaySeed = forceRandom
    ? Math.floor(Math.random() * 1000000)
    : getDeterministicSeed(userId + todayStr);

  // 1. Slot 1 Selection: Saved Movie first, then (Popular AND Top Rated) intersection, then Popular fallback
  let slot1Movie: any = null;
  if (wantCandidates.length > 0) {
    const chosen = wantCandidates[todaySeed % wantCandidates.length];
    slot1Movie = {
      id: String(chosen.movie_id),
      title: chosen.title,
      year: chosen.year,
      voteAverage: chosen.vote_average,
      posterUrl: chosen.poster_url,
      isSaved: true,
      badgeText: "Listemden",
    };
  } else {
    // Check intersection of popular and top-rated
    const intersection = popularCandidates.filter(p => topRatedCandidates.some(t => String(t.id) === String(p.id)));
    if (intersection.length > 0) {
      const chosen = intersection[todaySeed % intersection.length];
      slot1Movie = {
        id: String(chosen.id),
        title: chosen.title,
        year: chosen.year,
        voteAverage: chosen.voteAverage,
        posterUrl: chosen.posterUrl,
        isSaved: false,
        badgeText: "Popüler & Yüksek Puan",
      };
    } else if (popularCandidates.length > 0) {
      const chosen = popularCandidates[todaySeed % popularCandidates.length];
      slot1Movie = {
        id: String(chosen.id),
        title: chosen.title,
        year: chosen.year,
        voteAverage: chosen.voteAverage,
        posterUrl: chosen.posterUrl,
        isSaved: false,
        badgeText: "Popüler Film",
      };
    }
  }

  if (slot1Movie) {
    selected.push(slot1Movie);
    selectedIds.add(String(slot1Movie.id));
  }

  // 2. Slot 2 Selection: Popular candidates
  const remainingPopular = popularCandidates.filter(c => !selectedIds.has(String(c.id)));
  if (remainingPopular.length > 0) {
    const chosen = remainingPopular[todaySeed % remainingPopular.length];
    selected.push({
      id: String(chosen.id),
      title: chosen.title,
      year: chosen.year,
      voteAverage: chosen.voteAverage,
      posterUrl: chosen.posterUrl,
      isSaved: false,
      badgeText: "Popüler Film",
    });
    selectedIds.add(String(chosen.id));
  }

  // 3. Slot 3 Selection: High IMDb / Top Rated candidates
  const remainingTopRated = topRatedCandidates.filter(c => !selectedIds.has(String(c.id)));
  if (remainingTopRated.length > 0) {
    const chosen = remainingTopRated[todaySeed % remainingTopRated.length];
    selected.push({
      id: String(chosen.id),
      title: chosen.title,
      year: chosen.year,
      voteAverage: chosen.voteAverage,
      posterUrl: chosen.posterUrl,
      isSaved: false,
      badgeText: "Yüksek Puan",
    });
    selectedIds.add(String(chosen.id));
  }

  // Fallbacks if we couldn't fill 3 slots (e.g., user had no saved movies)
  const allAvailableCandidates = [
    ...popularCandidates.map(c => ({ ...c, badgeText: "Popüler Film" })),
    ...topRatedCandidates.map(c => ({ ...c, badgeText: "Yüksek Puan" }))
  ].filter(c => !selectedIds.has(String(c.id)));

  let fallbackIndex = 0;
  while (selected.length < 3 && allAvailableCandidates.length > fallbackIndex) {
    const candidate = allAvailableCandidates[(todaySeed + fallbackIndex) % allAvailableCandidates.length];
    if (!selectedIds.has(String(candidate.id))) {
      selected.push({
        id: String(candidate.id),
        title: candidate.title,
        year: candidate.year,
        voteAverage: candidate.voteAverage,
        posterUrl: candidate.posterUrl,
        isSaved: false,
        badgeText: candidate.badgeText,
      });
      selectedIds.add(String(candidate.id));
    }
    fallbackIndex++;
  }

  const [enrichedM1, enrichedM2, enrichedM3] = await Promise.all([
    enrichWithImdbRating(selected[0]),
    enrichWithImdbRating(selected[1]),
    enrichWithImdbRating(selected[2]),
  ]);

  const movie1 = enrichedM1;
  const movie2 = enrichedM2;
  const movie3 = enrichedM3;

  // Save to daily suggestion table
  if (movie1 || movie2 || movie3) {
    await supabase
      .schema("film_graph")
      .from("daily_suggestions")
      .upsert({
        user_id: userId,
        suggestion_date: todayStr,
        movie_1: movie1,
        movie_2: movie2,
        movie_3: movie3,
      }, {
        onConflict: "user_id,suggestion_date"
      });
  }

  return { movie1, movie2, movie3 };
}

export const getDailySuggestions = api(
  { expose: true, method: "GET", path: "/film-graph/daily-suggestions/:userId" },
  async ({ userId }: { userId: string }): Promise<GetDailySuggestionsResponse> => {
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if suggestions for today already exist
    const { data: suggestionData, error: suggestionError } = await supabase
      .schema("film_graph")
      .from("daily_suggestions")
      .select("movie_1, movie_2, movie_3")
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
      const m3 = suggestionData.movie_3;

      // If either suggested movie is now watched, delete suggestion so it regenerates
      if (
        (m1 && watchedIds.has(String(m1.id))) ||
        (m2 && watchedIds.has(String(m2.id))) ||
        (m3 && watchedIds.has(String(m3.id)))
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
          movie3: m3 ? { ...m3, isSaved: savedIds.has(String(m3.id)) } : null,
        };
      }
    }

    // Otherwise, generate suggestions:
    return await generateSuggestions(userId, todayStr, false);
  }
);
