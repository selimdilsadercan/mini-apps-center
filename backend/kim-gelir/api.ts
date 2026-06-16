import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface ActivityInvite {
  userId: string; // This is clerk_id returned from RPC
  username: string | null;
  avatar: string | null;
  status: 'gelirim' | 'belki' | 'gelemem' | 'bekliyor';
  selectedOptions: string[];
  updatedAt: string;
}

export interface Activity {
  id: string;
  creatorId: string; // This is clerk_id returned from RPC
  creatorUsername: string | null;
  creatorAvatar: string | null;
  title: string;
  location: string;
  timeOption: string;
  customTime: string | null;
  activityType: 'quick_invite' | 'plan_poll' | 'time_poll';
  options: string[];
  createdAt: string;
  expiresAt: string;
  responses: ActivityInvite[];
}

// ==================== REQUEST/RESPONSE TYPES ====================

export interface CreateActivityRequest {
  creatorId: string; // clerk_id
  title: string;
  location: string;
  timeOption: string;
  customTime?: string;
  invitedUserIds: string[]; // clerk_ids
  activityType?: string; // 'quick_invite', 'plan_poll', 'time_poll'
  options?: string[];
}

export interface CreateActivityResponse {
  activityId: string;
}

export interface RespondToActivityRequest {
  activityId: string;
  userId: string; // clerk_id
  status?: string; // 'gelirim', 'belki', 'gelemem', 'bekliyor'
  selectedOptions?: string[];
}

export interface RespondToActivityResponse {
  success: boolean;
}

export interface GetActivitiesRequest {
  userId: string; // clerk_id
}

export interface GetActivitiesResponse {
  activities: Activity[];
}

// ==================== API ENDPOINTS ====================

/**
 * Yeni aktivite daveti veya anket oluşturur
 * POST /kim-gelir/create
 */
export const createActivity = api(
  { expose: true, method: "POST", path: "/kim-gelir/create" },
  async (req: CreateActivityRequest): Promise<CreateActivityResponse> => {
    const { data, error } = await supabase.schema("kim_gelir").rpc("create_activity", {
      p_creator_clerk_id: req.creatorId,
      p_title: req.title,
      p_location: req.location,
      p_time_option: req.timeOption,
      p_custom_time: req.customTime || null,
      p_invited_clerk_ids: req.invitedUserIds,
      p_activity_type: req.activityType || 'quick_invite',
      p_options: req.options || [],
    });

    if (error) {
      console.error("createActivity error:", error);
      throw APIError.internal(`Failed to create activity: ${error.message}`);
    }

    return { activityId: data };
  }
);

/**
 * Aktiviteye katılım durumunu veya anket oylarını günceller
 * POST /kim-gelir/respond
 */
