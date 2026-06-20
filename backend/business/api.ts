import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  theme_color: string;
  font_family: string;
  created_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface CreateBusinessRequest {
  userId: string;
  name: string;
  description: string;
  logoUrl: string;
  themeColor: string;
}

interface UpdateBusinessRequest {
  businessId: string;
  name: string;
  description: string;
  logoUrl: string;
  themeColor: string;
  fontFamily: string;
}

interface BusinessResponse {
  business: Business | null;
}

// ==================== ENDPOINTS ====================

/**
 * Create a new business profile
 * POST /business/create
 */
export const createBusiness = api(
  { expose: true, method: "POST", path: "/business/create" },
  async (req: CreateBusinessRequest): Promise<BusinessResponse> => {
    const { data, error } = await supabase.schema("business").rpc("create_business", {
      p_user_id: req.userId,
      p_name: req.name,
      p_description: req.description,
      p_logo_url: req.logoUrl,
      p_theme_color: req.themeColor,
    });

    if (error) {
      console.error("createBusiness error:", error);
      throw APIError.internal(`Failed to create business: ${error.message}`);
    }

    return { business: (data as Business) || null };
  }
);

/**
 * Update business details
 * POST /business/update
 */
export const updateBusiness = api(
  { expose: true, method: "POST", path: "/business/update" },
  async (req: UpdateBusinessRequest): Promise<BusinessResponse> => {
    const { data, error } = await supabase.schema("business").rpc("update_business", {
      p_business_id: req.businessId,
      p_name: req.name,
      p_description: req.description,
      p_logo_url: req.logoUrl,
      p_theme_color: req.themeColor,
      p_font_family: req.fontFamily,
    });

    if (error) {
      console.error("updateBusiness error:", error);
      throw APIError.internal(`Failed to update business: ${error.message}`);
    }

    return { business: (data as Business) || null };
  }
);

/**
 * Get all businesses owned by a specific user
 * GET /business/owned/:userId
 */
export const getOwnedBusinesses = api(
  { expose: true, method: "GET", path: "/business/owned/:userId" },
  async ({ userId }: { userId: string }): Promise<{ businesses: Business[] }> => {
    const { data, error } = await supabase.schema("business").rpc("get_owned_businesses", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getOwnedBusinesses error:", error);
      throw APIError.internal(`Failed to get businesses: ${error.message}`);
    }

    return { businesses: (data as Business[]) || [] };
  }
);

/**
 * Get specific business details
 * GET /business/get/:id
 */
export const getBusiness = api(
  { expose: true, method: "GET", path: "/business/get/:id" },
  async ({ id }: { id: string }): Promise<{ business: Business | null }> => {
    const { data, error } = await supabase.schema("business").rpc("get_business", {
      p_business_id: id,
    });

    if (error) {
      console.error("getBusiness error:", error);
      throw APIError.internal(`Failed to get business: ${error.message}`);
    }

    return { business: (data as Business) || null };
  }
);
