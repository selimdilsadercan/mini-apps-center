const STUDY_ACTIVITY_IDS = new Set([
  "study",
  "exam_study",
  "project",
  "library",
  "coworking",
  "homework",
  "presentation",
  "brainstorm",
  "reading",
  "language_practice",
]);

const FOOD_ACTIVITY_IDS = new Set([
  "food",
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "dessert",
  "pizza",
  "burger",
  "sushi",
]);

export function isStudyActivity(actId: string): boolean {
  return STUDY_ACTIVITY_IDS.has(actId);
}

export function isFoodActivity(actId: string): boolean {
  return FOOD_ACTIVITY_IDS.has(actId);
}

export function getLocationPickerCopy(actId: string): { label: string; placeholder: string } {
  if (actId === "gym") {
    return {
      label: "Hangi spor salonunda buluşacaksınız?",
      placeholder: "Örn: MacFit, Hillside…",
    };
  }
  if (actId === "coffee" || actId === "tea") {
    return { label: "Hangi kafede buluşacaksınız?", placeholder: "Örn: Starbucks, Espressolab…" };
  }
  if (isFoodActivity(actId)) {
    return {
      label: "Hangi restoranda / nerede yemek yiyeceksiniz?",
      placeholder: "Örn: restoran adı, evde…",
    };
  }
  if (actId === "movie") {
    return { label: "Hangi sinemada buluşacaksınız?", placeholder: "Örn: Piazza, Arsan Sineması…" };
  }
  if (actId === "theater") {
    return { label: "Hangi salonda / mekanda?", placeholder: "Örn: Kültür merkezi…" };
  }
  if (actId === "concert" || actId === "festival") {
    return { label: "Hangi etkinlik / konser?", placeholder: "Yaklaşan etkinlik seç…" };
  }
  if (actId === "standup") {
    return { label: "Hangi stand-up gösterisi?", placeholder: "Yaklaşan gösteri seç…" };
  }
  if (actId === "card_game") {
    return { label: "Hangi kart oyununu oynayacaksınız?", placeholder: "Örn: Batak, Pişti…" };
  }
  if (["football", "basketball", "volleyball", "tennis", "table_tennis"].includes(actId)) {
    return { label: "Hangi sahada / kortta?", placeholder: "Örn: halı saha, spor tesisi…" };
  }
  if (actId === "library") {
    return { label: "Hangi kütüphanede çalışacaksınız?", placeholder: "Örn: Kütüphane adı…" };
  }
  if (isStudyActivity(actId)) {
    return { label: "Nerede çalışacaksınız?", placeholder: "Örn: Kafum, kütüphane…" };
  }
  return { label: "Buluşma yeri neresi?", placeholder: "Örn: mekan, adres, semt…" };
}

export const DEFAULT_LOCATION_ACTIVITY = {
  id: "general",
  label: "Buluşma",
  icon: "📍",
};
