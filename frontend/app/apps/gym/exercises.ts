import type { ExerciseTrackingType } from "./types";

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

export function createCustomExerciseSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `custom-${base || "egzersiz"}`;
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
  if (!slug || slug.startsWith("custom-")) return undefined;
  
  // 1. Direct UUID slug match
  const directMatch = catalog.find((e) => e.slug === slug);
  if (directMatch) return directMatch;

  // 2. Exact slugified nameEn or name match
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const exactSlugMatch = catalog.find((e) => {
    const slugEn = e.nameEn?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const slugTr = e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return slugEn === cleanSlug || slugTr === cleanSlug;
  });
  if (exactSlugMatch) return exactSlugMatch;

  // 3. Fuzzy search: token similarity scoring
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove diacritics
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/[\s-]+/)
      .filter(Boolean);
  };

  const queryTokens = normalize(slug);
  if (queryTokens.length === 0) return undefined;

  let bestMatch: ExerciseCatalogItem | undefined = undefined;
  let bestScore = 0;

  for (const item of catalog) {
    const itemTokens = [
      ...normalize(item.name),
      ...normalize(item.nameEn ?? ""),
    ];

    let matches = 0;
    for (const token of queryTokens) {
      if (itemTokens.includes(token)) {
        matches++;
      }
    }

    const score = matches / queryTokens.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // If match quality is reasonable (at least 40% of the query tokens matched), return it
  if (bestScore >= 0.4) {
    return bestMatch;
  }

  return undefined;
}

const NO_WEIGHT_EQUIPMENT = new Set(["Body Only"]);

export interface ExerciseTrackingRef {
  slug: string;
  trackingType?: ExerciseTrackingType;
}

export function isCustomExerciseSlug(slug: string): boolean {
  return slug.startsWith("custom-");
}

export function getExerciseTrackingType(
  exercise: ExerciseTrackingRef,
  catalogItem?: Pick<ExerciseCatalogItem, "name" | "nameEn" | "equipment">,
): ExerciseTrackingType {
  if (isCustomExerciseSlug(exercise.slug) && exercise.trackingType) {
    return exercise.trackingType;
  }
  if (catalogItem) {
    if (exerciseUsesDuration(catalogItem)) return "duration";
    if (exerciseUsesWeight(catalogItem.equipment)) return "weighted";
    return "bodyweight";
  }
  return "weighted";
}

export function trackingUsesWeight(type: ExerciseTrackingType): boolean {
  return type === "weighted";
}

export function trackingUsesDuration(type: ExerciseTrackingType): boolean {
  return type === "duration";
}

export function getTrackingTypeLabel(type: ExerciseTrackingType): string {
  switch (type) {
    case "weighted":
      return "Kilolu";
    case "bodyweight":
      return "Vücut ağırlığı";
    case "duration":
      return "Süreli";
  }
}

const DURATION_EXERCISE_PATTERN =
  /\b(plank|side plank|wall sit|dead hang|hollow hold|l-sit|superman hold|glute bridge hold|isometric hold|isometric neck|isometric chest|static hold)\b/i;

export function exerciseUsesDuration(
  exercise: Pick<ExerciseCatalogItem, "name" | "nameEn"> | undefined
): boolean {
  if (!exercise) return false;
  return DURATION_EXERCISE_PATTERN.test(`${exercise.nameEn} ${exercise.name}`);
}

export function exerciseUsesWeight(equipment: string[] | undefined): boolean {
  if (!equipment?.length) return false;
  return !equipment.every((item) => NO_WEIGHT_EQUIPMENT.has(item));
}

export function formatPreviousSet(
  set: { reps: number | null; weightKg: number | null },
  options?: { duration?: boolean }
): string {
  if (options?.duration) {
    if (set.reps != null && set.reps > 0) return formatSetDuration(set.reps);
    return "—";
  }
  if (set.weightKg && set.reps) return `${set.weightKg}kg × ${set.reps}`;
  if (set.reps) return `× ${set.reps}`;
  return "—";
}

export function formatSetDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, "0")}`;
  return `${s}s`;
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

export function showExerciseDetail(exercise: ExerciseCatalogItem) {
  if (typeof window !== "undefined") {
    window.location.href = `/apps/gym/exercise/${exercise.slug}`;
  }
}
