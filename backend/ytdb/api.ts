import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { users } from "~encore/clients";
import { fetchYouTubeMetadata, resolveYouTubeSource, enrichVideosWithPublishDates, fetchVideoPublishDateFromPage } from "./youtube";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Episode {
  id: string;
  series_id: string;
  title: string;
  episode_number: number;
  duration: string;
  youtube_id: string;
  thumbnail_url: string | null;
  published_at: string | null;
  created_at: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  creator: string;
  youtube_id: string | null;
  category: string;
  status: string;
  year: number;
  contexts: string[];
  attention_level: string;
  emoji: string | null;
  gradient: string | null;
  source_type?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  is_raw?: boolean;
  created_at: string;
  episode_count?: number;
  episodes?: Episode[];
}

export interface YouTubeResolveResult {
  type: "video" | "playlist" | "channel";
  youtube_id: string;
  title: string;
  author: string;
  thumbnail_url: string;
  source_id: string | null;
  video_count: number;
  videos: Array<{
    youtube_id: string;
    title: string;
    author: string;
    thumbnail_url: string;
    published_at?: string | null;
  }>;
}

interface AdminRequest {
  userId: string;
}

async function requireAdmin(userId: string) {
  if (!userId?.trim()) {
    throw APIError.unauthenticated("Authentication required");
  }
  const res = await users.checkAdmin({ clerkId: userId });
  if (!res.isAdmin) {
    throw APIError.permissionDenied("Admin privilege required");
  }
}

type SeriesInsertPayload = {
  title: string;
  description: string;
  creator: string;
  youtube_id: string | null;
  category: string;
  status: string;
  year: number;
  contexts: string[];
  attention_level: string;
  source_type?: string;
  source_id?: string | null;
  source_url?: string;
  is_raw?: boolean;
};

async function insertSeriesRow(payload: SeriesInsertPayload) {
  let current: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await supabase
      .from("ytdb_series")
      .insert(current)
      .select("*")
      .single();

    if (!result.error) return result;

    const msg = result.error.message;
    if (msg.includes("is_raw") && "is_raw" in current) {
      const { is_raw: _removed, ...rest } = current;
      current = rest;
      continue;
    }
    if (
      msg.includes("source_") &&
      ("source_type" in current || "source_id" in current || "source_url" in current)
    ) {
      const { source_type: _t, source_id: _i, source_url: _u, ...rest } = current;
      current = rest;
      continue;
    }

    return result;
  }

  return supabase.from("ytdb_series").insert(current).select("*").single();
}

function isRawSeries(row: Series): boolean {
  if (row.is_raw === true) return true;
  if (row.is_raw === false) return false;
  if (!row.source_type || row.source_type === "manual") return false;
  return row.source_type === "playlist" || row.source_type === "channel" || row.source_type === "video";
}

async function querySeries(filters?: { isRaw?: boolean }) {
  const { data, error } = await supabase
    .from("ytdb_series")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const rows = (data || []) as Series[];
  if (filters?.isRaw === undefined) {
    return { data: rows, error: null };
  }

  const hasIsRawColumn = rows.some((row) => row.is_raw === true || row.is_raw === false);
  if (hasIsRawColumn) {
    return {
      data: rows.filter((row) => isRawSeries(row) === filters.isRaw),
      error: null,
    };
  }

  return {
    data: rows.filter((row) => {
      if (filters.isRaw) {
        return isRawSeries(row);
      }
      return !isRawSeries(row);
    }),
    error: null,
  };
}

type EpisodeInsertPayload = {
  series_id: string;
  title: string;
  episode_number: number;
  youtube_id: string;
  thumbnail_url?: string | null;
  published_at?: string | null;
};

async function insertEpisodeRow(payload: EpisodeInsertPayload, withSelect = false) {
  let current: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt < 2; attempt++) {
    const query = supabase.from("ytdb_episodes").insert(current);
    const result = withSelect ? await query.select("*").single() : await query;

    if (!result.error) return result;

    if (result.error.message.includes("published_at") && "published_at" in current) {
      const { published_at: _removed, ...rest } = current;
      current = rest;
      continue;
    }

    return result;
  }

  return withSelect
    ? supabase.from("ytdb_episodes").insert(current).select("*").single()
    : supabase.from("ytdb_episodes").insert(current);
}

