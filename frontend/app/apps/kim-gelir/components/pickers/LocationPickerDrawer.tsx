"use client";

import { useState } from "react";
import { CaretLeft, MapPin, X } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import dynamic from "next/dynamic";
import { GAMES_DATA } from "../../../iskambil/games-registry";
import type { useMarasSources } from "../../hooks/useMarasSources";
import {
  DEFAULT_LOCATION_ACTIVITY,
  getLocationPickerCopy,
  isFoodActivity,
  isStudyActivity,
} from "../../lib/location-picker-config";
import { matchesQuery } from "../../lib/maras-sources";
import {
  drawerHandleClass,
  fieldClass,
  iconBtnClass,
  NE_YAPSAK_ACCENT,
  pickerBadgeClass,
  pickerRowClass,
  primaryBtnClass,
  sectionLabelClass,
} from "../../lib/theme";
import type { ActivityPreset } from "./ActivityPickerDrawer";

const StudyPlacesMap = dynamic(() => import("@/components/maps/StudyPlacesMap"), {
  ssr: false,
});

type MarasSources = ReturnType<typeof useMarasSources>;

export interface LocationPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maras: MarasSources;
  activity?: ActivityPreset;
  onConfirm: (value: string) => void;
}

export function LocationPickerDrawer({
  open,
  onOpenChange,
  maras,
  activity = DEFAULT_LOCATION_ACTIVITY,
  onConfirm,
}: LocationPickerDrawerProps) {
  const [query, setQuery] = useState("");
  const actId = activity.id || "general";
  const copy = getLocationPickerCopy(actId);

  const filteredCinemas =
    actId === "movie"
      ? maras.cinemas.filter((c) => matchesQuery(`${c.name} ${c.district}`, query))
      : [];

  const filteredTheaters = actId === "theater" ? maras.theaterVenues(query) : [];
  const filteredCafePlaces = actId === "coffee" || actId === "tea" ? maras.cafePlaces(query) : [];
  const filteredFoodPlaces = isFoodActivity(actId) ? maras.foodPlaces(query) : [];
  const filteredEvents =
    actId === "concert" || actId === "festival" || actId === "standup"
      ? maras.filterEvents(query).filter((e) => {
          if (actId === "concert") return e.kind === "concert";
          if (actId === "standup") return e.kind === "standup";
          return e.kind === "campus" || e.kind === "concert";
        })
      : [];
  const filteredGames =
    actId === "card_game"
      ? (GAMES_DATA as { id: string; name_tr: string; name_en: string; minPlayers: number; maxPlayers: number }[]).filter(
          (g) => !query.trim() || matchesQuery(`${g.name_tr} ${g.name_en}`, query)
        )
      : [];
  const filteredWorkplaces = isStudyActivity(actId) ? maras.studyPlaces(query) : [];

  const handleConfirm = () => {
    if (!query.trim()) return;
    onConfirm(query.trim());
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
        <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-xl mx-auto border-t border-app-border shadow-2xl flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto flex flex-col">
            <div className={drawerHandleClass} />
            <header className="flex justify-between items-center mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onOpenChange(false)} className={iconBtnClass}>
                  <CaretLeft size={20} weight="bold" />
                </button>
                <Drawer.Title className="font-black text-base text-app-text">Yer Seç</Drawer.Title>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} className={iconBtnClass}>
                <X size={18} weight="bold" />
              </button>
            </header>

            <div className={`flex items-center gap-3 p-3.5 rounded-xl border mb-5 shrink-0 ${fieldClass}`}>
              <span className="text-xl">{activity.icon}</span>
              <div className="min-w-0">
                <span className={sectionLabelClass}>Bağlam</span>
                <span className="text-sm font-bold text-app-text block truncate">{activity.label}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4 flex flex-col min-h-0">
              <label className={sectionLabelClass}>{copy.label}</label>
              <div className="relative shrink-0">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.placeholder}
                  className={`${fieldClass} pl-10 pr-10`}
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-app-muted"
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>

              {actId === "movie" && (
                <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1">
                  {maras.loading && (
                    <p className="text-[10px] text-app-muted font-bold px-1">Sinema seansları yükleniyor…</p>
                  )}
                  {filteredCinemas.map((cinema) => {
                    const value = `${cinema.name} (${cinema.district})`;
                    const isSelected = query === value;
                    const topMovie = cinema.moviesToday[0];
                    return (
                      <button
                        key={cinema.slug}
                        type="button"
                        onClick={() => setQuery(value)}
                        className={`${pickerRowClass(isSelected)} flex flex-col gap-1 p-3 w-full`}
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="text-sm shrink-0">🎬</span>
                            <span className="truncate">{cinema.name}</span>
                          </div>
                          <span className={pickerBadgeClass(isSelected)}>{cinema.district}</span>
                        </div>
                        {topMovie && (
                          <p className="text-[10px] font-semibold text-app-muted pl-6 truncate">
                            Bugün: {topMovie.title}
                            {topMovie.times[0] ? ` · ${topMovie.times.slice(0, 3).join(", ")}` : ""}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {actId === "theater" &&
                filteredTheaters.map((theater) => {
                  const value = `${theater.name} (${theater.district || "Kahramanmaraş"})`;
                  return (
                    <button
                      key={theater.id}
                      type="button"
                      onClick={() => setQuery(value)}
                      className={`${pickerRowClass(query === value)} flex items-center justify-between p-3 w-full`}
                    >
                      <span className="truncate">🎭 {theater.name}</span>
                      <span className={pickerBadgeClass(query === value)}>{theater.district || "Maraş"}</span>
                    </button>
                  );
                })}

              {(actId === "concert" || actId === "festival" || actId === "standup") &&
                filteredEvents.map((event) => {
                  const value = `${event.title} · ${event.location}`;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setQuery(value)}
                      className={`${pickerRowClass(query === value || query === event.location)} flex items-center justify-between p-3 w-full`}
                    >
                      <div className="min-w-0 truncate">
                        <span className="block truncate">{event.title}</span>
                        <span className="text-[10px] text-app-muted">{event.location}</span>
                      </div>
                      <span className="text-[10px] text-app-muted shrink-0 ml-2">{event.dateLabel}</span>
                    </button>
                  );
                })}

              {(actId === "coffee" || actId === "tea") &&
                filteredCafePlaces.map((place) => {
                  const value = `${place.name} (${place.district || "Kahramanmaraş"})`;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setQuery(value)}
                      className={`${pickerRowClass(query === value)} flex justify-between p-3 w-full`}
                    >
                      <span className="truncate">☕ {place.name}</span>
                      <span className="text-[10px] text-app-muted">{place.district}</span>
                    </button>
                  );
                })}

              {isFoodActivity(actId) &&
                filteredFoodPlaces.map((place) => {
                  const value = `${place.name} (${place.district || "Kahramanmaraş"})`;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setQuery(value)}
                      className={`${pickerRowClass(query === value)} flex justify-between p-3 w-full`}
                    >
                      <span className="truncate">🍽️ {place.name}</span>
                      <span className="text-[10px] text-app-muted">{place.district}</span>
                    </button>
                  );
                })}

              {actId === "card_game" &&
                filteredGames.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => setQuery(game.name_tr)}
                    className={`${pickerRowClass(query === game.name_tr)} flex justify-between p-3 w-full`}
                  >
                    <span>🃏 {game.name_tr}</span>
                    <span className={pickerBadgeClass(query === game.name_tr)}>
                      {game.minPlayers}-{game.maxPlayers}
                    </span>
                  </button>
                ))}

              {isStudyActivity(actId) && (
                <div className="flex flex-col gap-2 min-h-0">
                  {filteredWorkplaces.some((w) => w.latitude && w.longitude) && (
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-app-border">
                      <StudyPlacesMap
                        places={filteredWorkplaces}
                        onSelectPlace={(place) =>
                          setQuery(`${place.name} (${place.district || "Kahramanmaraş"})`)
                        }
                        selectedPlaceId={
                          maras.places.find(
                            (w) => `${w.name} (${w.district || "Kahramanmaraş"})` === query
                          )?.id
                        }
                      />
                    </div>
                  )}
                  {filteredWorkplaces.map((place) => {
                    const value = `${place.name} (${place.district || "Kahramanmaraş"})`;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => setQuery(value)}
                        className={`${pickerRowClass(query === value)} flex justify-between p-3 w-full`}
                      >
                        <span className="truncate">🏫 {place.name}</span>
                        <span className={pickerBadgeClass(query === value)}>
                          {place.district || "Çalışma Alanı"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={!query.trim()}
              className={primaryBtnClass}
              style={{ backgroundColor: NE_YAPSAK_ACCENT }}
            >
              Öneriyi Ekle
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
