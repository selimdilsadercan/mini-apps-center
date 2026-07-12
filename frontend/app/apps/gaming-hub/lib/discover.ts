import type { gaming_hub } from "@/lib/client";

export function webGameToDiscoverItem(game: gaming_hub.WebGame): gaming_hub.DiscoverItem {
  return {
    id: game.id,
    title: game.title,
    coverUrl: game.coverUrl,
    url: game.url,
    description: game.description ?? null,
  };
}

export function catalogGameToDiscoverItem(game: gaming_hub.CatalogGame): gaming_hub.DiscoverItem {
  return {
    id: game.gameId,
    title: game.title,
    coverUrl: game.coverUrl,
    url: null,
    description: game.summary,
  };
}

export const DISCOVER_CATEGORY_LABELS: Record<gaming_hub.DiscoverCategory, string> = {
  "bilgisayar-web": "Web",
  mobil: "Mobil",
  populer: "Popüler Oyunlar",
};

export const DISCOVER_CATEGORIES: gaming_hub.DiscoverCategory[] = [
  "bilgisayar-web",
  "mobil",
  "populer",
];

export function isDiscoverCategory(value: string | null): value is gaming_hub.DiscoverCategory {
  return value === "bilgisayar-web" || value === "mobil" || value === "populer";
}