function sortEpisodesByPublishedDate(episodes: Episode[]): Episode[] {
  return [...episodes].sort((a, b) => {
    if (a.published_at && b.published_at) {
      return new Date(a.published_at).getTime() - new Date(b.published_at).getTime();
    }
    if (a.published_at) return -1;
    if (b.published_at) return 1;
    return a.episode_number - b.episode_number;
  });
}

function episodePayloadFromVideo(
  seriesId: string,
  video: { title: string; youtubeId: string; thumbnailUrl: string; publishedAt?: string | null },
  episodeNumber: number
): EpisodeInsertPayload {
  return {
    series_id: seriesId,
    title: video.title,
    episode_number: episodeNumber,
    youtube_id: video.youtubeId,
    thumbnail_url: video.thumbnailUrl,
    published_at: video.publishedAt || null,
  };
}

async function attachEpisodeCounts(seriesList: Series[]): Promise<Series[]> {
  if (seriesList.length === 0) return [];

  const ids = seriesList.map((s) => s.id);
  const { data: episodes, error } = await supabase
    .from("ytdb_episodes")
    .select("series_id")
    .in("series_id", ids);

  if (error) {
    throw APIError.internal(`Failed to count episodes: ${error.message}`);
  }

  const counts = new Map<string, number>();
  for (const ep of episodes || []) {
    counts.set(ep.series_id, (counts.get(ep.series_id) || 0) + 1);
  }

  return seriesList.map((series) => ({
    ...series,
    episode_count: counts.get(series.id) || 0,
  }));
}

async function backfillEpisodePublishDates(episodes: Episode[]): Promise<Episode[]> {
  const missing = episodes.filter((ep) => !ep.published_at && ep.youtube_id);
  if (missing.length === 0) return episodes;

  const dateById = new Map<string, string>();

  await Promise.all(
    missing.slice(0, 20).map(async (ep) => {
      const publishedAt = await fetchVideoPublishDateFromPage(ep.youtube_id).catch(() => null);
      if (!publishedAt) return;

      dateById.set(ep.id, publishedAt);
      await supabase.from("ytdb_episodes").update({ published_at: publishedAt }).eq("id", ep.id);
    })
  );

  if (dateById.size === 0) return episodes;

  return episodes.map((ep) =>
    dateById.has(ep.id) ? { ...ep, published_at: dateById.get(ep.id)! } : ep
  );
}

// ==================== PUBLIC ====================

export const listSeries = api(
  { expose: true, method: "GET", path: "/ytdb/series" },
  async (): Promise<{ series: Series[] }> => {
    const { data, error } = await querySeries({ isRaw: false });

    if (error) {
      throw APIError.internal(`Failed to list series: ${error.message}`);
    }

    const withCounts = await attachEpisodeCounts((data || []) as Series[]);
    return { series: withCounts };
  }
);

export const listRawSources = api(
  { expose: true, method: "GET", path: "/ytdb/sources/:userId" },
  async ({ userId }: { userId: string }): Promise<{ sources: Series[] }> => {
    await requireAdmin(userId);

    const { data, error } = await querySeries({ isRaw: true });

    if (error) {
      throw APIError.internal(`Failed to list raw sources: ${error.message}`);
    }

    const withCounts = await attachEpisodeCounts((data || []) as Series[]);
    return { sources: withCounts };
  }
);

export const getSeriesById = api(
  { expose: true, method: "GET", path: "/ytdb/series/:id" },
  async ({ id }: { id: string }): Promise<{ series: Series }> => {
    const { data, error } = await supabase
      .from("ytdb_series")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw APIError.internal(`Failed to fetch series: ${error.message}`);
    }
    if (!data) {
      throw APIError.notFound("Series not found");
    }

    const { data: episodes, error: epError } = await supabase
      .from("ytdb_episodes")
      .select("*")
      .eq("series_id", id)
      .order("episode_number", { ascending: true });

    if (epError) {
      throw APIError.internal(`Failed to fetch episodes: ${epError.message}`);
    }

    const withDates = await backfillEpisodePublishDates((episodes || []) as Episode[]);

    const series = {
      ...(data as Series),
      episodes: sortEpisodesByPublishedDate(withDates),
      episode_count: withDates.length,
    };

    return { series };
  }
);

