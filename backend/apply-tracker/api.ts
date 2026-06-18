import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export type ApplicationStatus = 'to_apply' | 'applied' | 'accepted' | 'rejected' | 'withdrawn';
export type ApplicationPriority = 'low' | 'medium' | 'high';

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  role_title: string | null;
  url: string | null;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes: string | null;
  cv_html: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppImportItem {
  company_name: string;
  role_title?: string;
  url?: string;
  status?: ApplicationStatus;
  priority?: ApplicationPriority;
  notes?: string;
}

// ==================== REQUEST/RESPONSE TYPES ====================

interface GetApplicationsRequest {
  userId: string;
}

interface GetApplicationsResponse {
  applications: Application[];
}

interface AddApplicationRequest {
  userId: string;
  companyName: string;
  roleTitle?: string;
  url?: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes?: string;
  cvHtml?: string;
}

interface AddApplicationResponse {
  application: Application | null;
}

interface UpdateApplicationRequest {
  userId: string;
  id: string;
  companyName: string;
  roleTitle?: string;
  url?: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  notes?: string;
  cvHtml?: string;
}

interface UpdateApplicationResponse {
  application: Application | null;
}

interface DeleteApplicationRequest {
  id: string;
  userId: string;
}

interface DeleteApplicationResponse {
  success: boolean;
}

interface BulkImportRequest {
  userId: string;
  applications: AppImportItem[];
}

interface BulkImportResponse {
  success: boolean;
}

// ==================== API ENDPOINTS ====================

/**
 * Kullanıcının tüm iş başvurularını getirir
 */
export const getApplications = api(
  { expose: true, method: "GET", path: "/apply-tracker/applications/:userId" },
  async ({ userId }: GetApplicationsRequest): Promise<GetApplicationsResponse> => {
    const { data, error } = await supabase.schema("apply_tracker").rpc("get_applications", {
      clerk_id_param: userId,
    });

    if (error) {
      console.error("getApplications error:", error);
      throw APIError.internal(`Failed to load applications: ${error.message}`);
    }

    return { applications: data || [] };
  }
);

/**
 * Yeni bir iş başvurusu ekler
 */
export const addApplication = api(
  { expose: true, method: "POST", path: "/apply-tracker/add" },
  async (req: AddApplicationRequest): Promise<AddApplicationResponse> => {
    const { data, error } = await supabase.schema("apply_tracker").rpc("add_application", {
      clerk_id_param: req.userId,
      company_name_param: req.companyName,
      role_title_param: req.roleTitle || null,
      url_param: req.url || null,
      status_param: req.status,
      priority_param: req.priority,
      notes_param: req.notes || null,
      cv_html_param: req.cvHtml || null,
    });

    if (error) {
      console.error("addApplication error:", error);
      throw APIError.internal(`Failed to add application: ${error.message}`);
    }

    return { application: (data as Application) || null };
  }
);

/**
 * İş başvurusunu günceller
 */
export const updateApplication = api(
  { expose: true, method: "PUT", path: "/apply-tracker/update" },
  async (req: UpdateApplicationRequest): Promise<UpdateApplicationResponse> => {
    const { data, error } = await supabase.schema("apply_tracker").rpc("update_application", {
      clerk_id_param: req.userId,
      id_param: req.id,
      company_name_param: req.companyName,
      role_title_param: req.roleTitle || null,
      url_param: req.url || null,
      status_param: req.status,
      priority_param: req.priority,
      notes_param: req.notes || null,
      cv_html_param: req.cvHtml || null,
    });

    if (error) {
      console.error("updateApplication error:", error);
      throw APIError.internal(`Failed to update application: ${error.message}`);
    }

    return { application: (data as Application) || null };
  }
);

/**
 * İş başvurusunu siler
 */
export const deleteApplication = api(
  { expose: true, method: "DELETE", path: "/apply-tracker/delete/:id" },
  async ({ id, userId }: DeleteApplicationRequest): Promise<DeleteApplicationResponse> => {
    const { data, error } = await supabase.schema("apply_tracker").rpc("delete_application", {
      item_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      console.error("deleteApplication error:", error);
      throw APIError.internal(`Failed to delete application: ${error.message}`);
    }

    return { success: !!data };
  }
);

/**
 * Birden fazla iş başvurusunu toplu olarak içeri aktarır
 */
export const bulkImport = api(
  { expose: true, method: "POST", path: "/apply-tracker/bulk-import" },
  async (req: BulkImportRequest): Promise<BulkImportResponse> => {
    // JSONB parametresi için veriyi hazırlayalım
    const appsJson = req.applications.map(app => ({
      company_name: app.company_name,
      role_title: app.role_title || null,
      url: app.url || null,
      status: app.status || 'to_apply',
      priority: app.priority || 'medium',
      notes: app.notes || null
    }));

    const { data, error } = await supabase.schema("apply_tracker").rpc("bulk_import", {
      clerk_id_param: req.userId,
      apps_json: appsJson,
    });

    if (error) {
      console.error("bulkImport error:", error);
      throw APIError.internal(`Failed to bulk import applications: ${error.message}`);
    }

    return { success: !!data };
  }
);
