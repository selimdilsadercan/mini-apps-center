export const DEFAULT_RANK_CITY = "kahramanmaras";
export const DEFAULT_WINDOW_DAYS = 90;
export const MIN_VOTES_FOR_RANKING = 0;
export const WEIGHTED_MIN_VOTES = 5;

export interface RankListConfig {
  id: string;
  label: string;
  emoji: string;
  title?: string;
  primaryTypes?: string[];
  tagKeywords?: string[];
}

export const RANK_LISTS: RankListConfig[] = [
  {
    id: "all",
    label: "Tüm Mekanlar",
    emoji: "🏠",
    title: "Kahramanmaraş Mekanları",
  },
  {
    id: "kahve",
    label: "Kahve",
    emoji: "☕",
    tagKeywords: ["kahve", "coffee", "roastery", "nitelikli kahve"],
    title: "En iyi kahve nerede içilir?",
  },
  {
    id: "hamburger",
    label: "Hamburger",
    emoji: "🍔",
    tagKeywords: ["hamburger", "burger"],
    title: "En iyi burger nerede yenir?",
  },
  {
    id: "pizza",
    label: "Pizza",
    emoji: "🍕",
    tagKeywords: ["pizza"],
    title: "En iyi pizza nerede yenir?",
  },
  {
    id: "maras_dondurmasi",
    label: "Maraş Dondurması",
    emoji: "🍦",
    tagKeywords: ["maraş dondurması", "dondurma", "ice cream"],
    title: "Gerçek Maraş dondurması nerede yenir?",
  },
  {
    id: "okey",
    label: "101 Okey",
    emoji: "🀄",
    tagKeywords: ["101 okey", "okey", "oyun"],
    title: "Okey nerede oynanır?",
  },
  {
    id: "firik_tarhana",
    label: "Firik & Tarhana",
    emoji: "🍲",
    tagKeywords: ["firik", "tarhana"],
    title: "Firik & Tarhana nerede yenir?",
  },
  {
    id: "piknik",
    label: "Piknik",
    emoji: "🧺",
    tagKeywords: ["piknik", "mesire"],
    title: "Piknik için nereye gidilir?",
  },
  {
    id: "study",
    label: "Çalışma Mekanı",
    emoji: "📚",
    primaryTypes: ["study_spot", "library"],
    tagKeywords: ["çalışma", "ders", "sessiz"],
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
