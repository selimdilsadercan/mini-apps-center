import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import axios from "axios";
import { parse } from "node-html-parser";
import * as fs from "fs";
import * as path from "path";

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
  business_id: string | null;
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
  businessId?: string;
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

interface UpdateClubRequest {
  clubId: string;
  name?: string;
  description?: string;
  logoUrl?: string;
}

interface UpdateClubResponse {
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

interface CsvImportRequest {
  clubId: string;
  csvContent: string;
}

interface CsvImportResponse {
  importedCount: number;
  failedCount: number;
}

interface SyncBggRequest {
  clubId: string;
}

interface SyncBggResponse {
  syncedCount: number;
  failedCount: number;
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
  async ({ name, description, logoUrl, ownerId, businessId }: CreateClubRequest): Promise<CreateClubResponse> => {
    const { data, error } = await supabase.schema("board_game_clubs").rpc("create_club", {
      name_param: name,
      description_param: description || null,
      logo_url_param: logoUrl || null,
      owner_id_param: ownerId,
      business_id_param: businessId || null,
    });

    if (error) {
      console.error("createClub error:", error);
      throw APIError.internal("Kulüp oluşturulamadı");
    }

    return { club: (data as Club) || null };
  }
);

/**
 * İşletmeye bağlı kulübü getirir
 * GET /board-game-clubs/business/:businessId
 */
export const getClubByBusinessId = api(
  { expose: true, method: "GET", path: "/board-game-clubs/business/:businessId" },
  async ({ businessId }: { businessId: string }): Promise<GetClubDetailsResponse> => {
    const { data, error } = await supabase
      .schema("board_game_clubs")
      .from("clubs")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      console.error("getClubByBusinessId error:", error);
      return { club: null };
    }

    return { club: (data as Club) || null };
  }
);

/**
 * Kulüp bilgilerini günceller
 * PUT /board-game-clubs/:clubId
 */
