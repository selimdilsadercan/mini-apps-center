export type PlanMeal = {
  id: string;
  title: string;
  recipeId?: string;
};

export type PlanData = Record<string, PlanMeal[]>;

const STORAGE_KEY = "meal-planner-week-plan-v1";

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadPlanData(): PlanData {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PlanData;
  } catch {
    return {};
  }
}

export function savePlanData(data: PlanData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createMealId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
