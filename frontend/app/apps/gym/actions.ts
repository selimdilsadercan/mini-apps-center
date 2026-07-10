import { createBrowserClient } from "@/lib/api";
import { isUnauthenticatedError, getErrorMessage } from "@/lib/api-error-handler";
import type {
  Routine,
  Workout,
  WorkoutExercise,
  GymStats,
  ExerciseRef,
  WorkoutSet,
  WeeklyPlanDay,
  TodayPlan,
} from "./types";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gymClient(client: ReturnType<typeof createBrowserClient>): any {
  return (client as any).gym;
}

export async function getOrCreateUserAction(
  clerkId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const client = createBrowserClient();
    const response = await client.users.getOrCreateUser({ clerkId });
    if (response.user) {
      return { data: { id: response.user.id }, error: null };
    }
    return { data: null, error: "Kullanıcı oluşturulamadı" };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getRoutinesAction(
  clerkId: string
): Promise<ActionResponse<Routine[]>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getRoutines(clerkId);
    return { data: response.routines ?? [], error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createRoutineAction(
  clerkId: string,
  name: string,
  exercises: ExerciseRef[]
): Promise<ActionResponse<Routine>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).createRoutine({
      userId: clerkId,
      name,
      exercises,
    });
    return { data: response.routine, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteRoutineAction(
  clerkId: string,
  routineId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).deleteRoutine(clerkId, routineId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getWorkoutsAction(
  clerkId: string
): Promise<ActionResponse<Workout[]>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getWorkouts(clerkId);
    return { data: response.workouts ?? [], error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function saveWorkoutAction(
  clerkId: string,
  payload: {
    name: string;
    routineId?: string | null;
    exercises: WorkoutExercise[];
    startedAt: string;
    finishedAt: string;
    durationSeconds: number;
    totalVolumeKg: number;
  }
): Promise<ActionResponse<Workout>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).saveWorkout({
      userId: clerkId,
      ...payload,
    });
    return { data: response.workout, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getPreviousSetsAction(
  clerkId: string,
  exerciseSlug: string
): Promise<ActionResponse<WorkoutSet[]>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getPreviousSets(clerkId, exerciseSlug);
    return { data: response.sets ?? [], error: null };
  } catch (error) {
    return { data: [], error: null };
  }
}

export async function getStatsAction(
  clerkId: string
): Promise<ActionResponse<GymStats>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getStats(clerkId);
    return { data: response, error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getWeeklyPlanAction(
  clerkId: string
): Promise<ActionResponse<WeeklyPlanDay[]>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getWeeklyPlan(clerkId);
    return { data: response.days ?? [], error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function setWeeklyPlanDayAction(
  clerkId: string,
  dayOfWeek: number,
  routineId: string | null
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).setWeeklyPlanDay(clerkId, {
      dayOfWeek,
      routineId,
    });
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTodayPlanAction(
  clerkId: string
): Promise<ActionResponse<TodayPlan>> {
  try {
    const client = createBrowserClient();
    const response = await gymClient(client).getTodayPlan(clerkId);
    return { data: response, error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}
