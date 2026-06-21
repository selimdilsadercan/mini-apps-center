import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type FeedbackStatus = 'pending' | 'planned' | 'in-progress' | 'completed';

export interface Feedback {
  id: string;
  user_id: string;
  business_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
  vote_count: number;
  has_voted: boolean;
  is_owner: boolean;
  author_name: string | null;
  author_avatar: string | null;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetFeedbacksRequest {
  userId: string;
  businessId: string;
}

interface GetFeedbacksResponse {
  feedbacks: Feedback[];
}

interface AddFeedbackRequest {
  userId: string;
  businessId: string;
  title: string;
  description?: string;
  category?: string;
}

interface AddFeedbackResponse {
  feedback: Feedback | null;
}

interface ToggleVoteRequest {
  userId: string;
  feedbackId: string;
}

interface ToggleVoteResponse {
  hasVoted: boolean;
}

interface DeleteFeedbackRequest {
  id: string;
  userId: string;
}

interface DeleteFeedbackResponse {
  success: boolean;
}

interface UpdateStatusRequest {
  userId: string;
  feedbackId: string;
  status: FeedbackStatus;
}

interface UpdateStatusResponse {
  feedback: Feedback | null;
}

interface UpdateFeedbackRequest {
  userId: string;
  feedbackId: string;
  title: string;
  description?: string;
  category?: string;
}

interface UpdateFeedbackResponse {
  feedback: Feedback | null;
}

// ==================== API ENDPOINTS ====================

/**
 * İşletmeye ait feedbackleri getirir
 */
export const getFeedbacks = api(
  { expose: true, method: "GET", path: "/feedback/feedbacks/:userId/:businessId" },
  async ({ userId, businessId }: GetFeedbacksRequest): Promise<GetFeedbacksResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("get_feedbacks", {
      clerk_id_param: userId,
      business_id_param: businessId,
    });

    if (error) {
      console.error("getFeedbacks error:", error);
      throw APIError.internal(`Failed to load feedbacks: ${error.message}`);
    }

    return { feedbacks: data || [] };
  }
);

/**
 * Yeni bir feedback ekler
 */
export const addFeedback = api(
  { expose: true, method: "POST", path: "/feedback/add" },
  async (req: AddFeedbackRequest): Promise<AddFeedbackResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("add_feedback", {
      clerk_id_param: req.userId,
      business_id_param: req.businessId,
      title_param: req.title,
      description_param: req.description || null,
      category_param: req.category || null,
    });

    if (error) {
      console.error("addFeedback error:", error);
      throw APIError.internal(`Failed to add feedback: ${error.message}`);
    }

    return { feedback: (data as Feedback) || null };
  }
);

/**
 * Feedback için oy verir veya oyu geri çeker
 */
export const toggleVote = api(
  { expose: true, method: "POST", path: "/feedback/toggle-vote" },
  async (req: ToggleVoteRequest): Promise<ToggleVoteResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("toggle_vote", {
      clerk_id_param: req.userId,
      feedback_id_param: req.feedbackId,
    });

    if (error) {
      console.error("toggleVote error:", error);
      throw APIError.internal(`Failed to toggle vote: ${error.message}`);
    }

    return { hasVoted: !!data };
  }
);

/**
 * Feedback'i siler
 */
export const deleteFeedback = api(
  { expose: true, method: "DELETE", path: "/feedback/delete/:id" },
  async ({ id, userId }: DeleteFeedbackRequest): Promise<DeleteFeedbackResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("delete_feedback", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteFeedback error:", error);
      throw APIError.internal(`Failed to delete feedback: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Feedback durumunu günceller (Sadece işletme sahibi)
 */
export const updateStatus = api(
  { expose: true, method: "PUT", path: "/feedback/update-status" },
  async (req: UpdateStatusRequest): Promise<UpdateStatusResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("update_feedback_status", {
      clerk_id_param: req.userId,
      feedback_id_param: req.feedbackId,
      status_param: req.status,
    });

    if (error) {
      console.error("updateStatus error:", error);
      throw APIError.internal(`Failed to update status: ${error.message}`);
    }

    return { feedback: (data as Feedback) || null };
  }
);

/**
 * Feedback içeriğini günceller (Sadece yazar)
 */
export const updateFeedback = api(
  { expose: true, method: "PUT", path: "/feedback/update" },
  async (req: UpdateFeedbackRequest): Promise<UpdateFeedbackResponse> => {
    const { data, error } = await supabase.schema("feedback_board").rpc("update_feedback", {
      clerk_id_param: req.userId,
      feedback_id_param: req.feedbackId,
      title_param: req.title,
      description_param: req.description || null,
      category_param: req.category || null,
    });

    if (error) {
      console.error("updateFeedback error:", error);
      throw APIError.internal(`Failed to update feedback: ${error.message}`);
    }

    return { feedback: (data as Feedback) || null };
  }
);
