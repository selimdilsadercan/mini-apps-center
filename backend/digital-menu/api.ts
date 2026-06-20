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
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  order_index: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  dietary_flags: string[];
  order_index: number;
}

export interface WaiterCall {
  id: string;
  table_number: string;
  status: string;
  created_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface GetMenuDataResponse {
  categories: Category[];
  items: MenuItem[];
}

interface AddCategoryRequest {
  businessId: string;
  name: string;
}

interface AddCategoryResponse {
  category: Category | null;
}

interface AddMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryFlags: string[];
}

interface AddMenuItemResponse {
  item: MenuItem | null;
}

interface CallWaiterRequest {
  businessId: string;
  tableNumber: string;
}

interface CallWaiterResponse {
  success: boolean;
  call: WaiterCall | null;
}

interface ResolveWaiterCallRequest {
  callId: string;
}

interface ResolveWaiterCallResponse {
  success: boolean;
}

// ==================== ENDPOINTS ====================

/**
 * Get all user owned businesses
 * GET /digital-menu/businesses/:userId
 */
export const getOwnedBusinesses = api(
  { expose: true, method: "GET", path: "/digital-menu/businesses/:userId" },
  async ({ userId }: { userId: string }): Promise<{ businesses: Business[] }> => {
    const v_user_id = await supabase.rpc("get_internal_user_id", { p_user_id: userId });
    const { data, error } = await supabase
      .schema("business")
      .from("businesses")
      .select("*")
      .eq("owner_user_id", v_user_id.data);

    if (error) {
      console.error("getOwnedBusinesses error:", error);
      throw APIError.internal(`Failed to get owned businesses: ${error.message}`);
    }

    return { businesses: data || [] };
  }
);

/**
 * Get all available businesses (public list)
 * GET /digital-menu/all-businesses
 */
export const getAllBusinesses = api(
  { expose: true, method: "GET", path: "/digital-menu/all-businesses" },
  async (): Promise<{ businesses: Business[] }> => {
    const { data, error } = await supabase
      .schema("business")
      .from("businesses")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("getAllBusinesses error:", error);
      throw APIError.internal(`Failed to get all businesses: ${error.message}`);
    }

    return { businesses: data || [] };
  }
);

/**
 * Get specific business details
 * GET /digital-menu/business/:businessId
 */
export const getBusiness = api(
  { expose: true, method: "GET", path: "/digital-menu/business/:businessId" },
  async ({ businessId }: { businessId: string }): Promise<{ business: Business | null }> => {
    const { data, error } = await supabase
      .schema("business")
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (error) {
      console.error("getBusiness error:", error);
      throw APIError.internal(`Failed to get business: ${error.message}`);
    }

    return { business: data };
  }
);

/**
 * Get complete menu hierarchy for a business
 * GET /digital-menu/menu/:businessId
 */
export const getMenuData = api(
  { expose: true, method: "GET", path: "/digital-menu/menu/:businessId" },
  async ({ businessId }: { businessId: string }): Promise<GetMenuDataResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("get_menu_data", {
      p_business_id: businessId,
    });

    if (error) {
      console.error("getMenuData error:", error);
      throw APIError.internal(`Failed to get menu data: ${error.message}`);
    }

    const payload = data as any;
    return {
      categories: payload?.categories || [],
      items: payload?.items || [],
    };
  }
);


/**
 * Add a category to a business
 * POST /digital-menu/category/add
 */
export const addCategory = api(
  { expose: true, method: "POST", path: "/digital-menu/category/add" },
  async (req: AddCategoryRequest): Promise<AddCategoryResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("add_category", {
      p_business_id: req.businessId,
      p_name: req.name,
    });

    if (error) {
      console.error("addCategory error:", error);
      throw APIError.internal(`Failed to add category: ${error.message}`);
    }

    return { category: (data as Category) || null };
  }
);

/**
 * Add a menu item to a category
 * POST /digital-menu/item/add
 */
export const addMenuItem = api(
  { expose: true, method: "POST", path: "/digital-menu/item/add" },
  async (req: AddMenuItemRequest): Promise<AddMenuItemResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("add_menu_item", {
      p_category_id: req.categoryId,
      p_name: req.name,
      p_description: req.description,
      p_price: req.price,
      p_image_url: req.imageUrl,
      p_dietary_flags: req.dietaryFlags,
    });

    if (error) {
      console.error("addMenuItem error:", error);
      throw APIError.internal(`Failed to add menu item: ${error.message}`);
    }

    return { item: (data as MenuItem) || null };
  }
);

/**
 * Toggle menu item availability
 * POST /digital-menu/item/toggle/:itemId
 */
export const toggleAvailability = api(
  { expose: true, method: "POST", path: "/digital-menu/item/toggle/:itemId" },
  async ({ itemId }: { itemId: string }): Promise<{ success: boolean; isAvailable: boolean }> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("toggle_item_availability", {
      p_item_id: itemId,
    });

    if (error) {
      console.error("toggleAvailability error:", error);
      throw APIError.internal(`Failed to toggle availability: ${error.message}`);
    }

    return { success: true, isAvailable: !!data };
  }
);

