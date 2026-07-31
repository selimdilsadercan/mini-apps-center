import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

const AUGUST_FAIR_INFO_URL =
  "https://kahramanmaras.bel.tr/duyuru/2026/07/24/geleneksel-agustos-fuari-etkinlik-takvimi";

// ==================== TYPES ====================

export interface ConcertFriend {
  id: string;
  username: string | null;
  avatar: string | null;
}

export interface Concert {
  id: string;
  userId: string;
  creatorUsername?: string | null;
  creatorAvatar?: string | null;
  artist: string;
  date: string; // YYYY-MM-DD
  venue?: string;
  placeId?: string;
  notes?: string;
  rating?: number;
  createdAt: string;
  friends?: ConcertFriend[];
  imageUrl?: string | null;
  infoUrl?: string;
  status?: "planned" | "attended";
  upcomingConcertId?: string;
}

export interface UpcomingConcert {
  id: string;
  artist: string;
  date: string; // YYYY-MM-DD
  venue?: string;
  placeId?: string;
  description?: string;
  imageUrl?: string;
  infoUrl?: string;
  createdAt: string;
}

interface GetUpcomingConcertsResponse {
  concerts: UpcomingConcert[];
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
  placeId?: string;
  notes?: string;
  rating?: number;
  friendIds?: string[];
  imageUrl?: string;
  infoUrl?: string;
  status?: "planned" | "attended";
  upcomingConcertId?: string;
}

interface AddConcertResponse {
  concert: Concert | null;
}

interface EditConcertRequest {
  id: string;
  userId: string;
  artist: string;
  date: string;
  venue?: string;
  placeId?: string;
  notes?: string;
  rating?: number;
  friendIds?: string[];
  imageUrl?: string;
  infoUrl?: string;
  status?: "planned" | "attended";
}

interface EditConcertResponse {
  concert: Concert | null;
}

interface BulkImportRequest {
  userId: string;
  concerts: {
    artist: string;
    date: string;
    venue?: string;
    placeId?: string;
    notes?: string;
    rating?: number;
    infoUrl?: string;
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

function mapConcertRow(concert: any): Concert {
  return {
    id: concert.id,
    userId: concert.user_id,
    creatorUsername: concert.creator_username,
    creatorAvatar: concert.creator_avatar,
    artist: concert.artist,
    date: concert.date,
    venue: concert.venue,
    placeId: concert.place_id || undefined,
    notes: concert.notes,
    rating: concert.rating,
    createdAt: concert.created_at,
    friends: concert.friends,
    imageUrl: concert.image_url,
    infoUrl: concert.info_url || undefined,
    status: (concert.status as "planned" | "attended") || "attended",
    upcomingConcertId: concert.upcoming_concert_id || undefined,
  };
}

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

    return {
      concerts: (data || []).map(mapConcertRow),
    };
  }
);

/**
 * Add a new concert
 * POST /concert-list/concerts/add
 */
export const addConcert = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/add" },
  async ({ userId, artist, date, venue, placeId, notes, rating, friendIds, imageUrl, infoUrl, status, upcomingConcertId }: AddConcertRequest): Promise<AddConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("add_concert", {
      clerk_id_param: userId,
      artist_param: artist,
      date_param: date,
      venue_param: venue || null,
      place_id_param: placeId || null,
      notes_param: notes || null,
      rating_param: rating ?? null,
      friend_ids_param: friendIds || [],
      image_url_param: imageUrl || null,
      info_url_param: infoUrl || null,
      status_param: status || "attended",
      upcoming_concert_id_param: upcomingConcertId || null,
    });

    if (error) {
      console.error("addConcert error:", error);
      throw APIError.internal(`Failed to add concert: ${error.message}`);
    }

    const concert = (data as any[] | null)?.[0];
    if (!concert) return { concert: null };

    return { concert: mapConcertRow(concert) };
  }
);

/**
 * Edit an existing concert
 * POST /concert-list/concerts/edit
 */
export const editConcert = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/edit" },
  async ({ id, userId, artist, date, venue, placeId, notes, rating, friendIds, imageUrl, infoUrl, status }: EditConcertRequest): Promise<EditConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("edit_concert", {
      concert_id_param: id,
      clerk_id_param: userId,
      artist_param: artist,
      date_param: date,
      venue_param: venue || null,
      place_id_param: placeId || null,
      notes_param: notes || null,
      rating_param: rating ?? null,
      friend_ids_param: friendIds || [],
      image_url_param: imageUrl || null,
      info_url_param: infoUrl || null,
      status_param: status || null,
    });

    if (error) {
      console.error("editConcert error:", error);
      throw APIError.internal(`Failed to edit concert: ${error.message}`);
    }

    const concert = (data as any[] | null)?.[0];
    if (!concert) return { concert: null };

    return { concert: mapConcertRow(concert) };
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

interface GetArtistImagesRequest {
  artist: string;
}

interface GetArtistImagesResponse {
  imageUrls: string[];
}

/**
 * Fetch multiple potential artist images from YouTube, Wikipedia, and iTunes
 * GET /concert-list/artist-images
 */
