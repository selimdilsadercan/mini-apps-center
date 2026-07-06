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

export function getItemImageUrl(name: string): string | null {
  const meta = ITEM_META_BY_NAME.get(name.toLocaleLowerCase("tr-TR"));
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
