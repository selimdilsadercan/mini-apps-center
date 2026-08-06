import type { MarasEventOption } from "./maras-sources";

export interface MoviePlanDetail {
  cinemaSlug: string;
  cinemaName: string;
  district: string;
  movieTitle: string;
  sessionTime: string;
}

export const MOVIE_PRESET_IDS = new Set(["movie"]);

export const EVENT_PRESET_IDS: Record<string, MarasEventOption["kind"][]> = {
  concert: ["concert"],
  festival: ["campus", "concert"],
  standup: ["standup"],
};

export function isMoviePreset(presetId: string | null | undefined): boolean {
  return !!presetId && MOVIE_PRESET_IDS.has(presetId);
}

export function getEventKindsForPreset(presetId: string | null | undefined): MarasEventOption["kind"][] | null {
  if (!presetId) return null;
  return EVENT_PRESET_IDS[presetId] ?? null;
}

export function buildDetailedTitle(baseLabel: string, detail: string, movieDetail?: MoviePlanDetail | null): string {
  if (movieDetail) {
    return `${baseLabel} · ${movieDetail.movieTitle}`;
  }
  return detail.trim() ? `${baseLabel} · ${detail.trim()}` : baseLabel;
}
