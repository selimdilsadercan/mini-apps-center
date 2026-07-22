import { CronJob } from "encore.dev/cron";
import { supabase } from "./api";
import { resolveYouTubeSource, fetchVideoMetaFromPage, fetchVideoPublishDateFromPage } from "./youtube";
import { log } from "encore.dev/log";

// Define a cron job to automatically sync new videos from connected YouTube channels or playlists.
// Runs every 6 hours.
const _ytdbSync = new CronJob("sync-ytdb-connected-sources", {
  title: "Sync connected YouTube channels and playlists",
  every: "6h",
  endpoint: syncConnectedSources,
});

export async function syncConnectedSources(): Promise<void> {
  log.info("Starting connected YouTube sources sync...");

  const { data: seriesList, error } = await supabase
    .from("ytdb_series")
    .select("*")
    .not("source_url", "is", null)
    .neq("source_type", "manual");

  if (error) {
    log.error(`Failed to fetch connected series: ${error.message}`);
    return;
  }

  log.info(`Found ${seriesList?.length || 0} series connected to YouTube sources.`);

  for (const series of seriesList || []) {
    log.info(`Syncing series: "${series.title}" (${series.id}) from URL: ${series.source_url}`);

    try {
      const preview = await resolveYouTubeSource(series.source_url, { enrichDates: false });
      if (preview.videos.length === 0) {
        log.info(`No videos resolved for series: ${series.title}`);
        continue;
      }

      // Fetch all existing episode youtube IDs for this series to avoid queries in the loop
      const { data: existingEpisodes } = await supabase
        .from("ytdb_episodes")
        .select("youtube_id")
        .eq("series_id", series.id);

      const existingSet = new Set((existingEpisodes || []).map((ep) => ep.youtube_id));
      let importedCount = 0;

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // YouTube search/channel lists are usually returned from newest to oldest,
      // but we want to import them in chronological order so episode numbers increment correctly.
      // So let's reverse the list.
      const videosToProcess = [...preview.videos].reverse();

      for (const video of videosToProcess) {
        if (existingSet.has(video.youtubeId)) {
          continue; // Already imported
        }

        // Apply channel specific filters (Shorts + Current Month)
        if (series.source_type === "channel") {
          const meta = await fetchVideoMetaFromPage(video.youtubeId).catch(() => null);
          if (meta?.isShort) {
            log.info(`Skipping Shorts video: "${video.title}"`);
            continue;
          }

          const actualPublishedAt = video.publishedAt || meta?.publishedAt;
          if (actualPublishedAt) {
            const pubDate = new Date(actualPublishedAt);
            if (pubDate.getFullYear() !== currentYear || pubDate.getMonth() !== currentMonth) {
              log.info(`Skipping past month video: "${video.title}" (${actualPublishedAt})`);
              continue;
            }
          } else {
            log.info(`Skipping video without publish date: "${video.title}"`);
            continue;
          }
        }

        // Get the next episode number in Season 1
        const { data: latest } = await supabase
          .from("ytdb_episodes")
          .select("episode_number")
          .eq("series_id", series.id)
          .eq("season_number", 1)
          .order("episode_number", { ascending: false })
          .limit(1)
          .maybeSingle();

        const nextEpisodeNumber = (latest?.episode_number || 0) + 1;

        // Resolve thumbnail
        const thumbnailUrl =
          video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

        // Resolve publish date
        let publishedAt = video.publishedAt || null;
        if (!publishedAt) {
          publishedAt = await fetchVideoPublishDateFromPage(video.youtubeId).catch(() => null);
        }

        // Insert new episode
        const { error: insertError } = await supabase.from("ytdb_episodes").insert({
          series_id: series.id,
          title: video.title.trim(),
          episode_number: nextEpisodeNumber,
          season_number: 1,
          youtube_id: video.youtubeId,
          thumbnail_url: thumbnailUrl,
          published_at: publishedAt,
        });

        if (insertError) {
          log.error(`Failed to insert auto-synced episode: ${insertError.message}`);
        } else {
          log.info(`Auto-synced new episode: "${video.title}"`);
          existingSet.add(video.youtubeId);
          importedCount++;
        }
      }

      log.info(`Finished syncing series "${series.title}". Imported ${importedCount} new episodes.`);
    } catch (err: any) {
      log.error(`Error syncing series "${series.title}": ${err.message || err}`);
    }
  }

  log.info("Finished connected YouTube sources sync job.");
}
