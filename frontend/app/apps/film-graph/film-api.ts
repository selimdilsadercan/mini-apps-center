import { getEncoreApiBase } from "@/lib/api";
import { FilmCatalogItem } from "./film-data";

export type DiscoverSort = "popular" | "rating" | "year";

interface ListFilmsResponse {
  movies: FilmCatalogItem[];
  page: number;
  totalPages: number;
}

async function encoreGet<T>(path: string): Promise<T> {
  const base = getEncoreApiBase();
  const response = await fetch(`${base}${path}`);
  if (!response.ok) {
    throw new Error(`Film API failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchPopularFilms(page = 1): Promise<ListFilmsResponse> {
  return encoreGet(`/film-graph/popular?page=${page}`);
}

export async function fetchTopRatedFilms(page = 1): Promise<ListFilmsResponse> {
  return encoreGet(`/film-graph/top-rated?page=${page}`);
}

export async function searchFilms(query: string, page = 1): Promise<ListFilmsResponse> {
  const params = new URLSearchParams({
    query,
    page: String(page),
  });
  return encoreGet(`/film-graph/search?${params.toString()}`);
}

export async function fetchFilmDetails(movieId: string): Promise<FilmCatalogItem> {
  const response = await encoreGet<{ movie: FilmCatalogItem }>(
    `/film-graph/movie/${encodeURIComponent(movieId)}`,
  );
  return response.movie;
}

export function sortFilmsByYear(movies: FilmCatalogItem[]): FilmCatalogItem[] {
  return [...movies].sort((a, b) => b.year - a.year);
}
