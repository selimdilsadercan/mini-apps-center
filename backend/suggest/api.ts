import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type SuggestionCategory = "song" | "movie" | "tv" | "video" | "place" | "book";
export type RecipientStatus = "pending" | "saved" | "completed" | "ignored";

export interface RecipientInfo {
  recipientId: string;
  recipientUsername: string | null;
  recipientAvatar: string | null;
  status: RecipientStatus;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  shareId: string;
  category: SuggestionCategory;
  title: string;
  shortNote: string | null;
  rating: number | null;
  externalLink: string | null;
  imageUrl: string | null;
  previewUrl: string | null;
  expiresAt: string | null;
  openedAt: string | null;
  reaction: string | null;
  isDailyPick: boolean;
  createdAt: string;
}

export interface InboxSuggestion extends Suggestion {
  suggestionId: string;
  senderId: string;
  senderUsername: string | null;
  senderAvatar: string | null;
  status: RecipientStatus;
  updatedAt: string;
}

export interface SentSuggestion extends Suggestion {
  recipients: RecipientInfo[];
}

export interface SuggestionDetail extends Suggestion {
  senderId: string;
  senderUsername: string | null;
  senderAvatar: string | null;
  recipientStatus: RecipientStatus | null;
}

// ==================== REQUEST / RESPONSE ====================

interface CreateSuggestionRequest {
  senderClerkId: string;
  category: SuggestionCategory;
  title: string;
  shortNote?: string;
  rating?: number;
  externalLink?: string;
  imageUrl?: string;
  recipientClerkIds?: string[];
  isDailyPick?: boolean;
  previewUrl?: string;
}

interface CreateSuggestionResponse {
  success: boolean;
  suggestionId?: string;
  shareId?: string;
  recipientsAdded?: number;
}

interface UpdateStatusRequest {
  recipientClerkId: string;
  suggestionId: string;
  status: RecipientStatus;
}

interface UpdateStatusResponse {
  success: boolean;
}

interface DeleteSentRequest {
  senderClerkId: string;
  shareId: string;
}

interface DeleteSentResponse {
  success: boolean;
}

interface InboxResponse {
  suggestions: InboxSuggestion[];
}

interface SentResponse {
  suggestions: SentSuggestion[];
}

interface DetailRequest {
  id: string;
  userId: string;
}

interface DetailResponse {
  suggestion: SuggestionDetail | null;
}

interface SearchSongRequest {
  query: string;
}

export interface SongResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  trackViewUrl: string;
  previewUrl?: string;
}

interface SearchSongResponse {
  results: SongResult[];
}

interface PublicDetailResponse {
  suggestion: Suggestion | null;
  senderId: string | null;
  senderUsername: string | null;
  senderAvatar: string | null;
  isExpired: boolean;
}

interface ReactionRequest {
  suggestionId: string;
  reaction: string | null;
}

interface ReactionResponse {
  success: boolean;
}

interface DailyStatusResponse {
  canSendDailyPick: boolean;
  timeLeftSeconds?: number;
}

// ==================== API ENDPOINTS ====================

/**
 * iTunes API üzerinden şarkı araması yapar
 */
