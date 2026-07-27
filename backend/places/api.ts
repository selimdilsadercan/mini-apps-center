import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Place {
  id: string;
  name: string;
  description: string | null;
  category: string;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  rating: number;
  working_hours: string | null;
  features: string[];
  business_id: string | null;
  created_at: string;
  is_favorite: boolean;
}

export interface ListPlacesRequest {
  userId?: string;
}

export interface ListPlacesResponse {
  places: Place[];
}

export interface GetPlaceRequest {
  id: string;
  userId?: string;
}

export interface GetPlaceResponse {
  place: Place;
}

export interface ToggleFavoriteRequest {
  placeId: string;
  userId: string;
}

export interface ToggleFavoriteResponse {
  success: boolean;
  isFavorite: boolean;
}

export interface AddPlaceRequest {
  name: string;
  description?: string;
  category: string; // 'Kafe', 'Restoran', 'Tatlıcı', 'Bar'
  address?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  working_hours?: string;
  features?: string[];
  business_id?: string;
}

export interface AddPlaceResponse {
  place: Place;
}

export interface SeedPlacesResponse {
  success: boolean;
  count: number;
}

// ==================== ENDPOINTS ====================

/**
 * List all cafes and restaurants
 * GET /places
 */
export const listPlaces = api(
  { expose: true, method: "GET", path: "/places" },
  async (req: ListPlacesRequest): Promise<ListPlacesResponse> => {
    const { data, error } = await supabase
      .schema("places")
      .rpc("list_places", { p_user_id: req.userId || null });

    if (error) {
      console.error("[Places] listPlaces error:", error);
      throw APIError.internal(`Failed to list places: ${error.message}`);
    }

    return { places: (data as Place[]) || [] };
  }
);

/**
 * Get details for a specific place
 * GET /places/:id
 */
export const getPlace = api(
  { expose: true, method: "GET", path: "/places/:id" },
  async (req: GetPlaceRequest): Promise<GetPlaceResponse> => {
    const { data, error } = await supabase
      .schema("places")
      .rpc("get_place", { p_user_id: req.userId || null, p_place_id: req.id });

    if (error) {
      console.error("[Places] getPlace error:", error);
      throw APIError.internal(`Failed to get place: ${error.message}`);
    }

    const item = Array.isArray(data) ? data[0] : data;
    if (!item) {
      throw APIError.notFound("Place not found");
    }

    return { place: item as Place };
  }
);

/**
 * Toggle favorite status of a place
 * POST /places/favorite
 */
export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/places/favorite" },
  async (req: ToggleFavoriteRequest): Promise<ToggleFavoriteResponse> => {
    if (!req.userId || !req.placeId) {
      throw APIError.invalidArgument("userId and placeId are required");
    }

    const { data, error } = await supabase
      .schema("places")
      .rpc("toggle_favorite", { p_user_id: req.userId, p_place_id: req.placeId });

    if (error) {
      console.error("[Places] toggleFavorite error:", error);
      throw APIError.internal(`Failed to toggle favorite: ${error.message}`);
    }

    const res = Array.isArray(data) ? data[0] : data;
    return {
      success: !!res?.success,
      isFavorite: !!res?.is_favorite,
    };
  }
);

/**
 * Add a new place
 * POST /places/add
 */
export const addPlace = api(
  { expose: true, method: "POST", path: "/places/add" },
  async (req: AddPlaceRequest): Promise<AddPlaceResponse> => {
    const { data, error } = await supabase
      .schema("places")
      .rpc("add_place", {
        p_name: req.name,
        p_description: req.description || null,
        p_category: req.category,
        p_address: req.address || null,
        p_district: req.district || null,
        p_latitude: req.latitude || null,
        p_longitude: req.longitude || null,
        p_image_url: req.image_url || null,
        p_working_hours: req.working_hours || null,
        p_features: req.features || [],
        p_business_id: req.business_id || null,
      });

    if (error) {
      console.error("[Places] addPlace error:", error);
      throw APIError.internal(`Failed to add place: ${error.message}`);
    }

    // Since RPC returns places.places, is_favorite is defaults to false on creation
    const place = { ...(data as any), is_favorite: false };
    return { place: place as Place };
  }
);

/**
 * Seed initial mock places
 * POST /places/seed
 */
export const seedPlaces = api(
  { expose: true, method: "POST", path: "/places/seed" },
  async (): Promise<SeedPlacesResponse> => {
    const { data, error } = await supabase
      .schema("places")
      .rpc("seed_places");

    if (error) {
      console.error("[Places] seedPlaces error:", error);
      throw APIError.internal(`Failed to seed places: ${error.message}`);
    }

    return {
      success: true,
      count: Number(data || 0),
    };
  }
);
