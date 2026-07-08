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

export interface ActiveSession {
  name: string;
  routineId: string | null;
  exercises: WorkoutExercise[];
  startedAt: string;
}

export const ACTIVE_SESSION_KEY = "gym_active_session";

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
