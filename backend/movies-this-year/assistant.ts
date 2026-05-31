import * as fs from "fs/promises";
import * as path from "path";
import type { AppAssistantModule } from "../lib/assistant-types";

const TMDB_API_KEY = "cb4898718f8913cfdfa5d7ca0f99344e";
const TMDB_BASE = "https://api.themoviedb.org/3";
const MOVIES_DATA_PATH = path.join(
  process.cwd(),
  "movies-this-year",
  "data",
  "movies_2026.json",
);

async function fetchTmdbMovies(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB isteği başarısız: ${response.status}`);
  }
  const data = (await response.json()) as { results?: unknown[] };
  return { movies: data.results ?? [] };
}

export const moviesThisYearAssistant: AppAssistantModule = {
  appId: "movies-this-year",
  name: "Movies This Year",
  description: "Film listelerini okur (salt okunur, harici API).",
  schema: "movies_this_year",
  tools: [
    {
      name: "list_movies",
      description: "Yılın filmlerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_upcoming",
      description: "Yaklaşan filmleri listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "list_top_rated",
      description: "En yüksek puanlı filmleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_movies: async () => {
      const raw = await fs.readFile(MOVIES_DATA_PATH, "utf-8");
      return { movies: JSON.parse(raw) };
    },
    list_upcoming: async () => {
      return fetchTmdbMovies(
        `${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR`,
      );
    },
    list_top_rated: async () => {
      return fetchTmdbMovies(
        `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&language=tr-TR`,
      );
    },
  },
};
