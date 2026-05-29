import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Concert {
  id: string;
  user_clerk_id: string;
  artist: string;
  date: string; // YYYY-MM-DD
  venue?: string;
  notes?: string;
  rating?: number;
  created_at: string;
}

// ==================== REQ/RES INTERFACES ====================

interface GetConcertsRequest {
  userId: string;
}

interface GetConcertsResponse {
  concerts: Concert[];
}

interface AddConcertRequest {
  userId: string;
  artist: string;
  date: string;
  venue?: string;
  notes?: string;
  rating?: number;
}

interface AddConcertResponse {
  concert: Concert | null;
}

interface BulkImportRequest {
  userId: string;
  concerts: {
    artist: string;
    date: string;
    venue?: string;
    notes?: string;
    rating?: number;
  }[];
}

interface BulkImportResponse {
  importedCount: number;
}

interface DeleteConcertRequest {
  id: string;
  userId: string;
}

interface DeleteConcertResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Get all concerts for a user
 * GET /concert-list/concerts/:userId
 */
export const getConcerts = api(
  { expose: true, method: "GET", path: "/concert-list/concerts/:userId" },
  async ({ userId }: GetConcertsRequest): Promise<GetConcertsResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("get_concerts", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getConcerts error:", error);
      throw APIError.internal(`Failed to load concerts: ${error.message}`);
    }

    return { concerts: data || [] };
  }
);

/**
 * Add a new concert
 * POST /concert-list/concerts/add
 */
export const addConcert = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/add" },
  async ({ userId, artist, date, venue, notes, rating }: AddConcertRequest): Promise<AddConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("add_concert", {
      clerk_id_param: userId,
      artist_param: artist,
      date_param: date,
      venue_param: venue || null,
      notes_param: notes || null,
      rating_param: rating || null,
    });

    if (error) {
      console.error("addConcert error:", error);
      throw APIError.internal(`Failed to add concert: ${error.message}`);
    }

    return { concert: data?.[0] || null };
  }
);

/**
 * Bulk import concerts
 * POST /concert-list/concerts/bulk
 */
export const bulkImportConcerts = api(
  { expose: true, method: "POST", path: "/concert-list/concerts/bulk" },
  async ({ userId, concerts }: BulkImportRequest): Promise<BulkImportResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("bulk_import_concerts", {
      clerk_id_param: userId,
      p_concerts: concerts,
    });

    if (error) {
      console.error("bulkImportConcerts error:", error);
      throw APIError.internal(`Failed to bulk import concerts: ${error.message}`);
    }

    return { importedCount: Number(data) || 0 };
  }
);

/**
 * Delete a concert
 * DELETE /concert-list/concerts/:id/:userId
 */
export const deleteConcert = api(
  { expose: true, method: "DELETE", path: "/concert-list/concerts/:id/:userId" },
  async ({ id, userId }: DeleteConcertRequest): Promise<DeleteConcertResponse> => {
    const { data, error } = await supabase.schema("concert_list").rpc("delete_concert", {
      concert_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteConcert error:", error);
      throw APIError.internal(`Failed to delete concert: ${error.message}`);
    }

    return { success: !!data };
  }
);
