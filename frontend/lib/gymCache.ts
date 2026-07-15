import type { QueryClient } from "@tanstack/react-query";
import type { Routine, Workout, WeeklyPlanDay, ExerciseRef } from "@/app/apps/gym/types";
import {
  getRoutinesAction,
  getWorkoutsAction,
  getStatsAction,
  getWeeklyPlanAction,
} from "@/app/apps/gym/actions";
import { invalidateDiscoverWidgets } from "@/lib/hubAgendaCache";

export const GYM_STALE_TIME = 2 * 60 * 1000;

export const gymRoutinesKey = (userId: string) => ["gym", "routines", userId] as const;
export const gymWorkoutsKey = (userId: string) => ["gym", "workouts", userId] as const;
export const gymStatsKey = (userId: string) => ["gym", "stats", userId] as const;
export const gymWeeklyPlanKey = (userId: string) => ["gym", "weeklyPlan", userId] as const;

function sortWorkouts(workouts: Workout[]): Workout[] {
  return [...workouts].sort((a, b) => {
    const aTime = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
    const bTime = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function fetchGymRoutines(userId: string): Promise<Routine[]> {
  const result = await getRoutinesAction(userId);
  if (result.error) throw new Error(result.error);
  return result.data ?? [];
}

export async function fetchGymWorkouts(userId: string): Promise<Workout[]> {
  const result = await getWorkoutsAction(userId);
  if (result.error) throw new Error(result.error);
  return sortWorkouts(result.data ?? []);
}

export async function fetchGymStats(userId: string) {
  const result = await getStatsAction(userId);
  if (result.error) throw new Error(result.error);
  return result.data ?? { weekMinutes: 0, totalWorkouts: 0 };
}

export async function fetchGymWeeklyPlan(userId: string): Promise<WeeklyPlanDay[]> {
  const result = await getWeeklyPlanAction(userId);
  if (result.error) throw new Error(result.error);
  return result.data ?? [];
}

export function upsertRoutineInCache(
  queryClient: QueryClient,
  userId: string,
  routine: Routine
) {
  queryClient.setQueryData<Routine[]>(gymRoutinesKey(userId), (prev) => {
    const items = prev ?? [];
    const idx = items.findIndex((item) => item.id === routine.id);
    if (idx >= 0) {
      return items.map((item) => (item.id === routine.id ? routine : item));
    }
    return [routine, ...items];
  });
}

export function removeRoutineFromCache(
  queryClient: QueryClient,
  userId: string,
  routineId: string
) {
  queryClient.setQueryData<Routine[]>(gymRoutinesKey(userId), (prev) =>
    (prev ?? []).filter((item) => item.id !== routineId)
  );
}

export function syncRoutineInWeeklyPlanCache(
  queryClient: QueryClient,
  userId: string,
  routine: Routine
) {
  queryClient.setQueryData<WeeklyPlanDay[]>(gymWeeklyPlanKey(userId), (prev) => {
    if (!prev) return prev;
    return prev.map((day) =>
      day.routineId === routine.id
        ? {
            ...day,
            routineName: routine.name,
            exercises: routine.exercises,
          }
        : day
    );
  });
}

export function clearRoutineFromWeeklyPlanCache(
  queryClient: QueryClient,
  userId: string,
  routineId: string
) {
  queryClient.setQueryData<WeeklyPlanDay[]>(gymWeeklyPlanKey(userId), (prev) => {
    if (!prev) return prev;
    return prev.map((day) =>
      day.routineId === routineId
        ? {
            ...day,
            routineId: null,
            routineName: null,
            exercises: [],
          }
        : day
    );
  });
}

export function prependWorkoutToCache(
  queryClient: QueryClient,
  userId: string,
  workout: Workout
) {
  queryClient.setQueryData<Workout[]>(gymWorkoutsKey(userId), (prev) =>
    sortWorkouts([workout, ...(prev ?? []).filter((item) => item.id !== workout.id)])
  );
}

export function upsertWorkoutInCache(
  queryClient: QueryClient,
  userId: string,
  workout: Workout
) {
  queryClient.setQueryData<Workout[]>(gymWorkoutsKey(userId), (prev) => {
    const items = prev ?? [];
    const next = items.some((item) => item.id === workout.id)
      ? items.map((item) => (item.id === workout.id ? workout : item))
      : [workout, ...items];
    return sortWorkouts(next);
  });
}

export function removeWorkoutFromCache(
  queryClient: QueryClient,
  userId: string,
  workoutId: string
) {
  queryClient.setQueryData<Workout[]>(gymWorkoutsKey(userId), (prev) =>
    (prev ?? []).filter((item) => item.id !== workoutId)
  );
}

export function patchWeeklyPlanDayInCache(
  queryClient: QueryClient,
  userId: string,
  update: {
    dayOfWeek: number;
    routineId: string | null;
    routineName: string | null;
    exercises: ExerciseRef[];
  }
) {
  queryClient.setQueryData<WeeklyPlanDay[]>(gymWeeklyPlanKey(userId), (prev) => {
    if (!prev) return prev;
    return prev.map((day) =>
      day.dayOfWeek === update.dayOfWeek
        ? {
            ...day,
            routineId: update.routineId,
            routineName: update.routineName,
            exercises: update.exercises,
          }
        : day
    );
  });
}

export function invalidateGymStats(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: gymStatsKey(userId) });
}

export function syncGymDiscoverWidgets(queryClient: QueryClient, userId: string) {
  invalidateDiscoverWidgets(queryClient, userId);
}

export function invalidateGymQueries(queryClient: QueryClient, userId: string) {
  void queryClient.invalidateQueries({ queryKey: gymRoutinesKey(userId) });
  void queryClient.invalidateQueries({ queryKey: gymWorkoutsKey(userId) });
  void queryClient.invalidateQueries({ queryKey: gymStatsKey(userId) });
  void queryClient.invalidateQueries({ queryKey: gymWeeklyPlanKey(userId) });
  syncGymDiscoverWidgets(queryClient, userId);
}
