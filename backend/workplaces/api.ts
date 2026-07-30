import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { users } from "~encore/clients";
import { extractGooglePlaceId, fetchAndCachePlacePhoto, isGooglePhotoProxyPath } from "./google-photos";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export const DEFAULT_VENUE_CITY = "kahramanmaras";

export const VENUE_PRIMARY_TYPES = [
  "cafe",
  "restaurant",
  "dessert",
  "bar",
  "library",
  "study_spot",
  "park",
  "activity",
  "natural_beauty",
  "historical",
  "mall",
  "museum",
  "complex",
] as const;

export type VenuePrimaryType = (typeof VENUE_PRIMARY_TYPES)[number];

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
  userId?: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  image_url?: string;
  address?: string;
  rating?: number;
  user_ratings_total?: number;
  internal_rating?: number;
  internal_review_count?: number;
  metadata?: any;
  businessId?: string;
  city?: string;
  types: string[];
  created_at: string;
  is_favorite?: boolean;
  is_visited?: boolean;
}

export interface ListPlacesRequest {
  userId?: string;
  city?: string;
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
  businessId?: string;
  city?: string;
  types?: string[];
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

export interface PlaceUserRating {
  placeId: string;
  overall: number;
  taste?: number | null;
  valueScore?: number | null;
  service?: number | null;
  atmosphere?: number | null;
  updatedAt: string;
}

export interface RatePlaceRequest {
  placeId: string;
  userId: string;
  overall: number;
  taste?: number;
  valueScore?: number;
  service?: number;
  atmosphere?: number;
}

export interface RatePlaceResponse {
  success: boolean;
  rating: PlaceUserRating;
}

export interface GetMyPlaceRatingRequest {
  placeId: string;
  userId: string;
}

export interface GetMyPlaceRatingResponse {
  rating: PlaceUserRating | null;
}

async function loadFavoritePlaceIds(userId: string): Promise<Set<string>> {
  const { data: internalUserId } = await supabase.rpc("get_internal_user_id", {
    clerk_id_param: userId,
  });

  if (!internalUserId) return new Set();

  const { data: rows, error: tableError } = await supabase
    .schema("workplaces")
    .from("favorites")
    .select("place_id")
    .eq("user_id", internalUserId);

  if (!tableError) {
    return new Set((rows ?? []).map((r: { place_id: string }) => r.place_id));
  }

  console.warn("favorites table read failed, trying RPC:", tableError.message);
  const { data, error } = await supabase
    .schema("workplaces")
    .rpc("get_favorite_place_ids", { p_user_id: userId });

  if (error) {
    console.error("loadFavoritePlaceIds error:", error);
    return new Set();
  }

  return new Set((data as string[] | null) ?? []);
}

async function loadVisitedPlaceIds(userId: string): Promise<Set<string>> {
  const { data: internalUserId } = await supabase.rpc("get_internal_user_id", {
    clerk_id_param: userId,
  });

  if (!internalUserId) return new Set();

  const { data: rows, error: tableError } = await supabase
    .schema("workplaces")
    .from("visited")
    .select("place_id")
    .eq("user_id", internalUserId);

  if (!tableError) {
    return new Set((rows ?? []).map((r: { place_id: string }) => r.place_id));
  }

  console.error("loadVisitedPlaceIds error:", tableError);
  return new Set();
}

function mapPlace(row: any): Place {
  return {
    id: row.id,
    name: row.name,
    note: row.note,
    url: row.url,
    tags: row.tags || [],
    wifi: !!row.wifi,
    parking: !!row.parking,
    power_outlets: !!row.power_outlets,
    quiet_level: row.quiet_level,
    userId: row.user_id,
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    district: row.district,
    image_url: row.image_url,
    address: row.address,
    rating: row.rating ? Number(row.rating) : undefined,
    user_ratings_total: row.user_ratings_total,
    internal_rating: row.internal_rating ? Number(row.internal_rating) : undefined,
    internal_review_count: row.internal_review_count,
    metadata: row.metadata,
    businessId: row.business_id,
    city: row.city,
    types: row.types || [],
    created_at: row.created_at,
  };
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
  const { data: internalUserId } = await supabase.rpc("get_internal_user_id", {
    clerk_id_param: userId,
  });

  if (!internalUserId) {
    throw APIError.notFound("user not found");
  }

  const { data: existing, error: readError } = await supabase
    .schema("workplaces")
    .from(table)
    .select("id")
    .eq("place_id", placeId)
    .eq("user_id", internalUserId)
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
      .eq("user_id", internalUserId);
    if (deleteError) {
      throw APIError.internal(`Failed to toggle ${table}: ${deleteError.message}`);
    }
    return false;
  }

