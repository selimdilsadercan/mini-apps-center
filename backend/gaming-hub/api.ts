import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import {
  discoverCoopGames,
  discoverPopularGames,
  getGame,
  searchGames,
  type CatalogGame,
} from "./igdb";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type GameStatus = "wishlist" | "backlog" | "playing" | "completed";
export type GameMode = "single" | "multi";

export interface LibraryItem {
  id: string;
  gameName: string;
  platform: string;
  status: GameStatus;
  gameMode: GameMode;
  igdbId: string | null;
  coverUrl: string | null;
  playTime: number; // in minutes
  rating: number | null;
  notes: string | null;
  updatedAt: string;
}

export interface DailyTask {
  id: string;
  gameName: string;
  igdbId: string | null;
  coverUrl: string | null;
  goalMinutes: number;
  completed: boolean;
  taskDate: string;
}

export interface PriceAlert {
  id: string;
  gameName: string;
  platform: string;
  targetPrice: number;
  currentPrice: number | null;
  isTriggered: boolean;
  createdAt: string;
}

export interface PlayStats {
  dailyLimit: number; // in minutes
  weeklyLimit: number; // in minutes
  todayMinutes: number;
  weekMinutes: number;
}

// ==================== REQUEST / RESPONSE ====================

export interface UpsertLibraryRequest {
  userId: string; // clerk_id
  gameName: string;
  platform: string;
  status: GameStatus;
  gameMode?: GameMode;
  igdbId?: string;
  coverUrl?: string;
  playTime?: number;
  rating?: number;
  notes?: string;
}

export interface LibraryResponse {
  items: LibraryItem[];
}

export interface AddPriceAlertRequest {
  userId: string;
  gameName: string;
  platform: string;
  targetPrice: number;
}

export interface PriceAlertsResponse {
  alerts: PriceAlert[];
}

export interface LogSessionRequest {
  userId: string;
  gameName: string;
  duration: number; // in minutes
}

export interface HabitLimitsRequest {
  userId: string;
  dailyLimit: number; // in minutes
  weeklyLimit: number; // in minutes
}

// ==================== IGDB CATALOG TYPES ====================

export type { CatalogGame };

export interface SearchGamesResponse {
  games: CatalogGame[];
}

export interface DiscoverGamesResponse {
  games: CatalogGame[];
}

// ==================== API ENDPOINTS ====================

function isMissingRpc(error: { code?: string } | null): boolean {
  return error?.code === "PGRST202";
}

/**
 * Adds or updates a game in the user's library.
 * POST /gaming-hub/library
 */
export const upsertLibraryItem = api(
  { expose: true, method: "POST", path: "/gaming-hub/library" },
  async (req: UpsertLibraryRequest): Promise<{ itemId: string }> => {
    let { data, error } = await supabase.schema("gaming_hub").rpc("upsert_library_item", {
      p_clerk_id: req.userId,
      p_game_name: req.gameName,
      p_platform: req.platform,
      p_status: req.status,
      p_play_time: req.playTime ?? 0,
      p_rating: req.rating ?? null,
      p_notes: req.notes ?? null,
      p_game_mode: req.gameMode ?? "single",
      p_igdb_id: req.igdbId ?? null,
      p_cover_url: req.coverUrl ?? null,
    });

    if (isMissingRpc(error)) {
      console.warn("upsertLibraryItem: using legacy RPC signature");
      ({ data, error } = await supabase.schema("gaming_hub").rpc("upsert_library_item", {
        p_clerk_id: req.userId,
        p_game_name: req.gameName,
        p_platform: req.platform,
        p_status: req.status,
        p_play_time: req.playTime ?? 0,
        p_rating: req.rating ?? null,
        p_notes: req.notes ?? null,
      }));
    }

    if (error) {
      console.error("upsertLibraryItem error:", error);
      throw APIError.invalidArgument("Oyun eklenemedi. Lütfen tekrar deneyin.");
    }

    return { itemId: data };
  }
);

/**
 * Retrieves the user's library.
 * GET /gaming-hub/library
 */
