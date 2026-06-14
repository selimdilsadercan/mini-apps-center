import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

import { getPresetsData } from "./data";
import { getUsdTryRateFromTcmb, type TcmbExchangeRate } from "./tcmb";

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
  trial_duration: string | null;
  website: string | null;
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
  domain?: string;
}

export interface SubscriptionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

function loadPresets(): GlobalPreset[] {
  return (getPresetsData() as any[]).map((p, idx) => ({
    id: `${p.name.toLowerCase().replace(/\s+/g, "-")}-${p.plan_name.toLowerCase().replace(/\s+/g, "-")}-${p.region.toLowerCase()}`,
    name: p.name,
    plan_name: p.plan_name,
    region: p.region,
    avg_price: p.price,
    currency: p.currency,
    category: p.category,
    color: p.color,
    icon: p.icon,
    usage_count: 1,
    domain: p.domain
  }));
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
  trialDuration?: string | null;
  website?: string | null;
}

interface CreateSubscriptionResponse {
  subscription: Subscription | null;
}

interface GetGlobalPresetsResponse {
  presets: GlobalPreset[];
}

interface GetCategoriesResponse {
  categories: SubscriptionCategory[];
}

type GetExchangeRateResponse = TcmbExchangeRate;

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
  trialDuration?: string | null;
  website?: string | null;
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
    return { presets: loadPresets() };
  }
);

export const getCategories = api(
  { expose: true, method: "GET", path: "/subcenter/categories" },
  async (): Promise<GetCategoriesResponse> => {
    const presets = loadPresets();
    const names = Array.from(new Set(presets.map((p) => p.category)));
    const categories = names.map((name) => {
      const meta: { icon: string; color: string; sort_order: number } = {
        "Entertainment": { icon: "🎬", color: "#E50914", sort_order: 1 },
        "Music": { icon: "🎵", color: "#1DB954", sort_order: 2 },
        "AI": { icon: "🤖", color: "#10A37F", sort_order: 3 },
        "Software": { icon: "💻", color: "#6366F1", sort_order: 4 },
        "Design": { icon: "✨", color: "#00C4CC", sort_order: 5 },
        "Social": { icon: "💬", color: "#1877F2", sort_order: 6 },
        "Cloud Storage": { icon: "☁️", color: "#0284C7", sort_order: 7 },
        "Dating": { icon: "❤️", color: "#EC4899", sort_order: 8 },
        "Education": { icon: "🎓", color: "#F59E0B", sort_order: 9 },
        "Finance": { icon: "💵", color: "#10B981", sort_order: 10 },
        "Gaming": { icon: "🎮", color: "#8B5CF6", sort_order: 11 },
        "Productivity": { icon: "⚡", color: "#3B82F6", sort_order: 12 },
        "Security": { icon: "🛡️", color: "#14B8A6", sort_order: 13 },
        "Shopping": { icon: "🛍️", color: "#EF4444", sort_order: 14 },
        "Sports": { icon: "⚽", color: "#22C55E", sort_order: 15 },
      }[name] || { icon: "📦", color: "#64748B", sort_order: 99 };
      return {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        icon: meta.icon,
        color: meta.color,
        sort_order: meta.sort_order,
      };
    }).sort((a, b) => a.sort_order - b.sort_order);

    return { categories };
  }
);

/**
 * Get USD/TRY exchange rate from TCMB (forex selling)
 * GET /subcenter/exchange-rate
 */
export const getExchangeRate = api(
  { expose: true, method: "GET", path: "/subcenter/exchange-rate" },
  async (): Promise<GetExchangeRateResponse> => {
    return getUsdTryRateFromTcmb();
  }
);

/**
 * Get all subscriptions for a user
 * GET /subcenter/user/:userId
 */
export const getUserSubscriptions = api(
  { expose: true, method: "GET", path: "/subcenter/user/:userId" },
  async ({ userId }: GetUserSubscriptionsRequest): Promise<GetUserSubscriptionsResponse> => {
    const { data, error } = await supabase.schema("subcenter").rpc("get_user_items", {
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
  async ({ userId, name, planName, region, price, currency, cycle, category, color, icon, startDate, trialDuration, website }: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> => {
    const finalPlanName = planName || "Standard";
    const finalRegion = region || "TR";

    // 1. Save locally for the user
    const { data, error } = await supabase.schema("subcenter").rpc("create_item", {
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
      trial_duration_param: trialDuration || null,
      website_param: website || null,
    });

    if (error) {
      console.error("createSubscription error:", error);
      throw APIError.internal(`Failed to create subscription: ${error.message}`);
    }

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
    const { data, error } = await supabase.schema("subcenter").rpc("delete_item", {
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
  async ({ id, userId, name, planName, region, price, currency, cycle, category, color, icon, startDate, trialDuration, website }: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> => {
    const { data, error } = await supabase.schema("subcenter").rpc("update_item", {
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
      trial_duration_param: trialDuration || null,
      website_param: website || null,
    });

    if (error) {
      console.error("updateSubscription error:", error);
      throw APIError.internal(`Failed to update subscription: ${error.message}`);
    }

    return { subscription: data?.[0] || null };
  }
);
