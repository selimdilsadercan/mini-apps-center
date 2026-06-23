import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Link {
    id: string;
    business_id: string;
    title: string;
    subtitle: string | null;
    app_id: string | null;
    url: string;
    icon: string | null;
    sort_order: number;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}

// ==================== REQUEST / RESPONSE ====================

interface GetLinksRequest {
    businessId: string;
}

interface UpsertLinkRequest {
    id?: string;
    businessId: string;
    title: string;
    subtitle?: string;
    appId?: string;
    url: string;
    icon?: string;
    sortOrder?: number;
}

interface DeleteLinkRequest {
    id: string;
}

interface ToggleLinkRequest {
    id: string;
}

// ==================== ENDPOINTS ====================

/**
 * Get all links for a business
 */
export const getLinks = api(
    { expose: true, method: "GET", path: "/business-page/links/:businessId" },
    async ({ businessId }: GetLinksRequest): Promise<{ links: Link[] }> => {
        const { data, error } = await supabase.schema("business_page").rpc("get_links", {
            p_business_id: businessId,
        });

        if (error) {
            console.error("business_page.getLinks error:", error);
            throw APIError.internal(`Failed to get links: ${error.message}`);
        }

        return { links: (data as Link[]) || [] };
    }
);

/**
 * Add or update a link
 */
export const upsertLink = api(
    { expose: true, method: "POST", path: "/business-page/links" },
    async (req: UpsertLinkRequest): Promise<{ link: Link }> => {
        const { data, error } = await supabase.schema("business_page").rpc("upsert_link", {
            p_id: req.id || null,
            p_business_id: req.businessId,
            p_title: req.title,
            p_subtitle: req.subtitle || null,
            p_app_id: req.appId || null,
            p_url: req.url,
            p_icon: req.icon || null,
            p_sort_order: req.sortOrder || 0,
        });

        if (error) {
            console.error("business_page.upsertLink error:", error);
            throw APIError.internal(`Failed to upsert link: ${error.message}`);
        }

        return { link: data as Link };
    }
);

/**
 * Delete a link
 */
export const deleteLink = api(
    { expose: true, method: "POST", path: "/business-page/links/delete" },
    async ({ id }: DeleteLinkRequest): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.schema("business_page").rpc("delete_link", {
            p_id: id,
        });

        if (error) {
            console.error("business_page.deleteLink error:", error);
            throw APIError.internal(`Failed to delete link: ${error.message}`);
        }

        return { success: !!data };
    }
);

/**
 * Toggle link status
 */
export const toggleLink = api(
    { expose: true, method: "POST", path: "/business-page/links/toggle" },
    async ({ id }: ToggleLinkRequest): Promise<{ isEnabled: boolean }> => {
        const { data, error } = await supabase.schema("business_page").rpc("toggle_link", {
            p_id: id,
        });

        if (error) {
            console.error("business_page.toggleLink error:", error);
            throw APIError.internal(`Failed to toggle link: ${error.message}`);
        }

        return { isEnabled: !!data };
    }
);
