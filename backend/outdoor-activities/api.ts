import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Venue {
  id: string;
  name: string;
  category: string;
  city: string;
  district?: string | null;
  address?: string | null;
  notes?: string | null;
  rating?: number | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

// ==================== REQUEST / RESPONSE INTERFACES ====================

interface GetVenuesRequest {
  category?: string;
  city?: string;
}

interface GetVenuesResponse {
  venues: Venue[];
}

interface GetVenueRequest {
  id: string;
}

interface GetVenueResponse {
  venue: Venue | null;
}

interface AddVenueRequest {
  name: string;
  category: string;
  city: string;
  district?: string;
  address?: string;
  notes?: string;
  rating?: number;
  websiteUrl?: string;
  imageUrl?: string;
  createdByClerkId?: string;
}

interface AddVenueResponse {
  venue: Venue | null;
}

// ==================== ENDPOINTS ====================

/**
 * Retrieve outdoor venues list
 * GET /outdoor-activities/venues
 */
export const getVenues = api(
  { expose: true, method: "GET", path: "/outdoor-activities/venues" },
  async ({ category, city }: GetVenuesRequest): Promise<GetVenuesResponse> => {
    let query = supabase.schema("outdoor_activities").from("venues").select("*");

    if (category) {
      query = query.eq("category", category);
    }
    if (city) {
      query = query.eq("city", city);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("getVenues error:", error);
      throw APIError.internal(`Failed to load venues: ${error.message}`);
    }

    const formatted = (data || []).map((row: Record<string, unknown>) => formatVenueRow(row));

    return { venues: formatted };
  }
);

function formatVenueRow(row: Record<string, unknown>): Venue {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    city: row.city as string,
    district: row.district as string | null | undefined,
    address: row.address as string | null | undefined,
    notes: row.notes as string | null | undefined,
    rating: row.rating != null ? Number(row.rating) : null,
    websiteUrl: row.website_url as string | null | undefined,
    imageUrl: row.image_url as string | null | undefined,
    createdBy: row.created_by as string | null | undefined,
    createdAt: row.created_at as string,
  };
}

/**
 * Retrieve a single outdoor venue
 * GET /outdoor-activities/venues/:id
 */
export const getVenue = api(
  { expose: true, method: "GET", path: "/outdoor-activities/venues/:id" },
  async ({ id }: GetVenueRequest): Promise<GetVenueResponse> => {
    const { data, error } = await supabase
      .schema("outdoor_activities")
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("getVenue error:", error);
      throw APIError.internal(`Failed to load venue: ${error.message}`);
    }

    return { venue: data ? formatVenueRow(data) : null };
  }
);

/**
 * Add a new outdoor venue
 * POST /outdoor-activities/venues/add
 */
export const addVenue = api(
  { expose: true, method: "POST", path: "/outdoor-activities/venues/add" },
  async ({
    name,
    category,
    city,
    district,
    address,
    notes,
    rating,
    websiteUrl,
    imageUrl,
    createdByClerkId
  }: AddVenueRequest): Promise<AddVenueResponse> => {
    let creatorUUID: string | null = null;

    if (createdByClerkId) {
      // Find public user UUID from clerk ID
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .or(`clerk_id.eq.${createdByClerkId},local_clerk_id.eq.${createdByClerkId}`)
        .single();
      if (userRow) {
        creatorUUID = userRow.id;
      }
    }

    const insertData = {
      name,
      category,
      city,
      district: district || null,
      address: address || null,
      notes: notes || null,
      rating: rating || null,
      website_url: websiteUrl || null,
      image_url: imageUrl || null,
      created_by: creatorUUID
    };

    const { data, error } = await supabase
      .schema("outdoor_activities")
      .from("venues")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("addVenue error:", error);
      throw APIError.internal(`Failed to add venue: ${error.message}`);
    }

    return { venue: formatVenueRow(data) };
  }
);

/**
 * Seed initial sample outdoor venues
 * POST /outdoor-activities/seed
 */
export const seedOutdoorVenues = api(
  { expose: true, method: "POST", path: "/outdoor-activities/seed" },
  async (): Promise<{ success: boolean; count: number }> => {
    const venues = [
      {
        name: "Kahramanmaraş Binicilik Kulübü",
        category: "horse-riding",
        city: "Kahramanmaraş",
        district: "Onikişubat",
        notes: "Muhteşem bir binicilik deneyimi, aile dostu ortam.",
        rating: 4.8,
        image_url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa52?w=600&auto=format&fit=crop"
      },
      {
        name: "Klavuzlu Barajı Kano Alanı",
        category: "canoeing",
        city: "Kahramanmaraş",
        district: "Kılavuzlu",
        notes: "Durgun su kanosu ve kürek sporu için ideal bölge.",
        rating: 4.5,
        image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop"
      },
      {
        name: "Yedikuyular Kayak Merkezi",
        category: "skiing",
        city: "Kahramanmaraş",
        district: "Dulkadiroğlu",
        notes: "Kış aylarında kayak, kızak ve kış kampı imkanları.",
        rating: 4.7,
        image_url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600&auto=format&fit=crop"
      },
      {
        name: "Başkonuş Yaylası Kamp Alanı",
        category: "camping",
        city: "Kahramanmaraş",
        district: "Andırın",
        notes: "Muhteşem çam ormanları içinde çadır ve karavan kampı.",
        rating: 4.9,
        image_url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&auto=format&fit=crop"
      },
      {
        name: "Istanbul Paintball Arena",
        category: "paintball",
        city: "İstanbul",
        district: "Beykoz",
        notes: "Geniş senaryolu açık saha paintball ve lasertag.",
        rating: 4.6,
        image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop"
      },
      {
        name: "Caddebostan Gokart Pisti",
        category: "gokart",
        city: "İstanbul",
        district: "Kadıköy",
        notes: "Hızlı virajları olan adrenalin dolu açık hava pisti.",
        rating: 4.4,
        image_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop"
      },
      {
        name: "Prens Adaları Dalış Merkezi",
        category: "diving",
        city: "İstanbul",
        district: "Adalar",
        notes: "Marmara Denizi'nde sualtı faunası ve batık dalışı turları.",
        rating: 4.6,
        image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop"
      }
    ];

    // Clear existing to avoid duplicates
    const names = venues.map(v => v.name);
    await supabase.schema("outdoor_activities").from("venues").delete().in("name", names);

    const { data, error } = await supabase.schema("outdoor_activities").from("venues").insert(venues).select();

    if (error) {
      console.error("seedOutdoorVenues error:", error);
      throw APIError.internal(`Failed to seed outdoor venues: ${error.message}`);
    }

    return { success: true, count: data?.length || 0 };
  }
);
