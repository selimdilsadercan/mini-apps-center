"use client";

import { useState } from "react";
import { Check, Funnel, MagnifyingGlass } from "@phosphor-icons/react";
import type { gaming_hub } from "@/lib/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DISCOVER_CATEGORIES, DISCOVER_CATEGORY_LABELS } from "../lib/discover";

export default function DiscoverAllToolbar({
  category,
  query,
  onQueryChange,
  onCategoryChange,
}: {
  category: gaming_hub.DiscoverCategory;
  query: string;
  onQueryChange: (value: string) => void;
  onCategoryChange: (category: gaming_hub.DiscoverCategory) => void;
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="flex gap-2 mb-4">
      <div className="relative flex-1 min-w-0">
        <MagnifyingGlass
          size={15}
          weight="bold"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Oyun ara..."
          className="w-full bg-app-surface border border-app-border rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-colors placeholder:text-app-muted text-app-text focus:border-app-muted"
        />
      </div>

      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Kategori filtresi"
            className="shrink-0 flex items-center gap-1.5 h-[38px] px-3 bg-app-surface border border-app-border rounded-xl text-app-muted hover:text-app-text hover:border-app-muted transition-colors active:scale-[0.98]"
          >
            <Funnel size={15} weight="bold" />
            <span className="text-xs font-semibold max-w-[5.5rem] truncate">
              {DISCOVER_CATEGORY_LABELS[category]}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1.5 rounded-xl border-app-border">
          <p className="px-2 py-1 text-[10px] font-bold text-app-muted uppercase tracking-wider">
            Kategori
          </p>
          {DISCOVER_CATEGORIES.map((option) => {
            const selected = option === category;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onCategoryChange(option);
                  setFilterOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-left text-sm transition-colors ${
                  selected
                    ? "bg-app-tab-track text-app-text font-semibold"
                    : "text-app-muted hover:bg-app-surface-muted"
                }`}
              >
                <span>{DISCOVER_CATEGORY_LABELS[option]}</span>
                {selected && <Check size={14} weight="bold" className="text-violet-600 shrink-0" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}
