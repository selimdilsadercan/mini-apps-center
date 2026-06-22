import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Player {
  id: string;
  name: string;
  initial: string;
  created_at: string;
}

export interface GameSave {
  id: string;
  name: string;
  game_template: string;
  players: any; // jsonb structure (list of player objects/ids)
  settings: any; // jsonb settings
  state: any; // jsonb scores & rounds state
  created_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface ClerkUserRequest {
  userId: string;
}

interface CreatePlayerRequest {
  userId: string;
  name: string;
  initial: string;
}

interface UpdatePlayerRequest {
  userId: string;
  playerId: string;
  name: string;
  initial: string;
}

interface DeletePlayerRequest {
  userId: string;
  playerId: string;
}

interface CreateGameSaveRequest {
  userId: string;
  name: string;
  gameTemplate: string;
  players: any;
  settings: any;
  state: any;
}

interface GetGameSaveByIdRequest {
  userId: string;
  saveId: string;
}

interface DeleteGameSaveRequest {
  userId: string;
  saveId: string;
}

interface UpdateGameSaveRequest {
  userId: string;
  saveId: string;
  name?: string;
  players?: any;
  settings?: any;
  state?: any;
}

// ==================== ENDPOINTS ====================

/**
 * Kişileri/Oyuncuları getirir
 * GET /yazboz/players/:userId
 */
export const getPlayers = api(
  { expose: true, method: "GET", path: "/yazboz/players/:userId" },
  async ({ userId }: ClerkUserRequest): Promise<{ players: Player[] }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("get_players", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getPlayers error:", error);
      throw APIError.internal(`Failed to get players: ${error.message}`);
    }

    return { players: data || [] };
  }
);

/**
 * Yeni kişi/oyuncu oluşturur
 * POST /yazboz/players
 */
export const createPlayer = api(
  { expose: true, method: "POST", path: "/yazboz/players" },
  async ({ userId, name, initial }: CreatePlayerRequest): Promise<{ player: Player | null }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("create_player", {
      clerk_id_param: userId,
      name_param: name,
      initial_param: initial,
    });

    if (error) {
      console.error("createPlayer error:", error);
      throw APIError.internal(`Failed to create player: ${error.message}`);
    }

    return { player: (data as Player) || null };
  }
);

/**
 * Kişiyi/Oyuncuyu günceller
 * POST /yazboz/players/update
 */
export const updatePlayer = api(
  { expose: true, method: "POST", path: "/yazboz/players/update" },
  async ({ userId, playerId, name, initial }: UpdatePlayerRequest): Promise<{ player: Player | null }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("update_player", {
      clerk_id_param: userId,
      player_id_param: playerId,
      name_param: name,
      initial_param: initial,
    });

    if (error) {
      console.error("updatePlayer error:", error);
      throw APIError.internal(`Failed to update player: ${error.message}`);
    }

    return { player: (data as Player) || null };
  }
);

/**
 * Kişiyi/Oyuncuyu siler
 * POST /yazboz/players/delete
 */
export const deletePlayer = api(
  { expose: true, method: "POST", path: "/yazboz/players/delete" },
  async ({ userId, playerId }: DeletePlayerRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("delete_player", {
      clerk_id_param: userId,
      player_id_param: playerId,
    });

    if (error) {
      console.error("deletePlayer error:", error);
      throw APIError.internal(`Failed to delete player: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Yeni bir oyun kaydı oluşturur / başlatır
 * POST /yazboz/game-saves
 */
export const createGameSave = api(
  { expose: true, method: "POST", path: "/yazboz/game-saves" },
  async ({ userId, name, gameTemplate, players, settings, state }: CreateGameSaveRequest): Promise<{ gameSave: GameSave | null }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("create_game_save", {
      clerk_id_param: userId,
      name_param: name,
      game_template_param: gameTemplate,
      players_param: players,
      settings_param: settings,
      state_param: state || {},
    });

    if (error) {
      console.error("createGameSave error:", error);
      throw APIError.internal(`Failed to create game save: ${error.message}`);
    }

    return { gameSave: (data as GameSave) || null };
  }
);

/**
 * Kullanıcının tüm kayıtlı oyunlarını listeler
 * GET /yazboz/game-saves/:userId
 */
export const getGameSaves = api(
  { expose: true, method: "GET", path: "/yazboz/game-saves/:userId" },
  async ({ userId }: ClerkUserRequest): Promise<{ gameSaves: GameSave[] }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("get_game_saves", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getGameSaves error:", error);
      throw APIError.internal(`Failed to get game saves: ${error.message}`);
    }

    return { gameSaves: data || [] };
  }
);

/**
 * Belirli bir oyun kaydının detayını getirir
 * GET /yazboz/game-saves/get/:userId/:saveId
 */
export const getGameSaveById = api(
  { expose: true, method: "GET", path: "/yazboz/game-saves/get/:userId/:saveId" },
  async ({ userId, saveId }: GetGameSaveByIdRequest): Promise<{ gameSave: GameSave | null }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("get_game_save_by_id", {
      clerk_id_param: userId,
      save_id_param: saveId,
    });

    if (error) {
      console.error("getGameSaveById error:", error);
      throw APIError.internal(`Failed to get game save: ${error.message}`);
    }

    return { gameSave: (data as GameSave) || null };
  }
);

/**
 * Oyun kaydını siler
 * POST /yazboz/game-saves/delete
 */
export const deleteGameSave = api(
  { expose: true, method: "POST", path: "/yazboz/game-saves/delete" },
  async ({ userId, saveId }: DeleteGameSaveRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("delete_game_save", {
      clerk_id_param: userId,
      save_id_param: saveId,
    });

    if (error) {
      console.error("deleteGameSave error:", error);
      throw APIError.internal(`Failed to delete game save: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Oyun kaydını günceller
 * POST /yazboz/game-saves/update
 */
export const updateGameSave = api(
  { expose: true, method: "POST", path: "/yazboz/game-saves/update" },
  async ({ userId, saveId, name, players, settings, state }: UpdateGameSaveRequest): Promise<{ gameSave: GameSave | null }> => {
    const { data, error } = await supabase.schema("yazboz").rpc("update_game_save", {
      clerk_id_param: userId,
      save_id_param: saveId,
      name_param: name || null,
      players_param: players || null,
      settings_param: settings || null,
      state_param: state || null,
    });

    if (error) {
      console.error("updateGameSave error:", error);
      throw APIError.internal(`Failed to update game save: ${error.message}`);
    }

    return { gameSave: (data as GameSave) || null };
  }
);
