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
  /** Rutinden gelen hedef — input placeholder; tiklenince gerçek değere yazılır */
  targetReps?: number | null;
  targetWeightKg?: number | null;
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

export interface ActiveSession {
  name: string;
  routineId: string | null;
  exercises: WorkoutExercise[];
  startedAt: string;
  manualDurationSeconds?: number | null;
}

export function getActiveSessionElapsed(session: ActiveSession, now = Date.now()): number {
  if (session.manualDurationSeconds != null) {
    return session.manualDurationSeconds;
  }
  return Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000));
}

export function buildActiveSessionFinishedAt(startedAt: string, durationSeconds: number): string {
  return new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();
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

export function createExerciseFromRef(ref: ExerciseRef): WorkoutExercise {
  const sets =
    ref.sets && ref.sets.length > 0
      ? ref.sets.map((s) => ({
          reps: null,
          weightKg: null,
          targetReps: s.reps,
          targetWeightKg: s.weightKg,
          completed: false,
        }))
      : Array.from({ length: 3 }, () => createEmptySet());
  return {
    slug: ref.slug,
    name: ref.name,
    sets,
  };
}

export function getSetTargetReps(
  set: WorkoutSet,
  setIdx: number,
  allSets: WorkoutSet[]
): number | null | undefined {
  if (setIdx > 0 && set.reps == null && allSets[0]?.reps != null) {
    return allSets[0].reps;
  }
  return set.targetReps;
}

export function getSetTargetWeightKg(
  set: WorkoutSet,
  setIdx: number,
  allSets: WorkoutSet[]
): number | null | undefined {
  if (setIdx > 0 && set.weightKg == null && allSets[0]?.weightKg != null) {
    return allSets[0].weightKg;
  }
  return set.targetWeightKg;
}

export function completeWorkoutSet(
  set: WorkoutSet,
  setIdx: number,
  allSets: WorkoutSet[]
): WorkoutSet {
  return {
    ...set,
    completed: true,
    reps: set.reps ?? getSetTargetReps(set, setIdx, allSets) ?? null,
    weightKg: set.weightKg ?? getSetTargetWeightKg(set, setIdx, allSets) ?? null,
  };
}

export function setPlaceholder(value: number | null | undefined): string {
  return value != null ? String(value) : "—";
}
