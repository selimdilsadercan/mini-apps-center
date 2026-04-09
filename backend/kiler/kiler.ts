import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type StorageType = "fridge" | "freezer" | "pantry";

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  unit: string;
  storage_type: StorageType;
  purchase_date: string;
  expiry_date?: string;
  created_at: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetItemsRequest {
  userId: string;
}

interface GetItemsResponse {
  items: PantryItem[];
}

interface AddItemRequest {
  userId: string;
  name: string;
  amount: number;
  unit: string;
  storageType: StorageType;
  purchaseDate: string;
  expiryDate?: string;
}

interface AddItemResponse {
  item: PantryItem | null;
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
 * Kullanıcının kilerindeki tüm ürünleri getirir
 * GET /kiler/items/:userId
 */
export const getItems = api(
  { expose: true, method: "GET", path: "/kiler/items/:userId" },
  async ({ userId }: GetItemsRequest): Promise<GetItemsResponse> => {
    const { data, error } = await supabase.rpc("kiler_get_items", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getItems error:", error);
      throw APIError.internal(`Failed to load pantry items: ${error.message}`);
    }

    return { items: data || [] };
  }
);

/**
 * Kilere yeni ürün ekler
 * POST /kiler/add
 */
export const addItem = api(
  { expose: true, method: "POST", path: "/kiler/add" },
  async ({ userId, name, amount, unit, storageType, purchaseDate, expiryDate }: AddItemRequest): Promise<AddItemResponse> => {
    const { data, error } = await supabase.rpc("kiler_add_item", {
      clerk_id_param: userId,
      name_param: name,
      amount_param: amount,
      unit_param: unit,
      storage_type_param: storageType,
      purchase_date_param: purchaseDate,
      expiry_date_param: expiryDate,
    });

    if (error) {
      console.error("addItem error:", error);
      throw APIError.internal(`Failed to add pantry item: ${error.message}`);
    }

    return { item: data?.[0] || null };
  }
);

/**
 * Kilerinden ürün siler
 * DELETE /kiler/item/:id
 */
export const deleteItem = api(
  { expose: true, method: "DELETE", path: "/kiler/item/:id" },
  async ({ id, userId }: DeleteItemRequest): Promise<DeleteItemResponse> => {
    const { data, error } = await supabase.rpc("kiler_delete_item", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteItem error:", error);
      throw APIError.internal(`Failed to delete pantry item: ${error.message}`);
    }

    return { success: !!data };
  }
);
