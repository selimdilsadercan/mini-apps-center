import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const googleMapsApiKey = secret("GoogleMapsAPIKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

interface ImportRequest {
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

interface GooglePlaceResponse {
  status: string;
  candidates?: {
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }[];
}

// Helper to geocode via Google Places API
async function geocodeWithGoogle(name: string, address?: string) {
  const apiKey = googleMapsApiKey();
  if (!apiKey) return null;

  try {
    const query = encodeURIComponent(`${name} ${address || ""} İstanbul Turkey`);
    const fields = "geometry,formatted_address,name,rating,user_ratings_total,international_phone_number,website,opening_hours";
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=${fields}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = (await response.json()) as any; // Cast as any for simplicity with extra fields

    if (data.status === "OK" && data.candidates?.[0]) {
      const candidate = data.candidates[0];
      const location = candidate.geometry.location;
      
      // Combine existing metadata with new Google data
      return {
        lat: location.lat,
        lng: location.lng,
        address: candidate.formatted_address,
        google_data: {
          rating: candidate.rating,
          user_ratings_total: candidate.user_ratings_total,
          phone: candidate.international_phone_number,
          website: candidate.website,
          opening_hours: candidate.opening_hours,
          name: candidate.name
        }
      };
    }
  } catch (err) {
    console.error("Google Geocoding Error:", err);
  }
  return null;
}

// Bulk import items
export const importItems = api(
  { expose: true, method: "POST", path: "/map-tracker/import" },
  async (req: ImportRequest): Promise<void> => {
    // Process items and geocode if missing
    const processedItems = await Promise.all(
      req.items.map(async (item) => {
        // Always try to geocode to get full metadata and precise coordinates
        // even if some coordinates exist, Google's data is usually better.
        const geo = await geocodeWithGoogle(item.name, item.address);
        
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
      p_list_name: req.listName,
      p_items: processedItems,
    });

    if (error) {
      throw new Error(error.message);
    }
  },
);

export const getData = api(
  { expose: true, method: "GET", path: "/map-tracker/data" },
  async (): Promise<{ lists: any[]; items: any[] }> => {
    const { data, error } = await supabase
      .schema("map_tracker")
      .rpc("get_data");
    if (error) throw new Error(error.message);
    return (data as any) || { lists: [], items: [] };
  },
);

export const toggleVisited = api(
  { expose: true, method: "POST", path: "/map-tracker/toggle-visited" },
  async (req: { id: string }): Promise<void> => {
    const { error } = await supabase
      .schema("map_tracker")
      .rpc("toggle_visited", {
        p_id: req.id,
      });
    if (error) throw new Error(error.message);
  },
);
