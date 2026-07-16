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
      <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-2">
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
                  ? "bg-gray-900 dark:bg-app-tab-active text-white dark:text-app-text border-gray-900 dark:border-app-border"
                  : "bg-app-surface text-app-muted border-app-border hover:border-app-muted"
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${
                  isOn ? "border-white/40 bg-white/20 dark:border-app-border dark:bg-app-surface-muted" : "border-app-border"
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
