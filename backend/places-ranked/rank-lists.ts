export const DEFAULT_RANK_CITY = "kahramanmaras";
export const DEFAULT_WINDOW_DAYS = 90;
export const MIN_VOTES_FOR_RANKING = 3;
export const WEIGHTED_MIN_VOTES = 10;

export interface RankListConfig {
  id: string;
  label: string;
  emoji: string;
  primaryTypes?: string[];
  tagKeywords?: string[];
}

export const RANK_LISTS: RankListConfig[] = [
  {
    id: "cafe",
    label: "Kafe",
    emoji: "☕",
    primaryTypes: ["cafe"],
  },
  {
    id: "restaurant",
    label: "Restoran",
    emoji: "🍽️",
    primaryTypes: ["restaurant"],
  },
  {
    id: "dessert",
    label: "Tatlıcı",
    emoji: "🍰",
    primaryTypes: ["dessert"],
  },
  {
    id: "ice_cream",
    label: "Dondurmacı",
    emoji: "🍦",
    primaryTypes: ["dessert"],
    tagKeywords: ["dondurma", "ice cream", "gelato", "maraş"],
  },
  {
    id: "study",
    label: "Çalışma Mekanı",
    emoji: "📚",
    primaryTypes: ["study_spot", "library", "cafe"],
  },
  {
    id: "breakfast",
    label: "Kahvaltı",
    emoji: "🥐",
    tagKeywords: ["kahvaltı", "breakfast", "brunch"],
  },
];

export function getRankList(listId: string): RankListConfig | undefined {
  return RANK_LISTS.find((l) => l.id === listId);
}
