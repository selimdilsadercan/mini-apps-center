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

    const fetchWithRetry = async (url: string) => {
      let response = await fetch(url);
      if (!response.ok && url.includes("language=tr-TR")) {
        // Fallback to English if Turkish fails
        const fallbackUrl = url.replace("&language=tr-TR", "");
        response = await fetch(fallbackUrl);
      }
      return response;
    };

    const url = `https://api.themoviedb.org/3/search/tv?api_key=${key}&query=${encodeURIComponent(query)}&language=tr-TR`;
    
    try {
      const response = await fetchWithRetry(url);

      if (!response.ok) {
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

    const fetchWithRetry = async (url: string) => {
      let response = await fetch(url);
      if (!response.ok && url.includes("language=tr-TR")) {
        // Fallback to English if Turkish fails
        const fallbackUrl = url.replace("&language=tr-TR", "");
        response = await fetch(fallbackUrl);
      }
      return response;
    };

    const response = await fetchWithRetry(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${tmdbApiKey()}&language=tr-TR`
    );

    if (!response.ok) {
      throw APIError.internal(`TMDB details fetch failed: ${response.status}`);
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

    const fetchWithRetry = async (url: string) => {
      let response = await fetch(url);
      if (!response.ok && url.includes("language=tr-TR")) {
        // Fallback to English if Turkish fails
        const fallbackUrl = url.replace("&language=tr-TR", "");
        response = await fetch(fallbackUrl);
      }
      return response;
    };

    const response = await fetchWithRetry(
      `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${tmdbApiKey()}&language=tr-TR`
    );

    if (!response.ok) {
      throw APIError.internal(`TMDB season fetch failed: ${response.status}`);
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

// ==================== TV FLOW TYPES ====================

export interface TvChannel {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  color: string;
  active_program: TvProgramSummary | null;
}

export interface TvProgramSummary {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  status: string;
  start_date: string;
  schedule_type: string;
  total_episodes: number;
  tmdb_id?: number | null;
  season_number?: number | null;
}

export interface TvEpisode {
  id: string;
  episode_number: number;
  title: string;
  description: string | null;
  stream_info: string;
  release_date: string;
  is_released: boolean;
  watched: boolean;
  emoji_reaction: string | null;
}

export interface TvProgramDetails {
  id: string;
  channel_id: string;
  title: string;
  description: string;
  cover_image: string;
  status: string;
  start_date: string;
  schedule_type: string;
  total_episodes: number;
  tmdb_id?: number | null;
  season_number?: number | null;
  episodes: TvEpisode[];
}

export interface TvGetChannelsResponse {
  channels: TvChannel[];
}

export interface TvGetProgramRequest {
  programId: string;
  userId?: string;
}

export interface TvToggleWatchRequest {
  episodeId: string;
  userId: string;
  emojiReaction?: string;
}

export interface TvToggleWatchResponse {
  watched: boolean;
  emoji_reaction: string | null;
}

export interface TvGetEpisodeStatsRequest {
  episodeId: string;
}

export interface TvEpisodeStatsResponse {
  watch_count: number;
  emojis: Record<string, number>;
}

// ==================== TV FLOW ENDPOINTS ====================

/**
 * Sabit kanalları ve o kanallardaki aktif programları getirir.
 * GET /series-track/tv/channels
 */
export const getTvChannels = api(
  { expose: true, method: "GET", path: "/series-track/tv/channels" },
  async (): Promise<TvGetChannelsResponse> => {
    const { data, error } = await supabase
      .schema("series_track")
      .rpc("get_channels");

    if (error) {
      console.error("getTvChannels error:", error);
      throw APIError.internal("Kanallar yüklenemedi");
    }

    return { channels: data || [] };
  }
);

/**
 * Belirli bir programın detaylarını ve bölümlerini (kullanıcı izleme durumuyla birlikte) getirir.
 * GET /series-track/tv/program/:programId
 */
export const getTvProgramDetails = api(
  { expose: true, method: "GET", path: "/series-track/tv/program/:programId" },
  async ({ programId, userId }: TvGetProgramRequest): Promise<TvProgramDetails> => {
    const { data, error } = await supabase
      .schema("series_track")
      .rpc("get_program_details", {
        p_program_id: programId,
        p_user_id: userId || "",
      });

    if (error) {
      console.error("getTvProgramDetails error:", error);
      throw APIError.internal("Program detayları yüklenemedi");
    }

    const program = (data as any[])?.[0];
    if (!program) {
      throw APIError.notFound("Program bulunamadı");
    }

    return {
      id: program.id,
      channel_id: program.channel_id,
      title: program.title,
      description: program.description,
      cover_image: program.cover_image,
      status: program.status,
      start_date: program.start_date,
      schedule_type: program.schedule_type,
      total_episodes: program.total_episodes,
      tmdb_id: program.tmdb_id,
      season_number: program.season_number,
      episodes: program.episodes || [],
    };
  }
);

/**
 * Bölümü izlendi/izlenmedi yapar veya emoji tepkisini günceller.
 * POST /series-track/tv/episode/:episodeId/watch
 */
export const toggleTvEpisodeWatched = api(
  { expose: true, method: "POST", path: "/series-track/tv/episode/:episodeId/watch" },
  async ({ episodeId, userId, emojiReaction }: TvToggleWatchRequest): Promise<TvToggleWatchResponse> => {
    // 1. Fetch mapping details (tmdb_id, season_number, episode_number, title)
    const { data: epData, error: epError } = await supabase
      .schema("series_track")
      .from("episodes")
      .select(`
        episode_number,
        programs (
          title,
          tmdb_id,
          season_number
        )
      `)
      .eq("id", episodeId)
      .single();

    if (epError || !epData || !epData.programs) {
      console.error("Error fetching program mapping details:", epError);
      throw APIError.internal("Yayın bilgisi bulunamadı");
    }

    const program = epData.programs as any;
    const tmdbId = program.tmdb_id;
    const seasonNum = program.season_number;
    const epNum = epData.episode_number;

    if (!tmdbId || !seasonNum) {
      throw APIError.invalidArgument("Bu yayının TMDB/Sezon bilgisi bulunmuyor.");
    }

    // 2. Resolve or add user series to library
    const { data: userSeriesList } = await supabase
      .schema("series_track")
      .from("user_series")
      .select("id")
      .eq("clerk_id", userId)
      .eq("tmdb_id", tmdbId);

    let seriesId = userSeriesList?.[0]?.id;

    if (!seriesId) {
      const { data: newSeries } = await supabase
        .schema("series_track")
        .rpc("add_user_series", {
          clerk_id_param: userId,
          tmdb_id_param: tmdbId,
          title_param: program.title,
          poster_path_param: "/vQW46U1N511gZBuOC1vt0t6aPBg.jpg", // default Suits poster
          backdrop_path_param: "/gX8Gc44vYw6vGoMMTJ9QA6irnUo.jpg",
          status_param: "watching",
          watch_url_slug_param: null,
        });
      
      if (newSeries) {
        seriesId = (newSeries as any).id;
      }
    }

    if (!seriesId) {
      throw APIError.internal("Kütüphaneye dizi eklenemedi");
    }

    // 3. Call unified toggle_episode_watched RPC
    await supabase
      .schema("series_track")
      .rpc("toggle_episode_watched", {
        clerk_id_param: userId,
        series_id_param: seriesId,
        season_number_param: seasonNum,
        episode_number_param: epNum,
      });

    // 4. Verify post-toggle watch state
    const { data: watchCheck } = await supabase
      .schema("series_track")
      .from("user_progress")
      .select("id")
      .eq("series_id", seriesId)
      .eq("season_number", seasonNum)
      .eq("episode_number", epNum);

    const isWatched = (watchCheck && watchCheck.length > 0) || false;

    return {
      watched: isWatched,
      emoji_reaction: null,
    };
  }
);

/**
 * Bölüm istatistiklerini (toplam izleme, emoji tepkileri) getirir.
 * GET /series-track/tv/episode/:episodeId/stats
 */
export const getTvEpisodeStats = api(
  { expose: true, method: "GET", path: "/series-track/tv/episode/:episodeId/stats" },
  async ({ episodeId }: TvGetEpisodeStatsRequest): Promise<TvEpisodeStatsResponse> => {
    const { data, error } = await supabase
      .schema("series_track")
      .rpc("get_program_episode_stats", {
        p_episode_id: episodeId,
      });

    if (error) {
      console.error("getTvEpisodeStats error:", error);
      throw APIError.internal("İstatistikler yüklenemedi");
    }

    const stats = data as any;
    return {
      watch_count: stats.watch_count || 0,
      emojis: stats.emojis || {},
    };
  }
);

interface SetTvActiveEpisodeRequest {
  programId: string;
  episodeNumber: number;
}

/**
 * TV programının aktif (yayındaki) bölümünü değiştirir (Sadece admin için).
 * POST /series-track/tv/admin/set-episode
 */
export const setTvActiveEpisode = api(
  { expose: true, method: "POST", path: "/series-track/tv/admin/set-episode" },
  async ({ programId, episodeNumber }: SetTvActiveEpisodeRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase
      .schema("series_track")
      .rpc("set_active_program_episode", {
        p_program_id: programId,
        p_target_episode_number: episodeNumber,
      });

    if (error) {
      console.error("setTvActiveEpisode error:", error);
      throw APIError.internal("Aktif bölüm güncellenemedi");
    }

    return { success: !!data };
  }
);

interface ChangeTvProgramSeasonEpisodeRequest {
  programId: string;
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  startDate: string;
  scheduleType: string;
}

/**
 * TV programının sezonunu, başlangıç tarihini, tekrar sıklığını ve aktif bölümünü değiştirir.
 * POST /series-track/tv/admin/change-season-episode
 */
export const changeTvProgramSeasonEpisode = api(
  { expose: true, method: "POST", path: "/series-track/tv/admin/change-season-episode" },
  async (req: ChangeTvProgramSeasonEpisodeRequest): Promise<{ success: boolean }> => {
    const key = tmdbApiKey();
    const url = `https://api.themoviedb.org/3/tv/${req.tmdbId}/season/${req.seasonNumber}?api_key=${key}&language=tr-TR`;
    let response = await fetch(url);
    if (!response.ok) {
      response = await fetch(url.replace("&language=tr-TR", ""));
    }

    if (!response.ok) {
      throw APIError.internal("TMDB'den sezon bilgisi alınamadı");
    }

    const seasonData = await response.json() as any;
    const episodes = seasonData.episodes || [];

    if (episodes.length === 0) {
      throw APIError.internal("Bu sezonda bölüm bulunamadı");
    }

    // Delete old EPG episodes for this program
    const { error: deleteError } = await supabase
      .schema("series_track")
      .from("episodes")
      .delete()
      .eq("program_id", req.programId);

    if (deleteError) {
      console.error("deleteError:", deleteError);
      throw APIError.internal("Eski bölümler silinemedi");
    }

    // Insert new episodes with shifted dates relative to req.episodeNumber
    const start = new Date(req.startDate);
    const episodesToInsert = episodes.map((ep: any) => {
      const epNum = ep.episode_number;
      const releaseDate = new Date(start);
      if (req.scheduleType === "weekly") {
        releaseDate.setDate(releaseDate.getDate() + (epNum - req.episodeNumber) * 7);
      } else {
        releaseDate.setDate(releaseDate.getDate() + (epNum - req.episodeNumber));
      }

      return {
        program_id: req.programId,
        episode_number: epNum,
        title: ep.name || `Bölüm ${epNum}`,
        description: ep.overview || "",
        stream_info: "Netflix",
        release_date: releaseDate.toISOString(),
      };
    });

    const { error: insertError } = await supabase
      .schema("series_track")
      .from("episodes")
      .insert(episodesToInsert);

    if (insertError) {
      console.error("insertError:", insertError);
      throw APIError.internal("Yeni bölümler kaydedilemedi");
    }

    // Fetch TMDB series name & poster to update the title & cover
    let seriesTitle = "TV Programı";
    let posterPath = "";
    try { 
      const detailsUrl = `https://api.themoviedb.org/3/tv/${req.tmdbId}?api_key=${key}&language=tr-TR`;
      const detRes = await fetch(detailsUrl);
      if (detRes.ok) {
        const detData = await detRes.json() as any;
        seriesTitle = detData.name || seriesTitle;
        posterPath = detData.poster_path ? `https://image.tmdb.org/t/p/w500${detData.poster_path}` : "";
      }
    } catch (e) {
      console.error(e);
    }

    const { error: updateError } = await supabase
      .schema("series_track")
      .from("programs")
      .update({
        title: `${seriesTitle}`,
        season_number: req.seasonNumber,
        total_episodes: episodes.length,
        start_date: req.startDate,
        schedule_type: req.scheduleType,
        cover_image: posterPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=600',
      })
      .eq("id", req.programId);

    if (updateError) {
      console.error("updateError:", updateError);
      throw APIError.internal("Program bilgisi güncellenemedi");
    }

    return { success: true };
  }
);

export interface TvCalendarEvent {
  id: string;
  program_id: string;
  title: string;
  program_title: string;
  episode_number: number;
  season_number: number;
  release_date: string;
  stream_info: string;
  tmdb_id: number | null;
}

export interface TvCalendarEventsResponse {
  events: TvCalendarEvent[];
}

/**
 * Takvim etkinliklerini (tüm EPG bölümlerini) tarih sırasıyla getirir.
 * GET /series-track/tv/admin/calendar-events
 */
export const getTvCalendarEvents = api(
  { expose: true, method: "GET", path: "/series-track/tv/admin/calendar-events" },
  async (): Promise<TvCalendarEventsResponse> => {
    const { data, error } = await supabase
      .schema("series_track")
      .from("episodes")
      .select(`
        id,
        program_id,
        title,
        episode_number,
        release_date,
        stream_info,
        programs (
          title,
          season_number,
          tmdb_id
        )
      `)
      .order("release_date", { ascending: true });

    if (error) {
      console.error("getTvCalendarEvents error:", error);
      throw APIError.internal("Takvim etkinlikleri yüklenemedi");
    }

    const events: TvCalendarEvent[] = (data || []).map((row: any) => ({
      id: row.id,
      program_id: row.program_id,
      title: row.title,
      program_title: row.programs?.title || "TV Programı",
      episode_number: row.episode_number,
      season_number: row.programs?.season_number || 1,
      release_date: row.release_date,
      stream_info: row.stream_info,
      tmdb_id: row.programs?.tmdb_id ?? null,
    }));

    return { events };
  }
);

