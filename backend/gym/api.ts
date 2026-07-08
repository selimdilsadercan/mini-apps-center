import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface ExerciseRef {
  slug: string;
  name: string;
}

export interface WorkoutSet {
  reps: number | null;
  weightKg: number | null;
  completed: boolean;
}

export interface WorkoutExercise {
  slug: string;
  name: string;
  sets: WorkoutSet[];
  note?: string;
}

export interface Routine {
  id: string;
  name: string;
  exercises: ExerciseRef[];
  createdAt: string;
}

export interface Workout {
  id: string;
  routineId: string | null;
  name: string;
  exercises: WorkoutExercise[];
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  totalVolumeKg: number;
}

export interface GymStats {
  weekMinutes: number;
  totalWorkouts: number;
}

// ==================== HELPERS ====================

function mapRoutine(row: Record<string, unknown>): Routine {
  return {
    id: row.id as string,
    name: row.name as string,
    exercises: (row.exercises as ExerciseRef[]) || [],
    createdAt: row.created_at as string,
  };
}

function mapWorkout(row: Record<string, unknown>): Workout {
  return {
    id: row.id as string,
    routineId: (row.routine_id as string) || null,
    name: row.name as string,
    exercises: (row.exercises as WorkoutExercise[]) || [],
    startedAt: row.started_at as string,
    finishedAt: (row.finished_at as string) || null,
    durationSeconds: (row.duration_seconds as number) || 0,
    totalVolumeKg: Number(row.total_volume_kg) || 0,
  };
}

// ==================== API ENDPOINTS ====================

export const getRoutines = api(
  { expose: true, method: "GET", path: "/gym/routines/:userId" },
  async ({ userId }: { userId: string }): Promise<{ routines: Routine[] }> => {
    const { data, error } = await supabase.schema("gym").rpc("get_routines", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getRoutines error:", error);
      throw APIError.internal("Rutinler yüklenemedi");
    }

    return { routines: (data as Record<string, unknown>[] || []).map(mapRoutine) };
  }
);

export const createRoutine = api(
  { expose: true, method: "POST", path: "/gym/routine" },
  async (req: {
    userId: string;
    name: string;
    exercises: ExerciseRef[];
  }): Promise<{ routine: Routine }> => {
    const { data, error } = await supabase.schema("gym").rpc("create_routine", {
      p_clerk_id: req.userId,
      p_name: req.name,
      p_exercises: req.exercises,
    });

    if (error) {
      console.error("createRoutine error:", error);
      throw APIError.internal("Rutin oluşturulamadı");
    }

    return { routine: mapRoutine(data as Record<string, unknown>) };
  }
);

export const deleteRoutine = api(
  { expose: true, method: "DELETE", path: "/gym/routine/:userId/:routineId" },
  async ({
    userId,
    routineId,
  }: {
    userId: string;
    routineId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("gym").rpc("delete_routine", {
      p_clerk_id: userId,
      p_routine_id: routineId,
    });

    if (error) {
      console.error("deleteRoutine error:", error);
      throw APIError.internal("Rutin silinemedi");
    }

    return { success: data as boolean };
  }
);

export const getWorkouts = api(
  { expose: true, method: "GET", path: "/gym/workouts/:userId" },
  async ({
    userId,
    limit,
  }: {
    userId: string;
    limit?: number;
  }): Promise<{ workouts: Workout[] }> => {
    const { data, error } = await supabase.schema("gym").rpc("get_workouts", {
      p_clerk_id: userId,
      p_limit: limit ?? 20,
    });

    if (error) {
      console.error("getWorkouts error:", error);
      throw APIError.internal("Antrenmanlar yüklenemedi");
    }

    return { workouts: (data as Record<string, unknown>[] || []).map(mapWorkout) };
  }
);

export const saveWorkout = api(
  { expose: true, method: "POST", path: "/gym/workout" },
  async (req: {
    userId: string;
    name: string;
    routineId?: string | null;
    exercises: WorkoutExercise[];
    startedAt: string;
    finishedAt: string;
    durationSeconds: number;
    totalVolumeKg: number;
  }): Promise<{ workout: Workout }> => {
    const { data, error } = await supabase.schema("gym").rpc("save_workout", {
      p_clerk_id: req.userId,
      p_name: req.name,
      p_routine_id: req.routineId ?? null,
      p_exercises: req.exercises,
      p_started_at: req.startedAt,
      p_finished_at: req.finishedAt,
      p_duration_seconds: req.durationSeconds,
      p_total_volume_kg: req.totalVolumeKg,
    });

    if (error) {
      console.error("saveWorkout error:", error);
      throw APIError.internal("Antrenman kaydedilemedi");
    }

    return { workout: mapWorkout(data as Record<string, unknown>) };
  }
);

export const getPreviousSets = api(
  { expose: true, method: "GET", path: "/gym/previous/:userId/:exerciseSlug" },
  async ({
    userId,
    exerciseSlug,
  }: {
    userId: string;
    exerciseSlug: string;
  }): Promise<{ sets: WorkoutSet[] }> => {
    const { data, error } = await supabase.schema("gym").rpc("get_previous_sets", {
      p_clerk_id: userId,
      p_exercise_slug: exerciseSlug,
    });

    if (error) {
      console.error("getPreviousSets error:", error);
      return { sets: [] };
    }

    return { sets: (data as WorkoutSet[]) || [] };
  }
);

export const getStats = api(
  { expose: true, method: "GET", path: "/gym/stats/:userId" },
  async ({ userId }: { userId: string }): Promise<GymStats> => {
    const { data, error } = await supabase.schema("gym").rpc("get_stats", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getStats error:", error);
      throw APIError.internal("İstatistikler yüklenemedi");
    }

    const stats = data as Record<string, number>;
    return {
      weekMinutes: stats.weekMinutes ?? 0,
      totalWorkouts: stats.totalWorkouts ?? 0,
    };
  }
);
