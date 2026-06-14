import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

interface ImportRequest {
  userId: string;
  listName: string;
  items: {
    name: string;
    address?: string;
    google_maps_url?: string;
    latitude?: number;
    longitude?: number;
    note?: string;
    metadata?: any;
  }[];
}

// Helper to geocode via OpenStreetMap (Nominatim) API instead of Google Maps API
async function geocodeWithOSM(name: string, address?: string) {
  try {
    const query = encodeURIComponent(`${name} ${address || ""} İstanbul Turkey`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MiniAppsCenter/1.0"
      }
    });
    const data = (await response.json()) as any;

    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: result.display_name,
        google_data: {
          rating: 0,
          user_ratings_total: 0,
          phone: "",
          website: "",
          opening_hours: null,
          name: name
        }
      };
    }
  } catch (err) {
    console.error("OSM Geocoding Error:", err);
  }
  return null;
}

/**
 * Bulk import items for a user
 * POST /map-tracker/import
 */
export const importItems = api(
  { expose: true, method: "POST", path: "/map-tracker/import" },
  async (req: ImportRequest): Promise<void> => {
    // Process items and geocode if missing
    const processedItems = await Promise.all(
      req.items.map(async (item) => {
        // Always try to geocode to get full metadata and precise coordinates
        const geo = await geocodeWithOSM(item.name, item.address);
        
        if (geo) {
          return {
            ...item,
            latitude: geo.lat,
            longitude: geo.lng,
            address: geo.address || item.address,
            // Merge CSV metadata with rich Google data
            metadata: {
              ...(item.metadata || {}),
              google: geo.google_data
            }
          };
        }
        return item;
      }),
    );

    const { error } = await supabase.schema("map_tracker").rpc("import_items", {
      clerk_id_param: req.userId,
      p_list_name: req.listName,
      p_items: processedItems,
    });

    if (error) {
      console.error("importItems error:", error);
      throw APIError.internal(`Failed to import items: ${error.message}`);
    }
  },
);

/**
 * Get all lists and items for a user
 * GET /map-tracker/data/:userId
 */
export const getData = api(
  { expose: true, method: "GET", path: "/map-tracker/data/:userId" },
  async ({ userId }: { userId: string }): Promise<{ lists: any[]; items: any[] }> => {
    const { data, error } = await supabase
      .schema("map_tracker")
      .rpc("get_data", { clerk_id_param: userId });
    
    if (error) {
      console.error("getData error:", error);
      throw APIError.internal(`Failed to load map data: ${error.message}`);
    }
    
    return (data as any) || { lists: [], items: [] };
  },
);

/**
 * Toggle visited status for an item
 * POST /map-tracker/toggle-visited
 */
export const toggleVisited = api(
  { expose: true, method: "POST", path: "/map-tracker/toggle-visited" },
  async (req: { userId: string; id: string }): Promise<void> => {
    const { error } = await supabase
      .schema("map_tracker")
      .rpc("toggle_visited", {
        clerk_id_param: req.userId,
        p_item_id: req.id,
      });
    
    if (error) {
      console.error("toggleVisited error:", error);
      throw APIError.internal(`Failed to toggle visited status: ${error.message}`);
    }
  },
);
