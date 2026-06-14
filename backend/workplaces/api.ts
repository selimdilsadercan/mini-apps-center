import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { users } from "~encore/clients";

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

export interface UpdatePlaceRequest {
  id: string;
  userId: string;
  name: string;
  note?: string;
  url?: string;
  wifi: boolean;
  parking: boolean;
  power_outlets: boolean;
  quiet_level: number;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  district?: string;
  image_url?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  metadata?: any;
  google_place_id?: string;
}

export interface UpdatePlaceResponse {
  place: Place;
}

export interface DeletePlaceRequest {
  placeId: string;
  userId: string;
}

export interface DeletePlaceResponse {
  success: boolean;
}

export interface SearchPlaceRequest {
  query: string;
}

export interface SearchPlaceResponse {
  results: Array<{
    name: string;
    address?: string;
    url?: string;
    latitude?: number;
    longitude?: number;
    rating?: number;
    user_ratings_total?: number;
    image_url?: string;
    google_place_id?: string;
    district?: string;
  }>;
}

export interface ListPendingPlacesRequest {
  userId: string;
}

export interface ListPendingPlacesResponse {
  places: Place[];
}

export interface ApprovePlaceRequest {
  placeId: string;
  userId: string;
}

export interface ApprovePlaceResponse {
  place: Place;
}

const googleMapsApiKey = secret("GoogleMapsAPIKey");

async function requireAdmin(userId: string) {
  if (!userId?.trim()) {
    throw APIError.unauthenticated("Authentication required");
  }
  const res = await users.checkAdmin({ clerkId: userId });
  if (!res.isAdmin) {
    throw APIError.permissionDenied("Admin privilege required");
  }
}

async function getEnrichedMetadata(googlePlaceId: string | undefined, existingMetadata: any): Promise<any> {
  const meta = { ...(existingMetadata || {}) };
  if (!googlePlaceId) return meta;

  // TEMPORARILY DISABLED TO AVOID COSTS
  /*
  const apiKey = googleMapsApiKey();
  if (!apiKey) return meta;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=formatted_phone_number,website,opening_hours,photos,types&key=${apiKey}`;
    const response = await fetch(url);
    const data = (await response.json()) as any;

    if (data.result) {
      const res = data.result;
      meta.phone = res.formatted_phone_number;
      meta.website = res.website;
      meta.opening_hours = res.opening_hours;
      meta.google_place_id = googlePlaceId;

      if (res.photos && res.photos.length > 0) {
        meta.photos = res.photos.map((photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${apiKey}`
        );
      }
    }
  } catch (err) {
    console.error("getEnrichedMetadata error:", err);
  }
  */
  return meta;
}

export const updatePlace = api(
  { expose: true, method: "POST", path: "/workplaces/update" },
  async (req: UpdatePlaceRequest): Promise<UpdatePlaceResponse> => {
    await requireAdmin(req.userId);

    // Fetch existing place to preserve details that are not in the update request
    const { data: currentRows, error: currentError } = await supabase
      .schema("workplaces")
      .from("places")
      .select("*")
      .eq("id", req.id)
      .maybeSingle();

    if (currentError || !currentRows) {
      throw APIError.notFound("place not found to update");
    }

    const existing = currentRows;
    const gId = req.google_place_id || existing.metadata?.google_place_id;
    const apiKey = googleMapsApiKey();

    let apiLat = undefined;
    let apiLng = undefined;
    let apiAddr = undefined;
    let apiRating = undefined;
    let apiRatingsTotal = undefined;
    let apiImg = undefined;
    let apiDistrict = undefined;

    // Fetch details from Google Places API if coordinates or images are missing (TEMPORARILY DISABLED TO AVOID COSTS)
    /*
    if (gId && apiKey && (!existing.latitude || !existing.longitude || !existing.image_url || !existing.address)) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${gId}&fields=geometry,formatted_address,rating,user_ratings_total,photos&key=${apiKey}`;
        const response = await fetch(url);
        const data = (await response.json()) as any;
        if (data.result) {
          const res = data.result;
          apiLat = res.geometry?.location?.lat;
          apiLng = res.geometry?.location?.lng;
          apiAddr = res.formatted_address;
          apiRating = res.rating;
          apiRatingsTotal = res.user_ratings_total;

          if (res.photos && res.photos.length > 0) {
            apiImg = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${res.photos[0].photo_reference}&key=${apiKey}`;
          }

          if (res.formatted_address) {
            const parts = res.formatted_address.split(",");
            if (parts.length > 1) {
              apiDistrict = parts[parts.length - 2].trim().split(" ")[0];
            }
          }
        }
      } catch (err) {
        console.error("Enrichment from details API during update failed:", err);
      }
    }
    */

    const meta = await getEnrichedMetadata(gId, req.metadata || existing.metadata);

    // Support merging new fields with existing fields fallback, or API-enriched fields
    const finalLatitude = req.latitude !== undefined && req.latitude !== null ? req.latitude : (existing.latitude || apiLat);
    const finalLongitude = req.longitude !== undefined && req.longitude !== null ? req.longitude : (existing.longitude || apiLng);
    const finalDistrict = req.district !== undefined && req.district !== null ? req.district : (existing.district || apiDistrict);
    const finalImageUrl = req.image_url !== undefined && req.image_url !== null ? req.image_url : (existing.image_url || apiImg);
    const finalAddress = req.address !== undefined && req.address !== null ? req.address : (existing.address || apiAddr);
    const finalRating = req.rating !== undefined && req.rating !== null ? req.rating : (existing.rating || apiRating);
    const finalUserRatings = req.user_ratings_total !== undefined && req.user_ratings_total !== null ? req.user_ratings_total : (existing.user_ratings_total || apiRatingsTotal);

    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("update_place", {
        p_id: req.id,
        p_name: req.name,
        p_note: req.note,
        p_url: req.url,
        p_tags: req.tags || [],
        p_wifi: req.wifi || false,
        p_parking: req.parking || false,
        p_power_outlets: req.power_outlets || false,
        p_quiet_level: req.quiet_level || 3,
        p_latitude: finalLatitude,
        p_longitude: finalLongitude,
        p_district: finalDistrict,
        p_image_url: finalImageUrl,
        p_address: finalAddress,
        p_rating: finalRating,
        p_user_ratings_total: finalUserRatings,
        p_metadata: meta,
      });
    if (error) {
      console.error("updatePlace error:", error);
      throw APIError.internal(`Failed to update place: ${error.message}`);
    }
    return { place: { ...data[0], is_favorite: false, is_visited: false } };
  }
);

