"use client";

import type { RecipeIngredient } from "../recipe-variant";
import { scaleIngredientAmount } from "../scale-ingredient";
import IngredientThumbnail from "./IngredientThumbnail";

export default function IngredientTooltip({
  ingredient,
  servings,
}: {
  ingredient: RecipeIngredient;
  servings: number;
}) {
  const scaledAmount = ingredient.amount
    ? scaleIngredientAmount(ingredient.amount, servings)
    : null;

  return (
    <span
      role="tooltip"
      className="absolute left-1/2 bottom-[calc(100%+6px)] z-30 -translate-x-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 shadow-lg pointer-events-none"
    >
      <span className="flex items-center gap-2 whitespace-nowrap">
        <IngredientThumbnail name={ingredient.name} size="tooltip" />
        <span>
          {scaledAmount ? (
            <>
              <span className="text-gray-900">{scaledAmount}</span>
              <span className="text-gray-400 font-semibold mx-1">·</span>
            </>
          ) : null}
          <span>{ingredient.name}</span>
        </span>
      </span>
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
    </span>
  );
}
