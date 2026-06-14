import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import * as fs from "fs/promises";
import * as path from "path";
import { createSupabaseClient } from "../lib/supabase";
import { secret } from "encore.dev/config";

const API_KEY = "cb4898718f8913cfdfa5d7ca0f99344e";
const BASE_URL = "https://api.themoviedb.org/3";
// Encore build dizini yerine doğrudan kaynak dizinini hedefle
const DATA_PATH = path.join(process.cwd(), "movies-this-year", "data", "movies_2026.json");

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  popularity: number;
  genreIds: number[];
  isFavorited?: boolean;
}

export interface GetMoviesResponse {
  movies: Movie[];
}

// ==================== API ENDPOINTS ====================

/**
 * TMDB'den verileri çeker ve yerel JSON dosyasına kaydeder (Maliyet düşürmek için)
 * POST /movies-this-year/sync
 */
export const syncMoviesThisYear = api(
  { expose: true, method: "POST", path: "/movies-this-year/sync" },
  async (): Promise<{ count: number }> => {
    const year = 2026;
    const fetchPage = async (page: number) => {
      const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${year}&sort_by=popularity.desc&language=tr-TR&region=TR&page=${page}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data: any = await response.json();
      return data.results || [];
    };

    try {
      // İlk 5 sayfayı çek (Daha kapsamlı bir takvim için)
      const pages = await Promise.all([
        fetchPage(1), fetchPage(2), fetchPage(3), fetchPage(4), fetchPage(5)
      ]);
      const allResults = pages.flat();
      
      const movies: Movie[] = allResults
        .filter((m: any) => m.release_date)
        .map((m: any) => ({
          id: m.id,
          title: m.title,
          overview: m.overview,
          posterPath: m.poster_path,
          backdropPath: m.backdrop_path,
          releaseDate: m.release_date,
          voteAverage: m.vote_average,
          popularity: m.popularity,
          genreIds: m.genre_ids,
        }));

      // Tekilleştir
      const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());

      // Tarihe göre sırala
      uniqueMovies.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());

      // JSON dosyasına yaz
      await fs.writeFile(DATA_PATH, JSON.stringify(uniqueMovies, null, 2), "utf-8");

      return { count: uniqueMovies.length };
    } catch (error: any) {
      console.error("syncMoviesThisYear error:", error);
      throw APIError.internal(`Sync failed: ${error.message}`);
    }
  }
);

export const getMoviesThisYear = api(
  { expose: true, method: "GET", path: "/movies-this-year/discover/:userId" },
  async ({ userId }: { userId: string }): Promise<GetMoviesResponse> => {
    try {
      log.info("Reading movies from data path", { path: DATA_PATH });
      const data = await fs.readFile(DATA_PATH, "utf-8");
      const movies: Movie[] = JSON.parse(data);

      // Fetch user favorites
      const { data: favorites, error } = await supabase
        .schema("movies_this_year")
        .rpc("get_favorites", { clerk_id_param: userId });

      if (!error && favorites) {
        const favoriteIds = new Set((favorites as any[]).map(f => f.movie_id));
        movies.forEach(m => {
          m.isFavorited = favoriteIds.has(m.id);
        });
      }

      return { movies };
    } catch (error: any) {
      log.error("Error reading movies JSON", { error: error.message, path: DATA_PATH });
      return { movies: [] };
    }
  }
);

/**
 * Yakında vizyona girecek filmleri getirir
 * GET /movies-this-year/upcoming
 */
export const getUpcomingMovies = api(
  { expose: true, method: "GET", path: "/movies-this-year/upcoming" },
  async (): Promise<GetMoviesResponse> => {
    const url = `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=tr-TR&region=TR`;

    try {
      const response = await fetch(url);
      const data: any = await response.json();
      const movies: Movie[] = data.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        popularity: m.popularity,
        genreIds: m.genre_ids,
      }));

      return { movies };
    } catch (error: any) {
      throw APIError.internal(`Failed to fetch upcoming movies: ${error.message}`);
    }
  }
);

/**
 * En yüksek puanlı filmleri getirir
 * GET /movies-this-year/top-rated
 */
export const getTopRatedMovies = api(
  { expose: true, method: "GET", path: "/movies-this-year/top-rated" },
  async (): Promise<GetMoviesResponse> => {
    const url = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=tr-TR`;

    try {
      const response = await fetch(url);
      const data: any = await response.json();
      const movies: Movie[] = data.results.map((m: any) => ({
        id: m.id,
        title: m.title,
        overview: m.overview,
        posterPath: m.poster_path,
        backdropPath: m.backdrop_path,
        releaseDate: m.release_date,
        voteAverage: m.vote_average,
        popularity: m.popularity,
        genreIds: m.genre_ids,
      }));

      return { movies };
    } catch (error: any) {
      throw APIError.internal(`Failed to fetch top rated movies: ${error.message}`);
    }
  }
);

/**
 * Toggles a movie in the user's favorites
 * POST /movies-this-year/favorite
 */
export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/movies-this-year/favorite" },
  async ({ userId, movieId }: { userId: string; movieId: number }): Promise<{ isFavorited: boolean }> => {
    const { data, error } = await supabase
      .schema("movies_this_year")
      .rpc("toggle_favorite", {
        clerk_id_param: userId,
        movie_id_param: movieId,
      });

    if (error) {
      console.error("toggleFavorite error:", error);
      throw APIError.internal(`Failed to toggle favorite: ${error.message}`);
    }

    return { isFavorited: data as boolean };
  }
);
