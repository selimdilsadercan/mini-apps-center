import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { appMeta } from "encore.dev";
import { createSupabaseClient, User } from "../lib/supabase";

const isLocal = appMeta().environment.cloud === "local";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserByClerkIdRequest {
  clerkId: string;
}

interface GetUserByClerkIdResponse {
  user: User | null;
}

interface CreateUserRequest {
  clerkId: string;
  firebaseId?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

interface CreateUserResponse {
  user: User | null;
}

interface GetOrCreateUserRequest {
  clerkId: string;
  firebaseId?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

interface GetOrCreateUserResponse {
  user: User | null;
  isNewUser: boolean;
}

interface SaveFcmTokenRequest {
  clerkId: string;
  token: string;
  deviceType: string;
}

interface SaveFcmTokenResponse {
  success: boolean;
}

interface UpdateAppOrderRequest {
  clerkId: string;
  appOrder: string[];
}

interface UpdateAppOrderResponse {
  success: boolean;
}

interface GetUserPreferencesRequest {
  clerkId: string;
}

interface GetUserPreferencesResponse {
  appOrder: string[] | null;
  selectedUniversity?: string | null;
  isOnboardingFinished?: boolean;
}

interface SetOnboardingFinishedRequest {
  clerkId: string;
  finished: boolean;
}

interface SetOnboardingFinishedResponse {
  success: boolean;
}

interface UpdateUniversityRequest {
  clerkId: string;
  university: string;
}

interface UpdateUniversityResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Clerk ID ile Supabase user'ı getirir
 */
export const getUserByClerkId = api(
  { expose: true, method: "GET", path: "/users/user/clerk/:clerkId" },
  async ({ clerkId }: GetUserByClerkIdRequest): Promise<GetUserByClerkIdResponse> => {
    const { data, error } = await supabase.rpc("users_get_user", {
      clerk_id_param: clerkId,
      is_local_param: isLocal,
      firebase_id_param: clerkId,
    });

    if (error) {
      console.error("getUserByClerkId error:", error);
      return { user: null };
    }

    return { user: data?.[0] || null };
  }
);

/**
 * Clerk ID ile yeni Supabase user oluşturur
 */
export const createUser = api(
  { expose: true, method: "POST", path: "/users/user/create" },
  async ({ clerkId, firebaseId, username, fullName, avatarUrl }: CreateUserRequest): Promise<CreateUserResponse> => {
    const { data, error } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
      username_param: username || null,
      avatar_url_param: avatarUrl || null,
      full_name_param: fullName || null,
      is_local_param: isLocal,
      firebase_id_param: firebaseId || clerkId,
    });

    if (error) {
      console.error("createUser error:", error);
      return { user: null };
    }

    return { user: data?.[0] || null };
  }
);

/**
 * Clerk ID ile Supabase user'ı getirir, yoksa oluşturur
 */
export const getOrCreateUser = api(
  { expose: true, method: "POST", path: "/users/user/get-or-create" },
  async ({ clerkId, firebaseId, username, fullName, avatarUrl }: GetOrCreateUserRequest): Promise<GetOrCreateUserResponse> => {
    // Önce mevcut user'ı ara
    const { data: existingData, error: existingError } = await supabase.rpc("users_get_user", {
      clerk_id_param: clerkId,
      is_local_param: isLocal,
      firebase_id_param: firebaseId || clerkId,
    });

    if (existingError) {
      console.error("getOrCreateUser - getUserByClerkId error:", existingError);
    }

    const existingUser = existingData?.[0] || null;

    if (existingUser) {
      // Mevcut user'ın username, full_name veya avatar'ı eksikse veya değiştiyse güncelle
      if (
        (username && existingUser.username !== username) ||
        (fullName && existingUser.full_name !== fullName) ||
        (avatarUrl && existingUser.avatar_url !== avatarUrl)
      ) {
        const { data: updatedData, error: updateError } = await supabase.rpc("users_create_user", {
          clerk_id_param: clerkId,
          username_param: username || existingUser.username,
          avatar_url_param: avatarUrl || existingUser.avatar_url,
          full_name_param: fullName || existingUser.full_name,
          is_local_param: isLocal,
          firebase_id_param: firebaseId || clerkId,
        });
        if (!updateError && updatedData?.[0]) {
          return { user: updatedData[0], isNewUser: false };
        }
      }
      return { user: existingUser, isNewUser: false };
    }

    // Yoksa oluştur
    const { data: newData, error: newError } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
      username_param: username || null,
      avatar_url_param: avatarUrl || null,
      full_name_param: fullName || null,
      is_local_param: isLocal,
      firebase_id_param: firebaseId || clerkId,
    });

    if (newError) {
      console.error("getOrCreateUser - createUser error:", newError);
      return { user: null, isNewUser: false };
    }

    return { user: newData?.[0] || null, isNewUser: true };
  }
);


