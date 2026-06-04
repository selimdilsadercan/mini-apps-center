import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface FriendUser {
  id: string;
  username: string | null;
  avatar: string | null;
  lastPlayedAt?: string | null;
}

export interface PendingRequest {
  id: string;
  username: string | null;
  avatar: string | null;
  createdAt: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface SendRequestParams {
  senderId: string;
  receiverId: string;
}

interface SendRequestResponse {
  success: boolean;
  message: string;
}

interface ActionParams {
  userId: string; // The one accepting/rejecting
  friendId: string; // The one who sent the request or is the friend
}

interface ActionResponse {
  success: boolean;
  message?: string;
}

interface GetFriendsResponse {
  friends: FriendUser[];
}

interface GetPendingRequestsResponse {
  requests: PendingRequest[];
}

// ==================== API ENDPOINTS ====================

/**
 * Arkadaşlık isteği gönderir
 * POST /friendship/request/send
 */
export const sendRequest = api(
  { expose: true, method: "POST", path: "/friendship/request/send" },
  async ({ senderId, receiverId }: SendRequestParams): Promise<SendRequestResponse> => {
    const { data, error } = await supabase.rpc("send_friend_request", {
      sender_clerk_id: senderId,
      receiver_clerk_id: receiverId,
    });

    if (error) {
      console.error("sendRequest error:", error);
      throw APIError.internal(`Failed to send friend request: ${error.message}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "",
    };
  }
);

/**
 * Gelen arkadaşlık isteğini kabul eder
 * POST /friendship/request/accept
 */
export const acceptRequest = api(
  { expose: true, method: "POST", path: "/friendship/request/accept" },
  async ({ userId, friendId }: ActionParams): Promise<ActionResponse> => {
    const { data, error } = await supabase.rpc("accept_friend_request", {
      receiver_clerk_id: userId,
      sender_clerk_id: friendId,
    });

    if (error) {
      console.error("acceptRequest error:", error);
      throw APIError.internal(`Failed to accept friend request: ${error.message}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "",
    };
  }
);

/**
 * Gelen arkadaşlık isteğini reddeder
 * POST /friendship/request/reject
 */
export const rejectRequest = api(
  { expose: true, method: "POST", path: "/friendship/request/reject" },
  async ({ userId, friendId }: ActionParams): Promise<ActionResponse> => {
    const { data, error } = await supabase.rpc("reject_friend_request", {
      receiver_clerk_id: userId,
      sender_clerk_id: friendId,
    });

    if (error) {
      console.error("rejectRequest error:", error);
      throw APIError.internal(`Failed to reject friend request: ${error.message}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "",
    };
  }
);

/**
 * Arkadaşı siler veya isteği iptal eder
 * POST /friendship/remove
 */
export const removeFriend = api(
  { expose: true, method: "POST", path: "/friendship/remove" },
  async ({ userId, friendId }: ActionParams): Promise<ActionResponse> => {
    const { data, error } = await supabase.rpc("remove_friend", {
      user_clerk_id: userId,
      friend_clerk_id: friendId,
    });

    if (error) {
      console.error("removeFriend error:", error);
      throw APIError.internal(`Failed to remove friend: ${error.message}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "",
    };
  }
);

/**
 * Arkadaş listesini getirir
 * GET /friendship/friends/:userId
 */
export const getFriends = api(
  { expose: true, method: "GET", path: "/friendship/friends/:userId" },
  async ({ userId }: { userId: string }): Promise<GetFriendsResponse> => {
    const { data, error } = await supabase.rpc("get_friends", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getFriends error:", error);
      throw APIError.internal(`Failed to get friends list: ${error.message}`);
    }

    const friends: FriendUser[] = (data || []).map((item: any) => ({
      id: item.id,
      username: item.username,
      avatar: item.avatar,
      lastPlayedAt: item.last_played_at || null,
    }));

    return { friends };
  }
);

/**
 * Bekleyen arkadaşlık isteklerini getirir
 * GET /friendship/requests/pending/:userId
 */
export const getPendingRequests = api(
  { expose: true, method: "GET", path: "/friendship/requests/pending/:userId" },
  async ({ userId }: { userId: string }): Promise<GetPendingRequestsResponse> => {
    const { data, error } = await supabase.rpc("get_pending_requests", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getPendingRequests error:", error);
      throw APIError.internal(`Failed to get pending requests: ${error.message}`);
    }


    const requests: PendingRequest[] = (data || []).map((item: any) => ({
      id: item.id,
      username: item.username,
      avatar: item.avatar,
      createdAt: item.created_at,
    }));

    return { requests };
  }
);

interface GetSentRequestsResponse {
  requests: PendingRequest[];
}

/**
 * Gönderilen bekleyen arkadaşlık isteklerini getirir
 * GET /friendship/requests/sent/:userId
 */
export const getSentRequests = api(
  { expose: true, method: "GET", path: "/friendship/requests/sent/:userId" },
  async ({ userId }: { userId: string }): Promise<GetSentRequestsResponse> => {
    const { data, error } = await supabase.rpc("get_sent_requests", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getSentRequests error:", error);
      throw APIError.internal(`Failed to get sent requests: ${error.message}`);
    }

    const requests: PendingRequest[] = (data || []).map((item: any) => ({
      id: item.id,
      username: item.username,
      avatar: item.avatar,
      createdAt: item.created_at,
    }));

    return { requests };
  }
);

