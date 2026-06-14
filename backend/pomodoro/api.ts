import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface PomodoroSession {
  id: string;
  userId: string;
  type: 'work' | 'break';
  durationMinutes: number;
  completedAt: string;
}

// ==================== REQUEST / RESPONSE INTERFACES ====================

export interface SaveSessionRequest {
  userId: string; // clerk_id
  type: 'work' | 'break';
  durationMinutes: number;
}

export interface GetSessionsResponse {
  sessions: PomodoroSession[];
}

// ==================== API ENDPOINTS ====================

/**
 * Saves a completed pomodoro session
 * POST /pomodoro/session
 */
export const saveSession = api(
  { expose: true, method: "POST", path: "/pomodoro/session" },
  async (req: SaveSessionRequest): Promise<PomodoroSession> => {
    const { data, error } = await supabase.schema("pomodoro").rpc("save_session", {
      p_clerk_id: req.userId,
      p_type: req.type,
      p_duration_minutes: req.durationMinutes,
    });

    if (error) {
      console.error("saveSession error:", error);
      throw APIError.internal(`Failed to save session: ${error.message}`);
    }

    const row = data as any;
    return {
      id: row.id,
      userId: req.userId,
      type: row.type,
      durationMinutes: row.duration_minutes,
      completedAt: row.completed_at,
    };
  }
);

/**
 * Gets all pomodoro sessions for a user
 * GET /pomodoro/sessions/:userId
 */
export const getSessions = api(
  { expose: true, method: "GET", path: "/pomodoro/sessions/:userId" },
  async ({ userId }: { userId: string }): Promise<GetSessionsResponse> => {
    const { data, error } = await supabase.schema("pomodoro").rpc("get_sessions", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getSessions error:", error);
      throw APIError.internal(`Failed to fetch sessions: ${error.message}`);
    }

    const sessions = (data as any[] || []).map(row => ({
      id: row.id,
      userId: userId,
      type: row.type,
      durationMinutes: row.duration_minutes,
      completedAt: row.completed_at,
    }));

    return { sessions };
  }
);
