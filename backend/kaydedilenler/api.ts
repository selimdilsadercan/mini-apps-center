import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES & INTERFACES ====================

export interface Bookmark {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  category: string;
  instagram_username: string | null;
  city: string | null;
  district: string | null;
  rating: number | null;
  is_visited: boolean;
  is_favorite: boolean;
  created_at: string;
}

interface GetUserBookmarksRequest {
  userId: string;
}

interface GetUserBookmarksResponse {
  bookmarks: Bookmark[];
}

interface CreateBookmarkRequest {
  userId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  category: string;
  instagramUsername?: string | null;
  city?: string | null;
  district?: string | null;
  rating?: number | null;
  isVisited?: boolean | null;
  isFavorite?: boolean | null;
}

interface CreateBookmarkResponse {
  bookmark: Bookmark | null;
}

interface UpdateBookmarkRequest {
  bookmarkId: string;
  userId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  category: string;
  instagramUsername?: string | null;
  city?: string | null;
  district?: string | null;
  rating?: number | null;
  isVisited: boolean;
  isFavorite: boolean;
}

interface UpdateBookmarkResponse {
  bookmark: Bookmark | null;
}

interface DeleteBookmarkRequest {
  bookmarkId: string;
  userId: string;
}

interface DeleteBookmarkResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Belirli kullanıcının tüm kaydedilenlerini getirir
 * GET /kaydedilenler/user/:userId
 */
export const getUserBookmarks = api(
  { expose: true, method: "GET", path: "/kaydedilenler/user/:userId" },
  async ({ userId }: GetUserBookmarksRequest): Promise<GetUserBookmarksResponse> => {
    const { data, error } = await supabase.schema("kaydedilenler").rpc("get_user_bookmarks", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getUserBookmarks error:", error);
      throw APIError.internal("Kaydedilenler yüklenemedi");
    }

    return { bookmarks: data || [] };
  }
);

/**
 * Yeni kaydedilen (bookmark) oluşturur
 * POST /kaydedilenler/create
 */
export const createBookmark = api(
  { expose: true, method: "POST", path: "/kaydedilenler/create" },
  async (req: CreateBookmarkRequest): Promise<CreateBookmarkResponse> => {
    const { data, error } = await supabase.schema("kaydedilenler").rpc("create_bookmark", {
      p_user_id: req.userId,
      p_title: req.title,
      p_description: req.description || null,
      p_url: req.url || null,
      p_image_url: req.imageUrl || null,
      p_category: req.category,
      p_instagram_username: req.instagramUsername || null,
      p_city: req.city || null,
      p_district: req.district || null,
      p_rating: req.rating !== undefined && req.rating !== null ? req.rating : null,
      p_is_visited: req.isVisited || false,
      p_is_favorite: req.isFavorite || false
    });

    if (error) {
      console.error("createBookmark error:", error);
      throw APIError.internal("Kaydedilen oluşturulamadı");
    }

    const row = data as any;
    return {
      bookmark: row ? {
        id: row.id,
        title: row.title,
        description: row.description,
        url: row.url,
        image_url: row.image_url,
        category: row.category,
        instagram_username: row.instagram_username,
        city: row.city,
        district: row.district,
        rating: row.rating ? Number(row.rating) : null,
        is_visited: row.is_visited,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
      } : null
    };
  }
);

/**
 * Kaydedileni günceller
 * PUT /kaydedilenler/:bookmarkId
 */
export const updateBookmark = api(
  { expose: true, method: "PUT", path: "/kaydedilenler/:bookmarkId" },
  async (req: UpdateBookmarkRequest): Promise<UpdateBookmarkResponse> => {
    const { data, error } = await supabase.schema("kaydedilenler").rpc("update_bookmark", {
      p_bookmark_id: req.bookmarkId,
      p_user_id: req.userId,
      p_title: req.title,
      p_description: req.description || null,
      p_url: req.url || null,
      p_image_url: req.imageUrl || null,
      p_category: req.category,
      p_instagram_username: req.instagramUsername || null,
      p_city: req.city || null,
      p_district: req.district || null,
      p_rating: req.rating !== undefined && req.rating !== null ? req.rating : null,
      p_is_visited: req.isVisited,
      p_is_favorite: req.isFavorite
    });

    if (error) {
      console.error("updateBookmark error:", error);
      throw APIError.internal("Kaydedilen güncellenemedi");
    }

    const row = data as any;
    if (!row) {
      throw APIError.permissionDenied("Bu kaydedileni güncelleme yetkiniz yok");
    }

    return {
      bookmark: {
        id: row.id,
        title: row.title,
        description: row.description,
        url: row.url,
        image_url: row.image_url,
        category: row.category,
        instagram_username: row.instagram_username,
        city: row.city,
        district: row.district,
        rating: row.rating ? Number(row.rating) : null,
        is_visited: row.is_visited,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
      }
    };
  }
);

/**
 * Kaydedileni siler
 * DELETE /kaydedilenler/:bookmarkId
 */
export const deleteBookmark = api(
  { expose: true, method: "DELETE", path: "/kaydedilenler/:bookmarkId" },
  async ({ bookmarkId, userId }: DeleteBookmarkRequest): Promise<DeleteBookmarkResponse> => {
    const { data, error } = await supabase.schema("kaydedilenler").rpc("delete_bookmark", {
      p_bookmark_id: bookmarkId,
      p_user_id: userId,
    });

    if (error) {
      console.error("deleteBookmark error:", error);
      throw APIError.internal("Kaydedilen silinemedi");
    }

    if (!data) {
      throw APIError.permissionDenied("Bu kaydedileni silme yetkiniz yok");
    }

    return { success: true };
  }
);
