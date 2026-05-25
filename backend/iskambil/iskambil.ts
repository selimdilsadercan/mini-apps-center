import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Game {
  id: string;
  name: string;
  description: string;
  rules: string[];
  min_players: number;
  max_players: number;
  deck_count: string;
  category: string;
  is_favorite: boolean;
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

/**
 * Kullanıcıya özel favori ve not bilgileriyle birlikte tüm oyunları listeler
 * GET /iskambil/games/:userId
 */
export const getGames = api(
  { expose: true, method: "GET", path: "/iskambil/games/:userId" },
  async ({ userId }: GetGamesRequest): Promise<GetGamesResponse> => {
    const { data, error } = await supabase.schema("iskambil").rpc("get_games", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getGames error:", error);
      throw APIError.internal(`Failed to load card games: ${error.message}`);
    }

    return { games: data || [] };
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

/**
 * Temporary migration/update endpoint
 */
export const runSeedUpdate = api(
  { expose: true, method: "POST", path: "/iskambil/dev/update-category" },
  async (): Promise<{ success: boolean }> => {
    const { error } = await supabase
      .schema("iskambil")
      .from("games")
      .update({ category: "El Bitirme" })
      .eq("category", "Kart Boşaltma");

    if (error) {
      console.error("Update category error:", error);
      throw APIError.internal(`Failed to update category: ${error.message}`);
    }

    return { success: true };
  }
);

