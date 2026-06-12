import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type SuggestionCategory = "song" | "movie" | "tv" | "video" | "place" | "book";
export type RecipientStatus = "pending" | "saved" | "completed" | "ignored";

export interface RecipientInfo {
  recipient_clerk_id: string;
  recipient_username: string | null;
  recipient_avatar: string | null;
  status: RecipientStatus;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  share_id: string;
  category: SuggestionCategory;
  title: string;
  short_note: string | null;
  rating: number | null;
  external_link: string | null;
  image_url: string | null;
  preview_url: string | null;
  expires_at: string | null;
  opened_at: string | null;
  reaction: string | null;
  is_daily_pick: boolean;
  created_at: string;
}

export interface InboxSuggestion extends Suggestion {
  suggestion_id: string;
  sender_clerk_id: string;
  sender_username: string | null;
  sender_avatar: string | null;
  status: RecipientStatus;
  updated_at: string;
}

export interface SentSuggestion extends Suggestion {
  recipients: RecipientInfo[];
}

export interface SuggestionDetail extends Suggestion {
  sender_clerk_id: string;
  sender_username: string | null;
  sender_avatar: string | null;
  recipient_status: RecipientStatus | null;
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
  sender_clerk_id: string | null;
  sender_username: string | null;
  sender_avatar: string | null;
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
 * GET /suggest/search/song
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
 * Yeni bir öneri oluşturur ve alıcılara gönderir (veya link paylaşımı için oluşturur)
 * POST /suggest/create
 */
export const createSuggestion = api(
  { expose: true, method: "POST", path: "/suggest/create" },
  async (req: CreateSuggestionRequest): Promise<CreateSuggestionResponse> => {
    // Default expiration is 24 hours from now for shareable links
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.schema("suggest").rpc("create_suggestion", {
      sender_clerk_id_param: req.senderClerkId,
      category_param: req.category,
      title_param: req.title,
      short_note_param: req.shortNote || null,
      rating_param: req.rating !== undefined ? req.rating : null,
      external_link_param: req.externalLink || null,
      image_url_param: req.imageUrl || null,
      recipient_clerk_ids: req.recipientClerkIds || [],
      expires_at_param: expiresAt,
      is_daily_pick_param: true, // Always true since every suggestion is now a daily pick/special link
      preview_url_param: req.previewUrl || null,
    });

    if (error) {
      console.error("createSuggestion error:", error);
      throw APIError.internal(`Failed to create suggestion: ${error.message}`);
    }

    return {
      success: true,
      suggestionId: data?.suggestion_id,
      shareId: data?.share_id,
      recipientsAdded: data?.recipients_added,
    };
  }
);

/**
 * Kullanıcıya gelen tüm önerileri listeler (Inbox)
 * GET /suggest/inbox/:userId
 */
export const getInbox = api(
  { expose: true, method: "GET", path: "/suggest/inbox/:userId" },
  async ({ userId }: { userId: string }): Promise<InboxResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_inbox_suggestions", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getInbox error:", error);
      throw APIError.internal(`Failed to fetch inbox: ${error.message}`);
    }

    const suggestions: InboxSuggestion[] = (data || []).map((row: any) => ({
      id: row.id,
      share_id: row.share_id,
      suggestion_id: row.suggestion_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
      preview_url: row.preview_url || null,
      expires_at: row.expires_at || null,
      opened_at: row.opened_at || null,
      reaction: row.reaction || null,
      is_daily_pick: !!row.is_daily_pick,
      created_at: row.created_at,
      sender_clerk_id: row.sender_clerk_id,
      sender_username: row.sender_username,
      sender_avatar: row.sender_avatar,
      status: row.status as RecipientStatus,
      updated_at: row.updated_at,
    }));

    return { suggestions };
  }
);

/**
 * Kullanıcının gönderdiği tüm önerileri listeler (Sent)
 * GET /suggest/sent/:userId
 */
export const getSent = api(
  { expose: true, method: "GET", path: "/suggest/sent/:userId" },
  async ({ userId }: { userId: string }): Promise<SentResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_sent_suggestions", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getSent error:", error);
      throw APIError.internal(`Failed to fetch sent suggestions: ${error.message}`);
    }

    const suggestions: SentSuggestion[] = (data || []).map((row: any) => ({
      id: row.id,
      share_id: row.share_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
      preview_url: row.preview_url || null,
      expires_at: row.expires_at || null,
      opened_at: row.opened_at || null,
      reaction: row.reaction || null,
      is_daily_pick: !!row.is_daily_pick,
      created_at: row.created_at,
      recipients: (row.recipients || []).map((r: any) => ({
        recipient_clerk_id: r.recipient_clerk_id,
        recipient_username: r.recipient_username,
        recipient_avatar: r.recipient_avatar,
        status: r.status as RecipientStatus,
        updated_at: r.updated_at,
      })),
    }));

    return { suggestions };
  }
);