export const respondToActivity = api(
  { expose: true, method: "POST", path: "/kim-gelir/respond" },
  async (req: RespondToActivityRequest): Promise<RespondToActivityResponse> => {
    const { data, error } = await supabase.schema("kim_gelir").rpc("respond_to_activity", {
      p_activity_id: req.activityId,
      p_clerk_id: req.userId,
      p_status: req.status || 'bekliyor',
      p_selected_options: req.selectedOptions || [],
    });

    if (error) {
      console.error("respondToActivity error:", error);
      throw APIError.internal(`Failed to respond to activity: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Kullanıcıya ait aktif aktiviteleri ve anketleri listeler
 * GET /kim-gelir/activities/:userId
 */
export const getActivities = api(
  { expose: true, method: "GET", path: "/kim-gelir/activities/:userId" },
  async ({ userId }: GetActivitiesRequest): Promise<GetActivitiesResponse> => {
    const { data, error } = await supabase.schema("kim_gelir").rpc("get_activities", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getActivities error:", error);
      throw APIError.internal(`Failed to get activities: ${error.message}`);
    }

    const activities: Activity[] = (data || []).map((row: any) => ({
      id: row.id,
      creatorId: row.creator_clerk_id,
      creatorUsername: row.creator_username,
      creatorAvatar: row.creator_avatar,
      title: row.title,
      location: row.location,
      timeOption: row.time_option,
      customTime: row.custom_time || null,
      activityType: row.activity_type || 'quick_invite',
      options: row.options || [],
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      responses: (row.responses || []).map((item: any) => ({
        userId: item.userId,
        username: item.username,
        avatar: item.avatar,
        status: item.status || 'bekliyor',
        selectedOptions: item.selectedOptions || [],
        updatedAt: item.updatedAt
      })),
    }));

    return { activities };
  }
);

export interface AddActivityOptionRequest {
  activityId: string;
  option: string;
}

export interface AddActivityOptionResponse {
  success: boolean;
}

/**
 * Anket seçeneği ekler
 * POST /kim-gelir/add-option
 */
export const addActivityOption = api(
  { expose: true, method: "POST", path: "/kim-gelir/add-option" },
  async (req: AddActivityOptionRequest): Promise<AddActivityOptionResponse> => {
    const { data: act, error: getErr } = await supabase
      .schema("kim_gelir")
      .from("activities")
      .select("options")
      .eq("id", req.activityId)
      .single();

    if (getErr || !act) {
      throw APIError.notFound(`Activity not found: ${getErr?.message}`);
    }

    const currentOptions: string[] = (act.options as string[]) || [];
    if (currentOptions.includes(req.option)) {
      return { success: true };
    }

    const newOptions = [...currentOptions, req.option];

    const { error: updateErr } = await supabase
      .schema("kim_gelir")
      .from("activities")
      .update({ options: newOptions })
      .eq("id", req.activityId);

    if (updateErr) {
      throw APIError.internal(`Failed to add option: ${updateErr.message}`);
    }

    return { success: true };
  }
);

// ==================== EDIT & DELETE ENDPOINTS ====================

export interface EditActivityRequest {
  activityId: string;
  userId: string; // clerk_id
  title: string;
  location: string;
  timeOption: string;
  customTime?: string;
}

export interface EditActivityResponse {
  success: boolean;
}

/**
 * Aktiviteyi düzenler
 * POST /kim-gelir/edit
 */
export const editActivity = api(
  { expose: true, method: "POST", path: "/kim-gelir/edit" },
  async (req: EditActivityRequest): Promise<EditActivityResponse> => {
    // Get internal user ID for the creator check
    const { data: userData, error: userErr } = await supabase
      .schema("public")
      .from("users")
      .select("id")
      .or(`clerk_id.eq.${req.userId},local_clerk_id.eq.${req.userId}`)
      .single();

    if (userErr || !userData) {
      throw APIError.notFound("User not found");
    }

    const { error } = await supabase
      .schema("kim_gelir")
      .from("activities")
      .update({
        title: req.title,
        location: req.location,
        time_option: req.timeOption,
        custom_time: req.customTime || null,
      })
      .eq("id", req.activityId)
      .eq("creator_id", userData.id);

    if (error) {
      console.error("editActivity error:", error);
      throw APIError.internal(`Failed to edit activity: ${error.message}`);
    }

    return { success: true };
  }
);

export interface DeleteActivityRequest {
  activityId: string;
  userId: string; // clerk_id
}

export interface DeleteActivityResponse {
  success: boolean;
}

/**
 * Aktiviteyi siler
 * POST /kim-gelir/delete
 */
export const deleteActivity = api(
  { expose: true, method: "POST", path: "/kim-gelir/delete" },
  async (req: DeleteActivityRequest): Promise<DeleteActivityResponse> => {
    // Get internal user ID for the creator check
    const { data: userData, error: userErr } = await supabase
      .schema("public")
      .from("users")
      .select("id")
      .or(`clerk_id.eq.${req.userId},local_clerk_id.eq.${req.userId}`)
      .single();

    if (userErr || !userData) {
      throw APIError.notFound("User not found");
    }

    const { error } = await supabase
      .schema("kim_gelir")
      .from("activities")
      .delete()
      .eq("id", req.activityId)
      .eq("creator_id", userData.id);

    if (error) {
      console.error("deleteActivity error:", error);
      throw APIError.internal(`Failed to delete activity: ${error.message}`);
    }

    return { success: true };
  }
);
