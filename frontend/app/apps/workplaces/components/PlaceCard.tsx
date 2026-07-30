"use client";

import React from "react";
import Link from "next/link";
import {
  Coffee,
  Heart,
  CheckCircle,
  WifiHigh,
  Car,
  Plug,
} from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { workplaces } from "@/lib/client";
import { resolvePlaceImageSrc } from "../lib/place-image";

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#B58463", // Muted Amber
  restaurant: "#B56363", // Muted Red
  dessert: "#B56395", // Muted Pink
  library: "#637DB5", // Muted Blue
  study_spot: "#7B63B5", // Muted Indigo
  park: "#63B58E", // Muted Emerald
  activity: "#B563B5", // Muted Purple
  natural_beauty: "#63B5B5", // Muted Teal
  historical: "#B59A63", // Muted Gold/Brown
  bar: "#9063B5", // Muted Violet
  mall: "#4B6584", // Muted Blue Gray
  museum: "#8E735C", // Muted Teracotta/Clay
  complex: "#576574", // Muted Slate/Steel
};

function venueTypeLabel(
  type: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!type) return t("venueTypes.fallback");
  const key = `venueTypes.${type}`;
  const label = t(key);
  return label === `workplaces.${key}` ? t("venueTypes.fallback") : label;
}

export function PlaceCard({
  place,
  onToggleFavorite,
  onToggleVisited,
}: {
  place: workplaces.Place;
  onToggleFavorite: (placeId: string) => void;
  onToggleVisited: (placeId: string) => void;
}) {
  const t = useTranslations("workplaces");

  const imageSrc = resolvePlaceImageSrc(place.image_url);
  
  const displayRating = place.internal_rating;
  const displayReviewCount = place.internal_review_count || 0;

  const locationLine = [
    place.district?.trim(),
    displayRating != null ? `★ ${displayRating.toFixed(1)}` : null,
    displayReviewCount > 0 ? `(${displayReviewCount})` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/apps/workplaces/place?placeId=${encodeURIComponent(place.id)}`}
      className="block bg-app-surface rounded-2xl border border-app-border overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="flex items-stretch gap-3 p-3">
        <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          {imageSrc ? (
            <img src={imageSrc} alt={place.name} className="w-full h-full object-cover" />
          ) : (
            <Coffee size={24} className="text-gray-300 dark:text-zinc-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-0.5">
            {place.types?.length > 0 && (
              <span className="inline-flex gap-0.5 mr-1 ml-0.5 mb-[1px]">
                {place.types.map((type) => (
                  <span
                    key={type}
                    className="inline-block w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.05)]"
                    style={{ backgroundColor: CATEGORY_COLORS[type] || CATEGORY_COLORS.cafe }}
                    title={venueTypeLabel(type, t)}
                  />
                ))}
              </span>
            )}
            {place.name}
          </p>

          {locationLine && (
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1">
              {locationLine}
            </p>
          )}

          <div className="hidden sm:flex items-center gap-2 mt-1.5">
            {place.wifi && <WifiHigh size={12} className="text-gray-400" />}
            {place.parking && <Car size={12} className="text-gray-400" />}
            {place.power_outlets && <Plug size={12} className="text-gray-400" />}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-1.5 shrink-0 self-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(place.id);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              place.is_favorite
                ? "bg-rose-500/15 text-rose-500"
                : "bg-neutral-50 dark:bg-zinc-800 text-gray-400"
            }`}
            aria-label={place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")}
          >
            <Heart size={18} weight={place.is_favorite ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleVisited(place.id);
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              place.is_visited
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-neutral-50 dark:bg-zinc-800 text-gray-400"
            }`}
            aria-label={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
          >
            <CheckCircle size={18} weight={place.is_visited ? "fill" : "regular"} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-xs text-app-text">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-app-border"
      />
      {label}
    </label>
  );
}