export const getUserLibrary = api(
  { expose: true, method: "GET", path: "/gaming-hub/library" },
  async (req: { userId: string }): Promise<LibraryResponse> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("get_user_library", {
      p_clerk_id: req.userId,
    });

    if (error) {
      console.error("getUserLibrary error:", error);
      throw APIError.internal(`Failed to get library: ${error.message}`);
    }

    const items: LibraryItem[] = (data || []).map((row: any) => ({
      id: row.id,
      gameName: row.game_name,
      platform: row.platform,
      status: row.status as GameStatus,
      gameMode: (row.game_mode ?? "single") as GameMode,
      igdbId: row.igdb_id ?? null,
      coverUrl: row.cover_url ?? null,
      playTime: row.play_time,
      rating: row.rating,
      notes: row.notes,
      updatedAt: row.updated_at,
    }));

    return { items };
  }
);

/**
 * Removes a game from the user's library.
 * DELETE /gaming-hub/library/:itemId/:userId
 */
export const deleteLibraryItem = api(
  { expose: true, method: "DELETE", path: "/gaming-hub/library/:itemId/:userId" },
  async (req: { itemId: string; userId: string }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("delete_library_item", {
      p_clerk_id: req.userId,
      p_item_id: req.itemId,
    });

    if (error) {
      console.error("deleteLibraryItem error:", error);
      throw APIError.internal(`Failed to delete library item: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Registers a new target price alert for a game.
 * POST /gaming-hub/price-alerts
 */
export const addPriceAlert = api(
  { expose: true, method: "POST", path: "/gaming-hub/price-alerts" },
  async (req: AddPriceAlertRequest): Promise<{ alertId: string }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("add_price_alert", {
      p_clerk_id: req.userId,
      p_game_name: req.gameName,
      p_platform: req.platform,
      p_target_price: req.targetPrice,
    });

    if (error) {
      console.error("addPriceAlert error:", error);
      throw APIError.internal(`Failed to add price alert: ${error.message}`);
    }

    return { alertId: data };
  }
);

/**
 * Gets a list of user's price alerts.
 * GET /gaming-hub/price-alerts
 */
export const getPriceAlerts = api(
  { expose: true, method: "GET", path: "/gaming-hub/price-alerts" },
  async (req: { userId: string }): Promise<PriceAlertsResponse> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("get_price_alerts", {
      p_clerk_id: req.userId,
    });

    if (error) {
      console.error("getPriceAlerts error:", error);
      throw APIError.internal(`Failed to get price alerts: ${error.message}`);
    }

    const alerts: PriceAlert[] = (data || []).map((row: any) => ({
      id: row.id,
      gameName: row.game_name,
      platform: row.platform,
      targetPrice: parseFloat(row.target_price),
      currentPrice: row.current_price ? parseFloat(row.current_price) : null,
      isTriggered: row.is_triggered,
      createdAt: row.created_at,
    }));

    return { alerts };
  }
);

/**
 * Logs a play session and increments library play time.
 * POST /gaming-hub/play-logs
 */
export const logPlaySession = api(
  { expose: true, method: "POST", path: "/gaming-hub/play-logs" },
  async (req: LogSessionRequest): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("gaming_hub").rpc("log_play_session", {
      p_clerk_id: req.userId,
      p_game_name: req.gameName,
      p_duration: req.duration,
    });

    if (error) {
      console.error("logPlaySession error:", error);
      throw APIError.internal(`Failed to log play session: ${error.message}`);
    }

    return { success: true };
  }
);

/**
 * Sets daily and weekly playtime limits.
 * POST /gaming-hub/habits
 */
export const upsertHabitLimits = api(
  { expose: true, method: "POST", path: "/gaming-hub/habits" },
  async (req: HabitLimitsRequest): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("gaming_hub").rpc("upsert_habit_limits", {
      p_clerk_id: req.userId,
      p_daily_limit: req.dailyLimit,
      p_weekly_limit: req.weeklyLimit,
    });

    if (error) {
      console.error("upsertHabitLimits error:", error);
      throw APIError.internal(`Failed to update habit limits: ${error.message}`);
    }

    return { success: true };
  }
);

/**
 * Retrieves playtime statistics and limit compliance.
 * GET /gaming-hub/stats
 */
export const getPlayStats = api(
  { expose: true, method: "GET", path: "/gaming-hub/stats" },
  async (req: { userId: string }): Promise<PlayStats> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("get_play_stats", {
      p_clerk_id: req.userId,
    });

    if (error) {
      console.error("getPlayStats error:", error);
      throw APIError.internal(`Failed to get play stats: ${error.message}`);
    }

    const row = data && data[0] ? data[0] : { daily_limit: 120, weekly_limit: 840, today_minutes: 0, week_minutes: 0 };

    return {
      dailyLimit: row.daily_limit,
      weeklyLimit: row.weekly_limit,
      todayMinutes: row.today_minutes,
      weekMinutes: row.week_minutes,
    };
  }
);

/**
 * Get today's daily gaming task.
 * GET /gaming-hub/daily-task
 */
export const getDailyTask = api(
  { expose: true, method: "GET", path: "/gaming-hub/daily-task" },
  async (req: { userId: string }): Promise<{ task: DailyTask | null }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("get_daily_task", {
      p_clerk_id: req.userId,
    });

    if (error) {
      // Migration not applied yet — treat as no task instead of surfacing 500.
      if (error.code === "PGRST202") {
        console.warn("getDailyTask: RPC missing, run gaming-hub migrations");
        return { task: null };
      }
      console.error("getDailyTask error:", error);
      throw APIError.internal(`Failed to get daily task: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) return { task: null };

    return {
      task: {
        id: row.id,
        gameName: row.game_name,
        igdbId: row.igdb_id,
        coverUrl: row.cover_url,
        goalMinutes: row.goal_minutes,
        completed: row.completed,
        taskDate: row.task_date,
      },
    };
  }
);

/**
 * Set today's daily gaming task.
 * POST /gaming-hub/daily-task
 */
export const setDailyTask = api(
  { expose: true, method: "POST", path: "/gaming-hub/daily-task" },
  async (req: {
    userId: string;
    gameName: string;
    igdbId?: string;
    coverUrl?: string;
    goalMinutes?: number;
  }): Promise<{ taskId: string }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("set_daily_task", {
      p_clerk_id: req.userId,
      p_game_name: req.gameName,
      p_igdb_id: req.igdbId ?? null,
      p_cover_url: req.coverUrl ?? null,
      p_goal_minutes: req.goalMinutes ?? 60,
    });

    if (error) {
      console.error("setDailyTask error:", error);
      throw APIError.internal(`Failed to set daily task: ${error.message}`);
    }

    return { taskId: data };
  }
);

