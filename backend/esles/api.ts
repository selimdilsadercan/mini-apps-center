import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type Platform = "PC" | "PS" | "Xbox" | "Mobile" | "Switch" | "Diğer";

export interface EslesPost {
  id: string;
  creatorId: string;
  creatorUsername: string | null;
  creatorAvatar: string | null;
  gameName: string;
  platform: Platform;
  playerCount: number;
  description: string;
  rankInfo: string | null;
  scheduledTime: string | null;
  createdAt: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

export interface CreatePostRequest {
  creatorId: string;
  gameName: string;
  platform: Platform;
  playerCount: number;
  description: string;
  rankInfo?: string;
  scheduledTime?: string;
}

export interface CreatePostResponse {
  postId: string;
}

export interface GetPostsRequest {
  limit?: number;
  offset?: number;
}

export interface GetPostsResponse {
  posts: EslesPost[];
}

export interface DeletePostRequest {
  postId: string;
  userId: string;
}

export interface DeletePostResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Yeni bir oyun eşleşme ilanı oluşturur
 * POST /esles/posts
 */
export const createPost = api(
  { expose: true, method: "POST", path: "/esles/posts" },
  async (req: CreatePostRequest): Promise<CreatePostResponse> => {
    const { data, error } = await supabase.schema("esles").rpc("create_post", {
      p_creator_clerk_id: req.creatorId,
      p_game_name: req.gameName,
      p_platform: req.platform,
      p_player_count: req.playerCount,
      p_description: req.description,
      p_rank_info: req.rankInfo || null,
      p_scheduled_time: req.scheduledTime || null,
    });

    if (error) {
      console.error("createPost error:", error);
      throw APIError.internal(`Failed to create post: ${error.message}`);
    }

    return { postId: data };
  }
);

/**
 * Tüm aktif ilanları listeler (herkes görebilir)
 * GET /esles/posts
 */
export const getPosts = api(
  { expose: true, method: "GET", path: "/esles/posts" },
  async (_req: GetPostsRequest): Promise<GetPostsResponse> => {
    const { data, error } = await supabase.schema("esles").rpc("get_posts", {
      p_limit: _req.limit || 50,
      p_offset: _req.offset || 0,
    });

    if (error) {
      console.error("getPosts error:", error);
      throw APIError.internal(`Failed to get posts: ${error.message}`);
    }

    const posts: EslesPost[] = (data || []).map((row: any) => ({
      id: row.id,
      creatorId: row.creator_clerk_id,
      creatorUsername: row.creator_username,
      creatorAvatar: row.creator_avatar,
      gameName: row.game_name,
      platform: row.platform,
      playerCount: row.player_count,
      description: row.description,
      rankInfo: row.rank_info || null,
      scheduledTime: row.scheduled_time || null,
      createdAt: row.created_at,
    }));

    return { posts };
  }
);

/**
 * Kendi ilanını siler
 * POST /esles/posts/delete
 */
export const deletePost = api(
  { expose: true, method: "POST", path: "/esles/posts/delete" },
  async (req: DeletePostRequest): Promise<DeletePostResponse> => {
    const { data: userData, error: userErr } = await supabase
      .schema("public")
      .from("users")
      .select("id")
      .or(`clerk_id.eq.${req.userId},local_clerk_id.eq.${req.userId}`)
      .single();

    if (userErr || !userData) {
      throw APIError.notFound("User not found");
    }

    const { error } = await supabase
      .schema("esles")
      .from("posts")
      .delete()
      .eq("id", req.postId)
      .eq("creator_id", userData.id);

    if (error) {
      console.error("deletePost error:", error);
      throw APIError.internal(`Failed to delete post: ${error.message}`);
    }

    return { success: true };
  }
);
