import { api, Header } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface AppBundle {
  id: string;
  version: string;
  build_number: number;
  bundle_url: string;
  checksum?: string;
  is_active: boolean;
  is_beta: boolean;
  platform: string;
  created_at: string;
  notes?: string;
}

export interface CheckUpdateRequest {
  platform: string;
  currentBuildNumber: number;
}

export interface CheckUpdateResponse {
  updateAvailable: boolean;
  latestBundle?: AppBundle;
}

export interface AddBundleRequest {
  version: string;
  buildNumber: number;
  bundleUrl: string;
  checksum?: string;
  platform?: string;
  notes?: string;
  isBeta?: boolean;
  adminKey?: Header<"x-admin-key">;
}

export interface AddBundleResponse {
  success: boolean;
  bundle?: AppBundle;
  error?: string;
}

/**
 * Check for the latest active bundle for a platform
 */
export const checkUpdate = api(
  { method: "GET", path: "/ota/check", expose: true },
  async (req: CheckUpdateRequest): Promise<CheckUpdateResponse> => {
    const { data, error } = await supabase.rpc("get_latest_bundle", {
      p_platform: req.platform,
      p_current_build_number: req.currentBuildNumber,
    });

    if (error || !data) {
      console.log("[OTA] Returning false due to:", error ? "error" : "no data");
      return { updateAvailable: false };
    }

    const result = data as { available: boolean; bundle?: AppBundle };

    return {
      updateAvailable: result.available,
      latestBundle: result.bundle,
    };
  },
);

/**
 * Admin: Add a new bundle to the system
 */
export const addBundle = api(
  { method: "POST", path: "/ota/bundle", expose: true },
  async (req: AddBundleRequest): Promise<AddBundleResponse> => {
    // Check for the secret admin key for local automation scripts
    const adminKey = req.adminKey;
    const secretKey = "valla-billah-benim-admin-key"; // Bunu daha sonra encore secret'a alabiliriz

    if (adminKey !== secretKey) {
      return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase.rpc("add_bundle", {
      p_version: req.version,
      p_build_number: req.buildNumber,
      p_bundle_url: req.bundleUrl,
      p_checksum: req.checksum ?? null,
      p_platform: req.platform || "all",
      p_notes: req.notes ?? null,
      p_is_beta: req.isBeta ?? false,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, bundle: data as AppBundle };
  },
);

/**
 * List all bundles (for admin panel)
 */
export const listBundles = api(
  { method: "GET", path: "/ota/bundles", expose: true },
  async (): Promise<{ bundles: AppBundle[] }> => {
    const { data, error } = await supabase.rpc("get_all_bundles");

    if (error || !data) {
      return { bundles: [] };
    }

    const result = data as { bundles: AppBundle[] };
    return { bundles: result.bundles };
  },
);

/**
 * Admin: Toggle bundle active status
 */
export const toggleBundleStatus = api(
  { method: "POST", path: "/ota/bundle/toggle", expose: true },
  async (req: {
    id: string;
    isActive: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from("app_bundles")
      .update({ is_active: req.isActive })
      .eq("id", req.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
);
