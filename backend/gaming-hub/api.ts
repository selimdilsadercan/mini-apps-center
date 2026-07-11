import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type GameStatus = "wishlist" | "backlog" | "playing" | "completed";

export interface LibraryItem {
  id: string;
  gameName: string;
  platform: string;
  status: GameStatus;
  playTime: number; // in minutes
  rating: number | null;
  notes: string | null;
  updatedAt: string;
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

// ==================== API ENDPOINTS ====================

/**
 * Adds or updates a game in the user's library.
 * POST /gaming-hub/library
 */
export const upsertLibraryItem = api(
  { expose: true, method: "POST", path: "/gaming-hub/library" },
  async (req: UpsertLibraryRequest): Promise<{ itemId: string }> => {
    const { data, error } = await supabase.schema("gaming_hub").rpc("upsert_library_item", {
      p_clerk_id: req.userId,
      p_game_name: req.gameName,
      p_platform: req.platform,
      p_status: req.status,
      p_play_time: req.playTime ?? 0,
      p_rating: req.rating ?? null,
      p_notes: req.notes ?? null,
    });

    if (error) {
      console.error("upsertLibraryItem error:", error);
      throw APIError.internal(`Failed to upsert library item: ${error.message}`);
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
      playTime: row.play_time,
      rating: row.rating,
      notes: row.notes,
      updatedAt: row.updated_at,
    }));

    return { items };
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