export const searchSong = api(
  { expose: true, method: "GET", path: "/suggest/search/song" },
  async ({ query }: SearchSongRequest): Promise<SearchSongResponse> => {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`
    );
    const data = (await response.json()) as any;
    return {
      results: (data.results || []).map((item: any) => ({
        trackId: item.trackId,
        trackName: item.trackName,
        artistName: item.artistName,
        artworkUrl100: item.artworkUrl100,
        trackViewUrl: item.trackViewUrl,
        previewUrl: item.previewUrl,
      })),
    };
  }
);

/**
 * Yeni bir öneri oluşturur ve alıcılara gönderir
 */
export const createSuggestion = api(
  { expose: true, method: "POST", path: "/suggest/create" },
  async (req: CreateSuggestionRequest): Promise<CreateSuggestionResponse> => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.schema("suggest").rpc("create_suggestion", {
      p_user_id: req.senderClerkId,
      category_param: req.category,
      title_param: req.title,
      short_note_param: req.shortNote || null,
      rating_param: req.rating !== undefined ? req.rating : null,
      external_link_param: req.externalLink || null,
      image_url_param: req.imageUrl || null,
      recipient_clerk_ids: req.recipientClerkIds || [],
      expires_at_param: expiresAt,
      is_daily_pick_param: true,
      preview_url_param: req.previewUrl || null,
    });

    if (error) {
      console.error("createSuggestion error:", error);
      throw APIError.internal(`Failed to create suggestion: ${error.message}`);
    }

    const res = data as any;
    return {
      success: true,
      suggestionId: res?.suggestion_id,
      shareId: res?.share_id,
      recipientsAdded: res?.recipients_added,
    };
  }
);

/**
 * Kullanıcıya gelen tüm önerileri listeler (Inbox)
 */
export const getInbox = api(
  { expose: true, method: "GET", path: "/suggest/inbox/:userId" },
  async ({ userId }: { userId: string }): Promise<InboxResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_inbox_suggestions", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getInbox error:", error);
      throw APIError.internal(`Failed to fetch inbox: ${error.message}`);
    }

    const suggestions: InboxSuggestion[] = (data || []).map((row: any) => ({
      id: row.id,
      shareId: row.share_id,
      suggestionId: row.suggestion_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      shortNote: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      externalLink: row.external_link,
      imageUrl: row.image_url,
      previewUrl: row.preview_url || null,
      expiresAt: row.expires_at || null,
      openedAt: row.opened_at || null,
      reaction: row.reaction || null,
      isDailyPick: !!row.is_daily_pick,
      createdAt: row.created_at,
      senderId: row.sender_id,
      senderUsername: row.sender_username,
      senderAvatar: row.sender_avatar,
      status: row.status as RecipientStatus,
      updatedAt: row.updated_at,
    }));

    return { suggestions };
  }
);

/**
 * Kullanıcının gönderdiği tüm önerileri listeler (Sent)
 */
export const getSent = api(
  { expose: true, method: "GET", path: "/suggest/sent/:userId" },
  async ({ userId }: { userId: string }): Promise<SentResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_sent_suggestions", {
      p_user_id: userId,
    });

    if (error) {
      console.error("getSent error:", error);
      throw APIError.internal(`Failed to fetch sent suggestions: ${error.message}`);
    }

    const suggestions: SentSuggestion[] = (data || []).map((row: any) => ({
      id: row.id,
      shareId: row.share_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      shortNote: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      externalLink: row.external_link,
      imageUrl: row.image_url,
      previewUrl: row.preview_url || null,
      expiresAt: row.expires_at || null,
      openedAt: row.opened_at || null,
      reaction: row.reaction || null,
      isDailyPick: !!row.is_daily_pick,
      createdAt: row.created_at,
      recipients: (row.recipients || []).map((r: any) => ({
        recipientId: r.recipient_id,
        recipientUsername: r.recipient_username,
        recipientAvatar: r.recipient_avatar,
        status: r.status as RecipientStatus,
        updatedAt: r.updated_at,
      })),
    }));

    return { suggestions };
  }
);

/**
 * Bir önerinin alıcı durumunu günceller
 */
export const updateStatus = api(
  { expose: true, method: "POST", path: "/suggest/status" },
  async (req: UpdateStatusRequest): Promise<UpdateStatusResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("update_recipient_status", {
      p_user_id: req.recipientClerkId,
      share_id_param: req.suggestionId,
      status_param: req.status,
    });

    if (error) {
      console.error("updateStatus error:", error);
      throw APIError.internal(`Failed to update status: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Gönderilen bir öneriyi gönderen için yumuşak siler
 */
export const deleteSentSuggestion = api(
  { expose: true, method: "POST", path: "/suggest/delete-sent" },
  async (req: DeleteSentRequest): Promise<DeleteSentResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("delete_sent_suggestion", {
      p_user_id: req.senderClerkId,
      share_id_param: req.shareId,
    });

    if (error) {
      console.error("deleteSentSuggestion error:", error);
      throw APIError.internal(`Failed to delete sent suggestion: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Öneri detayını getirir
 */
export const getSuggestionDetail = api(
  { expose: true, method: "GET", path: "/suggest/detail/:id/:userId" },
  async ({ id, userId }: DetailRequest): Promise<DetailResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_suggestion_detail", {
      p_user_id: userId,
      share_id_param: id,
    });

    if (error) {
      console.error("getSuggestionDetail error:", error);
      throw APIError.internal(`Failed to fetch suggestion detail: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return { suggestion: null };
    }

    const row = data[0];
    const suggestion: SuggestionDetail = {
      id: row.id,
      shareId: row.share_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      shortNote: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      externalLink: row.external_link,
      imageUrl: row.image_url,
      previewUrl: row.preview_url || null,
      expiresAt: row.expires_at || null,
      openedAt: row.opened_at || null,
      reaction: row.reaction || null,
      isDailyPick: !!row.is_daily_pick,
      createdAt: row.created_at,
      senderId: row.sender_id,
      senderUsername: row.sender_username,
      senderAvatar: row.sender_avatar,
      recipientStatus: row.recipient_status as RecipientStatus | null,
    };

    return { suggestion };
  }
);

/**
 * Public endpoint to fetch suggestion detail
 */
export const getPublicSuggestion = api(
  { expose: true, method: "GET", path: "/suggest/public/:id" },
  async ({ id, userId }: { id: string; userId?: string }): Promise<PublicDetailResponse> => {
    const { data, error } = await supabase
      .schema("suggest")
      .from("suggestions")
      .select("*")
      .eq("share_id", id)
      .single();

    if (error || !data) {
      console.error("getPublicSuggestion error:", error);
      return { suggestion: null, senderId: null, senderUsername: null, senderAvatar: null, isExpired: false };
    }

    if (userId) {
      const v_user_id = await supabase.rpc("get_internal_user_id", { clerk_id_param: userId });
      const v_sender_id = data.sender_id;

      if (v_user_id.data && v_user_id.data !== v_sender_id) {
        await supabase
          .schema("suggest")
          .from("recipients")
          .upsert(
            {
              suggestion_id: data.id,
              recipient_id: v_user_id.data,
              status: "pending",
            },
            { onConflict: "suggestion_id,recipient_id", ignoreDuplicates: true }
          );
      }
    }

    const suggestion: Suggestion = {
      id: data.id,
      shareId: data.share_id,
      category: data.category as SuggestionCategory,
      title: data.title,
      shortNote: data.short_note,
      rating: data.rating ? parseFloat(data.rating) : null,
      externalLink: data.external_link,
      imageUrl: data.image_url,
      previewUrl: data.preview_url || null,
      expiresAt: data.expires_at || null,
      openedAt: data.opened_at || null,
      reaction: data.reaction || null,
      isDailyPick: !!data.is_daily_pick,
      createdAt: data.created_at,
    };

    const isExpired = suggestion.expiresAt 
      ? new Date() > new Date(suggestion.expiresAt)
      : false;

    if (isExpired) {
      return { suggestion: null, senderId: null, senderUsername: null, senderAvatar: null, isExpired: true };
    }

    if (!suggestion.openedAt) {
      await supabase.schema("suggest").rpc("mark_suggestion_opened", {
        share_id_param: id,
      });
      suggestion.openedAt = new Date().toISOString();
    }

    let senderUsername = null;
    let senderAvatar = null;
    let senderId = data.sender_id;
    const { data: userData, error: userError } = await supabase
      .schema("public")
      .from("users")
      .select("username, avatar_url")
      .eq("id", data.sender_id)
      .single();

    if (userData && !userError) {
      senderUsername = userData.username;
      senderAvatar = userData.avatar_url;
    }

    return { suggestion, senderId, senderUsername, senderAvatar, isExpired: false };
  }
);

/**
 * Submit reaction for a suggestion publicly
 */
export const submitReaction = api(
  { expose: true, method: "POST", path: "/suggest/reaction" },
  async (req: ReactionRequest): Promise<ReactionResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("update_suggestion_reaction", {
      share_id_param: req.suggestionId,
      reaction_param: req.reaction,
    });

    if (error) {
      console.error("submitReaction error:", error);
      throw APIError.internal(`Failed to submit reaction: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Get daily suggestion pick status for a user
 */
export const getDailyStatus = api(
  { expose: true, method: "GET", path: "/suggest/daily-status/:userId" },
  async ({ userId }: { userId: string }): Promise<DailyStatusResponse> => {
    const v_user_id = await supabase.rpc("get_internal_user_id", { clerk_id_param: userId });
    
    if (!v_user_id.data) {
      return { canSendDailyPick: true };
    }

    const { data, error } = await supabase
      .schema("suggest")
      .from("suggestions")
      .select("created_at")
      .eq("sender_id", v_user_id.data)
      .eq("is_daily_pick", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("getDailyStatus error:", error);
      throw APIError.internal("Failed to retrieve daily status");
    }

    if (!data || data.length === 0) {
      return { canSendDailyPick: true };
    }

    const lastPickTime = new Date(data[0].created_at).getTime();
    const nextPickTime = lastPickTime + 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now >= nextPickTime) {
      return { canSendDailyPick: true };
    }

    const timeLeftSeconds = Math.ceil((nextPickTime - now) / 1000);
    return { canSendDailyPick: false, timeLeftSeconds };
  }
);
