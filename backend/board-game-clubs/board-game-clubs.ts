import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import axios from "axios";
import { parse } from "node-html-parser";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Club {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
}

export interface ClubGame {
  id: string;
  club_id: string;
  bgg_id: number | null;
  title: string;
  image_url: string | null;
  min_players: number | null;
  max_players: number | null;
  playing_time: number | null;
  description: string | null;
  condition: "new" | "good" | "worn" | "damaged";
  status: "available" | "borrowed" | "maintenance";
  notes: string | null;
  created_at: string;
}

export interface BggSearchResult {
  id: number;
  title: string;
  year_published: number | null;
}

export interface BggGameDetails {
  id: number;
  title: string;
  image_url: string | null;
  thumbnail_url: string | null;
  min_players: number;
  max_players: number;
  playing_time: number;
  description: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserClubsRequest {
  userId: string;
}

interface GetUserClubsResponse {
  clubs: Club[];
}

interface CreateClubRequest {
  name: string;
  description?: string;
  logoUrl?: string;
  ownerId: string;
}

interface CreateClubResponse {
  club: Club | null;
}

interface GetClubDetailsRequest {
  clubId: string;
}

interface GetClubDetailsResponse {
  club: Club | null;
}

interface GetClubGamesRequest {
  clubId: string;
}

interface GetClubGamesResponse {
  games: ClubGame[];
}

interface AddClubGameRequest {
  clubId: string;
  bggId?: number;
  title: string;
  imageUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  description?: string;
  condition?: "new" | "good" | "worn" | "damaged";
  status?: "available" | "borrowed" | "maintenance";
  notes?: string;
  apiKey?: string;
}

interface AddClubGameResponse {
  game: ClubGame | null;
}

interface UpdateClubGameRequest {
  gameId: string;
  title?: string;
  imageUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  description?: string;
  condition?: "new" | "good" | "worn" | "damaged";
  status?: "available" | "borrowed" | "maintenance";
  notes?: string;
}

interface UpdateClubGameResponse {
  game: ClubGame | null;
}

interface DeleteClubGameRequest {
  gameId: string;
}

interface DeleteClubGameResponse {
  success: boolean;
}

interface BggSearchRequest {
  query: string;
  apiKey?: string;
}

interface BggSearchResponse {
  results: BggSearchResult[];
}

interface BggGeeklistImportRequest {
  clubId: string;
  geeklistId: string;
  apiKey?: string;
}

interface BggGeeklistImportResponse {
  importedCount: number;
  failedCount: number;
  games: ClubGame[];
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının sahip olduğu kulüpleri listeler
 * GET /board-game-clubs/user/:userId
 */
export const getUserClubs = api(
  { expose: true, method: "GET", path: "/board-game-clubs/user/:userId" },
  async ({ userId }: GetUserClubsRequest): Promise<GetUserClubsResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("get_user_clubs", {
      owner_id_param: userId,
    });

    if (error) {
      console.error("getUserClubs error:", error);
      throw APIError.internal("Kulüpler listelenirken bir hata oluştu");
    }

    return { clubs: data || [] };
  }
);

/**
 * Yeni bir kutu oyunu kulübü/kafe profili oluşturur
 * POST /board-game-clubs/create
 */
export const createClub = api(
  { expose: true, method: "POST", path: "/board-game-clubs/create" },
  async ({ name, description, logoUrl, ownerId }: CreateClubRequest): Promise<CreateClubResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("create_club", {
      name_param: name,
      description_param: description || null,
      logo_url_param: logoUrl || null,
      owner_id_param: ownerId,
    });

    if (error) {
      console.error("createClub error:", error);
      throw APIError.internal("Kulüp oluşturulamadı");
    }

    return { club: data?.[0] || null };
  }
);

/**
 * Kulüp detaylarını getirir
 * GET /board-game-clubs/:clubId
 */
