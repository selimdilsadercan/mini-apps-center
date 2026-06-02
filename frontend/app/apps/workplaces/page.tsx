"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import {
  applyPlacePatches,
  setPlaceStatusPatch,
} from "@/lib/workplaces-place-sync";
import {
  ArrowLeft,
  Coffee,
  WifiHigh,
  Car,
  Plug,
  SpeakerLow,
  Plus,
  MagnifyingGlass,
  Tag,
  Heart,
  CheckCircle,
  MapPin,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";

export default function WorkplacesPage() {
  const t = useTranslations("workplaces");
  const router = useRouter();
  const client = useMemo(() => createBrowserClient(), []);
  const { user, isLoaded: isUserLoaded } = useUser();

  const suggesterLabel =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    undefined;
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterPower, setFilterPower] = useState(false);
  const [filterWantToGo, setFilterWantToGo] = useState(false);
  const [filterVisited, setFilterVisited] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const districts = useMemo(() => {
    const names = new Set<string>();
    for (const place of places) {
      const d = place.district?.trim();
      if (d) names.add(d);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "tr"));
  }, [places]);

  const [newPlace, setNewPlace] = useState({
    name: "",
    note: "",
    url: "",
    wifi: false,
    parking: false,
    power_outlets: false,
    quiet_level: 3,
    tags: "",
  });

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces({
        userId: user?.id,
      });
      setPlaces(applyPlacePatches(res.places ?? []));
    } catch (err) {
      console.error("Failed to fetch places:", err);
      toast.error(t("toast.loadFailed"));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
    // t is recreated each render; only refetch when user or client changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, client]);

  useEffect(() => {
    if (!isUserLoaded) return;
    fetchPlaces();
  }, [fetchPlaces, isUserLoaded]);

  const handleToggleFavorite = async (placeId: string) => {
    if (!isUserLoaded) return;
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    const actionKey = `fav:${placeId}`;
    if (pendingAction === actionKey) return;

    const previous = places.find((p) => p.id === placeId)?.is_favorite ?? false;
    setPendingAction(actionKey);
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === placeId ? { ...p, is_favorite: !previous } : p,
      ),
    );

    try {
      const res = await client.workplaces.toggleFavorite({
        placeId,
        userId: user.id,
      });
      const isFavorite = Boolean(res.isFavorite);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_favorite: isFavorite } : p,
        ),
      );
      setPlaceStatusPatch(placeId, { is_favorite: isFavorite });
    } catch (err) {
      console.error("toggleFavorite failed:", err);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_favorite: previous } : p,
        ),
      );
      toast.error(t("toast.updateFailed"));
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggleVisited = async (placeId: string) => {
    if (!isUserLoaded) return;
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    const actionKey = `vis:${placeId}`;
    if (pendingAction === actionKey) return;

    const previous = places.find((p) => p.id === placeId)?.is_visited ?? false;
    setPendingAction(actionKey);
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === placeId ? { ...p, is_visited: !previous } : p,
      ),
    );

    try {
      const res = await client.workplaces.toggleVisited({
        placeId,
        userId: user.id,
      });
      const isVisited = Boolean(res.isVisited);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_visited: isVisited } : p,
        ),
      );
      setPlaceStatusPatch(placeId, { is_visited: isVisited });
    } catch (err) {
      console.error("toggleVisited failed:", err);
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_visited: previous } : p,
        ),
      );
      toast.error(t("toast.updateFailed"));
    } finally {
      setPendingAction(null);
    }
  };

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDistrict =
        !filterDistrict || place.district?.trim() === filterDistrict;

      const matchesWifi = !filterWifi || place.wifi;
      const matchesParking = !filterParking || place.parking;
      const matchesPower = !filterPower || place.power_outlets;

      const matchesList =
        (!filterWantToGo && !filterVisited) ||
        (filterWantToGo && place.is_favorite) ||
        (filterVisited && place.is_visited);

      return (
        matchesSearch &&
        matchesDistrict &&
        matchesWifi &&
        matchesParking &&
        matchesPower &&
        matchesList
      );
    });
  }, [
    places,
    searchQuery,
    filterDistrict,
    filterWifi,
    filterParking,
    filterPower,
    filterWantToGo,
    filterVisited,
  ]);

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      await client.workplaces.addPlace({
        ...newPlace,
        tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
        suggested_by: suggesterLabel,
        suggested_by_clerk_id: user.id,
      });
      setShowAddModal(false);
      setNewPlace({
        name: "",
        note: "",
        url: "",
        wifi: false,
        parking: false,
        power_outlets: false,
        quiet_level: 3,
        tags: "",
      });
      fetchPlaces();
    } catch (err) {
      console.error("Failed to add place:", err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-[env(safe-area-inset-top,0px)]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm isolate">
        <div className="max-w-5xl mx-auto py-5 sm:py-6 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="p-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors shrink-0 touch-manipulation"
                aria-label={t("aria.back")}
              >
                <ArrowLeft size={22} weight="bold" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
                  <Coffee className="text-amber-700 shrink-0" weight="fill" />
                  <span className="truncate">{t("title")}</span>
                </h1>
                <p className="text-neutral-500 mt-1">{t("subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-800 transition-colors shadow-sm"
            >
              <Plus weight="bold" />
              {t("suggestPlace")}
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
              <FilterButton
                active={filterWifi}
                onClick={() => setFilterWifi(!filterWifi)}
                icon={<WifiHigh weight={filterWifi ? "fill" : "regular"} />}
                label={t("filters.wifi")}
              />
              <FilterButton
                active={filterParking}
                onClick={() => setFilterParking(!filterParking)}
                icon={<Car weight={filterParking ? "fill" : "regular"} />}
                label={t("filters.parking")}
              />
              <FilterButton
                active={filterPower}
                onClick={() => setFilterPower(!filterPower)}
                icon={<Plug weight={filterPower ? "fill" : "regular"} />}
                label={t("filters.power")}
              />
            </div>
          </div>

          {districts.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-700" />
                {t("district.label")}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0">
                <DistrictChip
                  active={!filterDistrict}
                  label={t("district.all")}
                  onClick={() => setFilterDistrict("")}
                />
                {districts.map((district) => (
                  <DistrictChip
                    key={district}
                    active={filterDistrict === district}
                    label={district}
                    onClick={() =>
                      setFilterDistrict(filterDistrict === district ? "" : district)
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-neutral-100">
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-1">
              <FilterButton
                active={filterWantToGo}
                onClick={() => setFilterWantToGo(!filterWantToGo)}
                icon={<Heart weight={filterWantToGo ? "fill" : "regular"} />}
                label={t("filters.wantToGo")}
                activeClassName="bg-rose-100 text-rose-800 border-rose-200"
              />
              <FilterButton
                active={filterVisited}
                onClick={() => setFilterVisited(!filterVisited)}
                icon={<CheckCircle weight={filterVisited ? "fill" : "regular"} />}
                label={t("filters.visited")}
                activeClassName="bg-emerald-100 text-emerald-800 border-emerald-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-0 max-w-5xl mx-auto mt-6 sm:mt-8 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">{t("loading")}</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleVisited={handleToggleVisited}
                  isFavoritePending={pendingAction === `fav:${place.id}`}
                  isVisitedPending={pendingAction === `vis:${place.id}`}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlass size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">{t("noResults")}</h3>
            <p className="text-neutral-500 mt-2">{t("noResultsHint")}</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-6 border-b">
                <h2 className="text-xl font-bold text-neutral-900">{t("modal.title")}</h2>
                <p className="text-neutral-500 text-sm mt-1">{t("modal.subtitle")}</p>
              </div>
              <form onSubmit={handleAddPlace} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.name")}</label>
                  <input
                    required
                    type="text"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder={t("placeholders.name")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.notes")}</label>
                  <textarea
                    value={newPlace.note}
                    onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none"
                    placeholder={t("placeholders.notes")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.mapsUrl")}</label>
                  <input
                    type="url"
                    value={newPlace.url}
                    onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder={t("placeholders.mapsUrl")}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <Checkbox
                    label={t("filters.wifi")}
                    checked={newPlace.wifi}
                    onChange={(checked) => setNewPlace({ ...newPlace, wifi: checked })}
                    icon={<WifiHigh />}
                  />
                  <Checkbox
                    label={t("filters.parking")}
                    checked={newPlace.parking}
                    onChange={(checked) => setNewPlace({ ...newPlace, parking: checked })}
                    icon={<Car />}
                  />
                  <Checkbox
                    label={t("filters.power")}
                    checked={newPlace.power_outlets}
                    onChange={(checked) => setNewPlace({ ...newPlace, power_outlets: checked })}
                    icon={<Plug />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.tags")}</label>
                  <input
                    type="text"
                    value={newPlace.tags}
                    onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder={t("placeholders.tags")}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    {t("modal.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 transition-colors shadow-sm"
                  >
                    {t("modal.submit")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PlaceCard({
  place,
  onToggleFavorite,
  onToggleVisited,
  isFavoritePending,
  isVisitedPending,
}: {
  place: workplaces.Place;
  onToggleFavorite: (placeId: string) => void;
  onToggleVisited: (placeId: string) => void;
  isFavoritePending: boolean;
  isVisitedPending: boolean;
}) {
  const t = useTranslations("workplaces");
  const router = useRouter();

  const openDetail = () => {
    router.push(`/apps/workplaces/place?placeId=${encodeURIComponent(place.id)}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all group flex flex-col"
    >
      <div className="relative aspect-[5/3] w-full max-h-40 bg-neutral-100 overflow-hidden">
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 pointer-events-none">
            <Coffee size={40} weight="thin" />
          </div>
        )}
        <button
          type="button"
          onClick={openDetail}
          className="absolute inset-0 z-0 cursor-pointer touch-manipulation"
          aria-label={place.name}
        />
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
          <PlaceActionButton
            active={place.is_favorite}
            pending={isFavoritePending}
            disabled={isFavoritePending}
            activeClassName="bg-rose-500 text-white"
            inactiveClassName="bg-white/95 text-neutral-500"
            ariaLabel={
              place.is_favorite ? t("aria.removeWantToGo") : t("aria.addWantToGo")
            }
            onActivate={() => onToggleFavorite(place.id)}
          >
            <Heart size={20} weight={place.is_favorite ? "fill" : "regular"} />
          </PlaceActionButton>
          <PlaceActionButton
            active={place.is_visited}
            pending={isVisitedPending}
            disabled={isVisitedPending}
            activeClassName="bg-emerald-600 text-white"
            inactiveClassName="bg-white/95 text-neutral-500"
            ariaLabel={place.is_visited ? t("aria.removeVisited") : t("aria.addVisited")}
            onActivate={() => onToggleVisited(place.id)}
          >
            <CheckCircle size={20} weight={place.is_visited ? "fill" : "regular"} />
          </PlaceActionButton>
        </div>
        {place.district && (
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full pointer-events-none">
            {place.district}
          </div>
        )}
        {place.rating && (
          <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-white/90 backdrop-blur-sm text-neutral-900 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm pointer-events-none">
            <span className="text-amber-500">★</span>
            {place.rating}
            <span className="text-neutral-400 font-normal">({place.user_ratings_total})</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openDetail}
        className="w-full text-left cursor-pointer touch-manipulation"
      >
        <div className="px-4 py-3">
          <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-800 transition-colors line-clamp-1">
            {place.name}
          </h3>
          {place.address && (
            <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
              {place.address}
            </p>
          )}

          {place.note && (
            <p className="text-neutral-600 mt-2 text-sm line-clamp-2 leading-snug">
              {place.note}
            </p>
          )}

          {place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[11px] font-medium rounded-md flex items-center gap-1"
                >
                  <Tag size={11} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-neutral-50 border-t flex items-center justify-between pointer-events-none">
          <div className="flex gap-3">
            <StatusIcon active={place.wifi} icon={<WifiHigh size={18} />} amenityKey="wifi" />
            <StatusIcon active={place.parking} icon={<Car size={18} />} amenityKey="parking" />
            <StatusIcon active={place.power_outlets} icon={<Plug size={18} />} amenityKey="power" />
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <SpeakerLow size={18} />
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`w-1.5 h-3 rounded-full ${
                    level <= place.quiet_level ? "bg-amber-500" : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function PlaceActionButton({
  active,
  pending,
  disabled,
  activeClassName,
  inactiveClassName,
  ariaLabel,
  onActivate,
  children,
}: {
  active?: boolean;
  pending: boolean;
  disabled: boolean;
  activeClassName: string;
  inactiveClassName: string;
  ariaLabel: string;
  onActivate: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        onActivate();
      }}
      className={`relative z-20 flex items-center justify-center min-h-11 min-w-11 p-2.5 rounded-full backdrop-blur-md shadow-sm transition-colors touch-manipulation select-none ${
        active ? activeClassName : inactiveClassName
      } ${disabled ? "opacity-60" : ""} ${pending ? "animate-pulse" : ""}`}
    >
      {children}
    </button>
  );
}

function DistrictChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
        active
          ? "bg-amber-700 text-white border-amber-700 shadow-sm"
          : "bg-white text-neutral-600 border-neutral-200 hover:border-amber-300 hover:text-amber-800"
      }`}
    >
      {label}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
  activeClassName = "bg-amber-100 text-amber-800 border-amber-200",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
        active
          ? activeClassName
          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusIcon({
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

function Checkbox({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon: React.ReactNode }) {
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
      {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { size: 24, weight: checked ? "fill" : "regular" })}
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
