"use client";

import type { OptionalToggle } from "../recipe-variant";

export default function OptionalIngredientToggles({
  toggles,
  selectedKeys,
  onToggle,
}: {
  toggles: OptionalToggle[];
  selectedKeys: Set<string>;
  onToggle: (key: string, on: boolean) => void;
}) {
  if (toggles.length === 0) return null;

  return (
    <div className="mb-3 px-1">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
        Varyasyonlar
      </span>
      <div className="flex flex-wrap gap-1.5">
        {toggles.map((toggle) => {
          const isOn = selectedKeys.has(toggle.key);
          return (
            <button
              key={toggle.key}
              type="button"
              onClick={() => onToggle(toggle.key, !isOn)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 border ${
                isOn
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                  isOn ? "border-white/40 bg-white/20" : "border-gray-300"
                }`}
              >
                {isOn ? "✓" : ""}
              </span>
              {toggle.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
