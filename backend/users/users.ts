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

interface CreateUserResponse {
  user: User | null;
}

interface GetOrCreateUserRequest {
  clerkId: string;
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

    return { user: data?.[0] || null };
  }
);

/**
 * Clerk ID ile yeni Supabase user oluşturur
 * POST /identity/user/create
 */
export const createUser = api(
  { expose: true, method: "POST", path: "/users/user/create" },
  async ({ clerkId }: CreateUserRequest): Promise<CreateUserResponse> => {
    const { data, error } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
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
  async ({ clerkId }: GetOrCreateUserRequest): Promise<GetOrCreateUserResponse> => {
    // Önce mevcut user'ı ara
    const { data: existingData, error: existingError } = await supabase.rpc("users_get_user", {
      clerk_id_param: clerkId,
    });

    if (existingError) {
      console.error("getOrCreateUser - getUserByClerkId error:", existingError);
    }

    const existingUser = existingData?.[0] || null;

    if (existingUser) {
      return { user: existingUser, isNewUser: false };
    }

    // Yoksa oluştur
    console.log("Supabase user bulunamadı, yeni oluşturuluyor...");
    
    const { data: newData, error: newError } = await supabase.rpc("users_create_user", {
      clerk_id_param: clerkId,
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
