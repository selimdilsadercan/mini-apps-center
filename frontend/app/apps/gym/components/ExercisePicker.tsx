"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, Plus, Barbell, Person, Timer, Check } from "@phosphor-icons/react";
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
  const [activeTab, setActiveTab] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customTrackingType, setCustomTrackingType] = useState<ExerciseTrackingType>("weighted");

  const trimmedQuery = query.trim();

  const results = useMemo(
    () => searchExercises(catalog, query, query.trim() ? 80 : 40),
    [catalog, query]
  );

  const handleTabChange = (tab: "search" | "custom") => {
    setActiveTab(tab);
    if (tab === "custom" && !customName && trimmedQuery) {
      setCustomName(trimmedQuery);
    }
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    if (!name) return;
    onSelect({
      slug: createCustomExerciseSlug(name),
      name: name,
      trackingType: customTrackingType,
    });
    setCustomName("");
    setQuery("");
  };

  return (
    <div className="space-y-3.5">
      {allowCustom && (
        <div className="inline-flex w-full p-1 rounded-2xl bg-app-tab-track border border-app-border">
          <button
            type="button"
            onClick={() => handleTabChange("search")}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "search"
                ? "bg-app-tab-active text-app-text shadow-sm"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Egzersiz Ara
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("custom")}
            className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "custom"
                ? "bg-app-tab-active text-app-text shadow-sm"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            <Plus size={14} weight="bold" />
            Özel Egzersiz
          </button>
        </div>
      )}

      {activeTab === "search" ? (
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Egzersiz ara..."
              className="w-full bg-app-surface border border-app-border rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 text-app-text transition-colors"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-app-muted uppercase tracking-wider">
            <span>{trimmedQuery ? `${results.length} sonuç` : "Popüler / A–Z"}</span>
            {allowCustom && trimmedQuery && (
              <button
                type="button"
                onClick={() => handleTabChange("custom")}
                className="text-app-text underline hover:opacity-80 transition-opacity"
              >
                Bulamadın mı? Özel Ekle
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[48vh] overflow-y-auto pr-0.5">
            {results.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-app-surface rounded-2xl border border-app-border p-5">
                <p className="text-xs font-bold text-app-muted">Aramanızla eşleşen egzersiz bulunamadı.</p>
                {allowCustom && (
                  <button
                    type="button"
                    onClick={() => handleTabChange("custom")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-black uppercase text-app-text hover:bg-app-surface-muted transition-all active:scale-95"
                  >
                    <Plus size={14} weight="bold" />
                    &quot;{trimmedQuery || "Özel"}&quot; Egzersiz Ekle
                  </button>
                )}
              </div>
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
                        ? "bg-app-surface-muted border-gray-300 dark:border-zinc-700 opacity-60"
                        : "bg-app-surface border-app-border hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <ExerciseThumbnail exercise={ex} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-app-text truncate">{ex.name}</p>
                      <p className="text-[10px] font-medium text-app-muted truncate mt-0.5">
                        {ex.muscleGroup}
                        {ex.equipment[0] ? ` · ${ex.equipment[0]}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} weight="bold" className="text-app-text shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-app-muted">
              Egzersiz Adı
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Örn: Cable Face Pull, Z-Bar Curl..."
              className="w-full bg-app-surface border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-app-text focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-app-muted">
              Takip Tipi Seç
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCustomTrackingType("weighted")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  customTrackingType === "weighted"
                    ? "bg-app-surface border-gray-900 dark:border-white text-app-text font-bold shadow-sm"
                    : "bg-app-surface border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                }`}
              >
                <Barbell size={20} weight={customTrackingType === "weighted" ? "fill" : "bold"} />
                <span className="text-xs font-bold">{getTrackingTypeLabel("weighted")}</span>
                <span className="text-[9px] text-app-muted leading-none">Ağırlık + Rep</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomTrackingType("bodyweight")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  customTrackingType === "bodyweight"
                    ? "bg-app-surface border-gray-900 dark:border-white text-app-text font-bold shadow-sm"
                    : "bg-app-surface border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                }`}
              >
                <Person size={20} weight={customTrackingType === "bodyweight" ? "fill" : "bold"} />
                <span className="text-xs font-bold">{getTrackingTypeLabel("bodyweight")}</span>
                <span className="text-[9px] text-app-muted leading-none">Sadece Rep</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomTrackingType("duration")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                  customTrackingType === "duration"
                    ? "bg-app-surface border-gray-900 dark:border-white text-app-text font-bold shadow-sm"
                    : "bg-app-surface border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                }`}
              >
                <Timer size={20} weight={customTrackingType === "duration" ? "fill" : "bold"} />
                <span className="text-xs font-bold">{getTrackingTypeLabel("duration")}</span>
                <span className="text-[9px] text-app-muted leading-none">Süre (sn/dk)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customName.trim()}
            className="w-full mt-2 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-black uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Egzersiz Oluştur & Ekle
          </button>
        </div>
      )}
    </div>
  );
}

