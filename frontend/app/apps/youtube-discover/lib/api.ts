import { createBrowserClient } from "@/lib/api";
import type { ytdb } from "@/lib/client";
import type { Category, Context, Episode, Series, SeriesStatus, AttentionLevel, SourceType } from "./types";

const client = createBrowserClient();

export type YouTubeSourceType = "video" | "playlist" | "channel";

export interface YouTubeSourcePreview {
  type: YouTubeSourceType;
  youtubeId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  sourceId: string | null;
  videoCount: number;
  videos: Array<{
    youtubeId: string;
    title: string;
    author: string;
    thumbnailUrl: string;
    publishedAt?: string | null;
  }>;
}

function mapEpisode(ep: ytdb.Episode): Episode {
  return {
    id: ep.id,
    title: ep.title,
    episodeNumber: ep.episode_number,
    duration: ep.duration,
    youtubeId: ep.youtube_id,
    thumbnail: ep.thumbnail_url || undefined,
    publishedAt: ep.published_at || undefined,
  };
}

function mapSeries(row: ytdb.Series): Series {
  const episodes = row.episodes?.map(mapEpisode);
  const episodeCount = row.episode_count ?? episodes?.length ?? 0;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    creator: row.creator,
    youtubeId: row.youtube_id || "",
    category: row.category as Category,
    status: row.status as SeriesStatus,
    year: row.year,
    episodeCount,
    avgRating: 0,
    ratingCount: 0,
    gradient: row.gradient || undefined,
    emoji: row.emoji || undefined,
    contexts: (row.contexts || []) as Context[],
    attentionLevel: (row.attention_level || "light") as AttentionLevel,
    isRaw:
      row.is_raw ??
      (row.source_type !== "manual" &&
        (row.source_type === "video" ||
          row.source_type === "playlist" ||
          row.source_type === "channel")),
    sourceType: (row.source_type || "manual") as SourceType,
    sourceUrl: row.source_url || undefined,
    episodes,
  };
}

function mapSourcePreview(source: ytdb.YouTubeResolveResult): YouTubeSourcePreview {
  return {
    type: source.type,
    youtubeId: source.youtube_id,
    title: source.title,
    author: source.author,
    thumbnailUrl: source.thumbnail_url,
    sourceId: source.source_id,
    videoCount: source.video_count,
    videos: source.videos.map((v) => ({
      youtubeId: v.youtube_id,
      title: v.title,
      author: v.author,
      thumbnailUrl: v.thumbnail_url,
      publishedAt: v.published_at || null,
    })),
  };
}

export async function fetchSeries(): Promise<Series[]> {
  const res = await client.ytdb.listSeries();
  return (res.series || []).map(mapSeries);
}

export async function fetchRawSources(userId: string): Promise<Series[]> {
  const res = await client.ytdb.listRawSources(userId);
  return (res.sources || []).map(mapSeries);
}

export async function promoteSource(
  userId: string,
  id: string,
  options?: {
    category?: Category;
    contexts?: Context[];
    attentionLevel?: AttentionLevel;
    title?: string;
    creator?: string;
  }
) {
  const res = await client.ytdb.promoteSource({
    userId,
    id,
    category: options?.category,
    contexts: options?.contexts,
    attention_level: options?.attentionLevel,
    title: options?.title,
    creator: options?.creator,
  });
  return mapSeries(res.series);
}

export async function fetchSeriesById(id: string): Promise<Series | null> {
  try {
    const res = await client.ytdb.getSeriesById(id);
    return mapSeries(res.series);
  } catch {
    return null;
  }
}

export async function resolveYouTubeUrl(
  userId: string,
  url: string,
  options?: { enrichDates?: boolean }
): Promise<YouTubeSourcePreview> {
  const res = await client.ytdb.resolveYouTubeUrl({
    userId,
    url,
    enrich_dates: options?.enrichDates === true,
  });
  return mapSourcePreview(res.source);
}

export async function importFromUrl(
  userId: string,
  url: string,
  options?: {
    category?: Category;
    contexts?: Context[];
    attentionLevel?: AttentionLevel;
    status?: SeriesStatus;
    title?: string;
    creator?: string;
    seriesOnly?: boolean;
  }
) {
  const res = await client.ytdb.importFromUrl({
    userId,
    url,
    category: options?.category,
    contexts: options?.contexts,
    attention_level: options?.attentionLevel,
    status: options?.status,
    title: options?.title,
    creator: options?.creator,
    series_only: options?.seriesOnly,
  });
  return {
    series: mapSeries(res.series),
    importedCount: res.imported_count,
    skippedCount: res.skipped_count,
  };
}

export async function createSeriesFromUrl(
  userId: string,
  url: string,
  options?: {
    category?: Category;
    contexts?: Context[];
    attentionLevel?: AttentionLevel;
    status?: SeriesStatus;
  }
) {
  const result = await importFromUrl(userId, url, options);
  return {
    series: result.series,
    episode: result.series.episodes?.[0] || null,
  };
}

export async function upsertSeries(
  userId: string,
  data: Partial<Series> & { title: string; creator: string; category: Category }
) {
  const res = await client.ytdb.upsertSeries({
    userId,
    id: data.id,
    title: data.title,
    description: data.description,
    creator: data.creator,
    youtube_id: data.youtubeId || null,
    category: data.category,
    status: data.status,
    year: data.year,
    contexts: data.contexts,
    attention_level: data.attentionLevel,
    emoji: data.emoji || null,
    gradient: data.gradient || null,
  });
  return mapSeries(res.series);
}

export async function deleteSeries(userId: string, id: string) {
  await client.ytdb.deleteSeries({ userId, id });
}

export async function addEpisodeFromUrl(
  userId: string,
  seriesId: string,
  url: string,
  options?: { episodeNumber?: number; title?: string }
) {
  const res = await client.ytdb.addEpisodeFromUrl({
    userId,
    series_id: seriesId,
    url,
    episode_number: options?.episodeNumber,
    title: options?.title,
  });
  return mapEpisode(res.episode);
}

export async function addEpisodeFromMeta(
  userId: string,
  seriesId: string,
  data: {
    youtubeId: string;
    title: string;
    thumbnailUrl?: string;
    episodeNumber?: number;
    publishedAt?: string | null;
  }
) {
  const res = await client.ytdb.addEpisodeFromMeta({
    userId,
    series_id: seriesId,
    youtube_id: data.youtubeId,
    title: data.title,
    thumbnail_url: data.thumbnailUrl,
    episode_number: data.episodeNumber,
    published_at: data.publishedAt,
  });
  return {
    episode: res.episode ? mapEpisode(res.episode) : null,
    skipped: res.skipped,
  };
}

export async function importEpisodesFromUrl(userId: string, seriesId: string, url: string) {
  const res = await client.ytdb.importEpisodesToSeries({
    userId,
    series_id: seriesId,
    url,
  });
  return {
    importedCount: res.imported_count,
    skippedCount: res.skipped_count,
    episodes: (res.episodes || []).map(mapEpisode),
  };
}

export async function deleteEpisode(userId: string, id: string) {
  await client.ytdb.deleteEpisode({ userId, id });
}
