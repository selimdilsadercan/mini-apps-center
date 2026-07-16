import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface RoutineSet {
  reps: number | null;
  weightKg: number | null;
}

export interface ExerciseRef {
  slug: string;
  name: string;
  sets?: RoutineSet[];
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

export interface WeeklyPlanDay {
  dayOfWeek: number;
  routineId: string | null;
  routineName: string | null;
  exercises: ExerciseRef[];
}

export interface TodayPlan {
  dayOfWeek: number;
  routine: Routine | null;
  completedToday: boolean;
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

function mapWeeklyPlanDay(row: Record<string, unknown>): WeeklyPlanDay {
  return {
    dayOfWeek: Number(row.day_of_week),
    routineId: (row.routine_id as string) || null,
    routineName: (row.routine_name as string) || null,
    exercises: (row.exercises as ExerciseRef[]) || [],
  };
}

function getIsoWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function isRoutineCompletedToday(
  workouts: Record<string, unknown>[],
  routineId: string,
  now = new Date()
): boolean {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return workouts.some((workout) => {
    if (workout.routine_id !== routineId) return false;
    const finishedAt = workout.finished_at
      ? new Date(workout.finished_at as string)
      : null;
    if (!finishedAt) return false;
    return finishedAt >= start && finishedAt <= end;
  });
}

export const getWeeklyPlan = api(
  { expose: true, method: "GET", path: "/gym/weekly-plan/:userId" },
  async ({ userId }: { userId: string }): Promise<{ days: WeeklyPlanDay[] }> => {
    const { data, error } = await supabase.schema("gym").rpc("get_weekly_plan", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getWeeklyPlan error:", error);
      throw APIError.internal("Haftalık plan yüklenemedi");
    }

    return { days: (data as Record<string, unknown>[] || []).map(mapWeeklyPlanDay) };
  }
);

export const setWeeklyPlanDay = api(
  { expose: true, method: "PUT", path: "/gym/weekly-plan/:userId" },
  async (req: {
    userId: string;
    dayOfWeek: number;
    routineId?: string | null;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("gym").rpc("set_weekly_plan_day", {
      p_clerk_id: req.userId,
      p_day_of_week: req.dayOfWeek,
      p_routine_id: req.routineId ?? null,
    });

    if (error) {
      console.error("setWeeklyPlanDay error:", error);
      throw APIError.internal("Haftalık plan güncellenemedi");
    }

    return { success: data as boolean };
  }
);

export const getTodayPlan = api(
  { expose: true, method: "GET", path: "/gym/today-plan/:userId" },
  async ({ userId }: { userId: string }): Promise<TodayPlan> => {
    const [planResult, workoutsResult] = await Promise.all([
      supabase.schema("gym").rpc("get_weekly_plan", {
        p_clerk_id: userId,
      }),
      supabase.schema("gym").rpc("get_workouts", {
        p_clerk_id: userId,
        p_limit: 10,
      }),
    ]);

    if (planResult.error) {
      console.error("getTodayPlan error:", planResult.error);
      throw APIError.internal("Bugünün planı yüklenemedi");
    }

    const today = getIsoWeekday();
    const row = (planResult.data as Record<string, unknown>[] || []).find(
      (entry) => Number(entry.day_of_week) === today
    );

    if (!row?.routine_id) {
      return { dayOfWeek: today, routine: null, completedToday: false };
    }

    const routineId = row.routine_id as string;
    const completedToday = isRoutineCompletedToday(
      (workoutsResult.data as Record<string, unknown>[] | null) ?? [],
      routineId
    );

    return {
      dayOfWeek: today,
      routine: {
        id: routineId,
        name: row.routine_name as string,
        exercises: (row.exercises as ExerciseRef[]) || [],
        createdAt: "",
      },
      completedToday,
    };
  }
);

export const updateWorkout = api(
  { expose: true, method: "POST", path: "/gym/workout/update" },
  async (req: {
    userId: string;
    workoutId: string;
    name: string;
    exercises: WorkoutExercise[];
    durationSeconds: number;
    totalVolumeKg: number;
    startedAt?: string;
    finishedAt?: string;
  }): Promise<{ workout: Workout }> => {
    const { data, error } = await supabase.schema("gym").rpc("update_workout", {
      p_clerk_id: req.userId,
      p_workout_id: req.workoutId,
      p_name: req.name,
      p_exercises: req.exercises,
      p_duration_seconds: req.durationSeconds,
      p_total_volume_kg: req.totalVolumeKg,
      p_started_at: req.startedAt ?? null,
      p_finished_at: req.finishedAt ?? null,
    });

    if (error) {
      console.error("updateWorkout error:", error);
      throw APIError.internal("Antrenman güncellenemedi");
    }

    return { workout: mapWorkout(data as Record<string, unknown>) };
  }
);

export const deleteWorkout = api(
  { expose: true, method: "DELETE", path: "/gym/workout/:userId/:workoutId" },
  async ({
    userId,
    workoutId,
  }: {
    userId: string;
    workoutId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("gym").rpc("delete_workout", {
      p_clerk_id: userId,
      p_workout_id: workoutId,
    });

    if (error) {
      console.error("deleteWorkout error:", error);
      throw APIError.internal("Antrenman silinemedi");
    }

    return { success: data as boolean };
  }
);

export const updateRoutine = api(
  { expose: true, method: "POST", path: "/gym/routine/update" },
  async (req: {
    userId: string;
    routineId: string;
    name: string;
    exercises: ExerciseRef[];
  }): Promise<{ routine: Routine }> => {
    const { data, error } = await supabase.schema("gym").rpc("update_routine", {
      p_clerk_id: req.userId,
      p_routine_id: req.routineId,
      p_name: req.name,
      p_exercises: req.exercises,
    });

    if (error) {
      console.error("updateRoutine error:", error);
      throw APIError.internal("Rutin güncellenemedi");
    }

    return { routine: mapRoutine(data as Record<string, unknown>) };
  }
);
