import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { fetchBigMatchesRaw, type BigMatch, type MatchSport } from "./espn";

const tmdbApiKey = secret("TmdbApiKey");
const BASE_URL = "https://api.themoviedb.org/3";
const LANG = "tr-TR";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

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
  adult?: boolean;
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

/**
 * DB'ye film catalog verisini kaydeder veya günceller (asynchronous background upsert)
 */
async function saveMoviesToDB(
  movies: FilmCatalogItem[],
  isPopular: boolean = false,
  forceOverride: boolean = false,
  isTopRated: boolean = false,
) {
  if (movies.length === 0) return;

  const ids = movies.map((m) => m.id);
  const { data: existing } = await supabase
    .schema("catalog")
    .from("movies")
    .select("id, is_popular, is_top_rated")
    .in("id", ids);

  const existingStatus = new Map<string, { popular: string; topRated: string }>();
  (existing || []).forEach((row: any) => {
    existingStatus.set(row.id, {
      popular: String(row.is_popular),
      topRated: String(row.is_top_rated || "false"),
    });
  });

  const rows = movies.map((m) => {
    const current = existingStatus.get(m.id) || { popular: "false", topRated: "false" };
    
    let popularStatus = "false";
    if (current.popular === "deleted_by_admin" && !forceOverride) {
      popularStatus = "deleted_by_admin";
    } else if (isPopular || current.popular === "true" || (current.popular === "deleted_by_admin" && forceOverride)) {
      popularStatus = "true";
    }

    let topRatedStatus = "false";
    if (current.topRated === "deleted_by_admin" && !forceOverride) {
      topRatedStatus = "deleted_by_admin";
    } else if (isTopRated || current.topRated === "true" || (current.topRated === "deleted_by_admin" && forceOverride)) {
      topRatedStatus = "true";
    }

    return {
      id: m.id,
      title: m.title,
      original_title: m.originalTitle,
      year: m.year,
      overview: m.overview,
      vote_average: m.voteAverage,
      vote_count: m.voteCount,
      popularity: m.popularity,
      poster_url: m.posterUrl || null,
      backdrop_url: m.backdropUrl || null,
      director_id: m.directorId || null,
      director_name: m.directorName || null,
      actor_ids: m.actorIds,
      cast_names: m.castNames,
      imdb_id: m.imdbId || null,
      imdb_rating: m.imdbRating || null,
      is_popular: popularStatus,
      is_top_rated: topRatedStatus,
    };
  });

  const { error } = await supabase
    .schema("catalog")
    .from("movies")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert movies to DB:", error);
  }
}

async function enrichBasicMoviesList(movies: FilmCatalogItem[]): Promise<FilmCatalogItem[]> {
  return await Promise.all(
    movies.map(async (m) => {
      try {
        const extData = await tmdbFetch<{ imdb_id?: string | null }>(`/movie/${m.id}/external_ids`);
        if (extData.imdb_id) {
          m.imdbId = extData.imdb_id;
          const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=fc1fef96&i=${extData.imdb_id}`);
          if (omdbRes.ok) {
            const omdbData = (await omdbRes.json()) as { Response?: string; imdbRating?: string };
            if (omdbData.Response !== "False" && omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
              m.imdbRating = Number(omdbData.imdbRating) || undefined;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to enrich movie ${m.id} during sync:`, err);
      }
      return m;
    })
  );
}

/**
 * TMDB'den popüler filmleri çeker, DB'ye yazar ve döner
 */
export const syncPopularFilms = async (page: number): Promise<FilmCatalogItem[]> => {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>(
    `/discover/movie?include_adult=false&include_video=false&sort_by=popularity.desc&vote_count.gte=50&language=${LANG}&page=${page}`
  );

  const safeMovies = (data.results || []).filter((movie) => {
    return (
      movie.adult !== true &&
      (movie.vote_count ?? 0) >= 50 &&
      movie.poster_path &&
      movie.release_date
    );
  });

  const basicList = safeMovies.map(mapBasicMovie);
  const enrichedList = await enrichBasicMoviesList(basicList);
  await saveMoviesToDB(enrichedList, true, false, false);
  return enrichedList;
};

