import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Meme {
  id: string;
  title: string;
  description: string;
  context: string;
  example: string;
  trend_status: string; // 'Trending', 'Classic', 'Dead'
  media_url: string;
  tags: string[];
  likes_count: number;
  creator_id: string | null;
  creator_username: string | null;
  creator_avatar: string | null;
  created_at: string;
  parent_id?: string;
  is_liked?: boolean;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetMemesRequest {
  userId?: string;
  search?: string;
  tag?: string;
  trend?: string;
  parentId?: string;
  onlyParents?: boolean;
  limit?: number;
  offset?: number;
}

interface GetMemesResponse {
  memes: Meme[];
}

interface CreateMemeRequest {
  userId: string;
  title: string;
  description?: string;
  context?: string;
  example?: string;
  trendStatus: string;
  mediaUrl: string;
  tags?: string[];
  parentId?: string;
}

interface CreateMemeResponse {
  meme: Meme | null;
}

interface LikeMemeRequest {
  id: string;
  userId: string;
}

interface LikeMemeResponse {
  likesCount: number;
}

// ==================== API ENDPOINTS ====================

/**
 * Get memes with search, tag, and trend filtering
 * GET /memes
 */
export const getMemes = api(
  { expose: true, method: "GET", path: "/memedex/memes" },
  async (params: GetMemesRequest): Promise<GetMemesResponse> => {
    const { data, error } = await supabase.schema("memedex").rpc("get_memes", {
      clerk_id_param: params.userId || null,
      search_param: params.search || "",
      tag_param: params.tag || "",
      trend_param: params.trend || "",
      parent_id_param: params.parentId || null,
      only_parents_param: params.onlyParents !== undefined ? params.onlyParents : true,
      limit_param: params.limit !== undefined ? params.limit : 32,
      offset_param: params.offset || 0,
    });

    if (error) {
      console.error("getMemes error:", error);
      throw APIError.internal(`Failed to load memes: ${error.message}`);
    }

    return { memes: data || [] };
  }
);

/**
 * Create a new meme entry
 * POST /memes
 */
export const createMeme = api(
  { expose: true, method: "POST", path: "/memedex/memes" },
  async (req: CreateMemeRequest): Promise<CreateMemeResponse> => {
    const { data, error } = await supabase.schema("memedex").rpc("create_meme", {
      clerk_id_param: req.userId,
      title_param: req.title,
      description_param: req.description || "",
      context_param: req.context || "",
      example_param: req.example || "",
      trend_status_param: req.trendStatus,
      media_url_param: req.mediaUrl,
      tags_param: req.tags || [],
      parent_id_param: req.parentId || null,
    });

    if (error) {
      console.error("createMeme error:", error);
      throw APIError.internal(`Failed to submit meme: ${error.message}`);
    }

    return { meme: (data as Meme) || null };
  }
);

/**
 * Like/Upvote a meme (toggles)
 * POST /memes/:id/like
 */
export const likeMeme = api(
  { expose: true, method: "POST", path: "/memedex/memes/:id/like" },
  async ({ id, userId }: LikeMemeRequest): Promise<LikeMemeResponse> => {
    const { data, error } = await supabase.schema("memedex").rpc("like_meme", {
      id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("likeMeme error:", error);
      throw APIError.internal(`Failed to upvote meme: ${error.message}`);
    }

    return { likesCount: Number(data) || 0 };
  }
);

interface UpdateMemeRequest {
  id: string;
  title: string;
  trendStatus: string;
  mediaUrl: string;
}

interface UpdateMemeResponse {
  meme: Meme | null;
}

interface DeleteMemeRequest {
  id: string;
}

interface DeleteMemeResponse {
  success: boolean;
}

/**
 * Update an existing meme
 * PUT /memedex/memes/:id
 */
export const updateMeme = api(
  { expose: true, method: "PUT", path: "/memedex/memes/:id" },
  async ({ id, title, trendStatus, mediaUrl }: UpdateMemeRequest): Promise<UpdateMemeResponse> => {
    const { data, error } = await supabase.schema("memedex").rpc("update_meme", {
      id_param: id,
      title_param: title,
      trend_status_param: trendStatus,
      media_url_param: mediaUrl,
    });

    if (error) {
      console.error("updateMeme error:", error);
      throw APIError.internal(`Failed to update meme: ${error.message}`);
    }

    return { meme: (data as Meme) || null };
  }
);

/**
 * Delete a meme
 * DELETE /memedex/memes/:id
 */
export const deleteMeme = api(
  { expose: true, method: "DELETE", path: "/memedex/memes/:id" },
  async ({ id }: DeleteMemeRequest): Promise<DeleteMemeResponse> => {
    const { data, error } = await supabase.schema("memedex").rpc("delete_meme", {
      id_param: id,
    });

    if (error) {
      console.error("deleteMeme error:", error);
      throw APIError.internal(`Failed to delete meme: ${error.message}`);
    }

    return { success: !!data };
  }
);
