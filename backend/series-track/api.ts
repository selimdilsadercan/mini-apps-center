import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const tmdbApiKey = secret("TmdbApiKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== CACHE ====================

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);  
    return null;
  }
  return entry.data;
}

function setToCache<T>(key: string, data: T) {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  });
}

// ==================== TYPES ====================

export type SeriesStatus = 'watching' | 'plan_to_watch' | 'completed' | 'dropped';

export interface UserSeries {
  id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: SeriesStatus;
  watch_url_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  season_number: number;
  episode_number: number;
  watched_at: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserSeriesRequest {
  userId: string;
}

interface GetUserSeriesResponse {
  series: UserSeries[];
}

interface AddUserSeriesRequest {
  userId: string;
  tmdbId: number;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  status?: SeriesStatus;
  watchUrlSlug?: string;
}

interface UpdateUserSeriesStatusRequest {
  userId: string;
  seriesId: string;
  status: SeriesStatus;
}

interface GetUserProgressRequest {
  userId: string;
  seriesId: string;
}

interface GetUserProgressResponse {
  progress: UserProgress[];
}

interface ToggleEpisodeWatchedRequest {
  userId: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
}

interface ToggleEpisodeWatchedResponse {
  isWatched: boolean;
}

interface MarkEpisodesWatchedRequest {
  userId: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumbers: number[];
}

interface MarkAllEpisodesWatchedRequest {
  userId: string;
  seriesId: string;
  seasonsData: Array<{ season: number; count: number }>;
}

interface SearchSeriesRequest {
  query: string;
}

interface TmdbSearchResponse {
  results: Array<{
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    overview: string;
    vote_average: number;
  }>;
}

interface GetSeriesDetailsRequest {
  tmdbId: number;
}

interface TmdbSeriesDetails {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  vote_average: number;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: Array<{
    season_number: number;
    episode_count: number;
    name: string;
    poster_path: string | null;
  }>;
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  } | null;
  last_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  } | null;
}

interface GetSeasonDetailsRequest {
  tmdbId: number;
  seasonNumber: number;
}