export const syncTopRatedFilms = async (page: number): Promise<FilmCatalogItem[]> => {
  const data = await tmdbFetch<{ results: TmdbMovie[] }>(
    `/movie/top_rated?language=${LANG}&page=${page}`
  );

  const safeMovies = (data.results || []).filter((movie) => {
    return (
      movie.adult !== true &&
      (movie.vote_count ?? 0) >= 100 &&
      movie.poster_path &&
      movie.release_date
    );
  });

  const basicList = safeMovies.map(mapBasicMovie);
  const enrichedList = await enrichBasicMoviesList(basicList);
  await saveMoviesToDB(enrichedList, false, false, true);
  return enrichedList;
};

/**
 * Cron veya manuel tetikleme ile popüler filmleri senkronize eder
 * POST /catalog/sync-popular
 */
export const runSyncPopularFilms = api(
  { expose: true, method: "POST", path: "/catalog/sync-popular" },
  async (): Promise<{ success: boolean }> => {
    try {
      console.log("Starting catalog sync job...");
      
      // Önce veritabanındaki düşük kaliteli veya hatalı popüler/top-rated filmleri temizleyelim
      await supabase
        .schema("catalog")
        .from("movies")
        .delete()
        .or("is_popular.eq.true,is_top_rated.eq.true")
        .or("vote_count.lt.50,poster_url.is.null,year.is.null");

      await Promise.all([
        syncPopularFilms(1),
        syncPopularFilms(2),
        syncPopularFilms(3),
        syncTopRatedFilms(1),
        syncTopRatedFilms(2),
        syncTopRatedFilms(3),
      ]);

      // Ayrıca veritabanında imdb_id veya imdb_rating alanı eksik olan diğer tüm filmleri zenginleştirelim
      const { data: existingMovies } = await supabase
        .schema("catalog")
        .from("movies")
        .select("id, title, year, imdb_id, imdb_rating, vote_average, poster_url")
        .or("imdb_id.is.null,imdb_rating.is.null");

      if (existingMovies && existingMovies.length > 0) {
        console.log(`Enriching ${existingMovies.length} existing movies in database...`);
        // Batch size 10 limit concurrency
        for (let i = 0; i < existingMovies.length; i += 10) {
          const batch = existingMovies.slice(i, i + 10);
          await Promise.all(
            batch.map(async (movie) => {
              try {
                let imdbId = movie.imdb_id;
                if (!imdbId) {
                  const extData = await tmdbFetch<{ imdb_id?: string | null }>(`/movie/${movie.id}/external_ids`);
                  imdbId = extData.imdb_id || undefined;
                }
                
                let imdbRating = movie.imdb_rating;
                if (imdbId && !imdbRating) {
                  const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=fc1fef96&i=${imdbId}`);
                  if (omdbRes.ok) {
                    const omdbData = (await omdbRes.json()) as { Response?: string; imdbRating?: string };
                    if (omdbData.Response !== "False" && omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
                      imdbRating = Number(omdbData.imdbRating) || null;
                    }
                  }
                }

                if (imdbId !== movie.imdb_id || imdbRating !== movie.imdb_rating) {
                  await supabase
                    .schema("catalog")
                    .from("movies")
                    .update({
                      imdb_id: imdbId || null,
                      imdb_rating: imdbRating || null,
                    })
                    .eq("id", movie.id);
                }
              } catch (err) {
                console.error(`Failed to enrich existing movie ${movie.id}:`, err);
              }
            })
          );
        }
      }
      
      console.log("Catalog sync job completed successfully.");
      return { success: true };
    } catch (err) {
      console.error("Catalog sync job failed:", err);
      throw APIError.internal("Sync job failed");
    }
  }
);

/**
 * Popüler filmleri getirir (önce local DB'den, yoksa TMDB'den çeker)
 * GET /catalog/popular?page=1
 */
export const getPopularFilms = api(
  { expose: true, method: "GET", path: "/catalog/popular" },
  async ({ page = 1 }: { page?: number }): Promise<ListFilmsResponse> => {
    try {
      // Önce local DB'den popülerliğe göre çekelim
      const limit = 25;
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .schema("catalog")
        .from("movies")
        .select("*")
        .eq("is_popular", "true")
        .order("popularity", { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && data && data.length > 5) {
        return {
          movies: data.map((row: any) => ({
            id: row.id,
            title: row.title,
            originalTitle: row.original_title || row.title,
            year: row.year,
            overview: row.overview || "",
            voteAverage: Number(row.vote_average || 0),
            voteCount: row.vote_count || 0,
            popularity: Number(row.popularity || 0),
            posterUrl: row.poster_url || undefined,
            backdropUrl: row.backdrop_url || undefined,
            directorId: row.director_id || "",
            directorName: row.director_name || "",
            actorIds: row.actor_ids || [],
            castNames: row.cast_names || [],
            imdbId: row.imdb_id || undefined,
            imdbRating: row.imdb_rating ? Number(row.imdb_rating) : undefined,
          })),
          page,
          totalPages: 10, // basic pagination placeholder
        };
      }

      // Local DB boşsa veya az veri varsa TMDB'den çekip DB'ye yazalım
      const movies = await syncPopularFilms(page);
      return {
        movies,
        page,
        totalPages: 10,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog popular films fetch failed: ${msg}`);
    }
  }
);

/**
 * Film arar (TMDB'den arar, sonuçları local DB'de önbelleğe alır ve döner)
 * GET /catalog/search?query=inception&page=1
 */
export const searchFilms = api(
  { expose: true, method: "GET", path: "/catalog/search" },
  async ({ query, page = 1 }: { query: string; page?: number }): Promise<ListFilmsResponse> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { movies: [], page: 1, totalPages: 0 };
    }

    try {
      const data = await tmdbFetch<{ results: TmdbMovie[]; total_pages: number }>(
        `/search/movie?language=${LANG}&query=${encodeURIComponent(trimmed)}&page=${page}&include_adult=false`,
      );

      const movies = data.results.map(mapBasicMovie);
      // Arkaplanda lokal DB'ye yaz
      await saveMoviesToDB(movies);

      return {
        movies,
        page,
        totalPages: data.total_pages,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog search failed: ${msg}`);
    }
  }
);

/**
 * Tek bir filmin detaylarını getirir (Lokal DB'de varsa oradan, yoksa TMDB'den zenginleştirip çeker)
 * GET /catalog/movie/:movieId
 */
export const getFilmDetails = api(
  { expose: true, method: "GET", path: "/catalog/movie/:movieId" },
  async ({ movieId }: { movieId: string }): Promise<{ movie: FilmCatalogItem }> => {
    try {
      // Önce local DB'de var mı ve yönetmen/oyuncu bilgisi dolu mu diye bakalım
      const { data, error } = await supabase
        .schema("catalog")
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();

      if (!error && data && data.director_name) {
        return {
          movie: {
            id: data.id,
            title: data.title,
            originalTitle: data.original_title || data.title,
            year: data.year,
            overview: data.overview || "",
            voteAverage: Number(data.vote_average || 0),
            voteCount: data.vote_count || 0,
            popularity: Number(data.popularity || 0),
            posterUrl: data.poster_url || undefined,
            backdropUrl: data.backdrop_url || undefined,
            directorId: data.director_id || "",
            directorName: data.director_name || "",
            actorIds: data.actor_ids || [],
            castNames: data.cast_names || [],
            imdbId: data.imdb_id || undefined,
            imdbRating: data.imdb_rating ? Number(data.imdb_rating) : undefined,
          },
        };
      }

      // Yoksa TMDB'den detaylı çekip DB'ye kaydet
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

      // Fetch IMDb rating from OMDb API
      if (externalIds.imdb_id) {
        try {
          const omdbRes = await fetch(`https://www.omdbapi.com/?apikey=fc1fef96&i=${externalIds.imdb_id}`);
          if (omdbRes.ok) {
            const omdbData = (await omdbRes.json()) as { Response?: string; imdbRating?: string };
            if (omdbData.Response !== "False" && omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
              movie.imdbRating = Number(omdbData.imdbRating) || undefined;
            }
          }
        } catch (err) {
          console.error("OMDb API fetch error in catalog getFilmDetails:", err);
        }
      }

      await saveMoviesToDB([movie]);
      return { movie };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog movie details failed: ${msg}`);
    }
  }
);

/**
 * ESPN ve TSDB'den canlı maçları çeker ve yerel DB'ye yazar
 * POST /catalog/sync-matches
 */
export const runSyncBigMatches = api(
  { expose: true, method: "POST", path: "/catalog/sync-matches" },
  async (): Promise<{ count: number }> => {
    try {
      console.log("Starting matches sync job...");
      const matches = await fetchBigMatchesRaw();
      if (matches.length > 0) {
        const rows = matches.map((m) => ({
          id: m.id,
          sport: m.sport,
          competition: m.competition,
          competition_tr: m.competitionTr,
          competition_slug: m.competitionSlug,
          home: m.home,
          away: m.away,
          home_logo: m.homeLogo,
          away_logo: m.awayLogo,
          home_score: m.homeScore,
          away_score: m.awayScore,
          state: m.state,
          status_text: m.statusText,
          clock: m.clock,
          start_at: m.startAt,
          venue: m.venue,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
          .schema("catalog")
          .from("matches")
          .upsert(rows, { onConflict: "id" });

        if (error) {
          throw error;
        }
      }
      console.log(`Sync completed. Upserted ${matches.length} matches.`);
      return { count: matches.length };
    } catch (err) {
      console.error("runSyncBigMatches error:", err);
      throw APIError.internal("Failed to sync matches");
    }
  }
);

export interface CatalogListMatchesRequest {
  sport?: MatchSport | "all";
  liveOnly?: boolean;
}

export interface CatalogListMatchesResponse {
  matches: BigMatch[];
  fetchedAt: string;
}

/**
 * Kayıtlı maçları veritabanından getirir (Eğer veritabanı boşsa veya eski kalmışsa arkaplanda sync tetikler)
 * GET /catalog/matches
 */
export const getBigMatches = api(
  { expose: true, method: "GET", path: "/catalog/matches" },
  async ({ sport, liveOnly }: CatalogListMatchesRequest): Promise<CatalogListMatchesResponse> => {
    try {
      // Önce veritabanından çekelim
      let query = supabase.schema("catalog").from("matches").select("*");

      if (sport && sport !== "all") {
        query = query.eq("sport", sport);
      }
      if (liveOnly) {
        query = query.eq("state", "live");
      }

      // Sıralama: live -> upcoming -> finished
      const { data, error } = await query;
      if (error) throw error;

      // Sıralamayı yapalım
      const mapped: BigMatch[] = (data || []).map((row: any) => ({
        id: row.id,
        sport: row.sport as MatchSport,
        competition: row.competition,
        competitionTr: row.competition_tr,
        competitionSlug: row.competition_slug,
        home: row.home,
        away: row.away,
        homeLogo: row.home_logo,
        awayLogo: row.away_logo,
        homeScore: row.home_score,
        awayScore: row.away_score,
        state: row.state as any,
        statusText: row.status_text,
        clock: row.clock,
        startAt: row.start_at,
        venue: row.venue,
      }));

      // Sıralama helper'ı
      const rank = { live: 0, upcoming: 1, finished: 2 };
      mapped.sort((a, b) => {
        const byState = rank[a.state] - rank[b.state];
        if (byState !== 0) return byState;
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      });

      return {
        matches: mapped,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("getBigMatches error:", err);
      throw APIError.internal("Failed to load matches from catalog");
    }
  }
);

// ==================== TV SHOW / SERIES ENDPOINTS ====================

export interface TmdbSearchResponse {
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

export interface TmdbSeriesDetails {
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

export interface TmdbSeasonDetails {
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

async function tmdbFetchWithRetry<T>(path: string): Promise<T> {
  const key = tmdbApiKey();
  if (!key) {
    throw APIError.internal("TMDB API Key is not configured");
  }

  const separator = path.includes("?") ? "&" : "?";
  let url = `${BASE_URL}${path}${separator}api_key=${key}`;
  let response = await fetch(url);

  if (!response.ok && path.includes("language=tr-TR")) {
    // Fallback to English if Turkish fails
    const fallbackUrl = url.replace("language=tr-TR", "language=en-US");
    response = await fetch(fallbackUrl);
  }

  if (!response.ok) {
    throw APIError.internal(`TMDB request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

/**
 * DB'ye dizi bilgilerini kaydeder veya günceller (asynchronous background upsert)
 */
async function saveSeriesToDB(seriesList: Array<{ id: number; name: string; overview: string; first_air_date?: string; vote_average?: number; popularity?: number; poster_path?: string | null; backdrop_path?: string | null }>, isPopular: boolean = false, forceOverride: boolean = false) {
  if (seriesList.length === 0) return;

  const ids = seriesList.map((s) => String(s.id));
  const { data: existing } = await supabase
    .schema("catalog")
    .from("series")
    .select("id, is_popular")
    .in("id", ids);

  const existingStatus = new Map<string, string>();
  (existing || []).forEach((row: any) => {
    existingStatus.set(row.id, String(row.is_popular));
  });

  const rows = seriesList.map((s) => {
    const current = existingStatus.get(String(s.id)) || "false";
    let status = "false";
    if (current === "deleted_by_admin" && !forceOverride) {
      status = "deleted_by_admin";
    } else if (isPopular || current === "true" || (current === "deleted_by_admin" && forceOverride)) {
      status = "true";
    }

    return {
      id: String(s.id),
      name: s.name,
      overview: s.overview || "",
      first_air_date: s.first_air_date || null,
      vote_average: s.vote_average || 0,
      popularity: s.popularity || 0,
      poster_path: s.poster_path || null,
      backdrop_path: s.backdrop_path || null,
      genres: [],
      is_popular: status,
    };
  });

  const { error } = await supabase
    .schema("catalog")
    .from("series")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert series to DB:", error);
  }
}

async function saveSeasonsToDB(seriesId: number, seasons: Array<{ season_number: number; episode_count: number; name: string; poster_path: string | null }>) {
  if (seasons.length === 0) return;
  const rows = seasons.map((s) => ({
    id: `${seriesId}:${s.season_number}`,
    series_id: String(seriesId),
    season_number: s.season_number,
    name: s.name,
    episode_count: s.episode_count,
    poster_path: s.poster_path || null,
  }));

  const { error } = await supabase
    .schema("catalog")
    .from("seasons")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert seasons to DB:", error);
  }
}

async function saveEpisodesToDB(seriesId: number, seasonNumber: number, episodes: Array<{ id: number; episode_number: number; name: string; overview: string; still_path: string | null; vote_average: number; air_date: string }>) {
  if (episodes.length === 0) return;
  const rows = episodes.map((e) => ({
    id: `${seriesId}:${seasonNumber}:${e.episode_number}`,
    series_id: String(seriesId),
    season_number: seasonNumber,
    episode_number: e.episode_number,
    name: e.name,
    overview: e.overview || "",
    still_path: e.still_path || null,
    vote_average: e.vote_average || 0,
    air_date: e.air_date || null,
  }));

  const { error } = await supabase
    .schema("catalog")
    .from("episodes")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to upsert episodes to DB:", error);
  }
}

/**
 * TV Dizisi arar (TMDB'den arar, sonuçları local DB'de önbelleğe alır ve döner)
 * GET /catalog/series/search?query=breaking
 */
export const searchSeries = api(
  { expose: true, method: "GET", path: "/catalog/series/search" },
  async ({ query }: { query: string }): Promise<TmdbSearchResponse> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { results: [] };
    }

    try {
      const data = await tmdbFetchWithRetry<{ results: any[] }>(
        `/search/tv?query=${encodeURIComponent(trimmed)}&language=${LANG}`
      );

      // DB'ye arka planda kaydet
      await saveSeriesToDB(data.results);

      return data as TmdbSearchResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog search series failed: ${msg}`);
    }
  }
);

/**
 * Dizi detaylarını getirir (TMDB'den çeker, local DB'ye yazar)
 * GET /catalog/series/details/:tmdbId
 */
export const getSeriesDetails = api(
  { expose: true, method: "GET", path: "/catalog/series/details/:tmdbId" },
  async ({ tmdbId }: { tmdbId: number }): Promise<TmdbSeriesDetails> => {
    try {
      const data = await tmdbFetchWithRetry<any>(
        `/tv/${tmdbId}?language=${LANG}`
      );

      // DB'ye arka planda kaydet/güncelle
      await saveSeriesToDB([data]);
      if (data.seasons) {
        await saveSeasonsToDB(tmdbId, data.seasons);
      }

      return data as TmdbSeriesDetails;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog get series details failed: ${msg}`);
    }
  }
);

