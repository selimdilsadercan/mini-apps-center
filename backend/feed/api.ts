import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { friendship } from "~encore/clients";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface FeedEvent {
  id: string;
  userId: string;
  username: string | null;
  userAvatar: string | null;
  appId: string;
  eventType: string;
  payload: any;
  createdAt: string;
}

export interface CreateEventRequest {
  userId: string;
  username?: string | null;
  userAvatar?: string | null;
  appId: string;
  eventType: string;
  payload: any;
}

export interface CreateEventResponse {
  event: FeedEvent;
}

export interface GetFeedRequest {
  userId: string;
  scope?: string;
}

export interface GetFeedResponse {
  events: FeedEvent[];
}

// Endpoint to log a social event
export const createEvent = api(
  { expose: true, method: "POST", path: "/feed/event" },
  async (req: CreateEventRequest): Promise<CreateEventResponse> => {
    const { data, error } = await supabase.rpc("create_feed_event", {
      clerk_id_param: req.userId,
      username_param: req.username || null,
      user_avatar_param: req.userAvatar || null,
      app_id_param: req.appId,
      event_type_param: req.eventType,
      payload_param: req.payload || {},
    });

    if (error) {
      console.error("createEvent error:", error);
      throw APIError.internal(`Failed to create feed event: ${error.message}`);
    }

    const event = data as any;
    return {
      event: {
        id: event.id,
        userId: event.user_id,
        username: event.username,
        userAvatar: event.user_avatar,
        appId: event.app_id,
        eventType: event.event_type,
        payload: event.payload,
        createdAt: event.created_at,
      },
    };
  }
);

// Endpoint to fetch feed events for user & their friends
export const getFeed = api(
  { expose: true, method: "GET", path: "/feed/:userId" },
  async (req: GetFeedRequest): Promise<GetFeedResponse> => {
    // 1. Fetch friend list to get their internal UUIDs
    let friendUuids: string[] = [];
    if (req.scope !== "all") {
      try {
        const friendsRes = await friendship.getFriends({ userId: req.userId });
        friendUuids = (friendsRes.friends || []).map((f) => f.id);
      } catch (err) {
        console.error("Failed to fetch friends for feed:", err);
      }
    }

    // 2. Fetch events matching query scope
    const { data: rows, error } = await supabase.rpc("get_feed", {
      clerk_id_param: req.userId,
      scope_param: req.scope || "foryou",
      friend_ids_param: friendUuids,
    });

    if (error) {
      console.error("getFeed error:", error);
      throw APIError.internal(`Failed to fetch feed: ${error.message}`);
    }

    const events: FeedEvent[] = (rows || []).map((row: any) => {
      return {
        id: row.id,
        userId: row.user_id,
        username: row.creator_username || row.username || row.creator_full_name || "Anonim",
        userAvatar: row.creator_avatar_url || row.user_avatar,
        appId: row.app_id,
        eventType: row.event_type,
        payload: row.payload,
        createdAt: row.created_at,
      };
    });

    return { events };
  }
);

export interface GetEventsByAppRequest {
  appId: string;
}

export interface GetEventsByAppResponse {
  events: FeedEvent[];
}

// Get feed events for a specific app
export const getEventsByApp = api(
  { expose: true, method: "GET", path: "/feed/app/:appId" },
  async ({ appId }: GetEventsByAppRequest): Promise<GetEventsByAppResponse> => {
    const { data: rows, error } = await supabase.rpc("get_events_by_app", {
      app_id_param: appId,
    });

    if (error) {
      console.error("getEventsByApp error:", error);
      throw APIError.internal(`Failed to fetch events for app ${appId}: ${error.message}`);
    }

    const events: FeedEvent[] = (rows || []).map((row: any) => {
      return {
        id: row.id,
        userId: row.user_id,
        username: row.creator_username || row.username || row.creator_full_name || "Anonim",
        userAvatar: row.creator_avatar_url || row.user_avatar,
        appId: row.app_id,
        eventType: row.event_type,
        payload: row.payload,
        createdAt: row.created_at,
      };
    });

    return { events };
  }
);

export interface UpdateEventRequest {
  id: string;
  userId: string;
  payload: any;
}

// Update a feed event's payload
export const updateEvent = api(
  { expose: true, method: "PUT", path: "/feed/event/:id" },
  async (req: UpdateEventRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.rpc("update_feed_event", {
      id_param: req.id,
      clerk_id_param: req.userId,
      payload_param: req.payload,
    });

    if (error) {
      console.error("updateEvent error:", error);
      throw APIError.internal(`Failed to update feed event: ${error.message}`);
    }

    if (!data) {
      throw APIError.notFound("Feed event not found or unauthorized");
    }

    return { success: true };
  }
);

export interface DeleteEventRequest {
  id: string;
  userId: string;
}

// Delete a feed event
export const deleteEvent = api(
  { expose: true, method: "DELETE", path: "/feed/event/:id" },
  async (req: DeleteEventRequest): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.rpc("delete_feed_event", {
      id_param: req.id,
      clerk_id_param: req.userId,
    });

    if (error) {
      console.error("deleteEvent error:", error);
      throw APIError.internal(`Failed to delete feed event: ${error.message}`);
    }

    if (!data) {
      throw APIError.notFound("Feed event not found or unauthorized");
    }

    return { success: true };
  }
);

