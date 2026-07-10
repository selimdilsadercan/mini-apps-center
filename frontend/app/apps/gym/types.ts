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

export interface WeeklyPlanDay {
  dayOfWeek: number;
  routineId: string | null;
  routineName: string | null;
  exercises: ExerciseRef[];
}

export interface TodayPlan {
  dayOfWeek: number;
  routine: Routine | null;
}

export interface ActiveSession {
  name: string;
  routineId: string | null;
  exercises: WorkoutExercise[];
  startedAt: string;
}

export const ACTIVE_SESSION_KEY = "gym_active_session";

export const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export function getIsoWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function startGymSession(
  name: string,
  routineId: string | null,
  exercises: ExerciseRef[]
): ActiveSession {
  const session: ActiveSession = {
    name,
    routineId,
    exercises: exercises.map((exercise) => createExerciseFromRef(exercise)),
    startedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function createEmptySet(): WorkoutSet {
  return { reps: null, weightKg: null, completed: false };
}

export function createExerciseFromRef(ref: ExerciseRef, defaultSets = 3): WorkoutExercise {
  return {
    slug: ref.slug,
    name: ref.name,
    sets: Array.from({ length: defaultSets }, () => createEmptySet()),
  };
}