  const { error: insertError } = await supabase
    .schema("workplaces")
    .from(table)
    .insert({ place_id: placeId, user_id: internalUserId });
  if (insertError) {
    throw APIError.internal(`Failed to toggle ${table}: ${insertError.message}`);
  }
  return true;
}

async function loadAllPlaces(city: string = DEFAULT_VENUE_CITY): Promise<Place[]> {
  const { data, error } = await supabase.schema("workplaces").rpc("get_places", {
    p_city: city,
  });
  if (error) {
    throw APIError.internal(`Failed to load places: ${error.message}`);
  }
  return (data || []).map(mapPlace);
}

async function loadPlaceRowById(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.schema("workplaces").rpc("get_place", { p_id: id });
  if (error) {
    console.error("loadPlaceRowById error:", error.message);
    throw APIError.internal(`Failed to load place: ${error.message}`);
  }
  const rows = data as Record<string, unknown>[] | null;
  return rows?.[0] ?? null;
}

async function loadPlacesForUser(userId?: string, city: string = DEFAULT_VENUE_CITY): Promise<Place[]> {
  const places = await loadAllPlaces(city);
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
  async ({ userId, city }: ListPlacesRequest): Promise<ListPlacesResponse> => {
    try {
      const places = await loadPlacesForUser(userId, city || DEFAULT_VENUE_CITY);
      return { places };
    } catch (err) {
      console.error("listPlaces error:", err);
      throw err;
    }
  },
);

export interface ListPlacesByBusinessRequest {
  businessId: string;
}

export const listPlacesByBusiness = api(
  { expose: true, method: "GET", path: "/workplaces/business/:businessId" },
  async ({ businessId }: ListPlacesByBusinessRequest): Promise<ListPlacesResponse> => {
    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("get_business_places", { p_business_id: businessId });
    if (error) {
      throw APIError.internal(`Failed to load business places: ${error.message}`);
    }
    return { places: (data || []).map(mapPlace) };
  },
);

