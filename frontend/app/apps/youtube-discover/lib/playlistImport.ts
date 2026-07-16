import {
  addEpisodeFromMeta,
  importFromUrl,
  resolveYouTubeUrl,
  type YouTubeSourcePreview,
} from "./api";

export type PlaylistImportPhase =
  | "resolving"
  | "creating"
  | "importing"
  | "done"
  | "error";

export type PlaylistImportJob = {
  seriesId: string;
  seriesTitle: string;
  total: number;
  done: number;
  skipped: number;
  currentTitle?: string;
  phase: PlaylistImportPhase;
  error?: string;
};

type ImportOptions = {
  userId: string;
  url: string;
  onUpdate: (job: Partial<PlaylistImportJob>) => void;
  onSeriesCreated?: (seriesId: string) => Promise<void>;
  onEpisodeAdded?: (seriesId: string) => Promise<void>;
  category?: "talk-show";
  contexts?: ("yemek")[];
};

export async function importPlaylistProgressively(
  userId: string,
  seriesId: string,
  videos: YouTubeSourcePreview["videos"],
  onUpdate: (job: Partial<PlaylistImportJob>) => void,
  startEpisodeNumber = 1,
  seriesTitle = "",
  options?: { onEpisodeAdded?: (seriesId: string) => Promise<void> }
) {
  let done = 0;
  let skipped = 0;
  let episodeNumber = startEpisodeNumber;

  onUpdate({
    seriesId,
    seriesTitle,
    total: videos.length,
    done: 0,
    skipped: 0,
    phase: "importing",
  });

  for (const video of videos) {
    onUpdate({
      currentTitle: video.title,
      done,
      skipped,
    });

    try {
      const result = await addEpisodeFromMeta(userId, seriesId, {
        youtubeId: video.youtubeId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        episodeNumber,
        publishedAt: video.publishedAt,
      });

      if (result.skipped) {
        skipped++;
      } else {
        done++;
        episodeNumber++;
        await options?.onEpisodeAdded?.(seriesId);
      }
    } catch (err: any) {
      onUpdate({
        phase: "error",
        error: err?.message || "Bölüm eklenemedi",
      });
      throw err;
    }
  }

  onUpdate({
    done,
    skipped,
    phase: "done",
    currentTitle: undefined,
  });

  return { done, skipped };
}

export async function createAndImportPlaylist({
  userId,
  url,
  onUpdate,
  onSeriesCreated,
  onEpisodeAdded,
  category = "talk-show",
  contexts = ["yemek"],
}: ImportOptions) {
  onUpdate({
    seriesId: "",
    seriesTitle: "",
    total: 0,
    done: 0,
    skipped: 0,
    phase: "resolving",
  });

  const preview = await resolveYouTubeUrl(userId, url, { enrichDates: true });

  if (preview.videos.length <= 1) {
    onUpdate({ phase: "creating", seriesTitle: preview.title, total: 1 });
    const result = await importFromUrl(userId, url, { category, contexts });
    onUpdate({
      seriesId: result.series.id,
      seriesTitle: result.series.title,
      total: 1,
      done: result.importedCount,
      skipped: result.skippedCount,
      phase: "done",
    });
    return { preview, series: result.series, imported: result.importedCount, skipped: result.skippedCount };
  }

  onUpdate({
    phase: "creating",
    seriesTitle: preview.title,
    total: preview.videos.length,
  });

  const { series } = await importFromUrl(userId, url, {
    category,
    contexts,
    seriesOnly: true,
  });

  await onSeriesCreated?.(series.id);

  onUpdate({
    seriesId: series.id,
    seriesTitle: series.title,
    total: preview.videos.length,
    done: 0,
    skipped: 0,
    phase: "importing",
  });

  const { done, skipped } = await importPlaylistProgressively(
    userId,
    series.id,
    preview.videos,
    (patch) => onUpdate({ seriesId: series.id, seriesTitle: series.title, ...patch } as PlaylistImportJob),
    1,
    series.title,
    { onEpisodeAdded }
  );

  return { preview, series, imported: done, skipped };
}

export async function importPlaylistToSeries({
  userId,
  seriesId,
  url,
  seriesTitle,
  startEpisodeNumber,
  onUpdate,
  onEpisodeAdded,
}: {
  userId: string;
  seriesId: string;
  url: string;
  seriesTitle: string;
  startEpisodeNumber: number;
  onUpdate: (job: Partial<PlaylistImportJob>) => void;
  onEpisodeAdded?: (seriesId: string) => Promise<void>;
}) {
  onUpdate({
    seriesId,
    seriesTitle,
    total: 0,
    done: 0,
    skipped: 0,
    phase: "resolving",
  });

  const preview = await resolveYouTubeUrl(userId, url, { enrichDates: true });

  if (preview.videos.length <= 1) {
    const video = preview.videos[0];
    if (!video) {
      throw new Error("Video bulunamadı");
    }

    onUpdate({ phase: "importing", total: 1, currentTitle: video.title });
    const result = await addEpisodeFromMeta(userId, seriesId, {
      youtubeId: video.youtubeId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
      episodeNumber: startEpisodeNumber,
      publishedAt: video.publishedAt,
    });

    onUpdate({
      total: 1,
      done: result.skipped ? 0 : 1,
      skipped: result.skipped ? 1 : 0,
      phase: "done",
    });

    return { preview, imported: result.skipped ? 0 : 1, skipped: result.skipped ? 1 : 0 };
  }

  return importPlaylistProgressively(
    userId,
    seriesId,
    preview.videos,
    (patch) => onUpdate({ seriesId, seriesTitle, ...patch }),
    startEpisodeNumber,
    seriesTitle,
    { onEpisodeAdded }
  ).then(({ done, skipped }) => ({ preview, imported: done, skipped }));
}