/**
 * Mark today's daily task as completed.
 * POST /gaming-hub/daily-task/complete
 */
export const completeDailyTask = api(
  { expose: true, method: "POST", path: "/gaming-hub/daily-task/complete" },
  async (req: { userId: string }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("complete_daily_task", {
      p_clerk_id: req.userId,
    });

    if (error) {
      console.error("completeDailyTask error:", error);
      throw APIError.internal(`Failed to complete daily task: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Search games via IGDB catalog.
 * GET /gaming-hub/games/search
 */
export const searchCatalogGames = api(
  { expose: true, method: "GET", path: "/gaming-hub/games/search" },
  async (req: { title: string; limit?: number }): Promise<SearchGamesResponse> => {
    if (!req.title?.trim()) {
      return { games: [] };
    }

    try {
      const games = await searchGames(req.title.trim(), req.limit ?? 10);
      return { games };
    } catch (err) {
      console.error("searchCatalogGames error:", err);
      throw APIError.internal("Oyun araması başarısız oldu");
    }
  }
);

/**
 * Get a single game from IGDB by ID.
 * GET /gaming-hub/games/:gameId
 */
export const getCatalogGame = api(
  { expose: true, method: "GET", path: "/gaming-hub/games/:gameId" },
  async (req: { gameId: string }): Promise<{ game: CatalogGame | null }> => {
    try {
      const game = await getGame(req.gameId);
      return { game };
    } catch (err) {
      console.error("getCatalogGame error:", err);
      throw APIError.internal("Oyun bilgisi alınamadı");
    }
  }
);

/**
 * Discover co-op and popular games from IGDB.
 * GET /gaming-hub/games/discover
 */
export const discoverGames = api(
  { expose: true, method: "GET", path: "/gaming-hub/games/discover" },
  async (req: { mode?: "coop" | "popular"; limit?: number }): Promise<DiscoverGamesResponse> => {
    try {
      const limit = req.limit ?? 20;
      const games =
        req.mode === "popular"
          ? await discoverPopularGames(limit)
          : await discoverCoopGames(limit);
      return { games };
    } catch (err) {
      console.error("discoverGames error:", err);
      throw APIError.internal("Oyun keşfi başarısız oldu");
    }
  }
);
