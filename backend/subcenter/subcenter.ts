import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  plan_name: string;
  region: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  start_date: string;
  created_at: string;
}

export interface GlobalPreset {
  id: string;
  name: string;
  plan_name: string;
  region: string;
  avg_price: number;
  currency: string;
  category: string;
  color: string;
  icon: string;
  usage_count: number;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetUserSubscriptionsRequest {
  userId: string;
}

interface GetUserSubscriptionsResponse {
  subscriptions: Subscription[];
}

interface CreateSubscriptionRequest {
  userId: string;
  name: string;
  planName?: string;
  region?: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  startDate: string;
}

interface CreateSubscriptionResponse {
  subscription: Subscription | null;
}

interface GetGlobalPresetsResponse {
  presets: GlobalPreset[];
}

interface DeleteSubscriptionRequest {
  id: string;
  userId: string;
}

interface DeleteSubscriptionResponse {
  success: boolean;
}

interface UpdateSubscriptionRequest {
  id: string;
  userId: string;
  name: string;
  planName: string;
  region: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  startDate: string;
}

interface UpdateSubscriptionResponse {
  subscription: Subscription | null;
}

// ==================== API ENDPOINTS ====================

/**
 * Get top community-driven subscription presets
 * GET /subcenter/presets
 */
export const getGlobalPresets = api(
  { expose: true, method: "GET", path: "/subcenter/presets" },
  async (): Promise<GetGlobalPresetsResponse> => {
    const { data, error } = await supabase.rpc("subcenter_get_global_presets", {
      limit_param: 15,
    });

    if (error) {
      console.error("getGlobalPresets error:", error);
      return { presets: [] }; // Fallback to empty
    }

    return { presets: data || [] };
  }
);

/**
 * Get all subscriptions for a user
 * GET /subcenter/user/:userId
 */
export const getUserSubscriptions = api(
  { expose: true, method: "GET", path: "/subcenter/user/:userId" },
  async ({ userId }: GetUserSubscriptionsRequest): Promise<GetUserSubscriptionsResponse> => {
    const { data, error } = await supabase.rpc("subcenter_get_user_items", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getUserSubscriptions error:", error);
      throw APIError.internal(`Failed to load subscriptions: ${error.message}`);
    }

    return { subscriptions: data || [] };
  }
);

/**
 * Create a new subscription and update community presets
 * POST /subcenter/create
 */
export const createSubscription = api(
  { expose: true, method: "POST", path: "/subcenter/create" },
  async ({ userId, name, planName, region, price, currency, cycle, category, color, icon, startDate }: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> => {
    const finalPlanName = planName || "Standard";
    const finalRegion = region || "TR";

    // 1. Save locally for the user
    const { data, error } = await supabase.rpc("subcenter_create_item", {
      clerk_id_param: userId,
      name_param: name,
      plan_name_param: finalPlanName,
      region_param: finalRegion,
      price_param: price,
      currency_param: currency,
      cycle_param: cycle,
      category_param: category,
      color_param: color,
      icon_param: icon,
      start_date_param: startDate,
    });

    if (error) {
      console.error("createSubscription error:", error);
      throw APIError.internal(`Failed to create subscription: ${error.message}`);
    }

    // 2. Intelligence: Contribution to Global Community Presets
    supabase.rpc("subcenter_upsert_global_preset", {
      name_param: name,
      plan_name_param: finalPlanName,
      region_param: finalRegion,
      price_param: price,
      category_param: category,
      color_param: color,
      icon_param: icon,
    }).then(({ error: globalError }) => {
      if (globalError) console.error("Global Preset Upsert Error:", globalError);
    });

    return { subscription: data?.[0] || null };
  }
);

/**
 * Delete a subscription
 * DELETE /subcenter/:id
 */
export const deleteSubscription = api(
  { expose: true, method: "DELETE", path: "/subcenter/:id" },
  async ({ id, userId }: DeleteSubscriptionRequest): Promise<DeleteSubscriptionResponse> => {
    const { data, error } = await supabase.rpc("subcenter_delete_item", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteSubscription error:", error);
      throw APIError.internal(`Failed to delete subscription: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Update a subscription
 * PUT /subcenter/:id
 */
export const updateSubscription = api(
  { expose: true, method: "PUT", path: "/subcenter/:id" },
  async ({ id, userId, name, planName, region, price, currency, cycle, category, color, icon, startDate }: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> => {
    const { data, error } = await supabase.rpc("subcenter_update_item", {
      item_id_param: id,
      clerk_id_param: userId,
      name_param: name,
      plan_name_param: planName,
      region_param: region,
      price_param: price,
      currency_param: currency,
      cycle_param: cycle,
      category_param: category,
      color_param: color,
      icon_param: icon,
      start_date_param: startDate,
    });

    if (error) {
      console.error("updateSubscription error:", error);
      throw APIError.internal(`Failed to update subscription: ${error.message}`);
    }

    return { subscription: data?.[0] || null };
  }
);
