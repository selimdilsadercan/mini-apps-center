import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { users } from "~encore/clients";
import { extractGooglePlaceId } from "./google-photos";

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
  "shop",
] as const;

export type VenuePrimaryType = (typeof VENUE_PRIMARY_TYPES)[number];

export interface RankList {
  id: string;
  label: string;
  emoji: string;
  title?: string;
}

export interface LeaderboardEntry {
  rank: number;
  placeId: string;
  name: string;
  district?: string | null;
  imageUrl?: string | null;
  types?: string[] | null;
  averageRating: number;
  voteCount: number;
}

export interface RankListConfig {
  id: string;
  label: string;
  emoji: string;
  title?: string;
  primaryTypes?: string[];
  tagKeywords?: string[];
}

export const RANK_LISTS: RankListConfig[] = [
  {
    id: "kahve",
    label: "Kahve",
    emoji: "☕",
    tagKeywords: ["kahve", "coffee", "roastery", "nitelikli kahve"],
    title: "En iyi kahve nerede içilir?",
  },
  {
    id: "hamburger",
    label: "Hamburger",
    emoji: "🍔",
    tagKeywords: ["hamburger", "burger"],
    title: "En iyi burger nerede yenir?",
  },
  {
    id: "pizza",
    label: "Pizza",
    emoji: "🍕",
    tagKeywords: ["pizza"],
    title: "En iyi pizza nerede yenir?",
  },
  {
    id: "maras_dondurmasi",
    label: "Maraş Dondurması",
    emoji: "🍦",
    tagKeywords: ["maraş dondurması", "dondurma", "ice cream"],
    title: "Gerçek Maraş dondurması nerede yenir?",
  },
  {
    id: "okey",
    label: "101 Okey",
    emoji: "🀄",
    tagKeywords: ["101 okey", "okey", "oyun"],
    title: "Okey nerede oynanır?",
  },
  {
    id: "firik_tarhana",
    label: "Firik & Tarhana",
    emoji: "🍲",
    tagKeywords: ["firik", "tarhana"],
    title: "Firik & Tarhana nerede yenir?",
  },
  {
    id: "piknik",
    label: "Piknik",
    emoji: "🧺",
    tagKeywords: ["piknik", "mesire"],
    title: "Piknik için nereye gidilir?",
  },
  {
    id: "study",
    label: "Çalışma Mekanı",
    emoji: "📚",
    primaryTypes: ["study_spot", "library"],
    tagKeywords: ["çalışma", "ders", "sessiz"],
  },
  {
    id: "breakfast",
    label: "Kahvaltı",
    emoji: "🥐",
    tagKeywords: ["kahvaltı", "breakfast", "brunch"],
  },
  {
    id: "shop",
    label: "Mağaza",
    emoji: "🛍️",
    primaryTypes: ["shop"],
    title: "Alışveriş yapılacak yerler",
  },
];

export function getRankList(listId: string): RankListConfig | undefined {
  return RANK_LISTS.find((l) => l.id === listId);
}

const MIN_VOTES_FOR_RANKING = 0;
const WEIGHTED_MIN_VOTES = 1;

function computeWeightedScore(
  averageRating: number,
  voteCount: number,
  globalMean: number,
  minVotes: number,
): number {
  return (voteCount * averageRating + minVotes * globalMean) / (voteCount + minVotes);
}

function roundScore(n: number): number {
  return Math.round(n * 10) / 10;
}

function placeMatchesList(place: any, listId: string): boolean {
  if (listId === "all") return true;
  const list = getRankList(listId);
  if (!list) return false;

  const tags = (place.tags ?? []).map((t: string) => t.toLowerCase());
  const name = (place.name ?? "").toLowerCase();
  const venueTypes = place.types || [];

  let matchesTag = false;
  if (list.tagKeywords?.length) {
    matchesTag = list.tagKeywords.some((kw) => {
      const lowerKw = kw.toLowerCase();
      return (
        tags.some((t: string) => t.toLowerCase().includes(lowerKw) || lowerKw.includes(t.toLowerCase())) ||
        name.includes(lowerKw)
      );
    });
  }

  let matchesType = false;
  if (list.primaryTypes?.length) {
    matchesType = list.primaryTypes.some((type) => venueTypes.includes(type));
  }

  if (list.tagKeywords?.length && list.primaryTypes?.length) {
    return matchesTag || matchesType;
  } else if (list.tagKeywords?.length) {
    return matchesTag;
  } else if (list.primaryTypes?.length) {
    return matchesType;
  }

  return true;
}

export interface GetLeaderboardRequest {
  listId?: string;
  city?: string;
  district?: string;
  limit?: number;
}

export interface GetLeaderboardResponse {
  listId: string;
  entries: LeaderboardEntry[];
}

export interface GetRankListsResponse {
  lists: RankList[];
}

export interface HomePlaceSection {
  listId: string;
  list: RankList;
  entries: LeaderboardEntry[];
}

export interface ListHomePlacesRequest {
  city?: string;
  limit?: number;
}

export interface ListHomePlacesResponse {
  sections: HomePlaceSection[];
}

export interface GetPlaceStatsRequest {
  placeId: string;
  listId?: string;
  city?: string;
}

