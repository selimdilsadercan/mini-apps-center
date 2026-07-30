"use client";

import { MagnifyingGlass, FunnelSimple, X } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { VENUE_TYPE_FILTERS } from "../lib/venue-types";

interface WorkplacesFiltersBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  filterDistrict: string;
  onFilterDistrictChange: (value: string) => void;
  districts: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  variant?: "default" | "overlay";
}

export default function WorkplacesFiltersBar({
  searchQuery,
  onSearchQueryChange,
  filterCategory,
  onFilterCategoryChange,
  filterDistrict,
  onFilterDistrictChange,
  districts,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters,
  variant = "default",
}: WorkplacesFiltersBarProps) {
  const t = useTranslations("workplaces");
  const isOverlay = variant === "overlay";

  return (
    <div className={`space-y-3 ${isOverlay ? "drop-shadow-lg" : ""}`}>
      <div className="flex gap-2 min-w-0">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={14} />
          <input
            type="text"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className={`w-full pl-9 pr-9 py-2 text-xs border rounded-xl focus:outline-none focus:border-amber-500/50 transition-colors text-app-text ${
              isOverlay
                ? "bg-neutral-900/92 dark:bg-neutral-900/92 backdrop-blur-md border-neutral-600/70 shadow-md"
                : "bg-app-surface border-app-border"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted cursor-pointer"
              type="button"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`relative shrink-0 flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
            showFilters || hasActiveFilters
              ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              : isOverlay
                ? "border-neutral-600/70 bg-neutral-900/92 backdrop-blur-md text-app-muted hover:text-app-text shadow-md"
                : "border-app-border bg-app-surface text-app-muted hover:text-app-text"
          }`}
          aria-label={t("filterPanel.toggle")}
          aria-expanded={showFilters}
        >
          <FunnelSimple size={16} weight={showFilters || hasActiveFilters ? "fill" : "bold"} />
          {hasActiveFilters && !showFilters && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </button>
      </div>

      {showFilters && (
        <div
          className={`space-y-2 rounded-xl border p-2.5 ${
            isOverlay
              ? "bg-neutral-900/92 backdrop-blur-md border-neutral-600/70 shadow-md"
              : "border-app-border bg-app-surface"
          }`}
        >
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => onFilterCategoryChange("")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                !filterCategory
                  ? "bg-[#D97706] text-white"
                  : "bg-app-bg border border-app-border text-app-muted"
              }`}
            >
              Tümü
            </button>
            {VENUE_TYPE_FILTERS.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => onFilterCategoryChange(type.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  filterCategory === type.id
                    ? "bg-[#D97706] text-white"
                    : "bg-app-bg border border-app-border text-app-muted"
                }`}
              >
                {t(`venueTypes.${type.id}`)}
              </button>
            ))}
          </div>

          {districts.length > 0 && (
            <select
              value={filterDistrict}
              onChange={(e) => onFilterDistrictChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-[10px] font-semibold border border-app-border bg-app-bg text-app-text cursor-pointer outline-none"
            >
              <option value="">{t("district.all")}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[10px] font-bold text-app-muted hover:text-app-text cursor-pointer"
            >
              {t("filterPanel.clear")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
