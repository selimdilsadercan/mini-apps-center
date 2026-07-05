import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface MissingItem {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetItemsRequest {
  userId: string;
}

interface GetItemsResponse {
  items: MissingItem[];
}

interface AddItemRequest {
  userId: string;
  name: string;
}

interface AddItemResponse {
  item: MissingItem | null;
}

interface DeleteItemRequest {
  id: string;
  userId: string;
}

interface DeleteItemResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının eksik listesindeki tüm ürünleri getirir
 * GET /eksik-var/items/:userId
 */
export const getItems = api(
  { expose: true, method: "GET", path: "/eksik-var/items/:userId" },
  async ({ userId }: GetItemsRequest): Promise<GetItemsResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("get_missing_items", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getItems error:", error);
      throw APIError.internal(`Failed to load missing items: ${error.message}`);
    }

    return { items: data || [] };
  }
);

/**
 * Eksik listesine yeni ürün ekler
 * POST /eksik-var/add
 */
export const addItem = api(
  { expose: true, method: "POST", path: "/eksik-var/add" },
  async ({ userId, name }: AddItemRequest): Promise<AddItemResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("add_missing_item", {
      clerk_id_param: userId,
      name_param: name,
    });

    if (error) {
      console.error("addItem error:", error);
      throw APIError.internal(`Failed to add missing item: ${error.message}`);
    }

    return { item: (data as MissingItem) || null };
  }
);

/**
 * Eksik listesinden ürün siler
 * DELETE /eksik-var/item/:id
 */
export const deleteItem = api(
  { expose: true, method: "DELETE", path: "/eksik-var/item/:id" },
  async ({ id, userId }: DeleteItemRequest): Promise<DeleteItemResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("delete_missing_item", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteItem error:", error);
      throw APIError.internal(`Failed to delete missing item: ${error.message}`);
    }

    return { success: !!data };
  }
);