export const updateClub = api(
  { expose: true, method: "PUT", path: "/board-game-clubs/:clubId" },
  async ({ clubId, name, description, logoUrl }: UpdateClubRequest): Promise<UpdateClubResponse> => {
    const { data, error } = await supabase
      .schema("board_game_clubs")
      .from("clubs")
      .update({
        name: name || undefined,
        description: description || null,
        logo_url: logoUrl || null,
      })
      .eq("id", clubId)
      .select()
      .single();

    if (error) {
      console.error("updateClub error:", error);
      throw APIError.internal("Kulüp güncellenemedi");
    }

    return { club: (data as Club) || null };
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

    return { club: (data as Club) || null };
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

    return { game: (data as ClubGame) || null };
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

    return { game: (data as ClubGame) || null };
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
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/xml,text/xml,*/*"
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

/**
 * CSV formatındaki oyun listesini kulüp kütüphanesine aktarır
 * Format: *,OYUN,EK PAKETLER,TÜRÜ,OYUNCU,ZORLUK
 * POST /board-game-clubs/:clubId/import-csv
 */
export const importCsvGames = api(
  { expose: true, method: "POST", path: "/board-game-clubs/:clubId/import-csv" },
  async ({ clubId, csvContent }: CsvImportRequest): Promise<CsvImportResponse> => {
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
    if (lines.length <= 1) {
      throw APIError.invalidArgument("CSV içeriği boş veya geçersiz");
    }

    // Header'ı atla
    const dataLines = lines.slice(1);
    let importedCount = 0;
    let failedCount = 0;

    for (const line of dataLines) {
      try {
        const columns = parseCsvLine(line);
        if (columns.length < 2) continue; // En azından oyun adı olmalı

        const title = columns[1];
        const expansions = columns[2];
        const genre = columns[3];
        const playerCountStr = columns[4];
        const difficulty = columns[5];

        const { min: minPlayers, max: maxPlayers } = parsePlayerCount(playerCountStr);

        let notes = "";
        if (expansions) notes += `Ek Paketler: ${expansions}\n`;
        if (difficulty) notes += `Zorluk: ${difficulty}\n`;
        notes = notes.trim();

        const { error } = await supabase.schema("board_game_clubs").rpc("add_club_game", {
          club_id_param: clubId,
          bgg_id_param: null,
          title_param: title,
          image_url_param: null,
          min_players_param: minPlayers,
          max_players_param: maxPlayers,
          playing_time_param: null,
          description_param: genre || null,
          condition_param: "good",
          status_param: "available",
          notes_param: notes || null,
        });

        if (error) {
          console.error(`CSV Import failed for game ${title}:`, error);
          failedCount++;
        } else {
          importedCount++;
        }
      } catch (err) {
        console.error(`Error parsing line: ${line}`, err);
        failedCount++;
      }
    }

    return { importedCount, failedCount };
  }
);

/**
 * NeoTroy Games üzerinden oyunun resmini bulmaya çalışır
 */
async function scrapeNeoTroyImage(title: string): Promise<string | null> {
  try {
    console.log(`[scrapeNeoTroyImage] Starting search for: ${title}`);
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };

    const searchUrl = `https://neotroygames.com/?s=${encodeURIComponent(title)}&post_type=product`;
    const response = await axios.get(searchUrl, { headers, timeout: 10000 });
    const root = parse(response.data);
    
    // Tüm ürün kartlarını bulalım
    const products = root.querySelectorAll("li.product, .rt-product-block");
    console.log(`[scrapeNeoTroyImage] Found ${products.length} potential products on page`);
    
    for (const product of products) {
      // Ürün adını kontrol et
      const titleEl = product.querySelector(".rt-title a, .woocommerce-loop-product__title, h3 a");
      const productTitle = titleEl?.text?.trim() || "";
      const img = product.querySelector("img");
      
      if (img && productTitle) {
        const normalizedProductTitle = productTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normalizedSearchTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

        console.log(`[scrapeNeoTroyImage] Checking product: "${productTitle}" against search: "${title}"`);

        // Eğer ürün adı aradığımız adla örtüşüyorsa bu doğru üründür
        if (normalizedProductTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedProductTitle)) {
          const src = img.getAttribute("data-src") || 
                      img.getAttribute("src") || 
                      img.getAttribute("data-lazy-src");
          
          if (src && !src.includes("data:image") && !src.toLowerCase().includes("logo")) {
            console.log(`[scrapeNeoTroyImage] MATCH FOUND! Product: "${productTitle}", Image: ${src}`);
            return src;
          }
        }
      }
    }

    // Eğer tam eşleşme bulamadıysak ama ürünler varsa, ilk ürünün resmini (logo değilse) dönmeyi deneyebiliriz
    if (products.length > 0) {
      const firstImg = products[0].querySelector("img");
      const src = firstImg?.getAttribute("data-src") || firstImg?.getAttribute("src");
      if (src && !src.includes("data:image") && !src.toLowerCase().includes("logo")) {
        console.log(`[scrapeNeoTroyImage] No exact match, falling back to first product image: ${src}`);
        return src;
      }
    }

    console.log(`[scrapeNeoTroyImage] No matching product found for: ${title}`);
    return null;
  } catch (err: any) {
    console.error(`[scrapeNeoTroyImage] Failed for ${title}:`, err.message);
    return null;
  }
}

/**
 * Google üzerinden oyunun resmini bulmaya çalışır
 */