/**
 * Call a waiter from a table
 * POST /digital-menu/waiter/call
 */
export const callWaiter = api(
  { expose: true, method: "POST", path: "/digital-menu/waiter/call" },
  async (req: CallWaiterRequest): Promise<CallWaiterResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("call_waiter", {
      p_business_id: req.businessId,
      p_table_number: req.tableNumber,
    });

    if (error) {
      console.error("callWaiter error:", error);
      throw APIError.internal(`Failed to call waiter: ${error.message}`);
    }

    return { success: true, call: (data as WaiterCall) || null };
  }
);

/**
 * Get active waiter calls for a business
 * GET /digital-menu/waiter/calls/:businessId
 */
export const getWaiterCalls = api(
  { expose: true, method: "GET", path: "/digital-menu/waiter/calls/:businessId" },
  async ({ businessId }: { businessId: string }): Promise<{ calls: WaiterCall[] }> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("get_waiter_calls", {
      p_business_id: businessId,
    });

    if (error) {
      console.error("getWaiterCalls error:", error);
      throw APIError.internal(`Failed to get waiter calls: ${error.message}`);
    }

    return { calls: data || [] };
  }
);

/**
 * Resolve an active waiter call
 * POST /digital-menu/waiter/resolve
 */
export const resolveWaiterCall = api(
  { expose: true, method: "POST", path: "/digital-menu/waiter/resolve" },
  async (req: ResolveWaiterCallRequest): Promise<ResolveWaiterCallResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("resolve_waiter_call", {
      p_call_id: req.callId,
    });

    if (error) {
      console.error("resolveWaiterCall error:", error);
      throw APIError.internal(`Failed to resolve waiter call: ${error.message}`);
    }

    return { success: !!data };
  }
);

interface ToggleFavoriteRequest {
  userId: string;
  businessId: string;
}

interface ToggleFavoriteResponse {
  isFavorited: boolean;
}

/**
 * Get user favorites
 * GET /digital-menu/favorites/:userId
 */
export const getUserFavorites = api(
  { expose: true, method: "GET", path: "/digital-menu/favorites/:userId" },
  async ({ userId }: { userId: string }): Promise<{ businessIds: string[] }> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("get_user_favorites", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getUserFavorites error:", error);
      throw APIError.internal(`Failed to get user favorites: ${error.message}`);
    }

    const ids = (data || []).map((row: any) => row.business_id);
    return { businessIds: ids };
  }
);

/**
 * Toggle favorite status
 * POST /digital-menu/favorites/toggle
 */
export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/digital-menu/favorites/toggle" },
  async (req: ToggleFavoriteRequest): Promise<ToggleFavoriteResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("toggle_favorite", {
      p_user_id: req.userId,
      p_business_id: req.businessId,
    });

    if (error) {
      console.error("toggleFavorite error:", error);
      throw APIError.internal(`Failed to toggle favorite: ${error.message}`);
    }

    return { isFavorited: !!data };
  }
);

interface UpdateMenuItemRequest {
  itemId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryFlags: string[];
}

interface UpdateMenuItemResponse {
  item: MenuItem | null;
}

/**
 * Update an existing menu item
 * POST /digital-menu/item/update
 */
export const updateMenuItem = api(
  { expose: true, method: "POST", path: "/digital-menu/item/update" },
  async (req: UpdateMenuItemRequest): Promise<UpdateMenuItemResponse> => {
    const { data, error } = await supabase.schema("digital_menu").rpc("update_menu_item", {
      p_item_id: req.itemId,
      p_category_id: req.categoryId,
      p_name: req.name,
      p_description: req.description,
      p_price: req.price,
      p_image_url: req.imageUrl,
      p_dietary_flags: req.dietaryFlags,
    });

    if (error) {
      console.error("updateMenuItem error:", error);
      throw APIError.internal(`Failed to update menu item: ${error.message}`);
    }

    return { item: (data as MenuItem) || null };
  }
);

/**
 * Proxy Unsplash search requests to bypass browser CORS policy
 * GET /digital-menu/unsplash/search
 */
export const searchUnsplash = api(
  { expose: true, method: "GET", path: "/digital-menu/unsplash/search" },
  async ({ query }: { query: string }): Promise<{ urls: string[] }> => {
    try {
      const response = await fetch(
        `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=9`
      );
      if (!response.ok) {
        throw new Error(`Unsplash returned status ${response.status}`);
      }
      const data = (await response.json()) as any;
      const urls = (data.results || []).map((img: any) => img.urls.regular);
      return { urls };
    } catch (error: any) {
      console.error("searchUnsplash error:", error);
      throw APIError.internal(`Failed to search Unsplash: ${error.message}`);
    }
  }
);


