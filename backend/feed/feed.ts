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
    const { data, error } = await supabase
      .schema("public")
      .from("feed_events")
      .insert({
        user_id: req.userId,
        username: req.username || null,
        user_avatar: req.userAvatar || null,
        app_id: req.appId,
        event_type: req.eventType,
        payload: req.payload || {},
      })
      .select()
      .single();

    if (error) {
      console.error("createEvent error:", error);
      throw APIError.internal(`Failed to create feed event: ${error.message}`);
    }

    return {
      event: {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        userAvatar: data.user_avatar,
        appId: data.app_id,
        eventType: data.event_type,
        payload: data.payload,
        createdAt: data.created_at,
      },
    };
  }
);

// Endpoint to fetch feed events for user & their friends
export const getFeed = api(
  { expose: true, method: "GET", path: "/feed/:userId" },
  async (req: GetFeedRequest): Promise<GetFeedResponse> => {
    // 1. Fetch friend list to get their clerk IDs if needed
    let friendIds: string[] = [];
    if (req.scope !== "all") {
      try {
        const friendsRes = await friendship.getFriends({ userId: req.userId });
        friendIds = (friendsRes.friends || []).map((f) => f.id);
      } catch (err) {
        console.error("Failed to fetch friends for feed:", err);
      }
    }

    // 2. Fetch events matching query scope
    let query = supabase.schema("public").from("feed_events").select("*");

    if (req.scope === "friends") {
      if (friendIds.length === 0) {
        return { events: [] };
      }
      query = query.in("user_id", friendIds);
    } else if (req.scope === "all") {
      // All platform events - no user filter
    } else {
      // foryou (default) scope: userId + friends
      const targetUserIds = [req.userId, ...friendIds];
      query = query.in("user_id", targetUserIds);
    }

    const { data: rows, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("getFeed error:", error);
      throw APIError.internal(`Failed to fetch feed: ${error.message}`);
    }

    const events: FeedEvent[] = (rows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      userAvatar: row.user_avatar,
      appId: row.app_id,
      eventType: row.event_type,
      payload: row.payload,
      createdAt: row.created_at,
    }));

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
    const { data: rows, error } = await supabase
      .schema("public")
      .from("feed_events")
      .select("*")
      .eq("app_id", appId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getEventsByApp error:", error);
      throw APIError.internal(`Failed to fetch events for app ${appId}: ${error.message}`);
    }

    const events: FeedEvent[] = (rows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      userAvatar: row.user_avatar,
      appId: row.app_id,
      eventType: row.event_type,
      payload: row.payload,
      createdAt: row.created_at,
    }));

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
    const { data, error } = await supabase
      .schema("public")
      .from("feed_events")
      .update({ payload: req.payload })
      .eq("id", req.id)
      .eq("user_id", req.userId)
      .select();

    if (error) {
      console.error("updateEvent error:", error);
      throw APIError.internal(`Failed to update feed event: ${error.message}`);
    }

    if (!data || data.length === 0) {
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
    const { data, error } = await supabase
      .schema("public")
      .from("feed_events")
      .delete()
      .eq("id", req.id)
      .eq("user_id", req.userId)
      .select();

    if (error) {
      console.error("deleteEvent error:", error);
      throw APIError.internal(`Failed to delete feed event: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw APIError.notFound("Feed event not found or unauthorized");
    }

    return { success: true };
  }
);

