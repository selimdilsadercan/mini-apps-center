import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

interface AddContributionRequest {
  userId: string; // Clerk ID or UUID
  contentType: string;
  title: string;
  imageUrl?: string | null;
  data: Record<string, unknown>;
}

export interface ContributionItem {
  id: string;
  createdUserId: string;
  contentType: string;
  title: string;
  imageUrl?: string | null;
  data: Record<string, unknown>;
  approved: boolean;
  createdAt: string;
  contributorName: string;
}

interface AddContributionResponse {
  contribution: ContributionItem | null;
}

interface GetContributionsResponse {
  contributions: ContributionItem[];
}

interface GetContributionResponse {
  contribution: ContributionItem | null;
}

interface ApproveContributionRequest {
  id: string;
  approved: boolean;
}

interface ApproveContributionResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Yeni bir topluluk katkısı ekler (Varsayılan olarak onay bekler)
 * POST /contributions/add
 */
export const addContribution = api(
  { expose: true, method: "POST", path: "/contributions/add" },
  async ({ userId, contentType, title, imageUrl, data }: AddContributionRequest): Promise<AddContributionResponse> => {
    const { data: resData, error } = await supabase.schema("contributions").rpc("add_contribution", {
      p_user_id: userId,
      content_type_param: contentType,
      title_param: title,
      image_url_param: imageUrl || null,
      data_param: data || {},
    });

    if (error) {
      console.error("addContribution error:", error);
      throw APIError.internal("Katkı eklenemedi");
    }

    const row = resData as any;
    return {
      contribution: row ? {
        id: row.id,
        createdUserId: row.created_user_id,
        contentType: row.content_type,
        title: row.title,
        imageUrl: row.image_url,
        data: row.data,
        approved: row.approved,
        createdAt: row.created_at,
        contributorName: "",
      } : null
    };
  }
);

/**
 * Belirli bir tipteki topluluk katkılarını listeler
 * GET /contributions/list/:contentType
 */
export const getContributions = api(
  { expose: true, method: "GET", path: "/contributions/list/:contentType" },
  async ({ contentType, onlyApproved }: { contentType: string; onlyApproved?: boolean }): Promise<GetContributionsResponse> => {
    const onlyApprovedVal = onlyApproved !== false; // default true
    const { data, error } = await supabase.schema("contributions").rpc("get_contributions", {
      content_type_param: contentType,
      only_approved_param: onlyApprovedVal,
    });

    if (error) {
      console.error("getContributions error:", error);
      throw APIError.internal("Katkılar yüklenemedi");
    }

    const rows = (data || []) as any[];
    return {
      contributions: rows.map((row) => ({
        id: row.id,
        createdUserId: row.created_user_id,
        contentType: row.content_type,
        title: row.title,
        imageUrl: row.image_url,
        data: row.data,
        approved: row.approved,
        createdAt: row.created_at,
        contributorName: row.contributor_name,
      })),
    };
  }
);

/**
 * ID ile tek bir topluluk katkısını getirir
 * GET /contributions/get/:id
 */
export const getContributionById = api(
  { expose: true, method: "GET", path: "/contributions/get/:id" },
  async ({ id }: { id: string }): Promise<GetContributionResponse> => {
    const { data, error } = await supabase.schema("contributions").rpc("get_contribution", {
      p_id: id,
    });

    if (error) {
      console.error("getContributionById error:", error);
      throw APIError.internal("Katkı yüklenemedi");
    }

    const rows = (data || []) as any[];
    const row = rows[0];

    return {
      contribution: row ? {
        id: row.id,
        createdUserId: row.created_user_id,
        contentType: row.content_type,
        title: row.title,
        imageUrl: row.image_url,
        data: row.data,
        approved: row.approved,
        createdAt: row.created_at,
        contributorName: row.contributor_name,
      } : null
    };
  }
);

/**
 * Katkıyı onaylar veya reddedip siler (Sadece admin için)
 * POST /contributions/approve
 */
export const approveContribution = api(
  { expose: true, method: "POST", path: "/contributions/approve" },
  async ({ id, approved }: ApproveContributionRequest): Promise<ApproveContributionResponse> => {
    const { data, error } = await supabase.schema("contributions").rpc("approve_contribution", {
      p_id: id,
      p_approved: approved,
    });

    if (error) {
      console.error("approveContribution error:", error);
      throw APIError.internal("Katkı onay işlemi başarısız");
    }

    return { success: !!data };
  }
);