export interface GetPlaceStatsResponse {
  stats: {
    placeId: string;
    averageRating: number;
    voteCount: number;
    weightedScore: number;
    rankInList?: number | null;
    listSize?: number | null;
  } | null;
  allTimeAverage?: number | null;
  allTimeVotes?: number;
}

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
    id: string;
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
  async ({ placeId, userId }: CachePlacePhotoRequest): Promise<CachePlacePhotoResponse> => {
    await requireAdmin(userId);

    const row = await loadPlaceRowById(placeId).catch(() => null);
    if (!row) {
      throw APIError.notFound("place not found");
    }

    return { image_url: (row as { image_url?: string | null }).image_url ?? null };
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

    const place = { ...mapPlace(data[0]), is_favorite: false, is_visited: false };
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
          id: place.id,
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

    const place = { ...mapPlace(data[0]), is_favorite: false, is_visited: false };
    return { place };
  }
);

async function fetchLeaderboardEntries(
  listConfig: RankListConfig,
  city: string,
  limit: number,
  district?: string,
): Promise<LeaderboardEntry[]> {
  // RPC ranks by Google Maps rating with IMDB-style weighting (user_ratings_total)
  const { data, error } = await supabase.schema("workplaces").rpc("get_leaderboard", {
    p_city: city,
    p_primary_types: listConfig.primaryTypes || [],
    p_tag_keywords: listConfig.tagKeywords || [],
    p_limit: limit,
  });

  if (error) {
    throw APIError.internal(`Leaderboard loading failed: ${error.message}`);
  }

  let entries: LeaderboardEntry[] = (data || []).map((row: any, idx: number) => ({
    rank: idx + 1,
    placeId: row.place_id,
    name: row.name,
    district: row.district,
    imageUrl: row.image_url,
    types: row.types,
    averageRating: Number(row.average_rating),
    voteCount: row.vote_count,
  }));

  if (district) {
    entries = entries
      .filter((e: LeaderboardEntry) => e.district?.trim() === district)
      .map((e: LeaderboardEntry, idx: number) => ({ ...e, rank: idx + 1 }));
  }

  return entries;
}

export const getRankLists = api(
  { expose: true, method: "GET", path: "/workplaces/rank-lists" },
  async (): Promise<GetRankListsResponse> => {
    return {
      lists: RANK_LISTS.map((l) => ({ id: l.id, label: l.label, emoji: l.emoji, title: l.title })),
    };
  }
);

/** All home sections in a single request */
export const listHomePlaces = api(
  { expose: true, method: "GET", path: "/workplaces/home" },
  async ({
    city = DEFAULT_VENUE_CITY,
    limit = 10,
  }: ListHomePlacesRequest): Promise<ListHomePlacesResponse> => {
    const sections = await Promise.all(
      RANK_LISTS.map(async (listConfig) => {
        const entries = await fetchLeaderboardEntries(listConfig, city, limit);
        return {
          listId: listConfig.id,
          list: {
            id: listConfig.id,
            label: listConfig.label,
            emoji: listConfig.emoji,
            title: listConfig.title,
          },
          entries,
        };
      }),
    );

    return { sections };
  },
);

export const getLeaderboard = api(
  { expose: true, method: "GET", path: "/workplaces/leaderboard" },
  async ({
    listId = "all",
    city = DEFAULT_VENUE_CITY,
    district,
    limit = 30,
  }: GetLeaderboardRequest): Promise<GetLeaderboardResponse> => {
    const list = getRankList(listId);
    if (!list) {
      return { listId, entries: [] };
    }

    const entries = await fetchLeaderboardEntries(list, city, limit, district);
    return { listId, entries };
  }
);

export const getPlaceStats = api(
  { expose: true, method: "GET", path: "/workplaces/place/:placeId/stats" },
  async ({
    placeId,
    listId = "all",
    city = DEFAULT_VENUE_CITY,
  }: GetPlaceStatsRequest): Promise<GetPlaceStatsResponse> => {
    const rpc = await supabase.schema("workplaces").rpc("get_place", { p_id: placeId });
    if (rpc.error || !rpc.data?.length) {
      return {
        stats: null,
        allTimeAverage: null,
        allTimeVotes: 0,
      };
    }

    const place = mapPlace(rpc.data[0]);
    const averageRating = place.internal_rating ?? 0;
    const voteCount = place.internal_review_count ?? 0;

    if (voteCount === 0) {
      return {
        stats: null,
        allTimeAverage: null,
        allTimeVotes: 0,
      };
    }

    const { data: cityRatings } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("overall");

    const globalScores = (cityRatings ?? []).map((r: any) => Number(r.overall));
    const globalMean =
      globalScores.length > 0
        ? globalScores.reduce((a: number, b: number) => a + b, 0) / globalScores.length
        : 7;

    const weightedScore = computeWeightedScore(
      averageRating,
      voteCount,
      globalMean,
      WEIGHTED_MIN_VOTES,
    );

    let rankInList: number | null = null;
    let listSize: number | null = null;
    try {
      const board = await getLeaderboard({ listId, city, limit: 200 });
      listSize = board.entries.length;
      const found = board.entries.find((e: LeaderboardEntry) => e.placeId === placeId);
      rankInList = found?.rank ?? null;
    } catch {
      // rank optional
    }

    return {
      stats: {
        placeId,
        averageRating: roundScore(averageRating),
        voteCount,
        weightedScore: roundScore(weightedScore),
        rankInList,
        listSize,
      },
      allTimeAverage: roundScore(averageRating),
      allTimeVotes: voteCount,
    };
  }
);
