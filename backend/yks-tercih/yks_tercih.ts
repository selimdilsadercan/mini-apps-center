import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { YKS_PROGRAMS, YKSProgram } from "./data/programs_data";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== INTERFACES ====================

export interface ListProgramsRequest {
  query?: string;
  scoreType?: "SAY" | "EA" | "SÖZ" | "DİL" | "TYT" | "ALL";
  city?: string;
  universityType?: "Devlet" | "Vakıf" | "ALL";
  scholarshipType?: string;
  minRank?: number;
  maxRank?: number;
  candidateRank?: number; // Automatic range +/- 30% if provided
  durationYears?: number;
  limit?: number;
  offset?: number;
}

export interface ListProgramsResponse {
  programs: YKSProgram[];
  totalCount: number;
}

export interface GetProgramRequest {
  id: string;
}

export interface SavedChoiceItem {
  id: string;
  userId: string;
  programId: string;
  sortOrder: number;
  note: string;
  createdAt: string;
  program?: YKSProgram;
}

export interface ListSavedChoicesRequest {
  userId: string;
}

export interface ListSavedChoicesResponse {
  items: SavedChoiceItem[];
}

export interface AddSavedChoiceRequest {
  userId: string;
  programId: string;
  note?: string;
}

export interface RemoveSavedChoiceRequest {
  userId: string;
  programId: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}

export interface ReorderSavedChoicesRequest {
  userId: string;
  programIds: string[];
}

// ==================== ENDPOINTS ====================

/**
 * List & search YKS university programs with detailed multi-criteria filters.
 */
export const listPrograms = api(
  { expose: true, method: "GET", path: "/yks/programs" },
  async (req: ListProgramsRequest): Promise<ListProgramsResponse> => {
    let filtered = [...YKS_PROGRAMS];

    // 1. Search Query (University, Faculty, Department, City)
    if (req.query && req.query.trim() !== "") {
      const q = req.query.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.universityName.toLowerCase().includes(q) ||
        p.departmentName.toLowerCase().includes(q) ||
        p.facultyName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.code.includes(q)
      );
    }

    // 2. Score Type Filter
    if (req.scoreType && req.scoreType !== "ALL") {
      filtered = filtered.filter((p) => p.scoreType === req.scoreType);
    }

    // 3. City Filter
    if (req.city && req.city !== "ALL") {
      filtered = filtered.filter((p) => p.city.toUpperCase() === req.city?.toUpperCase());
    }

    // 4. University Type (Devlet / Vakıf)
    if (req.universityType && req.universityType !== "ALL") {
      filtered = filtered.filter((p) => p.universityType === req.universityType);
    }

    // 5. Scholarship Type
    if (req.scholarshipType && req.scholarshipType !== "ALL") {
      filtered = filtered.filter((p) => p.scholarshipType === req.scholarshipType);
    }

    // 6. Duration Years (2 vs 4)
    if (req.durationYears) {
      filtered = filtered.filter((p) => p.durationYears === req.durationYears);
    }

    // 7. Rank Filtering (Candidate Rank auto range OR explicit min/max)
    let minR = req.minRank;
    let maxR = req.maxRank;

    if (req.candidateRank && req.candidateRank > 0) {
      // Auto compute +/- 35% around candidate rank
      const r = req.candidateRank;
      minR = Math.max(1, Math.floor(r * 0.65));
      maxR = Math.ceil(r * 1.35);
    }

    if (minR !== undefined && minR > 0) {
      filtered = filtered.filter((p) => {
        const latestRank = p.history[0]?.rank;
        return latestRank !== null && latestRank >= (minR as number);
      });
    }

    if (maxR !== undefined && maxR > 0) {
      filtered = filtered.filter((p) => {
        const latestRank = p.history[0]?.rank;
        return latestRank !== null && latestRank <= (maxR as number);
      });
    }

    // Sort by 2024 latest rank ascending
    filtered.sort((a, b) => {
      const rA = a.history[0]?.rank ?? 9999999;
      const rB = b.history[0]?.rank ?? 9999999;
      return rA - rB;
    });

    const totalCount = filtered.length;
    const offset = req.offset ?? 0;
    const limit = req.limit ?? 50;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      programs: paginated,
      totalCount,
    };
  }
);

/**
 * Get detailed info for a single program by ID or code.
 */
export const getProgram = api(
  { expose: true, method: "GET", path: "/yks/program/:id" },
  async ({ id }: GetProgramRequest): Promise<{ program: YKSProgram }> => {
    const program = YKS_PROGRAMS.find((p) => p.id === id || p.code === id);
    if (!program) {
      throw APIError.notFound(`Program with ID ${id} not found`);
    }
    return { program };
  }
);

/**
 * Get saved preference choices for a user.
 */
export const getSavedChoices = api(
  { expose: true, method: "GET", path: "/yks/saved" },
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

    const items: SavedChoiceItem[] = (data || []).map((row: any) => {
      const prog = YKS_PROGRAMS.find((p) => p.id === row.program_id);
      return {
        id: row.id,
        userId: row.user_id,
        programId: row.program_id,
        sortOrder: row.sort_order,
        note: row.note || "",
        createdAt: row.created_at,
        program: prog,
      };
    });

    return { items };
  }
);

/**
 * Add a program to candidate's tercih list.
 */
export const addSavedChoice = api(
  { expose: true, method: "POST", path: "/yks/saved/add" },
  async (req: AddSavedChoiceRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.programId) {
      throw APIError.invalidArgument("userId and programId are required");
    }

    const { error } = await supabase.rpc("add_saved_choice", {
      p_user_id: req.userId,
      p_program_id: req.programId,
      p_note: req.note || "",
    });

    if (error) {
      console.error("Error adding saved choice:", error);
      throw APIError.internal("Failed to add preference");
    }

    return { success: true };
  }
);

/**
 * Remove a program from candidate's tercih list.
 */
export const removeSavedChoice = api(
  { expose: true, method: "POST", path: "/yks/saved/remove" },
  async (req: RemoveSavedChoiceRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.programId) {
      throw APIError.invalidArgument("userId and programId are required");
    }

    const { error } = await supabase.rpc("remove_saved_choice", {
      p_user_id: req.userId,
      p_program_id: req.programId,
    });

    if (error) {
      console.error("Error removing saved choice:", error);
      throw APIError.internal("Failed to remove preference");
    }

    return { success: true };
  }
);

/**
 * Reorder candidate's tercih list items.
 */
export const reorderSavedChoices = api(
  { expose: true, method: "POST", path: "/yks/saved/reorder" },
  async (req: ReorderSavedChoicesRequest): Promise<ActionResponse> => {
    if (!req.userId || !req.programIds) {
      throw APIError.invalidArgument("userId and programIds are required");
    }

    const { error } = await supabase.rpc("reorder_saved_choices", {
      p_user_id: req.userId,
      p_program_ids: req.programIds,
    });

    if (error) {
      console.error("Error reordering saved choices:", error);
      throw APIError.internal("Failed to reorder preferences");
    }

    return { success: true };
  }
);
