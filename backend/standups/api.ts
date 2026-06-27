import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Comedian {
  id: string;
  business_id: string | null;
  name: string;
  bio: string | null;
  image_url: string | null;
  youtube_channel_id: string | null;
  instagram_username: string | null;
  created_at: string;
}

export interface Show {
  id: string;
  comedian_id: string;
  venue_business_id: string | null;
  venue_name: string | null;
  title: string;
  description: string | null;
  show_date: string;
  ticket_url: string | null;
  created_at: string;
  comedian?: Comedian;
}

export interface Video {
  id: string;
  comedian_id: string;
  youtube_video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface ListShowsResponse {
  shows: Show[];
}

interface ListComediansResponse {
  comedians: Comedian[];
}

interface ComedianDetailsResponse {
  comedian: Comedian;
  shows: Show[];
  videos: Video[];
}

// ==================== ENDPOINTS ====================

/**
 * Get all upcoming shows
 */
export const listUpcomingShows = api(
  { expose: true, method: "GET", path: "/standups/shows" },
  async (): Promise<ListShowsResponse> => {
    const { data, error } = await supabase.rpc("get_upcoming_shows");

    if (error) {
      throw APIError.internal(`Failed to fetch shows: ${error.message}`);
    }

    return { shows: data || [] };
  }
);

/**
 * Get comedian details with shows and videos
 */
export const getComedianDetails = api(
  { expose: true, method: "GET", path: "/standups/comedian/:id" },
  async ({ id }: { id: string }): Promise<ComedianDetailsResponse> => {
    const { data, error } = await supabase.rpc("get_comedian_full_details", {
      p_comedian_id: id
    });

    if (error || !data) {
      throw APIError.notFound(`Comedian not found or error: ${error?.message}`);
    }

    return data as ComedianDetailsResponse;
  }
);

/**
 * List all comedians
 */
export const listComedians = api(
  { expose: true, method: "GET", path: "/standups/comedians" },
  async (): Promise<ListComediansResponse> => {
    const { data, error } = await supabase
      .from("standup_comedians")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw APIError.internal(`Failed to fetch comedians: ${error.message}`);
    }

    return { comedians: data || [] };
  }
);

/**
 * Create or update a comedian (Admin/Business owner)
 */
export const upsertComedian = api(
  { expose: true, method: "POST", path: "/standups/comedian" },
  async (req: Partial<Comedian> & { name: string }): Promise<{ comedian: Comedian }> => {
    const { data, error } = await supabase
      .from("standup_comedians")
      .upsert({
        id: req.id,
        business_id: req.business_id,
        name: req.name,
        bio: req.bio,
        image_url: req.image_url,
        youtube_channel_id: req.youtube_channel_id,
        instagram_username: req.instagram_username
      })
      .select()
      .single();

    if (error) {
      throw APIError.internal(`Failed to upsert comedian: ${error.message}`);
    }

    return { comedian: data };
  }
);

/**
 * Create or update a show
 */
export const upsertShow = api(
  { expose: true, method: "POST", path: "/standups/show" },
  async (req: Partial<Show> & { comedian_id: string; title: string; show_date: string }): Promise<{ show: Show }> => {
    const { data, error } = await supabase
      .from("standup_shows")
      .upsert({
        id: req.id,
        comedian_id: req.comedian_id,
        venue_business_id: req.venue_business_id,
        venue_name: req.venue_name,
        title: req.title,
        description: req.description,
        show_date: req.show_date,
        ticket_url: req.ticket_url
      })
      .select()
      .single();

    if (error) {
      throw APIError.internal(`Failed to upsert show: ${error.message}`);
    }

    return { show: data };
  }
);

/**
 * Add a video to a comedian
 */
export const addVideo = api(
  { expose: true, method: "POST", path: "/standups/video" },
  async (req: { comedian_id: string; youtube_video_id: string; title?: string; thumbnail_url?: string }): Promise<{ video: Video }> => {
    const { data, error } = await supabase
      .from("standup_videos")
      .upsert({
        comedian_id: req.comedian_id,
        youtube_video_id: req.youtube_video_id,
        title: req.title,
        thumbnail_url: req.thumbnail_url
      })
      .select()
      .single();

    if (error) {
      throw APIError.internal(`Failed to add video: ${error.message}`);
    }

    return { video: data };
  }
);