/**
 * Bir önerinin alıcı durumunu günceller (Save, Completed, Ignore, etc.)
 * POST /suggest/status
 */
export const updateStatus = api(
  { expose: true, method: "POST", path: "/suggest/status" },
  async (req: UpdateStatusRequest): Promise<UpdateStatusResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("update_recipient_status", {
      recipient_clerk_id_param: req.recipientClerkId,
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
 * Öneri detayını getirir (Gönderen veya Alıcı görebilir)
 * GET /suggest/detail/:id/:userId
 */
export const getSuggestionDetail = api(
  { expose: true, method: "GET", path: "/suggest/detail/:id/:userId" },
  async ({ id, userId }: DetailRequest): Promise<DetailResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("get_suggestion_detail", {
      clerk_id_param: userId,
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
      share_id: row.share_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
      preview_url: row.preview_url || null,
      expires_at: row.expires_at || null,
      opened_at: row.opened_at || null,
      reaction: row.reaction || null,
      is_daily_pick: !!row.is_daily_pick,
      created_at: row.created_at,
      sender_clerk_id: row.sender_clerk_id,
      sender_username: row.sender_username,
      sender_avatar: row.sender_avatar,
      recipient_status: row.recipient_status as RecipientStatus | null,
    };

    return { suggestion };
  }
);

/**
 * Public endpoint to fetch suggestion detail (no authentication required)
 * Handles expiration check and registers "opened" state on first access.
 * GET /suggest/public/:id
 */
export const getPublicSuggestion = api(
  { expose: true, method: "GET", path: "/suggest/public/:id" },
  async ({ id, userId }: { id: string; userId?: string }): Promise<PublicDetailResponse> => {
    // 1. Fetch suggestion using share_id
    const { data, error } = await supabase
      .schema("suggest")
      .from("suggestions")
      .select("*")
      .eq("share_id", id)
      .single();

    if (error || !data) {
      console.error("getPublicSuggestion error:", error);
      return { suggestion: null, sender_clerk_id: null, sender_username: null, sender_avatar: null, isExpired: false };
    }

    // If userId is provided and is not the sender, add them as a recipient
    if (userId && userId !== data.sender_clerk_id) {
      const { data: recUser, error: recUserErr } = await supabase
        .schema("public")
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (recUser && !recUserErr) {
        await supabase
          .schema("suggest")
          .from("recipients")
          .upsert(
            {
              suggestion_id: data.id,
              recipient_id: recUser.id,
              recipient_clerk_id: userId,
              status: "pending",
            },
            { onConflict: "suggestion_id,recipient_clerk_id", ignoreDuplicates: true }
          );
      }
    }

    const suggestion: Suggestion = {
      id: data.id,
      share_id: data.share_id,
      category: data.category as SuggestionCategory,
      title: data.title,
      short_note: data.short_note,
      rating: data.rating ? parseFloat(data.rating) : null,
      external_link: data.external_link,
      image_url: data.image_url,
      preview_url: data.preview_url || null,
      expires_at: data.expires_at || null,
      opened_at: data.opened_at || null,
      reaction: data.reaction || null,
      is_daily_pick: !!data.is_daily_pick,
      created_at: data.created_at,
    };

    // 2. Check if expired
    const isExpired = suggestion.expires_at 
      ? new Date() > new Date(suggestion.expires_at)
      : false;

    if (isExpired) {
      return { suggestion: null, sender_clerk_id: null, sender_username: null, sender_avatar: null, isExpired: true };
    }

    // 3. Register opened state
    if (!suggestion.opened_at) {
      await supabase.schema("suggest").rpc("mark_suggestion_opened", {
        share_id_param: id,
      });
      suggestion.opened_at = new Date().toISOString();
    }

    // 4. Resolve sender username/avatar
    let sender_username = null;
    let sender_avatar = null;
    const { data: userData, error: userError } = await supabase
      .schema("public")
      .from("users")
      .select("username, avatar_url")
      .eq("clerk_id", data.sender_clerk_id)
      .single();

    if (userData && !userError) {
      sender_username = userData.username;
      sender_avatar = userData.avatar_url;
    }

    return { suggestion, sender_clerk_id: data.sender_clerk_id, sender_username, sender_avatar, isExpired: false };
  }
);

/**
 * Submit reaction for a suggestion publicly
 * POST /suggest/reaction
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
 * GET /suggest/daily-status/:userId
 */
export const getDailyStatus = api(
  { expose: true, method: "GET", path: "/suggest/daily-status/:userId" },
  async ({ userId }: { userId: string }): Promise<DailyStatusResponse> => {
    const { data, error } = await supabase
      .schema("suggest")
      .from("suggestions")
      .select("created_at")
      .eq("sender_clerk_id", userId)
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
