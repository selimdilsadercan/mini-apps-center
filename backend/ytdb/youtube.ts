import axios from "axios";

export type YouTubeSourceType = "video" | "playlist" | "channel";

export interface YouTubeVideoMeta {
  youtubeId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  publishedAt?: string | null;
}

export interface YouTubeSourcePreview {
  type: YouTubeSourceType;
  title: string;
  author: string;
  thumbnailUrl: string;
  sourceId: string | null;
  videoCount: number;
  videos: YouTubeVideoMeta[];
}

function parseUrl(input: string): URL | null {
  try {
    return input.trim().startsWith("http")
      ? new URL(input.trim())
      : new URL(`https://${input.trim()}`);
  } catch {
    return null;
  }
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const url = parseUrl(trimmed);
  if (!url) {
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match?.[1] ?? null;
  }

  if (url.hostname.includes("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && id.length === 11 ? id : null;
  }

  if (url.hostname.includes("youtube.com")) {
    const v = url.searchParams.get("v");
    if (v && v.length === 11) return v;

    const parts = url.pathname.split("/").filter(Boolean);
    const markerIndex = parts.findIndex((part) =>
      ["embed", "shorts", "v", "live"].includes(part)
    );
    if (markerIndex >= 0 && parts[markerIndex + 1]?.length === 11) {
      return parts[markerIndex + 1];
    }
  }

  return null;
}

export function extractPlaylistId(input: string): string | null {
  const url = parseUrl(input);
  if (url?.searchParams.get("list")) {
    return url.searchParams.get("list");
  }

  const match = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function extractChannelHandle(input: string): string | null {
  const url = parseUrl(input);
  if (!url) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const atIndex = parts.findIndex((p) => p.startsWith("@"));
  if (atIndex >= 0) return parts[atIndex].replace("@", "");

  if (parts[0] === "channel" && parts[1]) return parts[1];
  return null;
}

export function detectYouTubeSourceType(input: string): YouTubeSourceType {
  const url = parseUrl(input);
  if (!url) {
    return extractYouTubeVideoId(input) ? "video" : "video";
  }

  if (url.pathname.includes("/playlist") || url.searchParams.get("list")) {
    return "playlist";
  }

  if (
    url.pathname.includes("/@") ||
    url.pathname.includes("/channel/") ||
    url.pathname.includes("/c/") ||
    url.pathname.includes("/user/")
  ) {
    return "channel";
  }

  if (extractYouTubeVideoId(input)) {
    return "video";
  }

  if (url.hostname.includes("youtube.com")) {
    return "channel";
  }

  return "video";
}

function sortVideosChronologically(videos: YouTubeVideoMeta[]): YouTubeVideoMeta[] {
  const withIndex = videos.map((video, index) => ({ video, index }));

  withIndex.sort((a, b) => {
    if (a.video.publishedAt && b.video.publishedAt) {
      const diff =
        new Date(a.video.publishedAt).getTime() - new Date(b.video.publishedAt).getTime();
      if (diff !== 0) return diff;
    }
    if (a.video.publishedAt) return -1;
    if (b.video.publishedAt) return 1;

    // YouTube playlist scrape/API is newest-first — higher index = older video.
    return b.index - a.index;
  });

  return withIndex.map(({ video }) => video);
}

export async function fetchYouTubeMetadata(input: string): Promise<YouTubeVideoMeta> {
  const youtubeId = extractYouTubeVideoId(input);
  if (!youtubeId) {
    throw new Error("Geçersiz YouTube URL veya video ID");
  }

  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  const [response, publishedAt] = await Promise.all([
    axios.get(oembedUrl, { timeout: 8000 }),
    fetchVideoPublishDateFromPage(youtubeId).catch(() => null),
  ]);

  return {
    youtubeId,
    title: response.data.title || "YouTube Videosu",
    author: response.data.author_name || "",
    thumbnailUrl:
      response.data.thumbnail_url ||
      `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    publishedAt,
  };
}

function parsePublishDateFromHtml(html: string): string | null {
  const patterns = [
    /"publishDate"\s*:\s*"([^"]+)"/,
    /"datePublished"\s*:\s*"([^"]+)"/,
    /"uploadDate"\s*:\s*"([^"]+)"/,
    /itemprop="datePublished"\s+content="([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    const parsed = new Date(match[1]);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

export async function fetchVideoPublishDateFromPage(youtubeId: string): Promise<string | null> {
  const response = await axios.get(`https://www.youtube.com/watch?v=${youtubeId}`, {
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
    },
  });

  return parsePublishDateFromHtml(String(response.data));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

const YT_PAGE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
};