export const getClubDetails = api(
  { expose: true, method: "GET", path: "/board-game-clubs/:clubId" },
  async ({ clubId }: GetClubDetailsRequest): Promise<GetClubDetailsResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("get_club_details", {
      club_id_param: clubId,
    });

    if (error) {
      console.error("getClubDetails error:", error);
      return { club: null };
    }

    return { club: data?.[0] || null };
  }
);

/**
 * Kulübün oyun kütüphanesini getirir
 * GET /board-game-clubs/:clubId/games
 */
export const getClubGames = api(
  { expose: true, method: "GET", path: "/board-game-clubs/:clubId/games" },
  async ({ clubId }: GetClubGamesRequest): Promise<GetClubGamesResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("get_club_games", {
      club_id_param: clubId,
    });

    if (error) {
      console.error("getClubGames error:", error);
      throw APIError.internal("Oyun kütüphanesi yüklenemedi");
    }

    return { games: data || [] };
  }
);

/**
 * Kulüp kütüphanesine oyun ekler (Manuel veya BGG verileri ile)
 * POST /board-game-clubs/:clubId/games/add
 */
export const addClubGame = api(
  { expose: true, method: "POST", path: "/board-game-clubs/:clubId/games/add" },
  async ({
    clubId,
    bggId,
    title,
    imageUrl,
    minPlayers,
    maxPlayers,
    playingTime,
    description,
    condition,
    status,
    notes,
    apiKey,
  }: AddClubGameRequest): Promise<AddClubGameResponse> => {
    let finalImageUrl = imageUrl;
    let finalMinPlayers = minPlayers;
    let finalMaxPlayers = maxPlayers;
    let finalPlayingTime = playingTime;
    let finalDescription = description;

    if (bggId && !imageUrl && !minPlayers) {
      try {
        const details = await fetchBggGameDetailsBatch([bggId], apiKey);
        if (details.length > 0) {
          finalImageUrl = details[0].image_url || details[0].thumbnail_url || undefined;
          finalMinPlayers = details[0].min_players || undefined;
          finalMaxPlayers = details[0].max_players || undefined;
          finalPlayingTime = details[0].playing_time || undefined;
          finalDescription = details[0].description || undefined;
        }
      } catch (err) {
        console.error("Failed to prefetch BGG details for new game:", err);
      }
    }

    const { data, error } = await supabase.schema("board_game_clubs").rpc("add_club_game", {
      club_id_param: clubId,
      bgg_id_param: bggId || null,
      title_param: title,
      image_url_param: finalImageUrl || null,
      min_players_param: finalMinPlayers || null,
      max_players_param: finalMaxPlayers || null,
      playing_time_param: finalPlayingTime || null,
      description_param: finalDescription || null,
      condition_param: condition || "good",
      status_param: status || "available",
      notes_param: notes || null,
    });

    if (error) {
      console.error("addClubGame error:", error);
      throw APIError.internal("Oyun kütüphaneye eklenemedi");
    }

    return { game: data?.[0] || null };
  }
);

/**
 * Kütüphanedeki bir oyunun durumunu veya bilgilerini günceller
 * PUT /board-game-clubs/games/:gameId
 */
export const updateClubGame = api(
  { expose: true, method: "PUT", path: "/board-game-clubs/games/:gameId" },
  async ({
    gameId,
    title,
    imageUrl,
    minPlayers,
    maxPlayers,
    playingTime,
    description,
    condition,
    status,
    notes,
  }: UpdateClubGameRequest): Promise<UpdateClubGameResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("update_club_game", {
      game_id_param: gameId,
      title_param: title || null,
      image_url_param: imageUrl || null,
      min_players_param: minPlayers || null,
      max_players_param: maxPlayers || null,
      playing_time_param: playingTime || null,
      description_param: description || null,
      condition_param: condition || null,
      status_param: status || null,
      notes_param: notes || null,
    });

    if (error) {
      console.error("updateClubGame error:", error);
      throw APIError.internal("Oyun güncellenemedi");
    }

    return { game: data?.[0] || null };
  }
);

