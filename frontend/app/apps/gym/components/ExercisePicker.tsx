"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus, Barbell, Person, Timer } from "@phosphor-icons/react";
import {
  createCustomExerciseSlug,
  getTrackingTypeLabel,
  searchExercises,
  type ExerciseCatalogItem,
} from "../exercises";
import type { ExerciseTrackingType } from "../types";
import ExerciseThumbnail from "./ExerciseThumbnail";

export interface SelectedExercise {
  slug: string;
  name: string;
  trackingType?: ExerciseTrackingType;
}

export default function ExercisePicker({
  catalog,
  onSelect,
  selectedSlugs,
  multiSelect = false,
  allowCustom = true,
}: {
  catalog: ExerciseCatalogItem[];
  onSelect: (exercise: SelectedExercise) => void;
  selectedSlugs?: Set<string>;
  multiSelect?: boolean;
  allowCustom?: boolean;
}) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const results = useMemo(
    () => searchExercises(catalog, query, query.trim() ? 80 : 40),
    [catalog, query]
  );

  const handleSelectCustom = (trackingType: ExerciseTrackingType) => {
    if (!trimmedQuery) return;
    onSelect({
      slug: createCustomExerciseSlug(trimmedQuery),
      name: trimmedQuery,
      trackingType,
    });
    setQuery("");
  };

  const customTypeClass = (type: ExerciseTrackingType) =>
    `flex-1 min-w-0 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] ${
      type === "weighted"
        ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
        : type === "bodyweight"
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    }`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Egzersiz ara..."
          className="w-full bg-white dark:bg-app-surface border border-gray-200/60 dark:border-app-border rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 text-app-text"
        />
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {trimmedQuery ? `${results.length} sonuç` : "Popüler / A–Z"}
      </p>

      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {allowCustom && trimmedQuery && (
          <div className="rounded-xl border border-dashed border-violet-300 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 p-3 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-800 flex items-center justify-center shrink-0">
                <Plus size={18} weight="bold" className="text-violet-600 dark:text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-700 dark:text-violet-300">Özel egzersiz ekle</p>
                <p className="text-[10px] text-violet-500 dark:text-violet-400 truncate">&quot;{trimmedQuery}&quot;</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
              Takip tipi seç
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectCustom("weighted")}
                className={customTypeClass("weighted")}
              >
                <Barbell size={16} weight="bold" />
                {getTrackingTypeLabel("weighted")}
              </button>
              <button
                type="button"
                onClick={() => handleSelectCustom("bodyweight")}
                className={customTypeClass("bodyweight")}
              >
                <Person size={16} weight="bold" />
                {getTrackingTypeLabel("bodyweight")}
              </button>
              <button
                type="button"
                onClick={() => handleSelectCustom("duration")}
                className={customTypeClass("duration")}
              >
                <Timer size={16} weight="bold" />
                {getTrackingTypeLabel("duration")}
              </button>
            </div>
          </div>
        )}

        {results.length === 0 ? (
          trimmedQuery ? (
            allowCustom ? null : (
              <p className="text-center py-8 text-xs font-bold text-gray-400">Sonuç bulunamadı</p>
            )
          ) : (
            <p className="text-center py-8 text-xs font-bold text-gray-400">Sonuç bulunamadı</p>
          )
        ) : (
          results.map((ex) => {
            const isSelected = selectedSlugs?.has(ex.slug);
            return (
              <button
                key={ex.slug}
                type="button"
                onClick={() => onSelect({ slug: ex.slug, name: ex.name })}
                disabled={multiSelect && isSelected}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? "bg-violet-50 border-violet-300 opacity-60"
                    : "bg-white dark:bg-app-surface border-gray-200/60 dark:border-app-border hover:border-violet-300"
                }`}
              >
                <ExerciseThumbnail exercise={ex} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-app-text truncate">{ex.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-app-muted truncate">
                    {ex.muscleGroup}
                    {ex.equipment[0] ? ` · ${ex.equipment[0]}` : ""}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
