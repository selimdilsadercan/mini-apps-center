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
  is_favorite?: boolean;
  is_visited?: boolean;
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

export interface ToggleVisitedRequest {
  placeId: string;
  userId: string;
}

export interface ToggleVisitedResponse {
  success: boolean;
  isVisited: boolean;
}

async function loadFavoritePlaceIds(userId: string): Promise<Set<string>> {
  const { data: rows, error: tableError } = await supabase
    .schema("workplaces")
    .from("favorites")
    .select("place_id")
    .eq("clerk_id", userId);

  if (!tableError) {
    return new Set((rows ?? []).map((r: { place_id: string }) => r.place_id));
  }

  console.warn("favorites table read failed, trying RPC:", tableError.message);
  const { data, error } = await supabase
    .schema("workplaces")
    .rpc("get_favorite_place_ids", { p_clerk_id: userId });

  if (error) {
    console.error("loadFavoritePlaceIds error:", error);
    return new Set();
  }

  return new Set((data as string[] | null) ?? []);
}

async function loadVisitedPlaceIds(userId: string): Promise<Set<string>> {
  const { data: rows, error: tableError } = await supabase
    .schema("workplaces")
    .from("visited")
    .select("place_id")
    .eq("clerk_id", userId);

  if (!tableError) {
    return new Set((rows ?? []).map((r: { place_id: string }) => r.place_id));
  }

  console.error("loadVisitedPlaceIds error:", tableError);
  return new Set();
}

function withUserFlags(
  places: Place[],
  favoriteIds: Set<string>,
  visitedIds: Set<string>,
): Place[] {
  return places.map((place) => ({
    ...place,
    is_favorite: favoriteIds.has(place.id),
    is_visited: visitedIds.has(place.id),
  }));
}

async function toggleRow(
  table: "favorites" | "visited",
  placeId: string,
  userId: string,
): Promise<boolean> {
  const { data: existing, error: readError } = await supabase
    .schema("workplaces")
    .from(table)
    .select("id")
    .eq("place_id", placeId)
    .eq("clerk_id", userId)
    .maybeSingle();

  if (readError) {
    throw APIError.internal(`Failed to toggle ${table}: ${readError.message}`);
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .schema("workplaces")
      .from(table)
      .delete()
      .eq("place_id", placeId)
      .eq("clerk_id", userId);
    if (deleteError) {
      throw APIError.internal(`Failed to toggle ${table}: ${deleteError.message}`);
    }
    return false;
  }

  const { error: insertError } = await supabase
    .schema("workplaces")
    .from(table)
    .insert({ place_id: placeId, clerk_id: userId });
  if (insertError) {
    throw APIError.internal(`Failed to toggle ${table}: ${insertError.message}`);
  }
  return true;
}

async function loadAllPlaces(): Promise<Place[]> {
  const { data, error } = await supabase.schema("workplaces").rpc("get_places");
  if (error) {
    throw APIError.internal(`Failed to load places: ${error.message}`);
  }
  return (data as Place[] | null) ?? [];
}

async function loadPlacesForUser(userId?: string): Promise<Place[]> {
  const places = await loadAllPlaces();
  if (!userId) {
    return places.map((p) => ({ ...p, is_favorite: false, is_visited: false }));
  }
  const [favoriteIds, visitedIds] = await Promise.all([
    loadFavoritePlaceIds(userId),
    loadVisitedPlaceIds(userId),
  ]);
  return withUserFlags(places, favoriteIds, visitedIds);
}

// Endpoints
export const listPlaces = api(
  { expose: true, method: "GET", path: "/workplaces" },
  async ({ userId }: ListPlacesRequest): Promise<ListPlacesResponse> => {
    try {
      const places = await loadPlacesForUser(userId);
      return { places };
    } catch (err) {
      console.error("listPlaces error:", err);
      throw err;
    }
  },
);

export const getPlace = api(
  { expose: true, method: "GET", path: "/workplaces/place/:id" },
  async ({ id, userId }: GetPlaceRequest): Promise<GetPlaceResponse> => {
    let place: Place | undefined;

    const rpc = await supabase.schema("workplaces").rpc("get_place", { p_id: id });
    if (!rpc.error) {
      const rows = rpc.data as Place[] | null;
      if (rows?.length) {
        place = rows[0];
      }
    } else {
      console.warn("getPlace RPC unavailable, using get_places:", rpc.error.message);
    }

    if (!place) {
      try {
        const places = await loadAllPlaces();
        place = places.find((p) => p.id === id);
      } catch (err) {
        if (err instanceof APIError) throw err;
        console.error("getPlace error:", err);
        throw APIError.internal("Failed to load place");
      }
    }

    if (!place) {
      throw APIError.notFound("place not found");
    }

    if (userId) {
      const [favoriteIds, visitedIds] = await Promise.all([
        loadFavoritePlaceIds(userId),
        loadVisitedPlaceIds(userId),
      ]);
      place = {
        ...place,
        is_favorite: favoriteIds.has(place.id),
        is_visited: visitedIds.has(place.id),
      };
    } else {
      place = { ...place, is_favorite: false, is_visited: false };
    }

    return { place };
  },
);

export const toggleFavorite = api(
  { expose: true, method: "POST", path: "/workplaces/favorite" },
  async ({ placeId, userId }: ToggleFavoriteRequest): Promise<ToggleFavoriteResponse> => {
    if (!userId?.trim()) {
      throw APIError.invalidArgument("userId is required");
    }

    const rpc = await supabase.schema("workplaces").rpc("toggle_favorite", {
      p_place_id: placeId,
      p_clerk_id: userId,
    });

    if (!rpc.error) {
      return { success: true, isFavorite: !!rpc.data };
    }

    console.warn("toggle_favorite RPC failed, using direct table:", rpc.error.message);
    const isFavorite = await toggleRow("favorites", placeId, userId);
    return { success: true, isFavorite };
  },
);

export const toggleVisited = api(
  { expose: true, method: "POST", path: "/workplaces/visited" },
  async ({ placeId, userId }: ToggleVisitedRequest): Promise<ToggleVisitedResponse> => {
    if (!userId?.trim()) {
      throw APIError.invalidArgument("userId is required");
    }

    const isVisited = await toggleRow("visited", placeId, userId);
    return { success: true, isVisited };
  },
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
    return { place: { ...data[0], is_favorite: false, is_visited: false } };
  },
);
