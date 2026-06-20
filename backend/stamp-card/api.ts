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
  stamp_limit: number;
  reward_title: string;
  font_family: string;
  created_at: string;
}

export interface UserCard {
  id: string;
  business_id: string;
  stamps_count: number;
  completed_count: number;
  updated_at: string;
  business_name: string;
  business_logo: string | null;
  business_reward: string;
  stamp_limit: number;
}

export interface RedeemedReward {
  id: string;
  business_id: string;
  reward_title: string;
  is_used: boolean;
  redeemed_at: string;
  business_name: string;
  business_logo: string | null;
}

export interface UserOwnedBusiness {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  stamp_limit: number;
  reward_title: string;
  pin_code: string;
  created_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface GetUserDataResponse {
  cards: UserCard[];
  rewards: RedeemedReward[];
  my_businesses: UserOwnedBusiness[];
}

interface AddStampRequest {
  userId: string;
  businessId: string;
  pin: string;
}

interface AddStampResponse {
  success: boolean;
  stamps_count?: number;
  completed_count?: number;
  reward_created?: boolean;
  new_reward_id?: string;
  error?: string;
}

interface UseRewardRequest {
  userId: string;
  rewardId: string;
}

interface UseRewardResponse {
  success: boolean;
}

interface CreateBusinessRequest {
  businessId: string;
  stampLimit: number;
  rewardTitle: string;
  pinCode: string;
}

interface CreateBusinessResponse {
  success: boolean;
}

// ==================== ENDPOINTS ====================

/**
 * Get all available businesses
 * GET /stamp-card/businesses
 */
export const getBusinesses = api(
  { expose: true, method: "GET", path: "/stamp-card/businesses" },
  async (): Promise<{ businesses: Business[] }> => {
    const { data, error } = await supabase.schema("stamp_card").rpc("get_businesses");

    if (error) {
      console.error("getBusinesses error:", error);
      throw APIError.internal(`Failed to get businesses: ${error.message}`);
    }

    return { businesses: data || [] };
  }
);

/**
 * Get all user-specific data (cards, rewards, user owned businesses)
 * GET /stamp-card/data/:userId
 */
export const getUserData = api(
  { expose: true, method: "GET", path: "/stamp-card/data/:userId" },
  async ({ userId }: { userId: string }): Promise<GetUserDataResponse> => {
    const { data, error } = await supabase.schema("stamp_card").rpc("get_user_data", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getUserData error:", error);
      throw APIError.internal(`Failed to get user stamp card data: ${error.message}`);
    }

    const payload = data as any;
    return {
      cards: payload?.cards || [],
      rewards: payload?.rewards || [],
      my_businesses: payload?.my_businesses || [],
    };
  }
);

/**
 * Add stamp to a card (validate PIN code)
 * POST /stamp-card/stamp
 */
export const addStamp = api(
  { expose: true, method: "POST", path: "/stamp-card/stamp" },
  async (req: AddStampRequest): Promise<AddStampResponse> => {
    const { data, error } = await supabase.schema("stamp_card").rpc("add_stamp", {
      p_user_id: req.userId,
      p_business_id: req.businessId,
      p_pin: req.pin,
    });

    if (error) {
      console.error("addStamp error:", error);
      throw APIError.internal(`Failed to add stamp: ${error.message}`);
    }

    return data as AddStampResponse;
  }
);

/**
 * Mark a redeemed reward as used
 * POST /stamp-card/reward/use
 */
export const useReward = api(
  { expose: true, method: "POST", path: "/stamp-card/reward/use" },
  async (req: UseRewardRequest): Promise<UseRewardResponse> => {
    const { data, error } = await supabase.schema("stamp_card").rpc("use_reward", {
      p_user_id: req.userId,
      p_reward_id: req.rewardId,
    });

    if (error) {
      console.error("useReward error:", error);
      throw APIError.internal(`Failed to use reward: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Create a new business
 * POST /stamp-card/business/create
 */
export const createBusiness = api(
  { expose: true, method: "POST", path: "/stamp-card/business/create" },
  async (req: CreateBusinessRequest): Promise<CreateBusinessResponse> => {
    const { data, error } = await supabase.schema("stamp_card").rpc("create_business", {
      p_business_id: req.businessId,
      p_stamp_limit: req.stampLimit,
      p_reward_title: req.rewardTitle,
      p_pin_code: req.pinCode,
    });

    if (error) {
      console.error("createBusiness error:", error);
      throw APIError.internal(`Failed to create business: ${error.message}`);
    }

    return { success: !!data };
  }
);