/**
 * Kütüphaneden oyun siler
 * DELETE /board-game-clubs/games/:gameId
 */
export const deleteClubGame = api(
  { expose: true, method: "DELETE", path: "/board-game-clubs/games/:gameId" },
  async ({ gameId }: DeleteClubGameRequest): Promise<DeleteClubGameResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("delete_club_game", {
      game_id_param: gameId,
    });

    if (error) {
      console.error("deleteClubGame error:", error);
      throw APIError.internal("Oyun kütüphaneden silinemedi");
    }

    return { success: !!data };
  }
);

/**
 * BoardGameGeek üzerinden oyun arar
 * GET /board-game-clubs/bgg/search
 */
export const searchBggGames = api(
  { expose: true, method: "GET", path: "/board-game-clubs/bgg/search" },
  async ({ query, apiKey }: BggSearchRequest): Promise<BggSearchResponse> => {
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["Bgg-Api-Key"] = apiKey;
      }

      const response = await axios.get(
        `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`,
        { headers }
      );
      
      const root = parse(response.data);
      const items = root.querySelectorAll("item");
      
      const results: BggSearchResult[] = items.map((item) => {
        const id = parseInt(item.getAttribute("id") || "0");
        const nameEl = item.querySelector("name[type=primary]") || item.querySelector("name");
        const title = nameEl ? nameEl.getAttribute("value") || "Bilinmeyen Oyun" : "Bilinmeyen Oyun";
        const yearEl = item.querySelector("yearpublished");
        const year_published = yearEl ? parseInt(yearEl.getAttribute("value") || "0") : null;
        
        return { id, title, year_published };
      });

      return { results: results.slice(0, 30) }; // En fazla 30 sonuç döner
    } catch (err) {
      console.error("BGG Search Error:", err);
      throw APIError.internal("BoardGameGeek araması başarısız oldu");
    }
  }
);

/**
 * BGG ID listesini alarak detaylı verilerini BGG Thing API'sinden çeker
 */
