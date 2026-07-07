import COMMON_ITEMS from "./common_items.json";

export const INGREDIENT_ATLAS_BASE_URL =
  "https://huggingface.co/datasets/ionicam/ingredient-atlas/resolve/main";

type CommonItemEntry = {
  name: string;
  slug?: string;
  atlasCategory?: string;
};

const ITEM_META_BY_NAME = new Map<string, CommonItemEntry>(
  COMMON_ITEMS.flatMap((group) => group.items).map((item) => [
    item.name.toLocaleLowerCase("tr-TR"),
    item,
  ])
);

const CATALOG_ITEMS_WITH_IMAGE = COMMON_ITEMS.flatMap((group) => group.items).filter(
  (item) => item.slug && item.atlasCategory
);

const CATALOG_ITEMS_BY_NAME_LENGTH = [...CATALOG_ITEMS_WITH_IMAGE].sort(
  (a, b) => b.name.length - a.name.length
);

function getMetaForName(name: string): CommonItemEntry | null {
  return ITEM_META_BY_NAME.get(name.toLocaleLowerCase("tr-TR")) ?? null;
}

/** Bileşik malzeme adlarını katalogdaki ürünle eşleştirir (ör. "haşlanmış nohut" → Nohut). */
export function resolveCatalogItem(name: string): CommonItemEntry | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const direct = getMetaForName(trimmed);
  if (direct?.slug && direct.atlasCategory) return direct;

  const lower = trimmed.toLocaleLowerCase("tr-TR");

  for (const item of CATALOG_ITEMS_BY_NAME_LENGTH) {
    const itemLower = item.name.toLocaleLowerCase("tr-TR");
    if (itemLower.length >= 3 && lower.includes(itemLower)) {
      return item;
    }
  }

  const words = lower.split(/\s+/).filter((word) => word.length >= 3);
  for (const word of words.sort((a, b) => b.length - a.length)) {
    const match = getMetaForName(word);
    if (match?.slug && match.atlasCategory) return match;
  }

  return null;
}

export function resolveItemImageUrl(name: string): string | null {
  const meta = resolveCatalogItem(name);
  if (!meta?.slug || !meta.atlasCategory) return null;

  return `${INGREDIENT_ATLAS_BASE_URL}/images/webp/512/${meta.atlasCategory}/${meta.slug}.webp`;
}

export function getItemImageUrl(name: string): string | null {
  const meta = getMetaForName(name);
  if (!meta?.slug || !meta.atlasCategory) return null;

  return `${INGREDIENT_ATLAS_BASE_URL}/images/webp/512/${meta.atlasCategory}/${meta.slug}.webp`;
}

export function formatItemName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const lower = trimmed.toLocaleLowerCase("tr-TR");
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

export function normalizeItemNameForAdd(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const canonical = ITEM_META_BY_NAME.get(trimmed.toLocaleLowerCase("tr-TR"));
  if (canonical) return canonical.name;

  return formatItemName(trimmed);
}

export function getItemInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed[0].toLocaleUpperCase("tr-TR");
}