function extractInnertubeConfig(html: string) {
  const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const clientVersion = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  if (!apiKey || !clientVersion) {
    throw new Error("YouTube yapılandırması okunamadı");
  }
  return { apiKey, clientVersion };
}

function parseTextRuns(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  if (typeof obj.simpleText === "string") return obj.simpleText;
  if (typeof obj.content === "string") return obj.content;
  const runs = obj.runs as Array<{ text?: string }> | undefined;
  return runs?.map((run) => run.text || "").join("") || "";
}

function extractVideoIdFromThumbnailUrl(url: string): string | null {
  const match = url.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
  return match?.[1] ?? null;
}

function parsePlaylistVideoRenderer(renderer: Record<string, unknown>): YouTubeVideoMeta | null {
  if (typeof renderer.videoId !== "string" || renderer.videoId.length !== 11) {
    return null;
  }

  const youtubeId = renderer.videoId;
  return {
    youtubeId,
    title: parseTextRuns(renderer.title) || "YouTube Videosu",
    author: parseTextRuns(renderer.shortBylineText) || "",
    thumbnailUrl:
      (
        (renderer.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)
          ?.thumbnails?.slice(-1)[0]?.url
      ) || `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
    publishedAt: null,
  };
}

function parseLockupViewModel(lockup: Record<string, unknown>): YouTubeVideoMeta | null {
  const contentType = lockup.contentType;
  if (contentType && contentType !== "LOCKUP_CONTENT_TYPE_VIDEO") {
    return null;
  }

  let youtubeId =
    typeof lockup.contentId === "string" && lockup.contentId.length === 11
      ? lockup.contentId
      : null;

  const thumbnailSources =
    (
      lockup.contentImage as
        | {
            thumbnailViewModel?: {
              image?: { sources?: Array<{ url?: string }> };
            };
          }
        | undefined
    )?.thumbnailViewModel?.image?.sources || [];

  let thumbnailUrl = thumbnailSources.at(-1)?.url || "";
  if (!youtubeId && thumbnailUrl) {
    youtubeId = extractVideoIdFromThumbnailUrl(thumbnailUrl);
  }
  if (!youtubeId) return null;

  const metadata = lockup.metadata as
    | {
        lockupMetadataViewModel?: {
          title?: unknown;
          image?: {
            decoratedAvatarViewModel?: {
              a11yLabel?: string;
            };
          };
        };
      }
    | undefined;

  const title =
    parseTextRuns(metadata?.lockupMetadataViewModel?.title) || "YouTube Videosu";
  const a11yLabel = metadata?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel?.a11yLabel;
  const author =
    (typeof a11yLabel === "string" ? a11yLabel.replace(/^Kanala git:\s*/i, "").trim() : "") ||
    "";

  if (!thumbnailUrl) {
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return { youtubeId, title, author, thumbnailUrl, publishedAt: null };
}

function collectVideosFromInnertubePayload(payload: unknown) {
  const videos: YouTubeVideoMeta[] = [];
  const seen = new Set<string>();

  const addVideo = (video: YouTubeVideoMeta | null) => {
    if (!video || seen.has(video.youtubeId)) return;
    seen.add(video.youtubeId);
    videos.push(video);
  };

  const walk = (node: unknown, depth = 0) => {
    if (!node || depth > 80) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    const renderer = obj.playlistVideoRenderer as Record<string, unknown> | undefined;
    if (renderer) {
      addVideo(parsePlaylistVideoRenderer(renderer));
    }

    const lockup = obj.lockupViewModel as Record<string, unknown> | undefined;
    if (lockup) {
      addVideo(parseLockupViewModel(lockup));
    }

    for (const value of Object.values(obj)) walk(value, depth + 1);
  };

  walk(payload);
  return videos;
}

function parseYtInitialData(html: string): unknown | null {
  const match =
    html.match(/var ytInitialData = ({.+?});<\/script>/s) ||
    html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function extractContinuationToken(payload: unknown): string | null {
  let token: string | null = null;

  const walk = (node: unknown, depth = 0) => {
    if (token || !node || depth > 80) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node !== "object") return;

    const obj = node as Record<string, unknown>;
    const next = obj.nextContinuationData as { continuation?: string } | undefined;
    if (next?.continuation) token = next.continuation;

    const endpoint = obj.continuationEndpoint as
      | { continuationCommand?: { token?: string } }
      | undefined;
    if (endpoint?.continuationCommand?.token) {
      token = endpoint.continuationCommand.token;
    }

    for (const value of Object.values(obj)) walk(value, depth + 1);
  };

  walk(payload);
  return token;
}

async function innertubeBrowse(
  apiKey: string,
  clientVersion: string,
  body: Record<string, unknown>
) {
  const response = await axios.post(
    `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`,
    {
      context: {
        client: {
          clientName: "WEB",
          clientVersion,
          hl: "tr",
          gl: "TR",
        },
      },
      ...body,
    },
    {
      timeout: 20000,
      headers: { ...YT_PAGE_HEADERS, "Content-Type": "application/json" },
    }
  );
  return response.data;
}

async function fetchPlaylistViaInnertube(playlistId: string) {
  const page = await axios.get(`https://www.youtube.com/playlist?list=${playlistId}`, {
    timeout: 20000,
    headers: YT_PAGE_HEADERS,
  });
  const html = String(page.data);
  const { apiKey, clientVersion } = extractInnertubeConfig(html);

  const videos: YouTubeVideoMeta[] = [];
  const seen = new Set<string>();
  const addVideos = (items: YouTubeVideoMeta[]) => {
    for (const video of items) {
      if (seen.has(video.youtubeId)) continue;
      seen.add(video.youtubeId);
      videos.push(video);
    }
  };

  const initialData = parseYtInitialData(html);
  if (initialData) {
    addVideos(collectVideosFromInnertubePayload(initialData));
  }

  if (videos.length === 0) {
    let payload = await innertubeBrowse(apiKey, clientVersion, {
      browseId: `VL${playlistId}`,
    });

    addVideos(collectVideosFromInnertubePayload(payload));

    let continuation = extractContinuationToken(payload);
    for (let pageNum = 0; continuation && pageNum < 25 && videos.length < 200; pageNum++) {
      payload = await innertubeBrowse(apiKey, clientVersion, { continuation });
      addVideos(collectVideosFromInnertubePayload(payload));
      continuation = extractContinuationToken(payload);
    }
  }

  if (videos.length === 0) {
    throw new Error("Oynatma listesinde video bulunamadı");
  }

  const titleMatch =
    html.match(/"playlist":{"title":"([^"]+)"/) ||
    html.match(/<title>([^<]+)<\/title>/);
  const rawTitle = titleMatch?.[1] || "YouTube Oynatma Listesi";
  const title = rawTitle.replace(/\s*-\s*YouTube\s*$/i, "").replace(/^Playlist:\s*/i, "").trim();

  return {
    title,
    author: videos[0]?.author || "",
    thumbnailUrl: videos[0]?.thumbnailUrl || "",
    videos,
  };
}