/**
 * Kullanıcının FCM token'ını kaydeder veya günceller
 */
export const saveFcmToken = api(
  { expose: true, method: "POST", path: "/users/fcm-token" },
  async ({ clerkId, token, deviceType }: SaveFcmTokenRequest): Promise<SaveFcmTokenResponse> => {
    const { error } = await supabase
      .from("user_fcm_tokens")
      .upsert(
        {
          clerk_id: clerkId,
          fcm_token: token,
          device_type: deviceType,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "clerk_id,fcm_token" }
      );

    if (error) {
      console.error("saveFcmToken error:", error);
      return { success: false };
    }

    return { success: true };
  }
);

/**
 * Kullanıcının uygulama sıralamasını günceller
 */
export const updateAppOrder = api(
  { expose: true, method: "POST", path: "/users/app-order" },
  async ({ clerkId, appOrder }: UpdateAppOrderRequest): Promise<UpdateAppOrderResponse> => {
    const { error } = await supabase.rpc("update_user_app_order", {
      clerk_id_param: clerkId,
      app_order_param: appOrder,
      is_local_param: isLocal,
    });

    if (error) {
      console.error("updateAppOrder error:", error);
      return { success: false };
    }

    return { success: true };
  }
);

export const getUserPreferences = api(
  { expose: true, method: "GET", path: "/users/preferences/:clerkId" },
  async ({ clerkId }: GetUserPreferencesRequest): Promise<GetUserPreferencesResponse> => {
    const { data, error } = await supabase.rpc("get_user_preferences", {
      clerk_id_param: clerkId,
      is_local_param: isLocal,
    });

    if (error) {
      console.error("getUserPreferences error:", error);
      return { appOrder: null, selectedUniversity: null, isOnboardingFinished: false };
    }

    return { 
      appOrder: data?.[0]?.app_order || null,
      selectedUniversity: data?.[0]?.selected_university || null,
      isOnboardingFinished: data?.[0]?.is_onboarding_finished || false
    };
  }
);

/**
 * Kullanıcının onboarding durumunu günceller
 */
export const setOnboardingFinished = api(
  { expose: true, method: "POST", path: "/users/onboarding-finished" },
  async ({ clerkId, finished }: SetOnboardingFinishedRequest): Promise<SetOnboardingFinishedResponse> => {
    const { error } = await supabase.rpc("update_onboarding_finished", {
      clerk_id_param: clerkId,
      finished_param: finished,
      is_local_param: isLocal,
    });

    if (error) {
      console.error("setOnboardingFinished error:", error);
      return { success: false };
    }

    return { success: true };
  }
);

/**
 * Kullanıcının seçtiği üniversiteyi günceller
 */
export const updateUniversity = api(
  { expose: true, method: "POST", path: "/users/university" },
  async ({ clerkId, university }: UpdateUniversityRequest): Promise<UpdateUniversityResponse> => {
    const { error } = await supabase.rpc("update_user_university", {
      clerk_id_param: clerkId,
      university_param: university,
      is_local_param: isLocal,
    });

    if (error) {
      console.error("updateUniversity error:", error);
      return { success: false };
    }

    return { success: true };
  }
);

interface CheckAdminRequest {
  clerkId: string;
}

interface CheckAdminResponse {
  isAdmin: boolean;
}

/**
 * Clerk ID ile kullanıcının admin olup olmadığını sorgular
 */
export const checkAdmin = api(
  { expose: true, method: "GET", path: "/users/admin/check/:clerkId" },
  async ({ clerkId }: CheckAdminRequest): Promise<CheckAdminResponse> => {
    const { data: isAdminRpc, error } = await supabase.rpc("is_admin", {
      p_clerk_id: clerkId,
      is_local_param: isLocal,
    });

    if (error) {
      console.warn("checkAdmin is_admin RPC failed, checking table directly:", error.message);
      const query = supabase.from("users").select("role");
      if (isLocal) {
        query.eq("local_clerk_id", clerkId);
      } else {
        query.eq("clerk_id", clerkId);
      }
      const { data, error: tableError } = await query.maybeSingle();

      if (tableError || !data) {
        return { isAdmin: false };
      }
      return { isAdmin: data.role === "admin" };
    }

    return { isAdmin: !!isAdminRpc };
  }
);

