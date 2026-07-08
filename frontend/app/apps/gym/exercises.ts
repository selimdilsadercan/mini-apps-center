export interface ExerciseCatalogItem {
  slug: string;
  /** Turkish display name */
  name: string;
  nameEn: string;
  muscleGroup: string;
  muscleGroupEn?: string;
  muscleSlug: string;
  equipment: string[];
  difficultyLevel: string | null;
  category: string | null;
  imageUrl: string | null;
}

const MUSCLE_EMOJI: Record<string, string> = {
  chest: "💪",
  shoulders: "🏋️",
  biceps: "💪",
  triceps: "🔥",
  forearms: "✊",
  abdominals: "🔥",
  quadriceps: "🦵",
  hamstrings: "🦵",
  glutes: "🍑",
  calves: "🦵",
  "middle-back": "🚣",
  lats: "⬇️",
  "lower-back": "💀",
  traps: "🔺",
  neck: "🧘",
  adductors: "🦵",
  abductors: "🦵",
  general: "🏋️",
};

let catalogCache: ExerciseCatalogItem[] | null = null;
let catalogPromise: Promise<ExerciseCatalogItem[]> | null = null;

export async function loadExerciseCatalog(): Promise<ExerciseCatalogItem[]> {
  if (catalogCache) return catalogCache;
  if (!catalogPromise) {
    catalogPromise = fetch("/gym/exercises.json")
      .then((res) => {
        if (!res.ok) throw new Error("Egzersiz listesi yüklenemedi");
        return res.json() as Promise<ExerciseCatalogItem[]>;
      })
      .then((data) => {
        catalogCache = data;
        return data;
      });
  }
  return catalogPromise;
}

export function getMuscleEmoji(muscleSlug: string): string {
  return MUSCLE_EMOJI[muscleSlug] ?? "🏋️";
}

export function getExerciseEmoji(exercise: Pick<ExerciseCatalogItem, "muscleSlug">): string {
  return getMuscleEmoji(exercise.muscleSlug);
}

export function searchExercises(
  catalog: ExerciseCatalogItem[],
  query: string,
  limit = 50
): ExerciseCatalogItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog.slice(0, limit);

  return catalog
    .filter((ex) => {
      const nameEn = ex.nameEn?.toLowerCase() ?? "";
      return (
        ex.name.toLowerCase().includes(q) ||
        nameEn.includes(q) ||
        ex.muscleGroup.toLowerCase().includes(q) ||
        (ex.muscleGroupEn?.toLowerCase().includes(q) ?? false) ||
        ex.equipment.some((e) => e.toLowerCase().includes(q))
      );
    })
    .slice(0, limit);
}

export function resolveExerciseName(
  catalog: ExerciseCatalogItem[],
  slug: string,
  storedName: string
): string {
  const fromCatalog = getExerciseBySlug(catalog, slug);
  return fromCatalog?.name ?? storedName;
}

export function getExerciseBySlug(
  catalog: ExerciseCatalogItem[],
  slug: string
): ExerciseCatalogItem | undefined {
  return catalog.find((e) => e.slug === slug);
}

const NO_WEIGHT_EQUIPMENT = new Set(["Body Only"]);

export function exerciseUsesWeight(equipment: string[] | undefined): boolean {
  if (!equipment?.length) return false;
  return !equipment.every((item) => NO_WEIGHT_EQUIPMENT.has(item));
}

export function formatPreviousSet(set: { reps: number | null; weightKg: number | null }): string {
  if (set.weightKg && set.reps) return `${set.weightKg}kg × ${set.reps}`;
  if (set.reps) return `× ${set.reps}`;
  return "—";
}

export function calcVolume(
  exercises: { sets: { reps: number | null; weightKg: number | null; completed: boolean }[] }[]
): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed && set.reps && set.weightKg) {
        total += set.reps * set.weightKg;
      }
    }
  }
  return Math.round(total * 10) / 10;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}s ${m}dk`;
  if (m > 0) return `${m}dk ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}
