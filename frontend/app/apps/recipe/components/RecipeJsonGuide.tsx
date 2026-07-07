"use client";

import { useState } from "react";
import { CaretDown, CaretUp, Copy, Check } from "@phosphor-icons/react";
import { RECIPE_JSON_AI_INSTRUCTION } from "../recipe-json-format";

export default function RecipeJsonGuide() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(RECIPE_JSON_AI_INSTRUCTION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text manually not needed for modern browsers
    }
  }

  return (
    <div className="mb-3 rounded-xl border border-orange-200/60 bg-orange-50/80 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <span className="text-xs font-bold text-orange-900">JSON format rehberi (AI prompt)</span>
          {open ? (
            <CaretUp size={16} className="text-orange-700 shrink-0" />
          ) : (
            <CaretDown size={16} className="text-orange-700 shrink-0" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-orange-200 text-[10px] font-bold text-orange-700 hover:bg-orange-100 transition-colors active:scale-95"
        >
          {copied ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 border-t border-orange-200/60">
          <pre className="mt-2 max-h-64 overflow-y-auto text-[10px] leading-relaxed text-orange-950 whitespace-pre-wrap font-mono">
            {RECIPE_JSON_AI_INSTRUCTION}
          </pre>
        </div>
      )}
    </div>
  );
}