/**
 * Dizi sezon detaylarını getirir (bölümleri)
 * GET /catalog/series/season/:tmdbId/:seasonNumber
 */
export const getSeasonDetails = api(
  { expose: true, method: "GET", path: "/catalog/series/season/:tmdbId/:seasonNumber" },
  async ({ tmdbId, seasonNumber }: { tmdbId: number; seasonNumber: number }): Promise<TmdbSeasonDetails> => {
    try {
      const data = await tmdbFetchWithRetry<TmdbSeasonDetails>(
        `/tv/${tmdbId}/season/${seasonNumber}?language=${LANG}`
      );

      if (data.episodes) {
        await saveEpisodesToDB(tmdbId, seasonNumber, data.episodes);
      }

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Catalog get season details failed: ${msg}`);
    }
  }
);

export interface AdminCatalogResponse {
  movies: any[];
  series: any[];
  matches: any[];
}

/**
 * Admin paneli için yerel katalog verilerini listeler (Son 100 kayıt)
 * GET /catalog/admin/data
 */
export const getAdminCatalog = api(
  { expose: true, method: "GET", path: "/catalog/admin/data" },
  async (): Promise<AdminCatalogResponse> => {
    try {
      const [moviesRes, seriesRes, matchesRes] = await Promise.all([
        supabase.schema("catalog").from("movies").select("*").or("is_popular.eq.true,is_top_rated.eq.true").order("popularity", { ascending: false }).limit(500),
        supabase.schema("catalog").from("series").select("*").order("popularity", { ascending: false }).order("id", { ascending: true }).limit(300),
        supabase.schema("catalog").from("matches").select("*").order("start_at", { ascending: false }).order("id", { ascending: true }).limit(100),
      ]);

      if (moviesRes.error) throw moviesRes.error;
      if (seriesRes.error) throw seriesRes.error;
      if (matchesRes.error) throw matchesRes.error;

      return {
        movies: moviesRes.data || [],
        series: seriesRes.data || [],
        matches: matchesRes.data || [],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Failed to get admin catalog: ${msg}`);
    }
  }
);

