import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { users } from "~encore/clients";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type EventCategory =
  | "Konser"
  | "Workshop"
  | "Turnuva"
  | "Sosyal"
  | "Kariyer"
  | "Spor"
  | "Diğer";

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  university: string;
  clubId: string | null;
  clubName: string | null;
  location: string | null;
  category: EventCategory;
  eventDate: string;
  eventTime: string | null;
  imageUrl: string | null;
  creatorUsername: string | null;
  creatorAvatar: string | null;
  createdAt: string;
}

export interface UniversityInfo {
  university: string;
  eventCount: number;
}

// ==================== REQUEST/RESPONSE ====================

export interface GetEventsRequest {
  university?: string;
  category?: string;
}

export interface GetEventsResponse {
  events: CampusEvent[];
}

export interface GetUniversitiesResponse {
  universities: UniversityInfo[];
}

export interface AddEventRequest {
  userId: string;
  title: string;
  university: string;
  eventDate: string;
  description?: string;
  clubName?: string;
  location?: string;
  category?: EventCategory;
  eventTime?: string;
  imageUrl?: string;
}

export interface AddEventResponse {
  eventId: string;
}

export interface DeleteEventRequest {
  userId: string;
  eventId: string;
}

export interface DeleteEventResponse {
  success: boolean;
}

// ==================== HELPERS ====================

async function requireAdmin(userId: string): Promise<void> {
  const res = await users.checkAdmin({ clerkId: userId });
  if (!res.isAdmin) {
    throw APIError.permissionDenied("Admin privilege required");
  }
}

function mapEvent(row: Record<string, unknown>): CampusEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || null,
    university: row.university as string,
    clubId: (row.club_id as string) || null,
    clubName: (row.club_name as string) || null,
    location: (row.location as string) || null,
    category: row.category as EventCategory,
    eventDate: row.event_date as string,
    eventTime: (row.event_time as string) || null,
    imageUrl: (row.image_url as string) || null,
    creatorUsername: (row.creator_username as string) || null,
    creatorAvatar: (row.creator_avatar as string) || null,
    createdAt: row.created_at as string,
  };
}

function isSchemaError(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "PGRST106" || (error?.message?.includes("Invalid schema") ?? false);
}

// ==================== API ENDPOINTS ====================

/**
 * Tüm etkinlikleri listeler (üniversite ve kategori filtresi opsiyonel)
 * GET /campus-event/events
 */
export const getEvents = api(
  { expose: true, method: "GET", path: "/campus-event/events" },
  async (req: GetEventsRequest): Promise<GetEventsResponse> => {
    const { data, error } = await supabase.schema("campus_event").rpc("get_events", {
      p_university: req.university || null,
      p_category: req.category || null,
    });

    if (error) {
      if (isSchemaError(error)) {
        console.warn("getEvents: campus_event schema not exposed yet");
        return { events: [] };
      }
      console.error("getEvents error:", error);
      throw APIError.internal(`Failed to get events: ${error.message}`);
    }

    return { events: (data || []).map(mapEvent) };
  }
);

/**
 * Üniversite listesini döner (etkinlik sayısıyla birlikte)
 * GET /campus-event/universities
 */
export const getUniversities = api(
  { expose: true, method: "GET", path: "/campus-event/universities" },
  async (): Promise<GetUniversitiesResponse> => {
    const { data, error } = await supabase.schema("campus_event").rpc("get_universities");

    if (error) {
      if (isSchemaError(error)) {
        console.warn("getUniversities: campus_event schema not exposed yet");
        return { universities: [] };
      }
      console.error("getUniversities error:", error);
      throw APIError.internal(`Failed to get universities: ${error.message}`);
    }

    const universities: UniversityInfo[] = (data || []).map((row: Record<string, unknown>) => ({
      university: row.university as string,
      eventCount: Number(row.event_count),
    }));

    return { universities };
  }
);

/**
 * Yeni etkinlik ekler (sadece admin)
 * POST /campus-event/events
 */
export const addEvent = api(
  { expose: true, method: "POST", path: "/campus-event/events" },
  async (req: AddEventRequest): Promise<AddEventResponse> => {
    await requireAdmin(req.userId);

    const { data, error } = await supabase.schema("campus_event").rpc("add_event", {
      p_creator_clerk_id: req.userId,
      p_title: req.title,
      p_university: req.university,
      p_event_date: req.eventDate,
      p_description: req.description || null,
      p_club_name: req.clubName || null,
      p_location: req.location || null,
      p_category: req.category || "Diğer",
      p_event_time: req.eventTime || null,
      p_image_url: req.imageUrl || null,
    });

    if (error) {
      console.error("addEvent error:", error);
      throw APIError.internal(`Failed to add event: ${error.message}`);
    }

    return { eventId: data };
  }
);

/**
 * Etkinliği siler (sadece admin)
 * POST /campus-event/events/delete
 */
export const deleteEvent = api(
  { expose: true, method: "POST", path: "/campus-event/events/delete" },
  async (req: DeleteEventRequest): Promise<DeleteEventResponse> => {
    await requireAdmin(req.userId);

    const { error } = await supabase
      .schema("campus_event")
      .from("events")
      .delete()
      .eq("id", req.eventId);

    if (error) {
      console.error("deleteEvent error:", error);
      throw APIError.internal(`Failed to delete event: ${error.message}`);
    }

    return { success: true };
  }
);