export const getPlace = api(
  { expose: true, method: "GET", path: "/workplaces/place/:id" },
  async ({ id, userId }: GetPlaceRequest): Promise<GetPlaceResponse> => {
    let place: Place | undefined;

    const rpc = await supabase.schema("workplaces").rpc("get_place", { p_id: id });
    if (!rpc.error) {
      const rows = rpc.data as any[] | null;
      if (rows?.length) {
        place = mapPlace(rows[0]);
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
      p_user_id: userId,
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

export const getMyPlaceRating = api(
  { expose: true, method: "GET", path: "/workplaces/place/:placeId/my-rating" },
  async ({
    placeId,
    userId,
  }: GetMyPlaceRatingRequest): Promise<GetMyPlaceRatingResponse> => {
    if (!userId?.trim()) {
      throw APIError.invalidArgument("userId is required");
    }

    const { data: internalUserId } = await supabase.rpc("get_internal_user_id", {
      clerk_id_param: userId,
    });
    if (!internalUserId) return { rating: null };

    const { data, error } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("*")
      .eq("place_id", placeId)
      .eq("user_id", internalUserId)
      .maybeSingle();

    if (error || !data) return { rating: null };

    return {
      rating: {
        placeId,
        overall: Number(data.overall),
        taste: data.taste != null ? Number(data.taste) : null,
        valueScore: data.value_score != null ? Number(data.value_score) : null,
        service: data.service != null ? Number(data.service) : null,
        atmosphere: data.atmosphere != null ? Number(data.atmosphere) : null,
        updatedAt: data.updated_at,
      },
    };
  },
);

export const ratePlace = api(
  { expose: true, method: "POST", path: "/workplaces/rate" },
  async ({
    placeId,
    userId,
    overall,
    taste,
    valueScore,
    service,
    atmosphere,
  }: RatePlaceRequest): Promise<RatePlaceResponse> => {
    if (!userId?.trim()) {
      throw APIError.invalidArgument("userId is required");
    }
    if (overall < 1 || overall > 10) {
      throw APIError.invalidArgument("overall must be between 1 and 10");
    }

    const { data: internalUserId } = await supabase.rpc("get_internal_user_id", {
      clerk_id_param: userId,
    });
    if (!internalUserId) {
      throw APIError.unauthenticated("User not found");
    }

    const { data: place } = await supabase
      .schema("workplaces")
      .from("places")
      .select("id")
      .eq("id", placeId)
      .maybeSingle();

    if (!place) {
      throw APIError.notFound("Place not found");
    }

    const payload = {
      place_id: placeId,
      user_id: internalUserId,
      overall,
      taste: taste ?? null,
      value_score: valueScore ?? null,
      service: service ?? null,
      atmosphere: atmosphere ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .upsert(payload, { onConflict: "place_id,user_id" })
      .select()
      .single();

    if (error || !data) {
      throw APIError.internal(`Failed to save rating: ${error?.message}`);
    }

    return {
      success: true,
      rating: {
        placeId,
        overall: Number(data.overall),
        taste: data.taste != null ? Number(data.taste) : null,
        valueScore: data.value_score != null ? Number(data.value_score) : null,
        service: data.service != null ? Number(data.service) : null,
        atmosphere: data.atmosphere != null ? Number(data.atmosphere) : null,
        updatedAt: data.updated_at,
      },
    };
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
      p_user_id: req.suggested_by,
      p_latitude: req.latitude,
      p_longitude: req.longitude,
      p_district: req.district,
      p_image_url: req.image_url,
      p_address: req.address,
      p_rating: req.rating,
      p_user_ratings_total: req.user_ratings_total,
      p_metadata: req.metadata || {},
      p_approved: true,
      p_business_id: req.businessId,
      p_city: req.city || DEFAULT_VENUE_CITY,
      p_types: req.types || [],
    });
    if (error) {
      console.error("addPlace error:", error);
      throw APIError.internal(`Failed to add place: ${error.message}`);
    }

    let place = { ...mapPlace(data[0]), is_favorite: false, is_visited: false };
    const googlePlaceId =
      extractGooglePlaceId(req.metadata?.google_place_id) || extractGooglePlaceId(req.url);
    if (googlePlaceId) {
      const imageUrl = await maybeAttachCachedPhoto(place.id, googlePlaceId, place.image_url);
      if (imageUrl) {
        place = { ...place, image_url: imageUrl };
      }
    }

    return { place };
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
  businessId?: string;
  types?: string[];
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
  city?: string;
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


async function maybeAttachCachedPhoto(
  placeId: string,
  googlePlaceId: string | undefined | null,
  existingImageUrl?: string | null,
): Promise<string | null> {
  // Keep manually uploaded / external URLs; only skip if not our Google proxy
  if (existingImageUrl?.trim() && !isGooglePhotoProxyPath(existingImageUrl)) {
    return existingImageUrl;
  }

  const normalizedId = extractGooglePlaceId(googlePlaceId ?? undefined);
  if (!normalizedId) {
    return null;
  }

  const imageUrl = await fetchAndCachePlacePhoto(supabase, normalizedId);
  if (!imageUrl) {
    return null;
  }

  const { error } = await supabase
    .schema("workplaces")
    .from("places")
    .update({ image_url: imageUrl })
    .eq("id", placeId);

  if (error) {
    console.warn("Failed to persist photo proxy path on place:", error.message);
  }

  return imageUrl;
}

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
  const normalizedId = extractGooglePlaceId(googlePlaceId ?? meta.google_place_id);
  if (normalizedId) {
    meta.google_place_id = normalizedId;
  }
  return meta;
}

export interface CachePlacePhotoRequest {
  placeId: string;
  userId: string;
  googlePlaceId?: string;
}

export interface CachePlacePhotoResponse {
  image_url: string | null;
}

export const cachePlacePhoto = api(
  { expose: true, method: "POST", path: "/workplaces/photo" },
  async ({ placeId, userId, googlePlaceId }: CachePlacePhotoRequest): Promise<CachePlacePhotoResponse> => {
    await requireAdmin(userId);

    const { data: directRow, error } = await supabase
      .schema("workplaces")
      .from("places")
      .select("id, image_url, url, metadata")
      .eq("id", placeId)
      .maybeSingle();

    const row = directRow ?? (await loadPlaceRowById(placeId).catch(() => null));
    if (error && !row) {
      console.error("cachePlacePhoto lookup error:", error.message);
    }
    if (!row) {
      throw APIError.notFound("place not found");
    }

    const resolvedId =
      extractGooglePlaceId(googlePlaceId) ||
      extractGooglePlaceId((row as any).metadata?.google_place_id) ||
      extractGooglePlaceId((row as any).url);

    if (!resolvedId) {
      throw APIError.invalidArgument("Google Place ID or Maps URL required");
    }

    const imageUrl = await maybeAttachCachedPhoto((row as any).id, resolvedId, (row as any).image_url);
    return { image_url: imageUrl };
  },
);

export const updatePlace = api(
  { expose: true, method: "POST", path: "/workplaces/update" },
  async (req: UpdatePlaceRequest): Promise<UpdatePlaceResponse> => {
    await requireAdmin(req.userId);

    const existing = await loadPlaceRowById(req.id);
    if (!existing) {
      throw APIError.notFound("place not found to update");
    }

    const gId = req.google_place_id || (existing.metadata as any)?.google_place_id;

    const meta = await getEnrichedMetadata(gId, req.metadata || (existing.metadata as any));

    const finalLatitude = req.latitude !== undefined && req.latitude !== null ? req.latitude : existing.latitude as number | null;
    const finalLongitude = req.longitude !== undefined && req.longitude !== null ? req.longitude : existing.longitude as number | null;
    const finalDistrict = req.district !== undefined && req.district !== null ? req.district : (existing.district as string | null);
    const finalImageUrl = req.image_url !== undefined && req.image_url !== null ? req.image_url : (existing.image_url as string | null);
    const finalAddress = req.address !== undefined && req.address !== null ? req.address : (existing.address as string | null);
    const finalRating = req.rating !== undefined && req.rating !== null ? req.rating : (existing.rating as number | null);
    const finalUserRatings = req.user_ratings_total !== undefined && req.user_ratings_total !== null ? req.user_ratings_total : (existing.user_ratings_total as number | null);

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
        p_business_id: req.businessId,
        p_types: req.types,
      });
    if (error) {
      console.error("updatePlace error:", error);
      throw APIError.internal(`Failed to update place: ${error.message}`);
    }

    if (!data?.length) {
      throw APIError.notFound("place not found to update");
    }

    let place = { ...mapPlace(data[0]), is_favorite: false, is_visited: false };
    const imageUrl = await maybeAttachCachedPhoto(place.id, gId, finalImageUrl);
    if (imageUrl) {
      place = { ...place, image_url: imageUrl };
    }

    return { place };
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
    const q = query.trim().toLowerCase();
    if (!q) {
      return { results: [] };
    }

    try {
      const places = await loadAllPlaces();
      const results = places
        .filter((place) => {
          return (
            place.name.toLowerCase().includes(q) ||
            (place.address?.toLowerCase().includes(q) ?? false) ||
            (place.district?.toLowerCase().includes(q) ?? false) ||
            place.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        })
        .slice(0, 10)
        .map((place) => ({
          name: place.name,
          address: place.address,
          url: place.url,
          latitude: place.latitude,
          longitude: place.longitude,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          image_url: place.image_url,
          google_place_id: place.metadata?.google_place_id,
          district: place.district,
        }));

      return { results };
    } catch (err) {
      console.error("searchPlace local error:", err);
      return { results: [] };
    }
  },
);

export const listPendingPlaces = api(
  { expose: true, method: "GET", path: "/workplaces/pending/:userId" },
  async ({ userId, city }: ListPendingPlacesRequest): Promise<ListPendingPlacesResponse> => {
    await requireAdmin(userId);
    const { data, error } = await supabase
      .schema("workplaces")
      .rpc("get_pending_places", { p_city: city || DEFAULT_VENUE_CITY });
    if (error) {
      console.error("listPendingPlaces error:", error);
      throw APIError.internal(`Failed to list pending places: ${error.message}`);
    }
    return { places: (data || []).map(mapPlace) };
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

    let place = { ...mapPlace(data[0]), is_favorite: false, is_visited: false };
    const googlePlaceId =
      extractGooglePlaceId(place.metadata?.google_place_id) || extractGooglePlaceId(place.url);
    if (googlePlaceId) {
      const imageUrl = await maybeAttachCachedPhoto(place.id, googlePlaceId, place.image_url);
      if (imageUrl) {
        place = { ...place, image_url: imageUrl };
      }
    }

    return { place };
  }
);
