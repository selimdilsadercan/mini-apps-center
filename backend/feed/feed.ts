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
  async ({ userId }: GetFeedRequest): Promise<GetFeedResponse> => {
    // 1. Fetch friend list to get their clerk IDs
    let friendIds: string[] = [];
    try {
      const friendsRes = await friendship.getFriends({ userId });
      friendIds = (friendsRes.friends || []).map((f) => f.id);
    } catch (err) {
      console.error("Failed to fetch friends for feed:", err);
    }

    // 2. Fetch events matching user or friends
    const targetUserIds = [userId, ...friendIds];
    const { data: rows, error } = await supabase
      .schema("public")
      .from("feed_events")
      .select("*")
      .in("user_id", targetUserIds)
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
