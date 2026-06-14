import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { getGamesData } from "./games";

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
  quick_rules_tr: string[] | null;
  quick_rules_en: string[] | null;
  setup_tr: string[] | null;
  setup_en: string[] | null;
  objective_tr: string | null;
  objective_en: string | null;
  gameplay_tr: string[] | null;
  gameplay_en: string[] | null;
  scoring_tr: string[] | null;
  scoring_en: string[] | null;
  ending_tr: string[] | null;
  ending_en: string[] | null;
  notes_tr: string[] | null;
  notes_en: string[] | null;
  custom_sections: GameSection[] | null;
}

export interface GameSection {
  title_tr: string;
  title_en: string;
  content_tr: string[];
  content_en: string[];
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
    // 1. Fetch user states from Supabase via RPC
    const { data, error } = await supabase.schema("iskambil").rpc("get_user_game_states", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("Failed to load user state:", error);
      throw APIError.internal("Failed to load user games state from database");
    }

    const state = data?.[0] || { favorites: [], known_games: [], notes: {} };
    const favoritesSet = new Set(state.favorites || []);
    const knownSet = new Set(state.known_games || []);
    const notesMap = new Map(Object.entries(state.notes || {}));

    // 2. Map local games JSON data and merge user states
    const games: Game[] = getGamesData().map((g: any) => ({
      id: g.id,
      name_tr: g.name_tr,
      name_en: g.name_en,
      original_name: g.originalName || null,
      description_tr: g.description_tr,
      description_en: g.description_en,
      rules_tr: g.rules_tr || g.quickRules_tr || [],
      rules_en: g.rules_en || g.quickRules_en || [],
      min_players: g.minPlayers,
      max_players: g.maxPlayers,
      deck_count_tr: g.deckCount_tr,
      deck_count_en: g.deckCount_en,
      category_tr: g.category_tr,
      category_en: g.category_en,
      is_favorite: favoritesSet.has(g.id),
      is_known: knownSet.has(g.id),
      user_note: (notesMap.get(g.id) as string) || null,
      quick_rules_tr: g.quickRules_tr || null,
      quick_rules_en: g.quickRules_en || null,
      setup_tr: g.setup_tr || null,
      setup_en: g.setup_en || null,
      objective_tr: g.objective_tr || null,
      objective_en: g.objective_en || null,
      gameplay_tr: g.gameplay_tr || null,
      gameplay_en: g.gameplay_en || null,
      scoring_tr: g.scoring_tr || null,
      scoring_en: g.scoring_en || null,
      ending_tr: g.ending_tr || null,
      ending_en: g.ending_en || null,
      notes_tr: g.notes_tr || null,
      notes_en: g.notes_en || null,
      custom_sections: g.customSections ? g.customSections.map((s: any) => ({
        title_tr: s.title_tr,
        title_en: s.title_en,
        content_tr: s.content_tr,
        content_en: s.content_en
      })) : null,
    }));

    // 3. Sort alphabetically by game name
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

    return { success: true, isFavorite: data as boolean };
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

    return { success: true, isKnown: data as boolean };
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

    return { success: true, note: data as string | null };
  }
);
