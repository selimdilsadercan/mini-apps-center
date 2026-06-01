import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface Place {
  id: string;
  name: string;
  note?: string;
  url?: string;
  tags: string[];
  wifi: boolean;
  parking: boolean;
  power_outlets: boolean;
  quiet_level: number;
  suggested_by?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  image_url?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  metadata?: any;
  created_at: string;
}

export interface ListPlacesResponse {
  places: Place[];
}

export interface AddPlaceRequest {
  name: string;
  note?: string;
  url?: string;
  tags?: string[];
  wifi?: boolean;
  parking?: boolean;
  power_outlets?: boolean;
  quiet_level?: number;
  suggested_by?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  image_url?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  metadata?: any;
}

export interface AddPlaceResponse {
  place: Place;
}

// Endpoints
export const listPlaces = api(
  { expose: true, method: "GET", path: "/workplaces" },
  async (): Promise<ListPlacesResponse> => {
    const { data, error } = await supabase.schema("workplaces").rpc("get_places");
    if (error) {
      console.error("listPlaces error:", error);
      throw APIError.internal(`Failed to load places: ${error.message}`);
    }
    return { places: data || [] };
  }
);

export const addPlace = api(
  { expose: true, method: "POST", path: "/workplaces" },
  async (req: AddPlaceRequest): Promise<AddPlaceResponse> => {
    const { data, error } = await supabase.schema("workplaces").rpc("add_place", {
      p_name: req.name,
      p_note: req.note,
      p_url: req.url,
      p_tags: req.tags || [],
      p_wifi: req.wifi || false,
      p_parking: req.parking || false,
      p_power_outlets: req.power_outlets || false,
      p_quiet_level: req.quiet_level || 3,
      p_suggested_by: req.suggested_by,
      p_latitude: req.latitude,
      p_longitude: req.longitude,
      p_district: req.district,
      p_image_url: req.image_url,
      p_address: req.address,
      p_rating: req.rating,
      p_user_ratings_total: req.user_ratings_total,
      p_metadata: req.metadata || {},
    });
    if (error) {
      console.error("addPlace error:", error);
      throw APIError.internal(`Failed to add place: ${error.message}`);
    }
    return { place: data[0] };
  }
);