/**
 * Katalogdan bir filmi siler
 * DELETE /catalog/movie/:movieId
 */
export const deleteCatalogMovie = api(
  { expose: true, method: "DELETE", path: "/catalog/movie/:movieId" },
  async ({ movieId }: { movieId: string }): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .schema("catalog")
        .from("movies")
        .update({ is_popular: "deleted_by_admin" })
        .eq("id", movieId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Failed to delete catalog movie: ${msg}`);
    }
  }
);

/**
 * Bir filmi TMDB'den çekip yüksek popülerlikle yerel kataloğa ekler/öne çıkarır
 * POST /catalog/movie/promote
 */
export const promoteMovieToPopular = api(
  { expose: true, method: "POST", path: "/catalog/movie/promote" },
  async ({ movieId, popularity = 1000.0 }: { movieId: string; popularity?: number }): Promise<{ success: boolean }> => {
    try {
      // TMDB'den detaylı çek
      const [details, creditsData, externalIds] = await Promise.all([
        tmdbFetch<TmdbMovie>(`/movie/${movieId}?language=${LANG}`),
        tmdbFetch<TmdbCredits>(`/movie/${movieId}/credits?language=${LANG}`),
        tmdbFetch<{ imdb_id?: string | null }>(`/movie/${movieId}/external_ids`),
      ]);

      if (details.adult) {
        throw APIError.invalidArgument("Adult content is not allowed in popular list");
      }

      const movie = mapMovieWithCredits(
        details,
        creditsData,
        externalIds.imdb_id || undefined,
      );

      // Popülerlik skorunu el ile yüksek set et ki üst sırada çıksın
      movie.popularity = popularity;

      await saveMoviesToDB([movie], true);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      throw APIError.internal(`Failed to promote movie to popular: ${msg}`);
    }
  }
);