// ==================== ADMIN ====================

export const resolveYouTubeUrl = api(
  { expose: true, method: "POST", path: "/ytdb/youtube/resolve" },
  async (
    req: AdminRequest & { url: string; enrich_dates?: boolean }
  ): Promise<{ source: YouTubeResolveResult }> => {
    await requireAdmin(req.userId);

    try {
      const preview = await resolveYouTubeSource(req.url, {
        enrichDates: req.enrich_dates === true,
      });
      const first = preview.videos[0];

      return {
        source: {
          type: preview.type,
          youtube_id: first?.youtubeId || preview.sourceId || "",
          title: preview.title,
          author: preview.author,
          thumbnail_url: preview.thumbnailUrl || first?.thumbnailUrl || "",
          source_id: preview.sourceId,
          video_count: preview.videoCount,
          videos: preview.videos.map((v) => ({
            youtube_id: v.youtubeId,
            title: v.title,
            author: v.author,
            thumbnail_url: v.thumbnailUrl,
            published_at: v.publishedAt || null,
          })),
        },
      };
    } catch (err: any) {
      throw APIError.invalidArgument(err?.message || "YouTube kaynağı çözümlenemedi");
    }
  }
);

export const importFromUrl = api(
  { expose: true, method: "POST", path: "/ytdb/series/import-url" },
  async (
    req: AdminRequest & {
      url: string;
      category?: string;
      contexts?: string[];
      attention_level?: string;
      status?: string;
      title?: string;
      creator?: string;
      series_only?: boolean;
    }
  ): Promise<{ series: Series; imported_count: number; skipped_count: number }> => {
    await requireAdmin(req.userId);

    let preview;
    try {
      preview = await resolveYouTubeSource(req.url, { enrichDates: false });
    } catch (err: any) {
      throw APIError.invalidArgument(err?.message || "YouTube kaynağı çözümlenemedi");
    }

    if (preview.videos.length === 0) {
      throw APIError.invalidArgument("İçe aktarılacak video bulunamadı");
    }

    const first = preview.videos[0];
    const seriesTitle =
      preview.type === "video"
        ? req.title?.trim() || first.title
        : req.title?.trim() || preview.title;
    const seriesCreator =
      req.creator?.trim() || preview.author || first.author || "YouTube";

    const isRaw = true;

    const { data: series, error: seriesError } = await insertSeriesRow({
      title: seriesTitle,
      description: "",
      creator: seriesCreator,
      youtube_id: first.youtubeId,
      category: req.category || "talk-show",
      status: req.status || "devam-ediyor",
      year: new Date().getFullYear(),
      contexts: [],
      attention_level: req.attention_level || "light",
      source_type: preview.type,
      source_id: preview.sourceId,
      source_url: req.url.trim(),
      is_raw: isRaw,
    });

    if (seriesError || !series) {
      throw APIError.internal(`Failed to create series: ${seriesError?.message}`);
    }

    if (req.series_only) {
      return {
        series: {
          ...(series as Series),
          episode_count: 0,
          episodes: [],
        },
        imported_count: 0,
        skipped_count: 0,
      };
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < preview.videos.length; i++) {
      const [video] = await enrichVideosWithPublishDates([preview.videos[i]]);
      const { error } = await insertEpisodeRow(
        episodePayloadFromVideo(series.id, video, i + 1)
      );

      if (error) {
        if (error.code === "23505") skipped++;
        else {
          await supabase.from("ytdb_series").delete().eq("id", series.id);
          throw APIError.internal(`Failed to import episode: ${error.message}`);
        }
      } else {
        imported++;
      }
    }

    if (imported === 0) {
      await supabase.from("ytdb_series").delete().eq("id", series.id);
      throw APIError.invalidArgument("Hiçbir video içe aktarılamadı");
    }

    const { data: episodes } = await supabase
      .from("ytdb_episodes")
      .select("*")
      .eq("series_id", series.id)
      .order("episode_number", { ascending: true });

    return {
      series: {
        ...(series as Series),
        episode_count: episodes?.length || imported,
        episodes: episodes || [],
      },
      imported_count: imported,
      skipped_count: skipped,
    };
  }
);

