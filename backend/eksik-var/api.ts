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
  notes?: string | null;
  is_used: boolean;
  category?: string | null;
  created_at: string;
}

export interface SharedMember {
  member_id: string;
  username: string | null;
  avatar_url: string | null;
  is_owner: boolean;
}

export interface InviteDetails {
  creator_username: string;
  is_expired: boolean;
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
  category?: string;
  notes?: string;
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

interface ToggleItemUsedRequest {
  id: string;
  userId: string;
}

interface ToggleItemUsedResponse {
  item: MissingItem | null;
}

interface UpdateItemRequest {
  id: string;
  userId: string;
  name?: string;
  isUsed?: boolean;
  category?: string;
  notes?: string;
}

interface UpdateItemResponse {
  item: MissingItem | null;
}

interface CreateShareInviteRequest {
  userId: string;
}

interface CreateShareInviteResponse {
  inviteId: string;
}

interface GetInviteDetailsRequest {
  inviteId: string;
}

interface AcceptShareInviteRequest {
  inviteId: string;
  userId: string;
}

interface AcceptShareInviteResponse {
  success: boolean;
}

interface GetSharedMembersRequest {
  userId: string;
}

interface GetSharedMembersResponse {
  members: SharedMember[];
}

interface RemoveSharedMemberRequest {
  userId: string;
  targetUserId: string;
}

interface RemoveSharedMemberResponse {
  success: boolean;
}

interface ShareWithFriendRequest {
  userId: string;
  friendUserId: string;
}

interface ShareWithFriendResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının eksik listesindeki tüm ürünleri getirir (kendi ekledikleri + paylaşılanların ekledikleri)
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
  async ({ userId, name, category, notes }: AddItemRequest): Promise<AddItemResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("add_missing_item", {
      clerk_id_param: userId,
      name_param: name,
      category_param: category ?? null,
      notes_param: notes ?? null,
    });

    if (error) {
      console.error("addItem error:", error);
      throw APIError.internal(`Failed to add missing item: ${error.message}`);
    }

    return { item: (data as MissingItem) || null };
  }
);

/**
 * Eksik listesinden ürün siler (kendi veya ortak olunan listelerdeki öğeleri silebilir)
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

/**
 * Ürünün kullanıldı/kullanılmadı durumunu değiştirir (kendi veya ortak olunan listelerdeki öğeleri değiştirebilir)
 * PUT /eksik-var/item/:id/toggle-used
 */
export const toggleItemUsed = api(
  { expose: true, method: "PUT", path: "/eksik-var/item/:id/toggle-used" },
  async ({ id, userId }: ToggleItemUsedRequest): Promise<ToggleItemUsedResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("toggle_item_used", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("toggleItemUsed error:", error);
      throw APIError.internal(`Failed to toggle item used state: ${error.message}`);
    }

    return { item: (data as MissingItem) || null };
  }
);

/**
 * Eksik listesindeki ürünü günceller (ad veya alındı durumu)
 * PUT /eksik-var/item/:id
 */
export const updateItem = api(
  { expose: true, method: "PUT", path: "/eksik-var/item/:id" },
  async ({ id, userId, name, isUsed, category, notes }: UpdateItemRequest): Promise<UpdateItemResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("update_missing_item", {
      item_id_param: id,
      clerk_id_param: userId,
      name_param: name ?? null,
      is_used_param: isUsed ?? null,
      category_param: category ?? null,
      notes_param: notes ?? null,
    });

    if (error) {
      console.error("updateItem error:", error);
      throw APIError.internal(`Failed to update missing item: ${error.message}`);
    }

    return { item: (data as MissingItem) || null };
  }
);

/**
 * Alışveriş listesini paylaşmak için davet linki (token) oluşturur
 * POST /eksik-var/share/invite/create
 */
export const createShareInvite = api(
  { expose: true, method: "POST", path: "/eksik-var/share/invite/create" },
  async ({ userId }: CreateShareInviteRequest): Promise<CreateShareInviteResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("create_share_invite", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("createShareInvite error:", error);
      throw APIError.internal(`Failed to create share invite: ${error.message}`);
    }

    return { inviteId: data };
  }
);

/**
 * Davet ID'sine göre davet detaylarını getirir (kimin davet ettiği vb.)
 * GET /eksik-var/share/invite/:inviteId
 */
export const getInviteDetails = api(
  { expose: true, method: "GET", path: "/eksik-var/share/invite/:inviteId" },
  async ({ inviteId }: GetInviteDetailsRequest): Promise<InviteDetails> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("get_invite_details", {
      invite_id_param: inviteId,
    });

    if (error) {
      console.error("getInviteDetails error:", error);
      throw APIError.internal(`Failed to get invite details: ${error.message}`);
    }

    const details = data && data[0];
    if (!details) {
      throw APIError.notFound("Invite not found");
    }

    return {
      creator_username: details.creator_username,
      is_expired: details.is_expired,
    };
  }
);

/**
 * Davet linkini kabul ederek ortak listeye katılır
 * POST /eksik-var/share/invite/accept
 */
export const acceptShareInvite = api(
  { expose: true, method: "POST", path: "/eksik-var/share/invite/accept" },
  async ({ inviteId, userId }: AcceptShareInviteRequest): Promise<AcceptShareInviteResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("accept_share_invite", {
      invite_id_param: inviteId,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("acceptShareInvite error:", error);
      throw APIError.internal(`Failed to accept share invite: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Ortak listenin paylaşıldığı tüm üyeleri getirir
 * GET /eksik-var/share/members/:userId
 */
export const getSharedMembers = api(
  { expose: true, method: "GET", path: "/eksik-var/share/members/:userId" },
  async ({ userId }: GetSharedMembersRequest): Promise<GetSharedMembersResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("get_shared_members", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getSharedMembers error:", error);
      throw APIError.internal(`Failed to get shared members: ${error.message}`);
    }

    return { members: data || [] };
  }
);

/**
 * Ortak listeden bir üyeyi çıkarır (ya da kendi katıldığı ortaklığı sonlandırır)
 * POST /eksik-var/share/remove
 */
export const removeSharedMember = api(
  { expose: true, method: "POST", path: "/eksik-var/share/remove" },
  async ({ userId, targetUserId }: RemoveSharedMemberRequest): Promise<RemoveSharedMemberResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("remove_shared_member", {
      clerk_id_param: userId,
      target_user_id_param: targetUserId,
    });

    if (error) {
      console.error("removeSharedMember error:", error);
      throw APIError.internal(`Failed to remove shared member: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Listeyi doğrudan bir arkadaş ile paylaşır
 * POST /eksik-var/share/friend
 */
export const shareWithFriend = api(
  { expose: true, method: "POST", path: "/eksik-var/share/friend" },
  async ({ userId, friendUserId }: ShareWithFriendRequest): Promise<ShareWithFriendResponse> => {
    const { data, error } = await supabase.schema("eksik_var").rpc("share_list_with_friend", {
      clerk_id_param: userId,
      friend_user_id_param: friendUserId,
    });

    if (error) {
      console.error("shareWithFriend error:", error);
      throw APIError.internal(`Failed to share with friend: ${error.message}`);
    }

    return { success: !!data };
  }
);
