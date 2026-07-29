import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { TUS_PLACEMENTS, TUS_SPECIALTIES, TUSPlacement } from "./data/placements_data";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface ListPlacementsRequest {
  query?: string;
  specialtySlug?: string;
  institutionType?: string;
  candidateScore?: number;
  limit?: number;
  offset?: number;
}

export interface ListPlacementsResponse {
  placements: TUSPlacement[];
  totalCount: number;
}

export interface GetPlacementRequest {
  id: string;
}

export interface SavedChoiceItem {
  id: string;
  userId: string;
  placementId: string;
  sortOrder: number;
  note: string;
  createdAt: string;
  placement?: TUSPlacement;
}

export interface ListSavedChoicesRequest {
  userId: string;
}

export interface ListSavedChoicesResponse {
  items: SavedChoiceItem[];
}

export interface AddSavedChoiceRequest {
  userId: string;
  placementId: string;
  note?: string;
}

export interface RemoveSavedChoiceRequest {
  userId: string;
  placementId: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}

export interface ReorderSavedChoicesRequest {
  userId: string;
  placementIds: string[];
}

export const listSpecialties = api(
  { expose: true, method: "GET", path: "/tus/specialties" },
  async (): Promise<{ specialties: typeof TUS_SPECIALTIES }> => {
    return { specialties: TUS_SPECIALTIES };
  }
);

export const listPlacements = api(
  { expose: true, method: "GET", path: "/tus/placements" },
  async (req: ListPlacementsRequest): Promise<ListPlacementsResponse> => {
    let filtered = [...TUS_PLACEMENTS];

    if (req.query && req.query.trim() !== "") {
      const q = req.query.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.institutionName.toLowerCase().includes(q) ||
          p.specialtyName.toLowerCase().includes(q)
      );
    }

    if (req.specialtySlug && req.specialtySlug !== "ALL") {
      filtered = filtered.filter((p) => p.specialtySlug === req.specialtySlug);
    }

    if (req.institutionType && req.institutionType !== "ALL") {
      filtered = filtered.filter((p) => p.institutionType === req.institutionType);
    }

    if (req.candidateScore && req.candidateScore > 0) {
      const minS = req.candidateScore * 0.85;
      const maxS = req.candidateScore * 1.15;
      filtered = filtered.filter((p) => {
        const latest = p.history[0]?.score;
        return latest !== null && latest >= minS && latest <= maxS;
      });
    }

    filtered.sort((a, b) => {
      const sA = a.history[0]?.score ?? 0;
      const sB = b.history[0]?.score ?? 0;
      return sB - sA;
    });

    const totalCount = filtered.length;
    const offset = req.offset ?? 0;
    const limit = req.limit ?? 50;

    return {
      placements: filtered.slice(offset, offset + limit),
      totalCount,
    };
  }
);

export const getPlacement = api(
  { expose: true, method: "GET", path: "/tus/placement/:id" },
  async ({ id }: GetPlacementRequest): Promise<{ placement: TUSPlacement }> => {
    const placement = TUS_PLACEMENTS.find((p) => p.id === id);
    if (!placement) {
      throw APIError.notFound(`Placement with ID ${id} not found`);
    }
    return { placement };
  }
);

export const getSavedChoices = api(
  { expose: true, method: "GET", path: "/tus/saved" },
  async (req: ListSavedChoicesRequest): Promise<ListSavedChoicesResponse> => {
    if (!req.userId) {
      throw APIError.invalidArgument("userId is required");
    }

    const { data, error } = await supabase.rpc("get_saved_choices", {
      p_user_id: req.userId,
    });

    if (error) {
      console.error("Error fetching saved choices:", error);
      throw APIError.internal("Failed to load saved choices");
    }

    const items: SavedChoiceItem[] = (data || []).map((row: Record<string, unknown>) => {
      const prog = TUS_PLACEMENTS.find((p) => p.id === row.placement_id);
      return {
        id: row.id as string,
        userId: row.user_id as string,
        placementId: row.placement_id as string,
        sortOrder: row.sort_order as number,
        note: (row.note as string) || "",
        createdAt: row.created_at as string,
        placement: prog,
      };
    });

    return { items };
  }
);

export const addSavedChoice = api(
  { expose: true, method: "POST", path: "/tus/saved/add" },
  async (req: AddSavedChoiceRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.placementId) {
      throw APIError.invalidArgument("userId and placementId are required");
    }

    const { error } = await supabase.rpc("add_saved_choice", {
      p_user_id: req.userId,
      p_placement_id: req.placementId,
      p_note: req.note || "",
    });

    if (error) {
      console.error("Error adding saved choice:", error);
      throw APIError.internal("Failed to add preference");
    }

    return { success: true };
  }
);

export const removeSavedChoice = api(
  { expose: true, method: "POST", path: "/tus/saved/remove" },
  async (req: RemoveSavedChoiceRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.placementId) {
      throw APIError.invalidArgument("userId and placementId are required");
    }

    const { error } = await supabase.rpc("remove_saved_choice", {
      p_user_id: req.userId,
      p_placement_id: req.placementId,
    });

    if (error) {
      console.error("Error removing saved choice:", error);
      throw APIError.internal("Failed to remove preference");
    }

    return { success: true };
  }
);

export const reorderSavedChoices = api(
  { expose: true, method: "POST", path: "/tus/saved/reorder" },
  async (req: ReorderSavedChoicesRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.placementIds) {
      throw APIError.invalidArgument("userId and placementIds are required");
    }

    const { error } = await supabase.rpc("reorder_saved_choices", {
      p_user_id: req.userId,
      p_placement_ids: req.placementIds,
    });

    if (error) {
      console.error("Error reordering saved choices:", error);
      throw APIError.internal("Failed to reorder preferences");
    }

    return { success: true };
  }
);