export const upsertSeries = api(
  { expose: true, method: "POST", path: "/ytdb/series" },
  async (
    req: AdminRequest &
      Partial<Series> & {
        title: string;
        creator: string;
        category: string;
      }
  ): Promise<{ series: Series }> => {
    await requireAdmin(req.userId);

    const payload = {
      id: req.id,
      title: req.title.trim(),
      description: req.description?.trim() || "",
      creator: req.creator.trim(),
      youtube_id: req.youtube_id || null,
      category: req.category,
      status: req.status || "devam-ediyor",
      year: req.year || new Date().getFullYear(),
      contexts: req.contexts || [],
      attention_level: req.attention_level || "light",
      emoji: req.emoji || null,
      gradient: req.gradient || null,
      is_raw: false,
    };

    const { data, error } = await supabase
      .from("ytdb_series")
      .upsert(payload)
      .select("*")
      .single();

    if (error?.message?.includes("is_raw")) {
      const { is_raw, ...core } = payload;
      const fallback = await supabase.from("ytdb_series").upsert(core).select("*").single();
      if (fallback.error) {
        throw APIError.internal(`Failed to upsert series: ${fallback.error.message}`);
      }
      const [withCount] = await attachEpisodeCounts([fallback.data as Series]);
      return { series: withCount };
    }

    if (error) {
      throw APIError.internal(`Failed to upsert series: ${error.message}`);
    }

    const [withCount] = await attachEpisodeCounts([data as Series]);
    return { series: withCount };
  }
);

export const promoteSource = api(
  { expose: true, method: "POST", path: "/ytdb/sources/promote" },
  async (
    req: AdminRequest & {
      id: string;
      category?: string;
      contexts?: string[];
      attention_level?: string;
      title?: string;
      creator?: string;
    }
  ): Promise<{ series: Series }> => {
    await requireAdmin(req.userId);

    const { data: existing, error: fetchError } = await supabase
      .from("ytdb_series")
      .select("*")
      .eq("id", req.id)
      .maybeSingle();

    if (fetchError) {
      throw APIError.internal(`Failed to fetch source: ${fetchError.message}`);
    }
    if (!existing) {
      throw APIError.notFound("Kaynak bulunamadı");
    }

    const updates: Record<string, unknown> = {
      is_raw: false,
      source_type: "manual",
      category: req.category || existing.category || "talk-show",
      contexts:
        req.contexts && req.contexts.length > 0
          ? req.contexts
          : existing.contexts?.length
            ? existing.contexts
            : ["yemek"],
      attention_level: req.attention_level || existing.attention_level || "light",
      title: req.title?.trim() || existing.title,
      creator: req.creator?.trim() || existing.creator,
    };

    let current: Record<string, unknown> = { ...updates };
    let data: Series | null = null;
    let error: { message: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await supabase
        .from("ytdb_series")
        .update(current)
        .eq("id", req.id)
        .select("*")
        .single();

      if (!result.error) {
        data = result.data as Series;
        error = null;
        break;
      }

      error = result.error;
      const msg = result.error.message;
      if (msg.includes("is_raw") && "is_raw" in current) {
        const { is_raw: _removed, ...rest } = current;
        current = rest;
        continue;
      }
      if (
        msg.includes("source_") &&
        ("source_type" in current || "source_id" in current || "source_url" in current)
      ) {
        const { source_type: _t, source_id: _i, source_url: _u, ...rest } = current;
        current = rest;
        continue;
      }
      break;
    }

    if (error || !data) {
      throw APIError.internal(`Failed to promote source: ${error?.message}`);
    }

    const [withCount] = await attachEpisodeCounts([data as Series]);
    return { series: withCount };
  }
);

export const deleteSeries = api(
  { expose: true, method: "POST", path: "/ytdb/series/delete" },
  async (req: AdminRequest & { id: string }): Promise<{ success: boolean }> => {
    await requireAdmin(req.userId);

    const { error } = await supabase.from("ytdb_series").delete().eq("id", req.id);
    if (error) {
      throw APIError.internal(`Failed to delete series: ${error.message}`);
    }

    return { success: true };
  }
);

