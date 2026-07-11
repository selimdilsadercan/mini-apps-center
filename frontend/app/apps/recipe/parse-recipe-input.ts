import { parseRecipeText } from "@/lib/text-to-recipe";
import type { RecipeIngredientInput, RecipeInstructionInput } from "./recipe-api-map";

export type ParsedRecipeInput = {
  title: string;
  ingredients: RecipeIngredientInput[];
  instructions: RecipeInstructionInput[];
};

type RecipeJsonPayload = {
  title?: string;
  ingredients?: RecipeIngredientInput[];
  instructions?: RecipeInstructionInput[];
};

export function parseRecipeJson(text: string): { data?: ParsedRecipeInput; error?: string } {
  try {
    const parsed = JSON.parse(text) as RecipeJsonPayload;
    if (!parsed.title?.trim()) return { error: "JSON'da title alanı gerekli" };
    if (!Array.isArray(parsed.ingredients)) return { error: "ingredients bir dizi olmalı" };
    if (!Array.isArray(parsed.instructions)) return { error: "instructions bir dizi olmalı" };

    return {
      data: {
        title: parsed.title.trim(),
        ingredients: parsed.ingredients.map((item) => ({
          name: item.name ?? "",
          amount: item.amount,
          key: item.key,
          optional: item.optional,
          defaultOn: item.defaultOn,
          label: item.label,
        })),
        instructions: parsed.instructions.map((item, idx) => ({
          text: item.text ?? "",
          index: item.index ?? item.step ?? idx + 1,
          step: item.step ?? item.index ?? idx + 1,
          requires: item.requires,
        })),
      },
    };
  } catch {
    return { error: "Geçersiz JSON formatı" };
  }
}

export function parseRecipeTextInput(text: string): { data?: ParsedRecipeInput; error?: string } {
  const parsed = parseRecipeText(text);
  if (!parsed) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return { error: "Tarif içeriği boş olamaz" };
    }
    return {
      data: {
        title: lines[0],
        ingredients: [],
        instructions: [],
      },
    };
  }
  if (!parsed.title?.trim()) {
    return { error: "Tarif başlığı bulunamadı. İlk satırda başlık olmalı." };
  }

  return {
    data: {
      title: parsed.title.trim(),
      ingredients: parsed.ingredients.map((item) => ({
        name: item.name,
        amount: item.amount,
      })),
      instructions: parsed.instructions.map((item, idx) => ({
        text: item.text,
        index: item.index ?? idx + 1,
        step: item.index ?? idx + 1,
      })),
    },
  };
}

/** Metin veya JSON — içerik { ile başlıyorsa JSON dener */
export function parseRecipeInput(
  text: string,
  mode: "text" | "json"
): { data?: ParsedRecipeInput; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { error: "Lütfen tarif içeriğini girin" };

  if (mode === "json" || trimmed.startsWith("{")) {
    return parseRecipeJson(trimmed);
  }
  return parseRecipeTextInput(trimmed);
}
