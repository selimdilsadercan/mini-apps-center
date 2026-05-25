import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import gamesData from "./games_data.json";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Game {
  id: string;
  name_tr: string;
  name_en: string;
  original_name: string | null;
  description_tr: string;
  description_en: string;
  rules_tr: string[];
  rules_en: string[];
  min_players: number;
  max_players: number;
  deck_count_tr: string;
  deck_count_en: string;
  category_tr: string;
  category_en: string;
  is_favorite: boolean;
  is_known: boolean;
  user_note: string | null;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetGamesRequest {
  userId: string;
}

interface GetGamesResponse {
  games: Game[];
}

interface ToggleFavoriteRequest {
  gameId: string;
  userId: string;
}

interface ToggleFavoriteResponse {
  success: boolean;
  isFavorite: boolean;
}

interface ToggleKnownRequest {
  gameId: string;
  userId: string;
}

interface ToggleKnownResponse {
  success: boolean;
  isKnown: boolean;
}

interface SaveNoteRequest {
  gameId: string;
  userId: string;
  note: string;
}

interface SaveNoteResponse {
  success: boolean;
  note: string | null;
}

// ==================== API ENDPOINTS ====================

export const getGames = api(
  { expose: true, method: "GET", path: "/iskambil/games/:userId" },
  async ({ userId }: GetGamesRequest): Promise<GetGamesResponse> => {
    // 1. Fetch user states from Supabase in parallel
    const [favsResult, knownResult, notesResult] = await Promise.all([
      supabase.schema("iskambil").from("favorites").select("game_id").eq("clerk_id", userId),
      supabase.schema("iskambil").from("known_games").select("game_id").eq("clerk_id", userId),
      supabase.schema("iskambil").from("notes").select("game_id, note").eq("clerk_id", userId),
    ]);

    if (favsResult.error || knownResult.error || notesResult.error) {
      console.error("Failed to load user state:", {
        favsError: favsResult.error,
        knownError: knownResult.error,
        notesError: notesResult.error
      });
      throw APIError.internal("Failed to load user games state from database");
    }

    // 2. Build fast lookup sets/maps
    const favoritesSet = new Set((favsResult.data || []).map(f => f.game_id));
    const knownSet = new Set((knownResult.data || []).map(k => k.game_id));
    const notesMap = new Map((notesResult.data || []).map(n => [n.game_id, n.note]));

    // 3. Map local games JSON data and merge user states
    const games: Game[] = gamesData.map((g: any) => ({
      id: g.id,
      name_tr: g.name_tr,
      name_en: g.name_en,
      original_name: g.originalName || null,
      description_tr: g.description_tr,
      description_en: g.description_en,
      rules_tr: g.rules_tr,
      rules_en: g.rules_en,
      min_players: g.minPlayers,
      max_players: g.maxPlayers,
      deck_count_tr: g.deckCount_tr,
      deck_count_en: g.deckCount_en,
      category_tr: g.category_tr,
      category_en: g.category_en,
      is_favorite: favoritesSet.has(g.id),
      is_known: knownSet.has(g.id),
      user_note: notesMap.get(g.id) || null
    }));

    // 4. Sort alphabetically by game name
    games.sort((a, b) => a.name_tr.localeCompare(b.name_tr, "tr"));

    return { games };
  }
);

/**
 * Bir oyunu favorilere ekler veya çıkartır
 * POST /iskambil/favorite
 */
export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/iskambil/favorite" },
  async ({ gameId, userId }: ToggleFavoriteRequest): Promise<ToggleFavoriteResponse> => {
    const { data, error } = await supabase.schema("iskambil").rpc("toggle_favorite", {
      game_id_param: gameId,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("toggleFavorite error:", error);
      throw APIError.internal(`Failed to toggle favorite status: ${error.message}`);
    }

    return { success: true, isFavorite: !!data };
  }
);

/**
 * Bir oyunu bildiğim oyunlar listesine ekler veya çıkartır
 * POST /iskambil/known
 */
export const toggleKnown = api(
  { expose: true, method: "POST", path: "/iskambil/known" },
  async ({ gameId, userId }: ToggleKnownRequest): Promise<ToggleKnownResponse> => {
    const { data, error } = await supabase.schema("iskambil").rpc("toggle_known", {
      game_id_param: gameId,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("toggleKnown error:", error);
      throw APIError.internal(`Failed to toggle known status: ${error.message}`);
    }

    return { success: true, isKnown: !!data };
  }
);


/**
 * Bir oyun için kullanıcının özel notlarını kaydeder veya günceller
 * POST /iskambil/note
 */
export const saveNote = api(
  { expose: true, method: "POST", path: "/iskambil/note" },
  async ({ gameId, userId, note }: SaveNoteRequest): Promise<SaveNoteResponse> => {
    const { data, error } = await supabase.schema("iskambil").rpc("save_note", {
      game_id_param: gameId,
      clerk_id_param: userId,
      note_param: note,
    });

    if (error) {
      console.error("saveNote error:", error);
      throw APIError.internal(`Failed to save note: ${error.message}`);
    }

    return { success: true, note: data };
  }
);