export const addEpisodeFromMeta = api(
  { expose: true, method: "POST", path: "/ytdb/episode/from-meta" },
  async (
    req: AdminRequest & {
      series_id: string;
      youtube_id: string;
      title: string;
      thumbnail_url?: string;
      episode_number?: number;
      published_at?: string | null;
    }
  ): Promise<{ episode: Episode | null; skipped: boolean }> => {
    await requireAdmin(req.userId);

    const { data: series, error: seriesError } = await supabase
      .from("ytdb_series")
      .select("id")
      .eq("id", req.series_id)
      .maybeSingle();

    if (seriesError || !series) {
      throw APIError.notFound("Series not found");
    }

    let episodeNumber = req.episode_number ?? 0;
    if (!episodeNumber) {
      const { data: latest } = await supabase
        .from("ytdb_episodes")
        .select("episode_number")
        .eq("series_id", req.series_id)
        .order("episode_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      episodeNumber = (latest?.episode_number || 0) + 1;
    }

    const youtubeId = req.youtube_id.trim();

    let publishedAt = req.published_at ?? null;
    if (publishedAt == null) {
      const [enriched] = await enrichVideosWithPublishDates([
        {
          youtubeId,
          title: req.title.trim() || "YouTube Videosu",
          author: "",
          thumbnailUrl:
            req.thumbnail_url?.trim() ||
            `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        },
      ]);
      publishedAt = enriched.publishedAt || null;
    }

    const { data, error } = await insertEpisodeRow(
      {
        series_id: req.series_id,
        title: req.title.trim() || "YouTube Videosu",
        episode_number: episodeNumber,
        youtube_id: youtubeId,
        thumbnail_url:
          req.thumbnail_url?.trim() ||
          `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        published_at: publishedAt,
      },
      true
    );

    if (error) {
      if (error.code === "23505") {
        return { episode: null, skipped: true };
      }
      throw APIError.internal(`Failed to add episode: ${error.message}`);
    }

    await supabase
      .from("ytdb_series")
      .update({ youtube_id: youtubeId })
      .eq("id", req.series_id)
      .is("youtube_id", null);

    return { episode: data as Episode, skipped: false };
  }
);

export const addEpisodeFromUrl = api(
  { expose: true, method: "POST", path: "/ytdb/episode/from-url" },
  async (
    req: AdminRequest & {
      series_id: string;
      url: string;
      episode_number?: number;
      title?: string;
    }
  ): Promise<{ episode: Episode }> => {
    await requireAdmin(req.userId);

    const { data: series, error: seriesError } = await supabase
      .from("ytdb_series")
      .select("id")
      .eq("id", req.series_id)
      .maybeSingle();

    if (seriesError || !series) {
      throw APIError.notFound("Series not found");
    }

    let meta;
    try {
      meta = await fetchYouTubeMetadata(req.url);
    } catch (err: any) {
      throw APIError.invalidArgument(err?.message || "YouTube videosu çözümlenemedi");
    }

    {
      const [enriched] = await enrichVideosWithPublishDates([meta]);
      meta = enriched;
    }

    let episodeNumber = req.episode_number ?? 0;
    if (!episodeNumber) {
      const { data: latest } = await supabase
        .from("ytdb_episodes")
        .select("episode_number")
        .eq("series_id", req.series_id)
        .order("episode_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      episodeNumber = (latest?.episode_number || 0) + 1;
    }

    const { data, error } = await insertEpisodeRow(
      {
        series_id: req.series_id,
        title: req.title?.trim() || meta.title,
        episode_number: episodeNumber,
        youtube_id: meta.youtubeId,
        thumbnail_url: meta.thumbnailUrl,
        published_at: meta.publishedAt || null,
      },
      true
    );

    if (error) {
      if (error.code === "23505") {
        throw APIError.invalidArgument("Bu video zaten seride mevcut");
      }
      throw APIError.internal(`Failed to add episode: ${error.message}`);
    }

    // Set series thumbnail from first episode if missing
    await supabase
      .from("ytdb_series")
      .update({ youtube_id: meta.youtubeId })
      .eq("id", req.series_id)
      .is("youtube_id", null);

    return { episode: data as Episode };
  }
);

export const importEpisodesToSeries = api(
  { expose: true, method: "POST", path: "/ytdb/episodes/import-url" },
  async (
    req: AdminRequest & {
      series_id: string;
      url: string;
    }
  ): Promise<{ imported_count: number; skipped_count: number; episodes: Episode[] }> => {
    await requireAdmin(req.userId);

    const { data: series, error: seriesError } = await supabase
      .from("ytdb_series")
      .select("id")
      .eq("id", req.series_id)
      .maybeSingle();

    if (seriesError || !series) {
      throw APIError.notFound("Series not found");
    }

    let preview;
    try {
      preview = await resolveYouTubeSource(req.url, { enrichDates: false });
    } catch (err: any) {
      throw APIError.invalidArgument(err?.message || "YouTube kaynağı çözümlenemedi");
    }

    const { data: latest } = await supabase
      .from("ytdb_episodes")
      .select("episode_number")
      .eq("series_id", req.series_id)
      .order("episode_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNumber = (latest?.episode_number || 0) + 1;
    let imported = 0;
    let skipped = 0;

    for (const video of preview.videos) {
      const [enriched] = await enrichVideosWithPublishDates([video]);
      const { error } = await insertEpisodeRow(
        episodePayloadFromVideo(req.series_id, enriched, nextNumber)
      );

      if (error) {
        if (error.code === "23505") skipped++;
        else throw APIError.internal(`Failed to import episode: ${error.message}`);
      } else {
        imported++;
        nextNumber++;
      }
    }

    const { data: episodes } = await supabase
      .from("ytdb_episodes")
      .select("*")
      .eq("series_id", req.series_id)
      .order("episode_number", { ascending: true });

    return {
      imported_count: imported,
      skipped_count: skipped,
      episodes: episodes || [],
    };
  }
);

export const deleteEpisode = api(
  { expose: true, method: "POST", path: "/ytdb/episode/delete" },
  async (req: AdminRequest & { id: string }): Promise<{ success: boolean }> => {
    await requireAdmin(req.userId);

    const { error } = await supabase.from("ytdb_episodes").delete().eq("id", req.id);
    if (error) {
      throw APIError.internal(`Failed to delete episode: ${error.message}`);
    }

    return { success: true };
  }
);

export const createSeriesFromUrl = api(
  { expose: true, method: "POST", path: "/ytdb/series/from-url" },
  async (
    req: AdminRequest & {
      url: string;
      category?: string;
      contexts?: string[];
      attention_level?: string;
      status?: string;
    }
  ): Promise<{ series: Series; episode: Episode }> => {
    await requireAdmin(req.userId);

    let meta;
    try {
      meta = await fetchYouTubeMetadata(req.url);
    } catch (err: any) {
      throw APIError.invalidArgument(err?.message || "YouTube videosu çözümlenemedi");
    }

    {
      const [enriched] = await enrichVideosWithPublishDates([meta]);
      meta = enriched;
    }

    const { data: series, error: seriesError } = await supabase
      .from("ytdb_series")
      .insert({
        title: meta.title,
        description: "",
        creator: meta.author || "YouTube",
        youtube_id: meta.youtubeId,
        category: req.category || "talk-show",
        status: req.status || "devam-ediyor",
        year: new Date().getFullYear(),
        contexts: req.contexts || ["yemek"],
        attention_level: req.attention_level || "light",
      })
      .select("*")
      .single();

    if (seriesError || !series) {
      throw APIError.internal(`Failed to create series: ${seriesError?.message}`);
    }

    const { data: episode, error: episodeError } = await insertEpisodeRow(
      episodePayloadFromVideo(series.id, meta, 1),
      true
    );

    if (episodeError || !episode) {
      await supabase.from("ytdb_series").delete().eq("id", series.id);
      throw APIError.internal(`Failed to create episode: ${episodeError?.message}`);
    }

    return {
      series: { ...(series as Series), episode_count: 1, episodes: [episode as Episode] },
      episode: episode as Episode,
    };
  }
);
