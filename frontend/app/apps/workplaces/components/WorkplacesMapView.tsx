"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Coffee,
  WifiHigh,
  Car,
  Plug,
  X,
  Coins,
  Eye,
  SpeakerLow,
  Phone,
  Globe,
  Clock,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { workplaces } from "@/lib/client";
import { useTranslations } from "@/contexts/LanguageContext";
import { matchesVenueTypeFilter } from "../lib/venue-types";
import { resolveMapsHref } from "../lib/maps-link";
import { resolvePlaceImageSrc } from "../lib/place-image";
import {
  formatTo24Hour,
  outletsLabels,
  parkingLabels,
  priceLabels,
  viewLabels,
  wifiLabels,
} from "../lib/place-amenity-labels";
import WorkplacesFiltersBar from "./WorkplacesFiltersBar";

const StudyPlacesMap = dynamic(() => import("@/components/maps/StudyPlacesMap"), {
  ssr: false,
});

interface WorkplacesMapViewProps {
  places: workplaces.Place[];
  loading: boolean;
}

export default function WorkplacesMapView({ places, loading }: WorkplacesMapViewProps) {
  const t = useTranslations("workplaces");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<workplaces.Place | null>(null);

  const districts = useMemo(() => {
    const names = new Set<string>();
    for (const place of places) {
      const d = place.district?.trim();
      if (d) names.add(d);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "tr"));
  }, [places]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDistrict = !filterDistrict || place.district?.trim() === filterDistrict;
      const matchesType = matchesVenueTypeFilter(place.types, filterCategory);

      return matchesSearch && matchesDistrict && matchesType;
    });
  }, [places, searchQuery, filterDistrict, filterCategory]);

  const hasActiveFilters = !!filterCategory || !!filterDistrict;

  return (
    <div className="relative w-full h-full min-h-0 workplaces-map">
      <div className="absolute inset-0">
        <StudyPlacesMap
          places={filteredPlaces}
          onSelectPlace={setSelectedPlace}
          selectedPlaceId={selectedPlace?.id}
          insetBottom
        />
      </div>

      {loading && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-4 bg-app-bg/70 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
          <p className="text-neutral-500 font-medium">{t("loading")}</p>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-[1000] p-3 pointer-events-none">
        <div className="pointer-events-auto max-w-5xl mx-auto">
          <WorkplacesFiltersBar
            variant="overlay"
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            filterDistrict={filterDistrict}
            onFilterDistrictChange={setFilterDistrict}
            districts={districts}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((open) => !open)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => {
              setFilterCategory("");
              setFilterDistrict("");
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="absolute left-3 right-3 sm:right-auto top-[5.5rem] bottom-20 sm:bottom-4 sm:w-[340px] bg-app-surface rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden border border-app-border"
            >
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="absolute right-3 top-3 w-8 h-8 bg-app-surface/90 hover:bg-app-surface text-app-text rounded-full flex items-center justify-center shadow-md z-10 transition-all cursor-pointer border border-app-border"
                  >
                    <X size={14} weight="bold" />
                  </button>

                  <div className="w-full h-44 bg-neutral-150 relative shrink-0 overflow-hidden">
                    {resolvePlaceImageSrc(selectedPlace.image_url) ? (
                      <img
                        src={resolvePlaceImageSrc(selectedPlace.image_url)}
                        alt={selectedPlace.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-app-bg">
                        <Coffee size={28} className="text-app-muted" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto space-y-3.5 no-scrollbar">
                    <div>
                      {selectedPlace.district && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {selectedPlace.district}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-app-text mt-1 leading-snug">
                        {selectedPlace.name}
                      </h3>
                      {selectedPlace.rating && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs">
                          <span className="text-amber-500">★</span>
                          <span className="text-app-text font-bold">{selectedPlace.rating}</span>
                          {selectedPlace.user_ratings_total !== undefined && (
                            <span className="text-app-muted">({selectedPlace.user_ratings_total})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedPlace.address && (
                      <p className="text-xs text-app-muted leading-relaxed font-semibold">
                        {selectedPlace.address}
                      </p>
                    )}

                    <div className="space-y-2 pt-1 border-t border-app-border">
                      <p className="text-[9px] font-bold text-app-muted uppercase tracking-wider">İmkanlar</p>
                      <div className="grid grid-cols-2 gap-2">
                        <AmenityChip
                          icon={WifiHigh}
                          label="WiFi"
                          value={
                            selectedPlace.metadata?.wifi_status
                              ? wifiLabels[selectedPlace.metadata.wifi_status]
                              : selectedPlace.wifi
                                ? "Var"
                                : "Yok"
                          }
                        />
                        <AmenityChip
                          icon={Plug}
                          label="Priz"
                          value={
                            selectedPlace.metadata?.outlets_status
                              ? outletsLabels[selectedPlace.metadata.outlets_status]
                              : selectedPlace.power_outlets
                                ? "Var"
                                : "Yok"
                          }
                        />
                        <AmenityChip
                          icon={Car}
                          label="Otopark"
                          value={
                            Array.isArray(selectedPlace.metadata?.parking_status)
                              ? selectedPlace.metadata.parking_status
                                  .map((k: string) => parkingLabels[k] || k)
                                  .join(", ")
                              : parkingLabels[selectedPlace.metadata?.parking_status] ||
                                (selectedPlace.parking ? "Var" : "Yok")
                          }
                        />
                        <AmenityChip
                          icon={Coins}
                          label="Fiyat"
                          value={priceLabels[selectedPlace.metadata?.coffee_price] || "Orta / Normal"}
                        />
                        <AmenityChip
                          icon={SpeakerLow}
                          label="Sessizlik"
                          value={
                            selectedPlace.quiet_level
                              ? {
                                  1: "Çok Gürültülü",
                                  2: "Gürültülü",
                                  3: "Orta",
                                  4: "Sessiz",
                                  5: "Çok Sessiz",
                                }[selectedPlace.quiet_level] || "Orta"
                              : "Orta"
                          }
                        />
                        <AmenityChip
                          icon={Eye}
                          label="Manzara"
                          value={viewLabels[selectedPlace.metadata?.view_status] || "Yok"}
                        />
                      </div>
                    </div>

                    <div className="border-t border-app-border pt-3 space-y-2">
                      <p className="text-[9px] font-bold text-app-muted uppercase tracking-wider">
                        İletişim & Saatler
                      </p>
                      {selectedPlace.metadata?.phone && (
                        <div className="flex items-center gap-2 text-xs text-app-muted font-semibold">
                          <Phone size={14} className="text-amber-700 shrink-0" />
                          <a href={`tel:${selectedPlace.metadata.phone}`} className="hover:text-amber-800 transition-colors">
                            {selectedPlace.metadata.phone}
                          </a>
                        </div>
                      )}
                      {selectedPlace.metadata?.website && (
                        <div className="flex items-center gap-2 text-xs text-app-muted font-semibold">
                          <Globe size={14} className="text-amber-700 shrink-0" />
                          <a
                            href={selectedPlace.metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-800 transition-colors truncate"
                          >
                            Web Sitesi
                          </a>
                        </div>
                      )}
                      {selectedPlace.metadata?.opening_hours && (
                        <div className="flex items-center gap-2 text-xs text-app-muted font-semibold">
                          <Clock size={14} className="text-amber-700 shrink-0" />
                          {selectedPlace.metadata.opening_hours.open_now !== undefined && (
                            <span
                              className={
                                selectedPlace.metadata.opening_hours.open_now
                                  ? "text-emerald-700 font-bold"
                                  : "text-rose-700 font-bold"
                              }
                            >
                              {selectedPlace.metadata.opening_hours.open_now ? "Açık" : "Kapalı"}
                            </span>
                          )}
                          {(() => {
                            const weekdayText = selectedPlace.metadata?.opening_hours?.weekday_text;
                            if (!weekdayText) return null;
                            const todayDay = new Date().getDay();
                            const googleIndex = todayDay === 0 ? 6 : todayDay - 1;
                            const rawText = weekdayText[googleIndex] || null;
                            if (!rawText) return null;
                            const formatted = formatTo24Hour(rawText);
                            const firstColon = formatted.indexOf(":");
                            if (firstColon === -1) return formatted;
                            const timePart = formatted.substring(firstColon + 1).trim();
                            return (
                              <span className="text-[11px] text-app-muted">• {timePart}</span>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {selectedPlace.note && (
                      <div className="bg-app-bg p-3 rounded-xl border border-app-border text-[11px] text-app-muted leading-relaxed font-semibold italic">
                        &ldquo;{selectedPlace.note}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-app-border bg-app-bg shrink-0 flex flex-col gap-2">
                    {(() => {
                      const mapsHref = resolveMapsHref(selectedPlace);
                      if (!mapsHref) return null;
                      return (
                        <a
                          href={mapsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-app-surface hover:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded-xl text-xs font-bold transition-all no-underline"
                        >
                          <ArrowSquareOut size={14} weight="bold" />
                          {t("detail.openMaps")}
                        </a>
                      );
                    })()}
                    <a
                      href={`/apps/workplaces/place?placeId=${selectedPlace.id}`}
                      className="block text-center w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow no-underline"
                    >
                      Detayları Gör
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
    </div>
  );
}

function AmenityChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WifiHigh;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-app-bg px-2.5 py-1.5 rounded-xl border border-app-border flex items-center gap-2">
      <Icon size={16} className="text-amber-700 dark:text-amber-400 shrink-0" />
      <div className="min-w-0">
        <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">{label}</span>
        <span className="text-[11px] font-bold text-app-text truncate block">{value}</span>
      </div>
    </div>
  );
}
