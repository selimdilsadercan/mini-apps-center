import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Concert {
  id: string;
  user_clerk_id: string;
  artist: string;
  date: string; // YYYY-MM-DD
  venue?: string;
  notes?: string;
  rating?: number;
  created_at: string;
}

// ==================== REQ/RES INTERFACES ====================

interface GetConcertsRequest {
  userId: string;
}

interface GetConcertsResponse {
  concerts: Concert[];
}

interface AddConcertRequest {
  userId: string;
  artist: string;
  date: string;
  venue?: string;
  notes?: string;
  rating?: number;
}

interface AddConcertResponse {
  concert: Concert | null;
}

interface BulkImportRequest {
  userId: string;
  concerts: {
    artist: string;
    date: string;
    venue?: string;
    notes?: string;
    rating?: number;
  }[];
}

interface BulkImportResponse {
  importedCount: number;
}

interface DeleteConcertRequest {
  id: string;
  userId: string;
}

interface DeleteConcertResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Get all concerts for a user
 * GET /concert-list/concerts/:userId
 */
export const getConcerts = api(
  { expose: true, method: "GET", path: "/concert-list/concerts/:userId" },
  async ({ userId }: GetConcertsRequest): Promise<GetConcertsResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("get_concerts", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getConcerts error:", error);
      throw APIError.internal(`Failed to load concerts: ${error.message}`);
    }

    return { concerts: data || [] };
  }
);

/**
 * Add a new concert
 * POST /concert-list/concerts/add
 */
export const addConcert = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/add" },
  async ({ userId, artist, date, venue, notes, rating }: AddConcertRequest): Promise<AddConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("add_concert", {
      clerk_id_param: userId,
      artist_param: artist,
      date_param: date,
      venue_param: venue || null,
      notes_param: notes || null,
      rating_param: rating || null,
    });

    if (error) {
      console.error("addConcert error:", error);
      throw APIError.internal(`Failed to add concert: ${error.message}`);
    }

    return { concert: data?.[0] || null };
  }
);

/**
 * Bulk import concerts
 * POST /concert-list/concerts/bulk
 */
export const bulkImportConcerts = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/bulk" },
  async ({ userId, concerts }: BulkImportRequest): Promise<BulkImportResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("bulk_import_concerts", {
      clerk_id_param: userId,
      p_concerts: concerts,
    });

    if (error) {
      console.error("bulkImportConcerts error:", error);
      throw APIError.internal(`Failed to bulk import concerts: ${error.message}`);
    }

    return { importedCount: Number(data) || 0 };
  }
);

/**
 * Delete a concert
 * DELETE /concert-list/concerts/:id/:userId
 */
export const deleteConcert = api(
  { expose: true, method: "DELETE", path: "/concert-list/concerts/:id/:userId" },
  async ({ id, userId }: DeleteConcertRequest): Promise<DeleteConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("delete_concert", {
      concert_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteConcert error:", error);
      throw APIError.internal(`Failed to delete concert: ${error.message}`);
    }

    return { success: !!data };
  }
);

interface GetArtistImageRequest {
  artist: string;
}

interface GetArtistImageResponse {
  imageUrl: string;
}

/**
 * Fetch artist image from Wikipedia API
 * GET /concert-list/artist-image
 */
export const getArtistImage = api(
  { expose: true, method: "GET", path: "/concert-list/artist-image" },
  async ({ artist }: GetArtistImageRequest): Promise<GetArtistImageResponse> => {
    if (!artist || !artist.trim()) {
      return { imageUrl: "" };
    }
    console.log(`[getArtistImage] Searching for artist: "${artist}"`);

    // Try YouTube Channel Avatar first
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.trim())}&sp=EgIQAg%3D%3D`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();
      // Match yt3.ggpht.com or yt3.googleusercontent.com channel avatar URLs
      const matches = html.match(/https:\/\/yt3\.(?:ggpht\.com|googleusercontent\.com)\/[\w-]+=[sS]\d+(?:-[a-zA-Z0-9]+)*/g);
      
      console.log(`[getArtistImage] YouTube Channel Matches count: ${matches ? matches.length : 0}`);
      if (matches && matches.length > 0) {
        // Force high resolution by replacing size parameter (e.g. s88, s176) with s240
        let imageUrl = matches[0];
        imageUrl = imageUrl.replace(/=s\d+/, "=s240");
        console.log(`[getArtistImage] YouTube Channel Avatar selected: "${imageUrl}"`);
        return { imageUrl };
      }
    } catch (err) {
      console.error("Error fetching artist avatar from YouTube Channel:", err);
    }

    // Fallback 1 & 2: Turkish Wikipedia (tr) & English Wikipedia (en)
    const wikis = ["tr", "en"];
    for (const lang of wikis) {
      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          artist.trim()
        )}&format=json&origin=*`;
        const searchRes = await fetch(searchUrl, {
          headers: {
            "User-Agent": "MyConcertList/1.0 (contact@example.com)"
          }
        });
        const searchData = (await searchRes.json()) as any;
        const firstResult = searchData.query?.search?.[0];
        console.log(`[getArtistImage] Wikipedia (${lang}) search firstResult:`, firstResult ? firstResult.title : "None");

        if (firstResult && firstResult.title) {
          const titleKey = firstResult.title.replace(/\s+/g, "_");
          const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleKey)}`;
          const summaryRes = await fetch(summaryUrl, {
            headers: {
              "User-Agent": "MyConcertList/1.0 (contact@example.com)"
            }
          });
          const summaryData = (await summaryRes.json()) as any;
          console.log(`[getArtistImage] Wikipedia (${lang}) summary thumbnail:`, summaryData.thumbnail ? summaryData.thumbnail.source : "None");

          if (summaryData.thumbnail && summaryData.thumbnail.source) {
            return { imageUrl: summaryData.thumbnail.source };
          }
        }
      } catch (err) {
        console.error(`Error fetching artist image from Wikipedia (${lang}):`, err);
      }
    }

    // Fallback 3: iTunes Song Search (extracting track album cover and resizing it to 300x300)
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artist.trim())}&entity=song&limit=1`;
      const itunesRes = await fetch(itunesUrl);
      const itunesData = (await itunesRes.json()) as any;
      const firstTrack = itunesData.results?.[0];
      console.log(`[getArtistImage] iTunes search firstTrack:`, firstTrack ? firstTrack.trackName : "None");

      if (firstTrack && firstTrack.artworkUrl100) {
        // Change 100x100 to 300x300 for high resolution cover
        const highResUrl = firstTrack.artworkUrl100.replace("/100x100bb.jpg", "/300x300bb.jpg");
        console.log(`[getArtistImage] iTunes cover selected: "${highResUrl}"`);
        return { imageUrl: highResUrl };
      }
    } catch (err) {
      console.error("Error fetching artist image from iTunes:", err);
    }

    console.log(`[getArtistImage] No image found anywhere. Returning empty string.`);
    return { imageUrl: "" };
  }
);