export const getArtistImages = api(
  { expose: true, method: "GET", path: "/concert-list/artist-images" },
  async ({ artist }: GetArtistImagesRequest): Promise<GetArtistImagesResponse> => {
    const urls: string[] = [];
    if (!artist || !artist.trim()) {
      return { imageUrls: [] };
    }

    // 1. YouTube Channel Avatars
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
          headers: { "User-Agent": "MyConcertList/1.0" }
        });
        const searchData = (await searchRes.json()) as any;
        const results = searchData.query?.search || [];
        for (const result of results) {
          if (urls.length >= 5) break;
          if (result.title) {
            const titleKey = result.title.replace(/\s+/g, "_");
            const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleKey)}`;
            const summaryRes = await fetch(summaryUrl, {
              headers: { "User-Agent": "MyConcertList/1.0" }
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

/**
 * Get all upcoming concerts
 * GET /concert-list/upcoming
 */
export const getUpcomingConcerts = api(
  { expose: true, method: "GET", path: "/concert-list/upcoming" },
  async (): Promise<GetUpcomingConcertsResponse> => {
    const { data, error } = await supabase
      .schema("concert_list")
      .from("upcoming_concerts")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("getUpcomingConcerts error:", error);
      throw APIError.internal(`Failed to fetch upcoming concerts: ${error.message}`);
    }

    const rows = data || [];
    const placeIds = [...new Set(rows.map((row: any) => row.place_id).filter(Boolean))] as string[];
    const placeMap = new Map<string, { name: string; district?: string | null }>();

    if (placeIds.length > 0) {
      const placeRows = await Promise.all(
        placeIds.map(async (placeId) => {
          const { data: placeData, error: placeError } = await supabase
            .schema("workplaces")
            .rpc("get_place", { p_id: placeId });

          if (placeError) {
            console.error("getUpcomingConcerts get_place error:", placeError);
            return null;
          }

          const place = (placeData as any[] | null)?.[0];
          if (!place?.id || !place?.name) return null;
          return { id: place.id as string, name: place.name as string, district: place.district as string | null };
        }),
      );

      for (const place of placeRows) {
        if (place) placeMap.set(place.id, { name: place.name, district: place.district });
      }
    }

    const formatted = rows.map((row: any) => {
      const linked = row.place_id ? placeMap.get(row.place_id) : undefined;
      return {
        id: row.id,
        artist: row.artist,
        date: row.date,
        venue: linked?.name || row.venue || undefined,
        placeId: row.place_id || undefined,
        description: row.description || undefined,
        imageUrl: row.image_url || undefined,
        infoUrl: row.info_url || undefined,
        createdAt: row.created_at,
      };
    });

    return { concerts: formatted };
  }
);

/**
 * Helper to fetch artist high-res image from iTunes API
 */
async function fetchArtistImage(artist: string): Promise<string> {
  try {
    const cleanArtist = artist.split("-")[0].trim();
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanArtist)}&entity=song&limit=1`;
    const itunesRes = await fetch(itunesUrl);
    const itunesData = (await itunesRes.json()) as any;
    const result = itunesData.results?.[0];
    if (result?.artworkUrl100) {
      return result.artworkUrl100.replace("/100x100bb.jpg", "/600x600bb.jpg");
    }
  } catch (err) {
    console.error("fetchArtistImage error:", err);
  }
  return "";
}

/**
 * Seed upcoming concerts with Kahramanmaraş August Fair concerts
 * POST /concert-list/seed-upcoming
 */
export const seedUpcomingConcerts = api(
  { expose: true, method: "POST", path: "/concert-list/seed-upcoming" },
  async (): Promise<{ success: boolean; count: number }> => {
    const concertsToSeed = [
      { artist: "Eypio", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-01" },
      { artist: "Dedublüman", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-04" },
      { artist: "Madrigal", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-06" },
      { artist: "Zakkum", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-07" },
      { artist: "Funda Arar", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-08" },
      { artist: "Ekin Uzunlar", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-11" },
      { artist: "Aydilge", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-12" },
      { artist: "Kubat", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-14" },
      { artist: "Gripin", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-15" },
      { artist: "Burak Kut", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-18" },
      { artist: "Semicenk", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-21" },
      { artist: "Yeni Türkü", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-22" },
      { artist: "Çelik", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-25" },
      { artist: "Öykü Gürman", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-27" },
      { artist: "Tuğçe Kandemir", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-28" },
      { artist: "Soner Sarıkabadayı", description: "Uluslararası Geleneksel Kahramanmaraş Ağustos Fuarı Konserleri", venue: "KAFUM (Kahramanmaraş Fuar Merkezi)", date: "2026-08-29" }
    ];

    // Fetch images for all artists in parallel
    const seededConcerts = await Promise.all(
      concertsToSeed.map(async (c) => {
        const image = await fetchArtistImage(c.artist);
        return {
          artist: c.artist,
          description: c.description,
          venue: c.venue,
          date: c.date,
          image_url: image || null,
          info_url: AUGUST_FAIR_INFO_URL,
        };
      })
    );

    // Delete existing upcoming concerts to avoid duplicates
    const artists = concertsToSeed.map(c => c.artist);
    await supabase.schema("concert_list").from("upcoming_concerts").delete().in("artist", artists);

    const { data, error } = await supabase
      .schema("concert_list")
      .from("upcoming_concerts")
      .insert(seededConcerts)
      .select();

    if (error) {
      console.error("seedUpcomingConcerts error:", error);
      throw APIError.internal(`Failed to seed upcoming concerts: ${error.message}`);
    }

    return { success: true, count: data?.length || 0 };
  }
);
