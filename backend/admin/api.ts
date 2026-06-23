import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient, User } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface AdminUser extends User {
  role?: string | null;
  total_count: number;
}

export interface AdminBusiness {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  theme_color: string;
  font_family: string;
  created_at: string;
  owner_user_id: string;
  owner_username: string | null;
  owner_full_name: string | null;
  total_count: number;
}

// ==================== REQUEST / RESPONSE ====================

interface ListRequest {
  limit?: number;
  offset?: number;
}

interface ListUsersResponse {
  users: AdminUser[];
  totalCount: number;
}

interface ListBusinessesResponse {
  businesses: AdminBusiness[];
  totalCount: number;
}

// ==================== ENDPOINTS ====================

/**
 * Tüm kullanıcıları listeler (Admin Only)
 */
export const listUsers = api(
  { expose: true, method: "GET", path: "/admin/users" },
  async (req: ListRequest): Promise<ListUsersResponse> => {
    const { data, error } = await supabase.rpc("users_list_users", {
      limit_param: req.limit || 50,
      offset_param: req.offset || 0,
    });

    if (error) {
      console.error("admin.listUsers error:", error);
      throw APIError.internal(`Failed to list users: ${error.message}`);
    }

    const totalCount = data?.[0]?.total_count || 0;
    return { 
      users: (data as AdminUser[]) || [],
      totalCount: Number(totalCount)
    };
  }
);

/**
 * Tüm işletmeleri listeler (Admin Only)
 */
export const listBusinesses = api(
  { expose: true, method: "GET", path: "/admin/businesses" },
  async (req: ListRequest): Promise<ListBusinessesResponse> => {
    const { data, error } = await supabase.schema("business").rpc("list_businesses", {
      limit_param: req.limit || 50,
      offset_param: req.offset || 0,
    });

    if (error) {
      console.error("admin.listBusinesses error:", error);
      throw APIError.internal(`Failed to list businesses: ${error.message}`);
    }

    const totalCount = data?.[0]?.total_count || 0;
    return { 
      businesses: (data as AdminBusiness[]) || [],
      totalCount: Number(totalCount)
    };
  }
);
