import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

interface GetDataResponse {
  lists: any[];
  items: any[];
}

// Fetch all data
export const getData = api(
  { expose: true, method: "GET", path: "/map-tracker/data" },
  async (): Promise<GetDataResponse> => {
    const { data, error } = await supabase.schema("map_tracker").rpc("get_data");

    if (error) {
      console.error("getData error:", error);
      throw APIError.internal(`Failed to load map data: ${error.message}`);
    }

    return data || { lists: [], items: [] };
  }
);

// Toggle visited status
export const toggleVisited = api(
  { expose: true, method: "POST", path: "/map-tracker/toggle/:id" },
  async (params: { id: string }): Promise<void> => {
    const { error } = await supabase.schema("map_tracker").rpc("toggle_visited", {
      p_item_id: params.id,
    });

    if (error) {
      console.error("toggleVisited error:", error);
      throw APIError.internal(`Failed to toggle visited status: ${error.message}`);
    }
  }
);

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

// Bulk import items
export const importItems = api(
  { expose: true, method: "POST", path: "/map-tracker/import" },
  async (req: ImportRequest): Promise<void> => {
    const { error } = await supabase.schema("map_tracker").rpc("import_items", {
      p_list_name: req.listName,
      p_items: req.items,
    });

    if (error) {
      console.error("importItems error:", error);
      throw APIError.internal(`Failed to import items: ${error.message}`);
    }
  }
);
