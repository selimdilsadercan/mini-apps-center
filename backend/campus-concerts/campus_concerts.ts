import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Attendee {
  clerk_id: string;
  username: string | null;
  avatar_url: string | null;
  status: string; // 'went', 'going', 'interested'
}

export interface CampusConcert {
  id: string;
  artist: string;
  campus: string;
  date: string; // YYYY-MM-DD
  description?: string | null;
  image_url?: string | null;
  added_by_id?: string | null;
  creator_username?: string | null;
  creator_avatar?: string | null;
  created_at: string;
  user_status?: string | null; // status of requesting user
  attendees?: Attendee[];
}

// ==================== REQ/RES INTERFACES ====================

interface GetConcertsRequest {
  userId?: string;
}

interface GetConcertsResponse {
  concerts: CampusConcert[];
}

interface AddConcertRequest {
  userId: string;
  artist: string;
  campus: string;
  date: string;
  description?: string;
  imageUrl?: string;
}

interface AddConcertResponse {
  concert: CampusConcert | null;
}

interface SetAttendanceRequest {
  userId: string;
  concertId: string;
  status: string; // 'went', 'going', 'interested', 'none'
}

interface SetAttendanceResponse {
  success: boolean;
}

interface GetArtistImageRequest {
  artist: string;
}

interface GetArtistImageResponse {
  imageUrl: string;
}

interface GetArtistImagesRequest {
  artist: string;
}

interface GetArtistImagesResponse {
  imageUrls: string[];
}

// ==================== API ENDPOINTS ====================

/**
 * Get all campus concerts. Optionally provides requesting user's status.
 * GET /campus-concerts/concerts
 */
export const getConcerts = api(
  { expose: true, method: "GET", path: "/campus-concerts/concerts" },
  async ({ userId }: GetConcertsRequest): Promise<GetConcertsResponse> => {
    const { data, error } = await supabase.schema("campus_concerts").rpc("get_concerts", {
      clerk_id_param: userId || null,
    });

    if (error) {
      console.error("getConcerts error:", error);
      throw APIError.internal(`Failed to load campus concerts: ${error.message}`);
    }

    return { concerts: data || [] };
  }
);

/**
 * Add a new campus concert
 * POST /campus-concerts/concerts/add
 */
export const addConcert = api(
  { expose: true, method: "POST", path: "/campus-concerts/concerts/add" },
  async ({ userId, artist, campus, date, description, imageUrl }: AddConcertRequest): Promise<AddConcertResponse> => {
    const { data, error } = await supabase.schema("campus_concerts").rpc("add_concert", {
      artist_param: artist,
      campus_param: campus,
      date_param: date,
      description_param: description || null,
      image_url_param: imageUrl || null,
      added_by_clerk_id_param: userId,
    });

    if (error) {
      console.error("addConcert error:", error);
      throw APIError.internal(`Failed to add campus concert: ${error.message}`);
    }

    return { concert: data?.[0] || null };
  }
);

/**
 * Set user attendance status for a concert
 * POST /campus-concerts/attendance/set
 */
export const setAttendance = api(
  { expose: true, method: "POST", path: "/campus-concerts/attendance/set" },
  async ({ userId, concertId, status }: SetAttendanceRequest): Promise<SetAttendanceResponse> => {
    const { error } = await supabase.schema("campus_concerts").rpc("set_attendance", {
      clerk_id_param: userId,
      concert_id_param: concertId,
      status_param: status,
    });

    if (error) {
      console.error("setAttendance error:", error);
      throw APIError.internal(`Failed to update attendance: ${error.message}`);
    }

    return { success: true };
  }
);

/**
 * Fetch artist image from YouTube / Wikipedia / iTunes
 * GET /campus-concerts/artist-image
 */
