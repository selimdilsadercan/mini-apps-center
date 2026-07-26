"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coffee, Heart, CheckCircle, Tag, WifiHigh, Car, Plug, SpeakerLow, Pencil, Trash } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { workplaces } from "@/lib/client";

export function PlaceCard({
  place,
  onToggleFavorite,
  onToggleVisited,
  isAdmin = false,
  isPending = false,
  onApprove,
  onDelete,
  onEdit,
}: {
  place: workplaces.Place;
  onToggleFavorite: (placeId: string) => void;
  onToggleVisited: (placeId: string) => void;
  isAdmin?: boolean;
  isPending?: boolean;
  onApprove?: (placeId: string) => void;
  onDelete?: (placeId: string) => void;
  onEdit?: (place: workplaces.Place) => void;
}) {
  const t = useTranslations("workplaces");

  return (
    <Link
      href={isPending ? "#" : `/apps/workplaces/place?placeId=${encodeURIComponent(place.id)}`}
      onClick={(e) => {
        if (isPending) {
          e.preventDefault();
        }
      }}
      className="block h-full"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all group flex flex-col h-full"
      >
        {/* Image Header */}
        <div className="relative h-36 w-full bg-neutral-100 overflow-hidden">
          {(place.image_url || place.metadata?.photos?.[0]) ? (
            <img
              src={place.image_url || place.metadata?.photos?.[0]}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <Coffee size={36} weight="thin" />
            </div>
          )}
          {place.district && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-full">
              {place.district}
            </div>
          )}
          {place.rating && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white/90 backdrop-blur-sm text-neutral-900 text-[10px] font-bold rounded-lg flex items-center gap-0.5 shadow-sm">
              <span className="text-amber-500">★</span>
              {place.rating}
              <span className="text-neutral-400 font-normal">({place.user_ratings_total})</span>
            </div>
          )}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
            {!isPending && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(place.id);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition-colors cursor-pointer ${
                    place.is_favorite
                      ? "bg-rose-500 text-white"
                      : "bg-white/90 text-neutral-500 hover:text-rose-500"
                  }`}
                  aria-label={place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")}
                >
                  <Heart size={16} weight={place.is_favorite ? "fill" : "regular"} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisited(place.id);
                  }}
                  className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition-colors cursor-pointer ${
                    place.is_visited
                      ? "bg-emerald-600 text-white"
                      : "bg-white/90 text-neutral-500 hover:text-emerald-600"
                  }`}
                  aria-label={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
                >
                  <CheckCircle size={16} weight={place.is_visited ? "fill" : "regular"} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                {place.name}
              </h3>
              {place.address && (
                <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                  {place.address}
                </p>
              )}
            </div>
          </div>

          {place.note && (
            <p className="text-neutral-600 mt-2 text-xs line-clamp-2 leading-relaxed">
              {place.note}
            </p>
          )}

          {!isPending && (place.is_favorite || place.is_visited) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {place.is_favorite && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">
                  {t("wantToGo")}
                </span>
              )}
              {place.is_visited && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                  {t("visited")}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-3">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-medium rounded-md flex items-center gap-0.5"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 bg-neutral-50 border-t flex flex-col gap-2">
          {isPending ? (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onApprove?.(place.id);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Onayla
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete?.(place.id);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Reddet
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-start">
              <div className="flex gap-3">
                <StatusIcon active={place.wifi} icon={<WifiHigh size={18} />} amenityKey="wifi" />
                <StatusIcon active={place.parking} icon={<Car size={18} />} amenityKey="parking" />
                <StatusIcon active={place.power_outlets} icon={<Plug size={18} />} amenityKey="power" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function StatusIcon({
  active,
  icon,
  amenityKey,
}: {
  active: boolean;
  icon: React.ReactNode;
  amenityKey: "wifi" | "parking" | "power";
}) {
  const t = useTranslations("workplaces");
  const amenity = t(`amenity.${amenityKey}`);
  const status = active ? t("amenity.yes") : t("amenity.no");

  return (
    <div
      className={`p-2 rounded-lg transition-colors relative group/tooltip ${
        active ? "text-amber-700 bg-amber-100" : "text-neutral-300 bg-neutral-100"
      }`}
    >
      {icon}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {t("amenity.status", { amenity, status })}
      </div>
    </div>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
        checked
          ? "bg-amber-50 border-amber-500 text-amber-700"
          : "bg-neutral-50 border-transparent text-neutral-400 hover:bg-neutral-100"
      }`}
    >
      {React.isValidElement(icon) &&
        React.cloneElement(icon as React.ReactElement<any>, {
          size: 24,
          weight: checked ? "fill" : "regular",
        })}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