function extractChannelIdFromHtml(html: string): string | null {
  const patterns = [
    /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/,
    /"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/,
    /"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function channelUploadsPlaylistId(channelId: string): string {
  return channelId.startsWith("UC") ? `UU${channelId.slice(2)}` : channelId;
}

function normalizeChannelVideosUrl(input: string): string {
  const url = parseUrl(input);
  if (!url) return input.trim();

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[parts.length - 1] === "videos") {
    return url.toString();
  }

  if (parts[0] === "channel" && parts[1]) {
    return `https://www.youtube.com/channel/${parts[1]}/videos`;
  }

  const handleIndex = parts.findIndex((part) => part.startsWith("@"));
  if (handleIndex >= 0) {
    return `https://www.youtube.com/${parts[handleIndex]}/videos`;
  }

  if (parts[0] === "c" || parts[0] === "user") {
    return `https://www.youtube.com/${parts.join("/")}/videos`;
  }

  return url.toString();
}

function parseChannelTitleFromHtml(html: string): string {
  const titleMatch =
    html.match(/"channelMetadataRenderer":\{[^}]*"title":"([^"]+)"/) ||
    html.match(/"title":"([^"]+)","description"/) ||
    html.match(/<title>([^<]+)<\/title>/);

  const rawTitle = titleMatch?.[1] || "YouTube Kanalı";
  return rawTitle.replace(/\s*-\s*YouTube\s*$/i, "").trim();
}

