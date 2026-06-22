import type { MenuResponse } from "./menu_provider";

export type MealSlot = "lunch" | "dinner";

function normalizeDishName(name: string): string {
  return name.trim().toLocaleUpperCase("tr-TR");
}

export function hasDislikedOnMenu(dishNames: string[], dislikedDishes: string[]): boolean {
  if (dislikedDishes.length === 0) return false;
  const disliked = new Set(dislikedDishes.map(normalizeDishName));
  return dishNames.some((name) => disliked.has(normalizeDishName(name)));
}

export function buildMealNotificationCopy(
  slot: MealSlot,
  menu: MenuResponse,
  dislikedDishes: string[],
): { title: string; body: string } {
  const dishNames = menu.dishes.map((d) => d.name);
  const preview = dishNames.slice(0, 4).join(", ");
  const suffix = dishNames.length > 4 ? "..." : "";

  if (hasDislikedOnMenu(dishNames, dislikedDishes)) {
    if (slot === "lunch") {
      return {
        title: "ITU Yemekhane • Dikkat! 🫣",
        body: "Bugünün öğle menüsünde sevmediğin bir yemek var. Menüye göz at!",
      };
    }
    return {
      title: "ITU Yemekhane • Bak bir! 🤨",
      body: "Akşam menüsünde sevmediğin bir yemek olabilir. Kontrol et!",
    };
  }

  if (slot === "lunch") {
    return {
      title: "ITU Yemekhane • Öğle Menüsü ☀️",
      body: `Bugünün öğle menüsü: ${preview}${suffix}`,
    };
  }

  return {
    title: "ITU Yemekhane • Akşam Menüsü 🌙",
    body: `Bugünün akşam menüsü: ${preview}${suffix}`,
  };
}
