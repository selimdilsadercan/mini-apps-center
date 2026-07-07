"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RecipeIngredient } from "../recipe-variant";
import { segmentInstructionText } from "../match-ingredients-in-text";
import IngredientTooltip from "./IngredientTooltip";

export default function InstructionText({
  text,
  ingredients,
  servings,
}: {
  text: string;
  ingredients: RecipeIngredient[];
  servings: number;
}) {
  const segments = useMemo(
    () => segmentInstructionText(text, ingredients),
    [text, ingredients]
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [canHover, setCanHover] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setActiveIndex(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [activeIndex]);

  return (
    <span ref={containerRef} className="relative inline">
      {segments.map((segment, idx) => {
        if (segment.type === "text") {
          return <span key={idx}>{segment.value}</span>;
        }

        const ingredient = ingredients[segment.ingredientIndex];
        const isOpen =
          hoverIndex === idx || (!canHover && activeIndex === idx) || activeIndex === idx;

        return (
          <span
            key={idx}
            className="relative inline"
            onMouseEnter={() => canHover && setHoverIndex(idx)}
            onMouseLeave={() => canHover && setHoverIndex(null)}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(isOpen && !canHover ? null : idx)}
              className={`font-bold underline decoration-gray-400 underline-offset-2 transition-colors ${
                isOpen ? "text-black" : "text-gray-900 hover:text-black"
              }`}
            >
              {segment.value}
            </button>

            {isOpen && <IngredientTooltip ingredient={ingredient} servings={servings} />}
          </span>
        );
      })}
    </span>
  );
}
