import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Attendee {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  status: string; // 'going', 'interested'
}

export interface CampusEvent {
  id: string;
  title: string;
  description?: string | null;
  university: string;
  location?: string | null;
  event_date: string; // ISO String
  image_url?: string | null;
  organizer_club?: string | null;
  added_by_id?: string | null;
  creator_username?: string | null;
  creator_avatar?: string | null;
  created_at: string;
  user_status?: string | null; // status of requesting user ('going', 'interested', null)
  attendees?: Attendee[];
}

// ==================== REQ/RES INTERFACES ====================

interface GetEventsRequest {
  userId?: string;
  university: string;
}

interface GetEventsResponse {
  events: CampusEvent[];
}

interface AddEventRequest {
  userId: string;
  title: string;
  description?: string;
  university: string;
  location?: string;
  eventDate: string; // ISO String
  imageUrl?: string;
  organizerClub?: string;
}

interface AddEventResponse {
  event: CampusEvent | null;
}

interface SetAttendanceRequest {
  userId: string;
  eventId: string;
  status: string; // 'going', 'interested', 'none'
}

interface SetAttendanceResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Get all events for a specific university
 * GET /campus-events/events
 */
export const getEvents = api(
  { expose: true, method: "GET", path: "/campus-events/events" },
  async ({ userId, university }: GetEventsRequest): Promise<GetEventsResponse> => {
    const { data, error } = await supabase.schema("campus_events").rpc("get_events", {
      clerk_id_param: userId || null,
      university_param: university,
    });

    if (error) {
      console.error("getEvents error:", error);
      throw APIError.internal(`Failed to load campus events: ${error.message}`);
    }

    return { events: data || [] };
  }
);

/**
 * Add a new campus event
 * POST /campus-events/events/add
 */
export const addEvent = api(
  { expose: true, method: "POST", path: "/campus-events/events/add" },
  async ({ 
    userId, 
    title, 
    description, 
    university, 
    location, 
    eventDate, 
    imageUrl, 
    organizerClub 
  }: AddEventRequest): Promise<AddEventResponse> => {
    const { data, error } = await supabase.schema("campus_events").rpc("add_event", {
      title_param: title,
      description_param: description || null,
      university_param: university,
      location_param: location || null,
      event_date_param: eventDate,
      image_url_param: imageUrl || null,
      organizer_club_param: organizerClub || null,
      added_by_clerk_id_param: userId,
    });

    if (error) {
      console.error("addEvent error:", error);
      throw APIError.internal(`Failed to add campus event: ${error.message}`);
    }

    return { event: (data as CampusEvent) || null };
  }
);

/**
 * Set user attendance status for an event
 * POST /campus-events/attendance/set
 */
export const setAttendance = api(
  { expose: true, method: "POST", path: "/campus-events/attendance/set" },
  async ({ userId, eventId, status }: SetAttendanceRequest): Promise<SetAttendanceResponse> => {
    const { error } = await supabase.schema("campus_events").rpc("set_attendance", {
      clerk_id_param: userId,
      event_id_param: eventId,
      status_param: status,
    });

    if (error) {
      console.error("setAttendance error:", error);
      throw APIError.internal(`Failed to update event attendance: ${error.message}`);
    }

    return { success: true };
  }
);
