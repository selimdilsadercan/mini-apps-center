import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient, User } from "../lib/supabase";

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
}

interface CreateUserRequest {
  clerkId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

interface CreateUserResponse {
  user: User | null;
}

interface GetOrCreateUserRequest {
  clerkId: string;
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
}

// ==================== API ENDPOINTS ====================

/**
 * Clerk ID ile Supabase user'ı getirir
 * GET /identity/user/clerk/:clerkId
 */
export const getUserByClerkId = api(
  { expose: true, method: "GET", path: "/users/user/clerk/:clerkId" },
  async ({ clerkId }: GetUserByClerkIdRequest): Promise<GetUserByClerkIdResponse> => {
    const { data, error } = await supabase.rpc("users_get_user", {
      clerk_id_param: clerkId,
    });

    if (error) {
      console.error("getUserByClerkId error:", error);
      return { user: null };
    }

    console.log("DB USER RETRIEVED:", data?.[0]);
    return { user: data?.[0] || null };
  }
);

/**
 * Clerk ID ile yeni Supabase user oluşturur
 * POST /identity/user/create
 */
export const createUser = api(
  { expose: true, method: "POST", path: "/users/user/create" },
  async ({ clerkId, username, fullName, avatarUrl }: CreateUserRequest): Promise<CreateUserResponse> => {
    const { data, error } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
      username_param: username || null,
      avatar_url_param: avatarUrl || null,
      full_name_param: fullName || null,
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
 * POST /identity/user/get-or-create
 */
export const getOrCreateUser = api(
  { expose: true, method: "POST", path: "/users/user/get-or-create" },
  async ({ clerkId, username, fullName, avatarUrl }: GetOrCreateUserRequest): Promise<GetOrCreateUserResponse> => {
    // Önce mevcut user'ı ara
    const { data: existingData, error: existingError } = await supabase.rpc("users_get_user", {
      clerk_id_param: clerkId,
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
        });
        if (!updateError && updatedData?.[0]) {
          return { user: updatedData[0], isNewUser: false };
        }
      }
      return { user: existingUser, isNewUser: false };
    }

    // Yoksa oluştur
    console.log("Supabase user bulunamadı, yeni oluşturuluyor...");
    
    const { data: newData, error: newError } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
      username_param: username || null,
      avatar_url_param: avatarUrl || null,
      full_name_param: fullName || null,
    });

    if (newError) {
      console.error("getOrCreateUser - createUser error:", newError);
      return { user: null, isNewUser: false };
    }

    const newUser = newData?.[0] || null;

    if (newUser) {
      console.log("Yeni Supabase user oluşturuldu:", newUser.id);
    }

    return { user: newUser, isNewUser: true };
  }
);


/**
 * Kullanıcının FCM token'ını kaydeder veya günceller
 * POST /users/fcm-token
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
 * POST /users/app-order
 */
export const updateAppOrder = api(
  { expose: true, method: "POST", path: "/users/app-order" },
  async ({ clerkId, appOrder }: UpdateAppOrderRequest): Promise<UpdateAppOrderResponse> => {
    const { error } = await supabase.rpc("update_user_app_order", {
      clerk_id_param: clerkId,
      app_order_param: appOrder,
    });

    if (error) {
      console.error("updateAppOrder error:", error);
      return { success: false };
    }

    return { success: true };
  }
);

/**
 * Kullanıcının tercihlerini (sıralama vb.) getirir
 * GET /users/preferences/:clerkId
 */
export const getUserPreferences = api(
  { expose: true, method: "GET", path: "/users/preferences/:clerkId" },
  async ({ clerkId }: GetUserPreferencesRequest): Promise<GetUserPreferencesResponse> => {
    const { data, error } = await supabase.rpc("get_user_preferences", {
      clerk_id_param: clerkId,
    });

    if (error) {
      console.error("getUserPreferences error:", error);
      return { appOrder: null };
    }

    return { appOrder: data?.[0]?.app_order || null };
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
 * GET /users/admin/check/:clerkId
 */
export const checkAdmin = api(
  { expose: true, method: "GET", path: "/users/admin/check/:clerkId" },
  async ({ clerkId }: CheckAdminRequest): Promise<CheckAdminResponse> => {
    const { data: isAdminRpc, error } = await supabase.rpc("is_admin", {
      p_clerk_id: clerkId,
    });

    if (error) {
      console.warn("checkAdmin is_admin RPC failed, checking table directly:", error.message);
      const { data, error: tableError } = await supabase
        .from("users")
        .select("role")
        .eq("clerk_id", clerkId)
        .maybeSingle();

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
 * GET /users/user/username/:username
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

