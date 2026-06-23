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
  university?: string | null;
  location?: string | null;
  event_date: string; // ISO String
  image_url?: string | null;
  organizer_club?: string | null;
  added_by_id?: string | null;
  creator_username?: string | null;
  creator_avatar?: string | null;
  created_at: string;
  user_status?: string | null; // status of requesting user ('going', 'interested', null)
  businessId?: string | null;
  category?: string | null;
  attendees?: Attendee[];
}

// ==================== REQ/RES INTERFACES ====================

interface GetEventsRequest {
  userId?: string;
  university?: string;
  businessId?: string;
  category?: string;
}

interface GetEventsResponse {
  events: CampusEvent[];
}

interface AddEventRequest {
  userId: string;
  title: string;
  description?: string;
  university?: string;
  location?: string;
  eventDate: string; // ISO String
  imageUrl?: string;
  organizerClub?: string;
  businessId?: string;
  category?: string;
}

interface AddEventResponse {
  event: CampusEvent | null;
}

interface UpdateEventRequest {
  eventId: string;
  title: string;
  description?: string;
  university?: string;
  location?: string;
  eventDate: string; // ISO String
  imageUrl?: string;
  organizerClub?: string;
  category?: string;
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
  async ({ userId, university, businessId, category }: GetEventsRequest): Promise<GetEventsResponse> => {
    const { data, error } = await supabase.schema("campus_events").rpc("get_events", {
      clerk_id_param: userId || null,
      university_param: university || null,
      business_id_param: businessId || null,
      category_param: category || null,
    });

    if (error) {
      console.error("getEvents error:", error);
      throw APIError.internal(`Failed to load events: ${error.message}`);
    }

    return { events: data || [] };
  }
);

/**
 * Add a new event
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
    organizerClub,
    businessId,
    category
  }: AddEventRequest): Promise<AddEventResponse> => {
    const { data, error } = await supabase.schema("campus_events").rpc("add_event", {
      title_param: title,
      description_param: description || null,
      university_param: university || null,
      location_param: location || null,
      event_date_param: eventDate,
      image_url_param: imageUrl || null,
      organizer_club_param: organizerClub || null,
      added_by_clerk_id_param: userId,
      business_id_param: businessId || null,
      category_param: category || null,
    });

    if (error) {
      console.error("addEvent error:", error);
      throw APIError.internal(`Failed to add event: ${error.message}`);
    }

    return { event: (data as CampusEvent) || null };
  }
);

/**
 * Update an existing event
 * POST /campus-events/events/update
 */
export const updateEvent = api(
  { expose: true, method: "POST", path: "/campus-events/events/update" },
  async ({ 
    eventId, 
    title, 
    description, 
    university, 
    location, 
    eventDate, 
    imageUrl, 
    organizerClub,
    category
  }: UpdateEventRequest): Promise<{ event: CampusEvent | null }> => {
    const { data, error } = await supabase.schema("campus_events").rpc("update_event", {
      event_id_param: eventId,
      title_param: title,
      description_param: description || null,
      university_param: university || null,
      location_param: location || null,
      event_date_param: eventDate,
      image_url_param: imageUrl || null,
      organizer_club_param: organizerClub || null,
      category_param: category || null,
    });

    if (error) {
      console.error("updateEvent error:", error);
      throw APIError.internal(`Failed to update event: ${error.message}`);
    }

    return { event: (data as CampusEvent) || null };
  }
);

/**
 * Get a single event by ID
 * GET /campus-events/events/:id
 */
export const getEvent = api(
  { expose: true, method: "GET", path: "/campus-events/events/:id" },
  async ({ id, userId }: { id: string; userId?: string }): Promise<{ event: CampusEvent | null }> => {
    const { data, error } = await supabase.schema("campus_events").rpc("get_event", {
      clerk_id_param: userId || null,
      event_id_param: id,
    });

    if (error) {
      console.error("getEvent error:", error);
      throw APIError.internal(`Failed to load event: ${error.message}`);
    }

    const event = Array.isArray(data) ? data[0] : data;
    return { event: (event as CampusEvent) || null };
  }
);

interface BulkAddEventsRequest {
  userId: string;
  businessId: string;
  events: {
    title: string;
    description?: string;
    location?: string;
    eventDate: string; // ISO String
    imageUrl?: string;
    organizerClub?: string;
    category?: string;
  }[];
}

/**
 * Bulk add events
 * POST /campus-events/events/bulk-add
 */
export const bulkAddEvents = api(
  { expose: true, method: "POST", path: "/campus-events/events/bulk-add" },
  async ({ userId, businessId, events }: BulkAddEventsRequest): Promise<{ success: boolean }> => {
    for (const event of events) {
      const { error } = await supabase.schema("campus_events").rpc("add_event", {
        title_param: event.title,
        description_param: event.description || null,
        university_param: null,
        location_param: event.location || null,
        event_date_param: event.eventDate,
        image_url_param: event.imageUrl || null,
        organizer_club_param: event.organizerClub || null,
        added_by_clerk_id_param: userId,
        business_id_param: businessId,
        category_param: event.category || null,
      });

      if (error) {
        console.error("bulkAddEvents error for event:", event.title, error);
        // We continue even if one fails, or we could throw. 
        // For simplicity, let's just log and continue.
      }
    }

    return { success: true };
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