async function fetchBggGameDetailsBatch(bggIds: number[], apiKey?: string): Promise<BggGameDetails[]> {
  if (bggIds.length === 0) return [];
  
  try {
    const idsString = bggIds.join(",");
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["Bgg-Api-Key"] = apiKey;
    }

    const response = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${idsString}`, { headers });
    const root = parse(response.data);
    const items = root.querySelectorAll("item");

    return items.map((item) => {
      const id = parseInt(item.getAttribute("id") || "0");
      const nameEl = item.querySelector("name[type=primary]") || item.querySelector("name");
      const title = nameEl ? nameEl.getAttribute("value") || "Bilinmeyen Oyun" : "Bilinmeyen Oyun";
      const image_url = item.querySelector("image")?.text || null;
      const thumbnail_url = item.querySelector("thumbnail")?.text || null;
      const min_players = parseInt(item.querySelector("minplayers")?.getAttribute("value") || "1");
      const max_players = parseInt(item.querySelector("maxplayers")?.getAttribute("value") || "1");
      const playing_time = parseInt(item.querySelector("playingtime")?.getAttribute("value") || "0");
      
      // XML içindeki description HTML kodları içerebilir, decode edip temizleyelim
      let description = item.querySelector("description")?.text || "";
      description = description
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#10;/g, "\n");

      return {
        id,
        title,
        image_url,
        thumbnail_url,
        min_players,
        max_players,
        playing_time,
        description,
      };
    });
  } catch (err) {
    console.error("fetchBggGameDetailsBatch error:", err);
    return [];
  }
}

/**
 * Bir BGG Geeklist'indeki tüm oyunları kulüp kütüphanesine toplu aktarır
 * POST /board-game-clubs/:clubId/bgg/import-geeklist
 */
export const importBggGeeklist = api(
  { expose: true, method: "POST", path: "/board-game-clubs/:clubId/bgg/import-geeklist" },
  async ({ clubId, geeklistId, apiKey }: BggGeeklistImportRequest): Promise<BggGeeklistImportResponse> => {
    try {
      // Extract numeric ID if a full URL is provided
      let sanitizedGeeklistId = geeklistId.trim();
      const urlMatch = sanitizedGeeklistId.match(/geeklist\/(\d+)/);
      if (urlMatch) {
        sanitizedGeeklistId = urlMatch[1];
      }

      // Configure headers with authorization if apiKey is provided
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["Bgg-Api-Key"] = apiKey;
      }

      // 1. Geeklist XML verisini çekelim
      const listResponse = await axios.get(`https://boardgamegeek.com/xmlapi/geeklist/${sanitizedGeeklistId}`, { headers });
      const listRoot = parse(listResponse.data);
      const listItems = listRoot.querySelectorAll("item");

      if (listItems.length === 0) {
        throw APIError.notFound("Geeklist boş veya bulunamadı");
      }

      // 2. BGG ID listesini çıkaralım
      const bggIds = listItems
        .map((item) => parseInt(item.getAttribute("objectid") || "0"))
        .filter((id) => id > 0);

      // Tekrarları temizleyelim
      const uniqueBggIds = Array.from(new Set(bggIds));

      if (uniqueBggIds.length === 0) {
        throw APIError.invalidArgument("Geeklist geçerli bir board game nesnesi barındırmıyor");
      }

      // 3. Mevcut oyun kütüphanesini çekelim ki mükerrer ekleme yapmayalım
      const { data: existingGames, error: fetchErr } = await supabase
        .schema("board_game_clubs")
        .rpc("get_club_games", { club_id_param: clubId });

      if (fetchErr) {
        console.error("fetch existing games error:", fetchErr);
      }

      const existingBggIds = new Set(
        (existingGames || [])
          .map((g: any) => g.bgg_id)
          .filter((id: any) => id !== null && id !== undefined)
      );

      // Sadece kütüphanede olmayan BGG ID'leri import edelim
      const idsToImport = uniqueBggIds.filter((id) => !existingBggIds.has(id));

      if (idsToImport.length === 0) {
        return { importedCount: 0, failedCount: 0, games: existingGames || [] };
      }

      // 4. Detaylı BGG verilerini toplu çekelim (BGG Thing API limitleri için 20'li chunklar halinde çekelim)
      const details: BggGameDetails[] = [];
      const chunkSize = 20;
      for (let i = 0; i < idsToImport.length; i += chunkSize) {
        const chunk = idsToImport.slice(i, i + chunkSize);
        const chunkDetails = await fetchBggGameDetailsBatch(chunk, apiKey);
        details.push(...chunkDetails);
      }

      // 5. Her oyunu Supabase veritabanına ekleyelim
      let importedCount = 0;
      let failedCount = 0;

      for (const gameDetail of details) {
        const { error: insertErr } = await supabase.schema("board_game_clubs").rpc("add_club_game", {
          club_id_param: clubId,
          bgg_id_param: gameDetail.id,
          title_param: gameDetail.title,
          image_url_param: gameDetail.image_url || gameDetail.thumbnail_url || null,
          min_players_param: gameDetail.min_players,
          max_players_param: gameDetail.max_players,
          playing_time_param: gameDetail.playing_time,
          description_param: gameDetail.description || null,
          condition_param: "good",
          status_param: "available",
          notes_param: "BGG Geeklist üzerinden toplu aktarıldı.",
        });

        if (insertErr) {
          console.error(`Import failed for game ${gameDetail.title}:`, insertErr);
          failedCount++;
        } else {
          importedCount++;
        }
      }

      // 6. Güncel kütüphaneyi döndür
      const { data: updatedGames } = await supabase
        .schema("board_game_clubs")
        .rpc("get_club_games", { club_id_param: clubId });

      return {
        importedCount,
        failedCount,
        games: updatedGames || [],
      };
    } catch (err) {
      console.error("Geeklist Import Error:", err);
      if (err instanceof APIError) throw err;
      throw APIError.internal("Geeklist aktarımı sırasında beklenmedik bir hata oluştu");
    }
  }
);
