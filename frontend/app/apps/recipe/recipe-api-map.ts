import type { lib } from "@/lib/client";

/** API / veritabanına giden malzeme — varyant alanları dahil */
export type ApiIngredient = lib.Ingredient & {
  key?: string;
  optional?: boolean;
  defaultOn?: boolean;
  label?: string;
};

/** API / veritabanına giden adım — requires dahil */
export type ApiInstruction = lib.Instruction & {
  requires?: string[];
};

export type RecipeIngredientInput = {
  name: string;
  amount?: string;
  key?: string;
  optional?: boolean;
  defaultOn?: boolean;
  label?: string;
};

export type RecipeInstructionInput = {
  text: string;
  index?: number;
  step?: number;
  requires?: string[];
};

export function toApiIngredients(items: RecipeIngredientInput[]): ApiIngredient[] {
  return items.map((item) => {
    const out: ApiIngredient = { name: item.name };
    if (item.amount) out.amount = item.amount;
    if (item.key) out.key = item.key;
    if (item.optional) out.optional = item.optional;
    if (item.defaultOn === false) out.defaultOn = false;
    if (item.label) out.label = item.label;
    return out;
  });
}

export function toApiInstructions(items: RecipeInstructionInput[]): ApiInstruction[] {
  return items.map((item, idx) => {
    const out: ApiInstruction = {
      step: item.step ?? item.index ?? idx + 1,
      text: item.text,
    };
    if (item.requires?.length) out.requires = item.requires;
    return out;
  });
}