interface TmdbSeasonDetails {
  id: number;
  season_number: number;
  episodes: Array<{
    id: number;
    episode_number: number;
    name: string;
    overview: string;
    still_path: string | null;
    vote_average: number;
    air_date: string;
  }>;
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının listesindeki tüm dizileri getirir
 */
export const getUserSeries = api(
  { expose: true, method: "GET", path: "/series-track/series/:userId" },
  async ({ userId }: GetUserSeriesRequest): Promise<GetUserSeriesResponse> => {
    const { data, error } = await supabase.schema("series_track").rpc("get_user_series", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getUserSeries error:", error);
      throw APIError.internal(`Failed to load user series: ${error.message}`);
    }

    return { series: data || [] };
  }
);

/**
 * Kullanıcının listesine yeni dizi ekler
 */
export const addUserSeries = api(
  { expose: true, method: "POST", path: "/series-track/series/add" },
  async (req: AddUserSeriesRequest): Promise<{ series: UserSeries | null }> => {
    const { data, error } = await supabase.schema("series_track").rpc("add_user_series", {
      clerk_id_param: req.userId,
      tmdb_id_param: req.tmdbId,
      title_param: req.title,
      poster_path_param: req.posterPath || null,
      backdrop_path_param: req.backdropPath || null,
      status_param: req.status || 'watching',
      watch_url_slug_param: req.watchUrlSlug || null,
    });

    if (error) {
      console.error("addUserSeries error:", error);
      throw APIError.internal(`Failed to add series: ${error.message}`);
    }

    return { series: (data as UserSeries) || null };
  }
);

/**
 * Dizinin izleme durumunu günceller
 */
export const updateUserSeriesStatus = api(
  { expose: true, method: "PUT", path: "/series-track/series/status" },
  async (req: UpdateUserSeriesStatusRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("series_track").rpc("update_user_series_status", {
      clerk_id_param: req.userId,
      series_id_param: req.seriesId,
      status_param: req.status,
    });

    if (error) {
      console.error("updateUserSeriesStatus error:", error);
      throw APIError.internal(`Failed to update status: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Diziyi listeden siler
 */
export const deleteUserSeries = api(
  { expose: true, method: "DELETE", path: "/series-track/series/:userId/:seriesId" },
  async ({ userId, seriesId }: { userId: string, seriesId: string }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("series_track").rpc("delete_user_series", {
      clerk_id_param: userId,
      series_id_param: seriesId,
    });

    if (error) {
      console.error("deleteUserSeries error:", error);
      throw APIError.internal(`Failed to delete series: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Kullanıcının bir dizi için izleme ilerlemesini getirir
 */
export const getUserProgress = api(
  { expose: true, method: "GET", path: "/series-track/progress/:userId/:seriesId" },
  async ({ userId, seriesId }: GetUserProgressRequest): Promise<GetUserProgressResponse> => {
    const { data, error } = await supabase.schema("series_track").rpc("get_user_progress", {
      clerk_id_param: userId,
      series_id_param: seriesId,
    });

    if (error) {
      console.error("getUserProgress error:", error);
      throw APIError.internal(`Failed to load progress: ${error.message}`);
    }

    return { progress: data || [] };
  }
);

/**
 * Bir bölümün izlenme durumunu değiştirir (toggle)
 */
export const toggleEpisodeWatched = api(
  { expose: true, method: "POST", path: "/series-track/progress/toggle" },
  async (req: ToggleEpisodeWatchedRequest): Promise<ToggleEpisodeWatchedResponse> => {
    const { data, error } = await supabase.schema("series_track").rpc("toggle_episode_watched", {
      clerk_id_param: req.userId,
      series_id_param: req.seriesId,
      season_number_param: req.seasonNumber,
      episode_number_param: req.episodeNumber,
    });

    if (error) {
      console.error("toggleEpisodeWatched error:", error);
      throw APIError.internal(`Failed to toggle episode: ${error.message}`);
    }

    return { isWatched: !!data };
  }
);

/**
 * Birden fazla bölümü izlendi olarak işaretler
 */
export const markEpisodesWatched = api(
  { expose: true, method: "POST", path: "/series-track/progress/mark-watched" },
  async (req: MarkEpisodesWatchedRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("series_track").rpc("mark_episodes_watched", {
      clerk_id_param: req.userId,
      series_id_param: req.seriesId,
      season_number_param: req.seasonNumber,
      episode_numbers_param: req.episodeNumbers,
    });

    if (error) {
      console.error("markEpisodesWatched error:", error);
      throw APIError.internal(`Failed to mark episodes: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Tüm diziyi izlendi olarak işaretler
 */
export const markAllEpisodesWatched = api(
  { expose: true, method: "POST", path: "/series-track/progress/mark-all-watched" },
  async (req: MarkAllEpisodesWatchedRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("series_track").rpc("mark_all_episodes_watched", {
      clerk_id_param: req.userId,
      series_id_param: req.seriesId,
      seasons_data_param: req.seasonsData,
    });

    if (error) {
      console.error("markAllEpisodesWatched error:", error);
      throw APIError.internal(`Failed to mark all episodes: ${error.message}`);
    }

    return { success: !!data };
  }
);

// ==================== TMDB PROXY ENDPOINTS ====================

/**
 * TMDB üzerinden dizi arar
 */
export const searchSeries = api(
  { expose: true, method: "GET", path: "/series-track/search" },
  async ({ query }: SearchSeriesRequest): Promise<TmdbSearchResponse> => {
    const cacheKey = `search:${query}`;
    const cached = getFromCache<TmdbSearchResponse>(cacheKey);
    if (cached) return cached;

    const key = tmdbApiKey();
    if (!key) {
      console.error("TMDB API Key is missing!");
      throw APIError.internal("TMDB API Key is not configured");
    }

    const url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(query)}&language=tr-TR`;
    
    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`TMDB search failed with status ${response.status}:`, errorBody);
        throw APIError.internal(`TMDB search failed: ${response.status}`);
      }

      const data = await response.json();
      setToCache(cacheKey, data);
      return data as TmdbSearchResponse;
    } catch (err: any) {
      console.error("TMDB fetch error:", err);
      throw APIError.internal(`TMDB fetch error: ${err.message}`);
    }
  }
);

/**
 * TMDB üzerinden dizi detaylarını getirir
 */
export const getSeriesDetails = api(
  { expose: true, method: "GET", path: "/series-track/details/:tmdbId" },
  async ({ tmdbId }: GetSeriesDetailsRequest): Promise<TmdbSeriesDetails> => {
    const cacheKey = `details:${tmdbId}`;
    const cached = getFromCache<TmdbSeriesDetails>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbApiKey()}&language=tr-TR`
    );

    if (!response.ok) {
      throw APIError.internal("TMDB details fetch failed");
    }

    const data = await response.json();
    setToCache(cacheKey, data);
    return data as TmdbSeriesDetails;
  }
);

/**
 * TMDB üzerinden sezon detaylarını (bölümleri) getirir
 */
export const getSeasonDetails = api(
  { expose: true, method: "GET", path: "/series-track/season/:tmdbId/:seasonNumber" },
  async ({ tmdbId, seasonNumber }: GetSeasonDetailsRequest): Promise<TmdbSeasonDetails> => {
    const cacheKey = `season:${tmdbId}:${seasonNumber}`;
    const cached = getFromCache<TmdbSeasonDetails>(cacheKey);
    if (cached) return cached;

    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${tmdbApiKey()}&language=tr-TR`
    );

    if (!response.ok) {
      throw APIError.internal("TMDB season fetch failed");
    }

    const data = await response.json();
    setToCache(cacheKey, data);
    return data as TmdbSeasonDetails;
  }
);

/**
 * API Key test endpoint
 */
export const testTmdbKey = api(
  { expose: true, method: "GET", path: "/series-track/test-key" },
  async (): Promise<{ status: number, body: string, keyLength: number }> => {
    const key = tmdbApiKey();
    const url = `https://api.themoviedb.org/3/configuration?api_key=${key}`;
    const response = await fetch(url);
    const body = await response.text();
    return { 
      status: response.status, 
      body: body.substring(0, 100), 
      keyLength: key ? key.length : 0 
    };
  }
);
