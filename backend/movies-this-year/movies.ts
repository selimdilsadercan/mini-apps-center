import { api, APIError } from "encore.dev/api";
import log from "encore.dev/log";
import * as fs from "fs/promises";
import * as path from "path";

const API_KEY = "cb4898718f8913cfdfa5d7ca0f99344e";
const BASE_URL = "https://api.themoviedb.org/3";
// Encore build dizini yerine doğrudan kaynak dizinini hedefle
const DATA_PATH = path.join(process.cwd(), "movies-this-year", "data", "movies_2026.json");

// ==================== TYPES ====================

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  popularity: number;
  genre_ids: number[];
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
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          release_date: m.release_date,
          vote_average: m.vote_average,
          popularity: m.popularity,
          genre_ids: m.genre_ids,
        }));

      // Tekilleştir
      const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());

      // Tarihe göre sırala
      uniqueMovies.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());

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
  { expose: true, method: "GET", path: "/movies-this-year/discover" },
  async (): Promise<GetMoviesResponse> => {
    try {
      log.info("Reading movies from data path", { path: DATA_PATH });
      const data = await fs.readFile(DATA_PATH, "utf-8");
      const movies: Movie[] = JSON.parse(data);
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
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        release_date: m.release_date,
        vote_average: m.vote_average,
        genre_ids: m.genre_ids,
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
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        release_date: m.release_date,
        vote_average: m.vote_average,
        genre_ids: m.genre_ids,
      }));

      return { movies };
    } catch (error: any) {
      throw APIError.internal(`Failed to fetch top rated movies: ${error.message}`);
    }
  }
);
