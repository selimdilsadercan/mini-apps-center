"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { searchExercises, type ExerciseCatalogItem } from "../exercises";
import ExerciseThumbnail from "./ExerciseThumbnail";

export default function ExercisePicker({
  catalog,
  onSelect,
  selectedSlugs,
  multiSelect = false,
}: {
  catalog: ExerciseCatalogItem[];
  onSelect: (exercise: ExerciseCatalogItem) => void;
  selectedSlugs?: Set<string>;
  multiSelect?: boolean;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchExercises(catalog, query, query.trim() ? 80 : 40),
    [catalog, query]
  );

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
          className="w-full bg-white border border-gray-200/60 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
        />
      </div>

      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {query.trim() ? `${results.length} sonuç` : "Popüler / A–Z"}
      </p>

      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-center py-8 text-xs font-bold text-gray-400">Sonuç bulunamadı</p>
        ) : (
          results.map((ex) => {
            const isSelected = selectedSlugs?.has(ex.slug);
            return (
              <button
                key={ex.slug}
                type="button"
                onClick={() => onSelect(ex)}
                disabled={multiSelect && isSelected}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? "bg-violet-50 border-violet-300 opacity-60"
                    : "bg-white border-gray-200/60 hover:border-violet-300"
                }`}
              >
                <ExerciseThumbnail exercise={ex} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{ex.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">
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