export const deletePlace = api(
  { expose: true, method: "POST", path: "/workplaces/delete" },
  async ({ placeId, userId }: DeletePlaceRequest): Promise<DeletePlaceResponse> => {
    await requireAdmin(userId);
    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("delete_place", { p_id: placeId });
    if (error) {
      console.error("deletePlace error:", error);
      throw APIError.internal(`Failed to delete place: ${error.message}`);
    }
    return { success: !!data };
  }
);

export const searchPlace = api(
  { expose: true, method: "GET", path: "/workplaces/search" },
  async ({ query }: SearchPlaceRequest): Promise<SearchPlaceResponse> => {
    // TEMPORARILY DISABLED GOOGLE SEARCH TO AVOID COSTS
    /*
    const apiKey = googleMapsApiKey();
    if (!apiKey) {
      return { results: [] };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (!data.results) {
        return { results: [] };
      }

      const results = data.results.map((r: any) => {
        let imageUrl = "";
        if (r.photos && r.photos.length > 0) {
          imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${r.photos[0].photo_reference}&key=${apiKey}`;
        }

        let district = "";
        if (r.formatted_address) {
          const parts = r.formatted_address.split(",");
          if (parts.length > 1) {
            district = parts[parts.length - 2].trim().split(" ")[0];
          }
        }

        return {
          name: r.name,
          address: r.formatted_address,
          url: r.place_id ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}` : undefined,
          latitude: r.geometry?.location?.lat,
          longitude: r.geometry?.location?.lng,
          rating: r.rating,
          user_ratings_total: r.user_ratings_total,
          image_url: imageUrl,
          google_place_id: r.place_id,
          district: district,
        };
      });

      return { results };
    } catch (err) {
      console.error("searchPlace error:", err);
      return { results: [] };
    }
    */

    // USING OPENSTREETMAP (NOMINATIM) INSTEAD
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "MiniAppsCenter/1.0"
        }
      });
      const data = (await response.json()) as any;
      if (!Array.isArray(data)) {
        return { results: [] };
      }
      const results = data.map((r: any) => {
        const name = r.name || r.display_name.split(",")[0];
        const address = r.display_name;
        const district = r.address?.suburb || r.address?.city_district || r.address?.town || "";
        return {
          name: name,
          address: address,
          url: `https://www.openstreetmap.org/#map=18/${r.lat}/${r.lon}`,
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
          rating: 0,
          user_ratings_total: 0,
          image_url: "",
          google_place_id: `osm_${r.place_id}`,
          district: district,
        };
      });
      return { results };
    } catch (err) {
      console.error("searchPlace OSM error:", err);
      return { results: [] };
    }
  }
);

export const listPendingPlaces = api(
  { expose: true, method: "GET", path: "/workplaces/pending/:userId" },
  async ({ userId }: ListPendingPlacesRequest): Promise<ListPendingPlacesResponse> => {
    await requireAdmin(userId);
    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("get_pending_places");
    if (error) {
      console.error("listPendingPlaces error:", error);
      throw APIError.internal(`Failed to list pending places: ${error.message}`);
    }
    return { places: data || [] };
  }
);

export const approvePlace = api(
  { expose: true, method: "POST", path: "/workplaces/approve" },
  async ({ placeId, userId }: ApprovePlaceRequest): Promise<ApprovePlaceResponse> => {
    await requireAdmin(userId);
    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("approve_place", { p_id: placeId });
    if (error) {
      console.error("approvePlace error:", error);
      throw APIError.internal(`Failed to approve place: ${error.message}`);
    }
    return { place: { ...data[0], is_favorite: false, is_visited: false } };
  }
);
