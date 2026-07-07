import type { Ingredient, Instruction } from "@/lib/text-to-recipe";

/** Tarif malzemesi — opsiyonel varyant desteği */
export type RecipeIngredient = Ingredient & {
  /** Bağlantı anahtarı (yapılış requires ile eşleşir). Yoksa isimden üretilir. */
  key?: string;
  /** true ise kullanıcı açıp kapatabilir */
  optional?: boolean;
  /** optional=true iken varsayılan durum (true = dahil). Varsayılan: true */
  defaultOn?: boolean;
  /** Toggle etiketi (yoksa name kullanılır) */
  label?: string;
};

/** Yapılış adımı — opsiyonel malzemeye bağlı olabilir */
export type RecipeInstruction = Instruction & {
  /** Bu anahtarların hepsi seçiliyse adım gösterilir */
  requires?: string[];
};

export type OptionalToggle = {
  key: string;
  label: string;
  defaultOn: boolean;
};

export function getIngredientKey(ingredient: RecipeIngredient, index: number): string {
  if (ingredient.key?.trim()) return ingredient.key.trim();
  const slug = ingredient.name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ğüşıöç\-]/gi, "");
  return slug || `ing-${index}`;
}

export function normalizeRecipeIngredients(raw: RecipeIngredient[]): RecipeIngredient[] {
  return raw.map((ingredient, index) => ({
    ...ingredient,
    key: getIngredientKey(ingredient, index),
  }));
}

export function getOptionalToggles(ingredients: RecipeIngredient[]): OptionalToggle[] {
  return ingredients
    .filter((ing) => ing.optional)
    .map((ing, index) => ({
      key: getIngredientKey(ing, index),
      label: ing.label?.trim() || ing.name,
      defaultOn: ing.defaultOn !== false,
    }));
}

export function buildDefaultSelectedKeys(ingredients: RecipeIngredient[]): Set<string> {
  const keys = new Set<string>();
  ingredients.forEach((ing, index) => {
    const key = getIngredientKey(ing, index);
    if (!ing.optional || ing.defaultOn !== false) {
      keys.add(key);
    }
  });
  return keys;
}

export function filterActiveIngredients(
  ingredients: RecipeIngredient[],
  selectedKeys: Set<string>
): RecipeIngredient[] {
  return ingredients.filter((ing, index) => {
    if (!ing.optional) return true;
    return selectedKeys.has(getIngredientKey(ing, index));
  });
}

export function filterActiveInstructions(
  instructions: RecipeInstruction[],
  selectedKeys: Set<string>
): RecipeInstruction[] {
  return instructions.filter((instruction) => {
    if (!instruction.requires?.length) return true;
    return instruction.requires.every((key) => selectedKeys.has(key));
  });
}

export function toggleIngredientKey(
  selectedKeys: Set<string>,
  key: string,
  on: boolean
): Set<string> {
  const next = new Set(selectedKeys);
  if (on) next.add(key);
  else next.delete(key);
  return next;
}
