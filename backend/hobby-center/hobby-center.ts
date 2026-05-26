import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type HobbyStatus = "interested" | "in_progress" | "learned";

export interface UserHobbyTrack {
  id: string;
  user_id: string | null;
  clerk_id: string;
  hobby_id: string;
  status: HobbyStatus;
  notes: string;
  completed_steps: number[];
  created_at: string;
  updated_at: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserHobbiesRequest {
  userId: string;
}

interface GetUserHobbiesResponse {
  tracks: UserHobbyTrack[];
}

interface UpdateUserHobbyRequest {
  userId: string;
  hobbyId: string;
  status: HobbyStatus;
  notes: string;
  completedSteps: number[];
}

interface UpdateUserHobbyResponse {
  track: UserHobbyTrack | null;
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının takip ettiği tüm hobileri ve durumlarını getirir
 * GET /hobby-center/user/:userId
 */
export const getUserHobbies = api(
  { expose: true, method: "GET", path: "/hobby-center/user/:userId" },
  async ({ userId }: GetUserHobbiesRequest): Promise<GetUserHobbiesResponse> => {
    const { data, error } = await supabase.schema("hobby_center").rpc("get_user_hobbies", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getUserHobbies error:", error);
      throw APIError.internal(`Failed to load user hobbies: ${error.message}`);
    }

    return { tracks: data || [] };
  }
);

/**
 * Kullanıcının bir hobi için kaydını günceller veya oluşturur
 * POST /hobby-center/update
 */
export const updateUserHobby = api(
  { expose: true, method: "POST", path: "/hobby-center/update" },
  async ({ userId, hobbyId, status, notes, completedSteps }: UpdateUserHobbyRequest): Promise<UpdateUserHobbyResponse> => {
    const { data, error } = await supabase.schema("hobby_center").rpc("update_user_hobby", {
      clerk_id_param: userId,
      hobby_id_param: hobbyId,
      status_param: status,
      notes_param: notes,
      completed_steps_param: completedSteps,
    });

    if (error) {
      console.error("updateUserHobby error:", error);
      throw APIError.internal(`Failed to update user hobby track: ${error.message}`);
    }

    return { track: data?.[0] || null };
  }
);
