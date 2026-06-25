import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Business {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  logo_url: string | null;
  header_url: string | null;
  theme_color: string;
  font_family: string;
  created_at: string;
  owner_user_id: string;
  enabled_apps: string[];
  contact_info: any;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  created_at: string;
  clerk_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

// ==================== REQUEST / RESPONSE ====================

interface CreateBusinessRequest {
  userId: string;
  name: string;
  description: string;
  logoUrl: string;
  headerUrl?: string;
  themeColor: string;
  contactInfo?: any;
}

interface UpdateBusinessRequest {
  businessId: string;
  name: string;
  description: string;
  logoUrl: string;
  headerUrl: string;
  themeColor: string;
  fontFamily: string;
  contactInfo: any;
}

interface BusinessResponse {
  business: Business | null;
}

interface AddBusinessUserRequest {
  businessId: string;
  clerkId: string;
  role: string;
}

interface RemoveBusinessUserRequest {
  businessId: string;
  clerkId: string;
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
      p_header_url: req.headerUrl || null,
      p_theme_color: req.themeColor,
      p_contact_info: req.contactInfo || {},
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
      p_header_url: req.headerUrl,
      p_theme_color: req.themeColor,
      p_font_family: req.fontFamily,
      p_contact_info: req.contactInfo,
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

    const biz = Array.isArray(data) ? data[0] : data;
    console.log("[Business] getBusiness result:", JSON.stringify(biz));
    return { business: (biz as Business) || null };
  }
);

/**
 * Get specific business details by slug
 * GET /business/get-by-slug/:slug
 */
export const getBusinessBySlug = api(
  { expose: true, method: "GET", path: "/business/get-by-slug/:slug" },
  async ({ slug }: { slug: string }): Promise<{ business: Business | null }> => {
    console.log("[Business] getBusinessBySlug called with slug:", slug);
    
    const { data, error } = await supabase.schema("business").rpc("get_business_by_slug", {
      p_slug: slug,
    });

    if (error) {
      console.error("[Business] getBusinessBySlug error:", error);
      // Fallback to direct query if RPC fails
      const { data: directData, error: directError } = await supabase
        .schema("business")
        .from("businesses")
        .select("*")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
        
      if (directError) {
        throw APIError.internal(`Failed to get business: ${directError.message}`);
      }
      
      if (directData) {
        return { business: (directData as Business) };
      }
      return { business: null };
    }

    const biz = Array.isArray(data) ? data[0] : data;
    console.log("[Business] getBusinessBySlug result:", JSON.stringify(biz));
    return { business: (biz as Business) || null };
  }
);

/**
 * Delete a business entirely
 * POST /business/delete
 */
export const deleteBusiness = api(
  { expose: true, method: "POST", path: "/business/delete" },
  async ({ businessId }: { businessId: string }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("business").rpc("delete_business", {
      p_business_id: businessId,
    });

    if (error) {
      console.error("deleteBusiness error:", error);
      throw APIError.internal(`Failed to delete business: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Add a user to a business
 * POST /business/users/add
 */
export const addBusinessUser = api(
  { expose: true, method: "POST", path: "/business/users/add" },
  async (req: AddBusinessUserRequest): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("business").rpc("add_business_user", {
      p_business_id: req.businessId,
      p_user_id: req.clerkId,
      p_role: req.role,
    });

    if (error) {
      console.error("addBusinessUser error:", error);
      throw APIError.internal(`Failed to add user: ${error.message}`);
    }

    return { success: true };
  }
);

/**
 * Get all users of a business
 * GET /business/users/:businessId
 */
export const getBusinessUsers = api(
  { expose: true, method: "GET", path: "/business/users/:businessId" },
  async ({ businessId }: { businessId: string }): Promise<{ users: BusinessUser[] }> => {
    const { data, error } = await supabase.schema("business").rpc("get_business_users", {
      p_business_id: businessId,
    });

    if (error) {
      console.error("getBusinessUsers error:", error);
      throw APIError.internal(`Failed to get users: ${error.message}`);
    }

    return { users: (data as BusinessUser[]) || [] };
  }
);

/**
 * Remove a user from a business
 * POST /business/users/remove
 */
export const removeBusinessUser = api(
  { expose: true, method: "POST", path: "/business/users/remove" },
  async (req: RemoveBusinessUserRequest): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("business").rpc("remove_business_user", {
      p_business_id: req.businessId,
      p_user_id: req.clerkId,
    });

    if (error) {
      console.error("removeBusinessUser error:", error);
      throw APIError.internal(`Failed to remove user: ${error.message}`);
    }

    return { success: true };
  }
);