async function fetchChannelViaInnertube(input: string) {
  const pageUrl = normalizeChannelVideosUrl(input);
  const page = await axios.get(pageUrl, {
    timeout: 20000,
    headers: YT_PAGE_HEADERS,
  });
  const html = String(page.data);

  const channelId = extractChannelIdFromHtml(html);
  if (!channelId) {
    throw new Error("Kanal URL'si çözümlenemedi. @handle veya /channel/UC... kullanın.");
  }

  const uploadsPlaylistId = channelUploadsPlaylistId(channelId);
  const scraped = await fetchPlaylistViaInnertube(uploadsPlaylistId);

  return {
    channelId,
    title: parseChannelTitleFromHtml(html) || scraped.title,
    author: scraped.author,
    thumbnailUrl: scraped.thumbnailUrl,
    videos: scraped.videos,
  };
}


export async function enrichVideosWithPublishDates(
  videos: YouTubeVideoMeta[]
): Promise<YouTubeVideoMeta[]> {
  if (videos.length === 0) return videos;

  return mapWithConcurrency(videos, 3, async (video) => {
    if (video.publishedAt) return video;
    const publishedAt = await fetchVideoPublishDateFromPage(video.youtubeId).catch(() => null);
    return { ...video, publishedAt };
  });
}

export async function resolveYouTubeSource(
  input: string,
  options?: { enrichDates?: boolean }
): Promise<YouTubeSourcePreview> {
  const type = detectYouTubeSourceType(input);
  let preview: YouTubeSourcePreview;

  if (type === "video") {
    const video = await fetchYouTubeMetadata(input);
    preview = {
      type: "video",
      title: video.title,
      author: video.author,
      thumbnailUrl: video.thumbnailUrl,
      sourceId: video.youtubeId,
      videoCount: 1,
      videos: [video],
    };
  } else if (type === "playlist") {
    const playlistId = extractPlaylistId(input);
    if (!playlistId) {
      throw new Error("Geçersiz oynatma listesi URL'si");
    }

    const scraped = await fetchPlaylistViaInnertube(playlistId);
    preview = {
      type: "playlist",
      title: scraped.title,
      author: scraped.author,
      thumbnailUrl: scraped.thumbnailUrl,
      sourceId: playlistId,
      videoCount: scraped.videos.length,
      videos: scraped.videos,
    };
  } else {
    const channel = await fetchChannelViaInnertube(input);

    if (channel.videos.length === 0) {
      throw new Error("Kanalda içe aktarılacak video bulunamadı");
    }

    preview = {
      type: "channel",
      title: channel.title,
      author: channel.author,
      thumbnailUrl: channel.thumbnailUrl || channel.videos[0]?.thumbnailUrl || "",
      sourceId: channel.channelId,
      videoCount: channel.videos.length,
      videos: channel.videos,
    };
  }

  if (preview.videos.length > 0 && options?.enrichDates === true) {
    preview.videos = await enrichVideosWithPublishDates(preview.videos);
  }

  if (preview.type === "playlist" || preview.type === "channel") {
    preview.videos = sortVideosChronologically(preview.videos);
  }

  return preview;
}