async function scrapeGameImage(title: string): Promise<string | null> {
  try {
    // Önce NeoTroy Games'i deneyelim (Türkçe içerik ve temiz görseller için)
    const neoTroyImg = await scrapeNeoTroyImage(title);
    if (neoTroyImg) return neoTroyImg;

    console.log(`[scrapeGameImage] Falling back to Google search for: ${title}`);
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.google.com/",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    };

    // Google Images araması
    // tbm=isch görsel araması için, sca_esv ve diğer parametreler bazen bot korumasını geçmeye yardımcı olabilir
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(title + " board game geek box art")}&tbm=isch&source=lnms`;
    console.log(`[scrapeGameImage] Requesting URL: ${searchUrl}`);
    const response = await axios.get(searchUrl, { headers, timeout: 10000 });
    const html = response.data;
    console.log(`[scrapeGameImage] Received HTML, length: ${html.length}`);
    
    // Debug için HTML'i dosyaya kaydedelim
    try {
      const debugPath = path.join(process.cwd(), "google_search_debug.html");
      fs.writeFileSync(debugPath, html);
      console.log(`[scrapeGameImage] Debug HTML saved to: ${debugPath}`);
    } catch (fsErr) {
      console.error(`[scrapeGameImage] Failed to save debug HTML:`, fsErr);
    }
    
    // Google Images HTML'indeki resim URL'lerini bulmaya çalışalım
    // 1. Standart URL'ler
    // 2. Escaped URL'ler (https:\/\/...)
    // 3. Google'ın tbn (thumbnail) URL'leri (uzantısız olabilir)
    const imgRegex = /(https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)|https?:\\\/\\\/[^"']+\.(?:jpg|jpeg|png|webp)|https?:\/\/encrypted-tbn[^"']+)/gi;
    const matches = html.match(imgRegex);
    console.log(`[scrapeGameImage] Found ${matches ? matches.length : 0} potential image matches`);
    
    if (matches) {
      for (let url of matches) {
        // Escaped slashes temizle
        url = url.replace(/\\/g, "");
        
        // Log individual matches for debugging
        console.log(`[scrapeGameImage] Checking URL: ${url.substring(0, 60)}...`);
        
        if (url.includes("gstatic.com") || url.includes("encrypted-tbn") || url.includes("google.com")) {
          if (url.includes("encrypted-tbn")) {
            console.log(`[scrapeGameImage] Selected encrypted-tbn URL: ${url}`);
            return url;
          }
        }
        if (url.includes("boardgamegeek.com/image")) {
          console.log(`[scrapeGameImage] Selected BGG image URL: ${url}`);
          return url;
        }
      }
      
      // Hiçbiri özel kriterlere uymadıysa ilkini temizleyip dön
      const finalUrl = matches[0].replace(/\\/g, "");
      console.log(`[scrapeGameImage] Falling back to first match: ${finalUrl}`);
      return finalUrl;
    }

    console.log(`[scrapeGameImage] No image matches found in HTML`);
    return null;
  } catch (err: any) {
    console.error(`[scrapeGameImage] Scraping failed for ${title}:`, err.message);
    return null;
  }
}

/**
 * Kütüphanedeki resimsiz oyunları BGG üzerinden arayıp resim ve eksik bilgileri tamamlar
 * POST /board-game-clubs/:clubId/sync-bgg
 */
export const syncClubGamesWithBgg = api(
  { expose: true, method: "POST", path: "/board-game-clubs/:clubId/sync-bgg" },
  async ({ clubId }: SyncBggRequest): Promise<SyncBggResponse> => {
    console.log(`[syncClubGamesWithBgg] Starting sync for club: ${clubId}`);
    // 1. Kulübün tüm oyunlarını çekelim
    const { data: games, error: fetchErr } = await supabase
      .schema("board_game_clubs")
      .rpc("get_club_games", { club_id_param: clubId });

    if (fetchErr || !games) {
      console.error(`[syncClubGamesWithBgg] Failed to fetch games:`, fetchErr);
      throw APIError.internal("Oyunlar çekilemedi");
    }

    console.log(`[syncClubGamesWithBgg] Total games found: ${games.length}`);

    // 2. Resimi olmayan veya BGG ID'si olmayan oyunları filtreleyelim
    const gamesToSync = (games as ClubGame[]).filter(
      (g) => !g.image_url
    );

    console.log(`[syncClubGamesWithBgg] Games needing sync: ${gamesToSync.length}`);

    let syncedCount = 0;
    let failedCount = 0;

    // NeoTroy JSON verilerini oku
    let neotroyGames: any[] = [];
    try {
      // Encore'da process.cwd() genellikle backend klasörüdür.
      // Eğer backend/backend oluşuyorsa, yolu düzeltelim.
      const cwd = process.cwd();
      let jsonPath = path.join(cwd, "board-game-clubs", "neotroy-games.json");
      
      // Eğer dosya yoksa ve biz ana klasördeysek (everything), backend ekleyelim
      if (!fs.existsSync(jsonPath)) {
        jsonPath = path.join(cwd, "backend", "board-game-clubs", "neotroy-games.json");
      }

      if (fs.existsSync(jsonPath)) {
        neotroyGames = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        console.log(`[syncClubGamesWithBgg] Loaded ${neotroyGames.length} games from JSON at: ${jsonPath}`);
      } else {
        console.error(`[syncClubGamesWithBgg] neotroy-games.json not found at: ${jsonPath}`);
      }
    } catch (err) {
      console.error(`[syncClubGamesWithBgg] Error reading neotroy-games.json:`, err);
    }

    // NeoTroy JSON verilerini normalize ederek bir map'e koyalım
    const neotroyMap = new Map<string, string>();
    neotroyGames.forEach(item => {
      const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!neotroyMap.has(normalizedTitle)) {
        neotroyMap.set(normalizedTitle, item.imageUrl);
      }
    });

    for (const game of gamesToSync) {
      try {
        console.log(`[syncClubGamesWithBgg] Processing game: "${game.title}" (ID: ${game.id})`);
        let imageUrl: string | null = null;
        
        // SADECE NeoTroy JSON'da arayalım
        const normalizedGameTitle = game.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        imageUrl = neotroyMap.get(normalizedGameTitle) || null;

        if (imageUrl) {
          console.log(`[syncClubGamesWithBgg] Image found in JSON: ${imageUrl.substring(0, 50)}...`);
          // Veritabanını güncelle
          const { error: updateErr } = await supabase.schema("board_game_clubs").rpc("update_club_game", {
            game_id_param: game.id,
            title_param: game.title,
            image_url_param: imageUrl,
            min_players_param: game.min_players,
            max_players_param: game.max_players,
            playing_time_param: game.playing_time,
            description_param: game.description,
            condition_param: game.condition,
            status_param: game.status,
            notes_param: game.notes,
          });
          
          if (updateErr) {
            console.error(`[syncClubGamesWithBgg] Database update failed for ${game.title}:`, updateErr);
            failedCount++;
          } else {
            syncedCount++;
            console.log(`[syncClubGamesWithBgg] Successfully synced image for: ${game.title}`);
          }
        } else {
          failedCount++;
          console.log(`[syncClubGamesWithBgg] Failed to find image in JSON for: ${game.title}`);
        }
      } catch (err: any) {
        console.error(`[syncClubGamesWithBgg] Unexpected error for ${game.title}:`, err.message);
        failedCount++;
      }
    }

    console.log(`[syncClubGamesWithBgg] Sync finished. Synced: ${syncedCount}, Failed: ${failedCount}`);
    return { syncedCount, failedCount };
  }
);

/**
 * CSV satırını virgüllere göre ayırır, tırnak içindeki virgülleri korur.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Oyuncu sayısı stringini (örn: "2-7", "2", "1-10+") min ve max olarak ayırır.
 */
function parsePlayerCount(playerStr: string): { min: number | null; max: number | null } {
  if (!playerStr) return { min: null, max: null };

  // "+" ve diğer sayısal olmayan karakterleri temizle (tire hariç)
  const cleaned = playerStr.replace(/[^\d-]/g, "");

  if (cleaned.includes("-")) {
    const parts = cleaned.split("-");
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    return {
      min: isNaN(min) ? null : min,
      max: isNaN(max) ? null : max,
    };
  } else {
    const val = parseInt(cleaned);
    return {
      min: isNaN(val) ? null : val,
      max: isNaN(val) ? null : val,
    };
  }
}
