export function episodeThumbnailUrl(ep: { youtubeId: string; thumbnail?: string }) {
  return ep.thumbnail || `https://img.youtube.com/vi/${ep.youtubeId}/hqdefault.jpg`;
}

export function formatEpisodeDate(publishedAt?: string) {
  if (!publishedAt) return null;
  return new Date(publishedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function sortEpisodesByDate<
  T extends { episodeNumber: number; publishedAt?: string },
>(episodes: T[]): T[] {
  return [...episodes].sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
    }
    if (a.publishedAt) return -1;
    if (b.publishedAt) return 1;
    return a.episodeNumber - b.episodeNumber;
  });
}

/** @deprecated use sortEpisodesByDate */
export const sortEpisodesChronologically = sortEpisodesByDate;