export const getArtistImage = api(
  { expose: true, method: "GET", path: "/campus-concerts/artist-image" },
  async ({ artist }: GetArtistImageRequest): Promise<GetArtistImageResponse> => {
    if (!artist || !artist.trim()) {
      return { imageUrl: "" };
    }

    // Try YouTube Channel Avatar first
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.trim())}&sp=EgIQAg%3D%3D`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();
      const matches = html.match(/https:\/\/yt3\.(?:ggpht\.com|googleusercontent\.com)\/[\w-]+=[sS]\d+(?:-[a-zA-Z0-9]+)*/g);
      if (matches && matches.length > 0) {
        let imageUrl = matches[0];
        imageUrl = imageUrl.replace(/=s\d+/, "=s240");
        return { imageUrl };
      }
    } catch (err) {
      console.error("Error fetching artist avatar from YouTube Channel:", err);
    }

    // Wikipedia fallback
    const wikis = ["tr", "en"];
    for (const lang of wikis) {
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          artist.trim()
        )}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl, {
          headers: {
            "User-Agent": "CampusConcerts/1.0"
          }
        });
        const searchData = (await searchRes.json()) as any;
        const firstResult = searchData.query?.search?.[0];

        if (firstResult && firstResult.title) {
          const titleKey = firstResult.title.replace(/\s+/g, "_");
          const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleKey)}`;
          const summaryRes = await fetch(summaryUrl, {
            headers: {
              "User-Agent": "CampusConcerts/1.0"
            }
          });
          const summaryData = (await summaryRes.json()) as any;

          if (summaryData.thumbnail && summaryData.thumbnail.source) {
            return { imageUrl: summaryData.thumbnail.source };
          }
        }
      } catch (err) {
        console.error(`Error fetching artist image from Wikipedia (${lang}):`, err);
      }
    }

    // iTunes fallback
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist.trim())}&entity=song&limit=1`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = (await itunesRes.json()) as any;
      const firstTrack = itunesData.results?.[0];

      if (firstTrack && firstTrack.artworkUrl100) {
        const highResUrl = firstTrack.artworkUrl100.replace("/100x100bb.jpg", "/300x300bb.jpg");
        return { imageUrl: highResUrl };
      }
    } catch (err) {
      console.error("Error fetching artist image from iTunes:", err);
    }

    return { imageUrl: "" };
  }
);

/**
 * Fetch multiple potential artist images
 * GET /campus-concerts/artist-images
 */
export const getArtistImages = api(
  { expose: true, method: "GET", path: "/campus-concerts/artist-images" },
  async ({ artist }: GetArtistImagesRequest): Promise<GetArtistImagesResponse> => {
    const urls: string[] = [];
    if (!artist || !artist.trim()) {
      return { imageUrls: [] };
    }

    // 1. YouTube
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.trim())}&sp=EgIQAg%3D%3D`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();
      const matches = html.match(/https:\/\/yt3\.(?:ggpht\.com|googleusercontent\.com)\/[\w-]+=[sS]\d+(?:-[a-zA-Z0-9]+)*/g);
      if (matches) {
        const seen = new Set<string>();
        for (const match of matches) {
          const highRes = match.replace(/=s\d+/, "=s240");
          if (!seen.has(highRes)) {
            seen.add(highRes);
            urls.push(highRes);
          }
          if (urls.length >= 4) break;
        }
      }
    } catch (err) {
      console.error("Error fetching from YouTube:", err);
    }

    // 2. Wikipedia (tr & en)
    const wikis = ["tr", "en"];
    for (const lang of wikis) {
      if (urls.length >= 5) break;
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artist.trim())}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl, {
          headers: { "User-Agent": "CampusConcerts/1.0" }
        });
        const searchData = (await searchRes.json()) as any;
        const results = searchData.query?.search || [];
        for (const result of results) {
          if (urls.length >= 5) break;
          if (result.title) {
            const titleKey = result.title.replace(/\s+/g, "_");
            const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleKey)}`;
            const summaryRes = await fetch(summaryUrl, {
              headers: { "User-Agent": "CampusConcerts/1.0" }
            });
            const summaryData = (await summaryRes.json()) as any;
            if (summaryData.thumbnail?.source && !urls.includes(summaryData.thumbnail.source)) {
              urls.push(summaryData.thumbnail.source);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching from Wikipedia:", err);
      }
    }

    // 3. iTunes
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist.trim())}&entity=song&limit=3`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = (await itunesRes.json()) as any;
      const results = itunesData.results || [];
      for (const result of results) {
        if (urls.length >= 6) break;
        if (result.artworkUrl100) {
          const highResUrl = result.artworkUrl100.replace("/100x100bb.jpg", "/300x300bb.jpg");
          if (!urls.includes(highResUrl)) {
            urls.push(highResUrl);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching from iTunes:", err);
    }

    return { imageUrls: urls };
  }
);
