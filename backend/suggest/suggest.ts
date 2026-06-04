import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type SuggestionCategory = "movie" | "tv" | "game" | "place";
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
  category: SuggestionCategory;
  title: string;
  short_note: string | null;
  rating: number | null;
  external_link: string | null;
  image_url: string | null;
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
  recipientClerkIds: string[];
}

interface CreateSuggestionResponse {
  success: boolean;
  suggestionId?: string;
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

// ==================== API ENDPOINTS ====================

/**
 * Yeni bir öneri oluşturur ve alıcılara gönderir
 * POST /suggest/create
 */
export const createSuggestion = api(
  { expose: true, method: "POST", path: "/suggest/create" },
  async (req: CreateSuggestionRequest): Promise<CreateSuggestionResponse> => {
    const { data, error } = await supabase.schema("suggest").rpc("create_suggestion", {
      sender_clerk_id_param: req.senderClerkId,
      category_param: req.category,
      title_param: req.title,
      short_note_param: req.shortNote || null,
      rating_param: req.rating !== undefined ? req.rating : null,
      external_link_param: req.externalLink || null,
      image_url_param: req.imageUrl || null,
      recipient_clerk_ids: req.recipientClerkIds,
    });

    if (error) {
      console.error("createSuggestion error:", error);
      throw APIError.internal(`Failed to create suggestion: ${error.message}`);
    }

    return {
      success: true,
      suggestionId: data?.suggestion_id,
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
      suggestion_id: row.suggestion_id,
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
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
 * Kullanıcının gönderdiği tüm önerileri ve alıcıların durumunu listeler (Sent)
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
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
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
      suggestion_id_param: req.suggestionId,
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
      suggestion_id_param: id,
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
      category: row.category as SuggestionCategory,
      title: row.title,
      short_note: row.short_note,
      rating: row.rating ? parseFloat(row.rating) : null,
      external_link: row.external_link,
      image_url: row.image_url,
      created_at: row.created_at,
      sender_clerk_id: row.sender_clerk_id,
      sender_username: row.sender_username,
      sender_avatar: row.sender_avatar,
      recipient_status: row.recipient_status as RecipientStatus | null,
    };

    return { suggestion };
  }
);