interface GetUserByUsernameRequest {
  username: string;
}

interface GetUserByUsernameResponse {
  user: User | null;
}

/**
 * Username ile Supabase user'ı getirir
 */
export const getUserByUsername = api(
  { expose: true, method: "GET", path: "/users/user/username/:username" },
  async ({ username }: GetUserByUsernameRequest): Promise<GetUserByUsernameResponse> => {
    const cleanedUsername = username.trim().toLowerCase();
    const { data, error } = await supabase.rpc("users_get_user_by_username", {
      username_param: cleanedUsername,
    });

    if (error) {
      console.error("getUserByUsername error:", error);
      return { user: null };
    }

    return { user: data?.[0] || null };
  }
);

interface DeleteUserRequest {
  clerkId: string;
}

interface DeleteUserResponse {
  success: boolean;
}

export type NotificationAppsJson = Record<string, Record<string, unknown>>;

interface GetNotificationOptInsRequest {
  clerkId: string;
}

interface GetNotificationOptInsResponse {
  apps: NotificationAppsJson;
  updatedAt: string | null;
}

interface SetNotificationAppOptInRequest {
  clerkId: string;
  appKey: string;
  patch: Record<string, unknown>;
}

interface SetNotificationAppOptInResponse {
  app: Record<string, unknown>;
  apps: NotificationAppsJson;
}

/**
 * Kullanıcı hesabını ve ilişkili verileri kalıcı olarak siler
 */
export const deleteUser = api(
  { expose: true, method: "DELETE", path: "/users/user/:clerkId" },
  async ({ clerkId }: DeleteUserRequest): Promise<DeleteUserResponse> => {
    const { data, error } = await supabase.rpc("delete_user_by_clerk_id", {
      clerk_id_param: clerkId,
      is_local_param: isLocal,
    });

    if (error) {
      console.error("deleteUser error:", error);
      return { success: false };
    }

    return { success: !!data };
  }
);

/**
 * Kullanıcının uygulama bazlı bildirim izinlerini getirir (JSON wrapper).
 */
export const getNotificationOptIns = api(
  { expose: true, method: "GET", path: "/users/notification-opt-ins/:clerkId" },
  async ({ clerkId }: GetNotificationOptInsRequest): Promise<GetNotificationOptInsResponse> => {
    const { data, error } = await supabase.rpc("get_notification_opt_ins", {
      clerk_id_param: clerkId,
    });

    if (error) {
      console.error("getNotificationOptIns error:", error);
      return { apps: {}, updatedAt: null };
    }

    const row = data?.[0];
    return {
      apps: (row?.apps as NotificationAppsJson) ?? {},
      updatedAt: row?.updated_at ?? null,
    };
  },
);

/**
 * Belirli bir uygulama için bildirim iznini JSON patch ile günceller.
 * Örn. appKey: "itu_yemekhane", patch: { enabled: true }
 */
export const setNotificationAppOptIn = api(
  { expose: true, method: "POST", path: "/users/notification-opt-ins" },
  async ({
    clerkId,
    appKey,
    patch,
  }: SetNotificationAppOptInRequest): Promise<SetNotificationAppOptInResponse> => {
    await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
      is_local_param: isLocal,
      firebase_id_param: clerkId,
    });

    const { data: merged, error: mergeError } = await supabase.rpc(
      "merge_notification_app_opt_in",
      {
        clerk_id_param: clerkId,
        app_key_param: appKey,
        patch_param: patch,
      },
    );

    if (mergeError) {
      console.error("setNotificationAppOptIn error:", mergeError);
      throw APIError.internal(`Failed to save notification opt-in: ${mergeError.message}`);
    }

    const { data, error } = await supabase.rpc("get_notification_opt_ins", {
      clerk_id_param: clerkId,
    });

    if (error) {
      console.error("setNotificationAppOptIn reload error:", error);
      return {
        app: (merged as Record<string, unknown>) ?? {},
        apps: { [appKey]: (merged as Record<string, unknown>) ?? {} },
      };
    }

    const apps = (data?.[0]?.apps as NotificationAppsJson) ?? {};
    return {
      app: (merged as Record<string, unknown>) ?? getAppPatch(apps, appKey),
      apps,
    };
  },
);

function getAppPatch(apps: NotificationAppsJson, appKey: string): Record<string, unknown> {
  const raw = apps[appKey];
  return raw && typeof raw === "object" ? raw : {};
}
