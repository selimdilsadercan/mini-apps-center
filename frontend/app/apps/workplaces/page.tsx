"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import {
  Coffee,
  WifiHigh,
  Car,
  Plug,
  Plus,
  House,
  Coins,
  Eye,
  SpeakerLow,
  Phone,
  Globe,
  ArrowSquareOut,
  Clock,
} from "@phosphor-icons/react";

import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";
import { PlaceCard, Checkbox } from "./components/PlaceCard";
import WorkplacesFiltersBar from "./components/WorkplacesFiltersBar";
import {
  DEFAULT_VENUE_CITY,
  VENUE_PRIMARY_TYPES,
  VENUE_TYPE_FILTERS,
  matchesVenueTypeFilter,
} from "./lib/venue-types";
import { resolveMapsHref } from "./lib/maps-link";
import { resolvePlaceImageSrc } from "./lib/place-image";
import {
  areaLabels,
  outletsLabels,
  parkingLabels,
  priceLabels,
  viewLabels,
  wifiLabels,
} from "./lib/place-amenity-labels";

function WorkplacesContent() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const { user } = useUser();

  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPlace, setEditingPlace] = useState<workplaces.Place | null>(null);
  const [photoFetchLoading, setPhotoFetchLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    client.users.checkAdmin(user.id)
      .then((res) => setIsAdmin(res.isAdmin))
      .catch((err) => console.error("Failed to check admin status:", err));
  }, [user?.id, client]);

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
    // Enum values for metadata
    wifi_status: "NO",
    parking_status: [] as string[],
    outlets_status: "NO",
    outdoor_status: "NO",
    view_status: "NO",
    areas: [] as string[],
    coffee_price: "MODERATE",
    types: ["cafe"] as string[],
    address: "",
    district: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    google_place_id: "",
    rating: "" as string | number,
    user_ratings_total: "" as string | number,
  });

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces({
        userId: user?.id,
        city: DEFAULT_VENUE_CITY,
      });
      setPlaces(res.places ?? []);
    } catch (err) {
      console.error("Failed to fetch places:", err);
      toast.error(t("toast.loadFailed"));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, client]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const handleToggleFavorite = async (placeId: string) => {
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      const res = await client.workplaces.toggleFavorite({
        placeId,
        userId: user.id,
      });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_favorite: res.isFavorite } : p,
        ),
      );
    } catch (err) {
      console.error("toggleFavorite failed:", err);
      toast.error(t("toast.updateFailed"));
    }
  };

  const handleToggleVisited = async (placeId: string) => {
    if (!user?.id) {
      toast.error(t("toast.signInRequired"));
      return;
    }
    try {
      const res = await client.workplaces.toggleVisited({
        placeId,
        userId: user.id,
      });
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === placeId ? { ...p, is_visited: res.isVisited } : p,
        ),
      );
    } catch (err) {
      console.error("toggleVisited failed:", err);
      toast.error(t("toast.updateFailed"));
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

      const matchesType = matchesVenueTypeFilter(place.types, filterCategory);

      return matchesSearch && matchesDistrict && matchesType;
    });
  }, [places, searchQuery, filterDistrict, filterCategory]);

  const hasActiveFilters = !!filterCategory || !!filterDistrict;

  const handleEditClick = (place: workplaces.Place) => {
    setEditingPlace(place);
    
    // Safely parse parking_status as an array of string
    let parsedParking: string[] = [];
    if (place.metadata?.parking_status) {
      if (Array.isArray(place.metadata.parking_status)) {
        parsedParking = place.metadata.parking_status;
      } else {
        parsedParking = [place.metadata.parking_status as string];
      }
    } else if (place.parking) {
      parsedParking = ["FREE"];
    } else {
      parsedParking = ["NO"];
    }

    // Safely parse areas as an array of string
    let parsedAreas: string[] = [];
    if (place.metadata?.areas) {
      if (Array.isArray(place.metadata.areas)) {
        parsedAreas = place.metadata.areas;
      } else {
        parsedAreas = [place.metadata.areas as string];
      }
    }

    setNewPlace({
      name: place.name,
      note: place.note || "",
      url: place.url || "",
      wifi: place.wifi || false,
      parking: place.parking || false,
      power_outlets: place.power_outlets || false,
      quiet_level: place.quiet_level || 3,
      tags: place.tags.join(", "),
      wifi_status: place.metadata?.wifi_status || (place.wifi ? "FREE_FAST" : "NO"),
      parking_status: parsedParking,
      outlets_status: place.metadata?.outlets_status || (place.power_outlets ? "SOME" : "NO"),
      outdoor_status: place.metadata?.outdoor_status || "NO",
      view_status: place.metadata?.view_status || "NO",
      areas: parsedAreas,
      coffee_price: place.metadata?.coffee_price || "MODERATE",
      types: place.types || ["cafe"],
      address: place.address || "",
      district: place.district || "",
      latitude: place.latitude,
      longitude: place.longitude,
      google_place_id: place.metadata?.google_place_id || "",
      rating: place.rating ?? "",
      user_ratings_total: place.user_ratings_total ?? "",
    } as any);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPlace(null);
    setNewPlace({
      name: "",
      note: "",
      url: "",
      wifi: false,
      parking: false,
      power_outlets: false,
      quiet_level: 3,
      tags: "",
      wifi_status: "NO",
      parking_status: [] as string[],
      outlets_status: "NO",
      outdoor_status: "NO",
      view_status: "NO",
      areas: [] as string[],
      coffee_price: "MODERATE",
      types: ["cafe"] as string[],
      address: "",
      district: "",
      latitude: undefined,
      longitude: undefined,
      google_place_id: "",
      rating: "",
      user_ratings_total: "",
    } as any);
  };

  const handleFetchPhoto = async () => {
    if (!user?.id || !isAdmin) return;
    const googlePlaceId =
      (newPlace as any).google_place_id?.trim() || newPlace.url?.trim();
    if (!googlePlaceId) {
      toast.error("Google Place ID veya Maps linki girin");
      return;
    }

    try {
      setPhotoFetchLoading(true);
      if (editingPlace) {
        const res = await client.workplaces.cachePlacePhoto({
          placeId: editingPlace.id,
          userId: user.id,
          googlePlaceId,
        });
        if (res.image_url) {
          setNewPlace({ ...newPlace, image_url: res.image_url } as any);
          toast.success("Fotoğraf kaydedildi");
        } else {
          toast.error("Fotoğraf bulunamadı");
        }
      } else {
        toast("Önce mekanı kaydedin, sonra fotoğraf çekilebilir", { icon: "ℹ️" });
      }
    } catch (err) {
      console.error("cachePlacePhoto failed:", err);
      toast.error("Fotoğraf alınamadı");
    } finally {
      setPhotoFetchLoading(false);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!user?.id) return;
    if (!window.confirm("Bu mekanı silmek istediğinize emin misiniz?")) return;
    try {
      await client.workplaces.deletePlace({
        placeId,
        userId: user.id,
      });
      toast.success("Mekan başarıyla silindi");
      fetchPlaces();
    } catch (err) {
      console.error("Failed to delete place:", err);
      toast.error("Mekan silinemedi");
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const wifiBool = newPlace.wifi_status !== "NO";
      const parkingBool = Array.isArray(newPlace.parking_status)
        ? (newPlace.parking_status.length > 0 && !newPlace.parking_status.includes("NO"))
        : newPlace.parking_status !== "NO";
      const powerBool = newPlace.outlets_status !== "NO";

      const metadata = {
        ...(editingPlace?.metadata || {}),
        wifi_status: newPlace.wifi_status,
        parking_status: newPlace.parking_status,
        outlets_status: newPlace.outlets_status,
        outdoor_status: newPlace.outdoor_status,
        view_status: newPlace.view_status,
        areas: newPlace.areas,
        coffee_price: newPlace.coffee_price,
        google_place_id: (newPlace as any).google_place_id,
      };

      const parseRating = (v: string | number | undefined) => {
        if (v === "" || v === undefined || v === null) return undefined;
        const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
        return Number.isNaN(n) ? undefined : n;
      };
      const parseReviewCount = (v: string | number | undefined) => {
        if (v === "" || v === undefined || v === null) return undefined;
        const n = typeof v === "number" ? v : parseInt(String(v).replace(/[^\d]/g, ""), 10);
        return Number.isNaN(n) ? undefined : n;
      };
      const rating = parseRating((newPlace as any).rating);
      const userRatingsTotal = parseReviewCount((newPlace as any).user_ratings_total);

      if (editingPlace) {
        await client.workplaces.updatePlace({
          id: editingPlace.id,
          userId: user?.id || "",
          name: newPlace.name,
          note: newPlace.note,
          url: newPlace.url,
          wifi: wifiBool,
          parking: parkingBool,
          power_outlets: powerBool,
          quiet_level: newPlace.quiet_level,
          tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
          metadata: metadata,
          google_place_id: (newPlace as any).google_place_id,
          types: (newPlace as any).types,
          address: (newPlace as any).address || undefined,
          district: (newPlace as any).district || undefined,
          latitude: (newPlace as any).latitude,
          longitude: (newPlace as any).longitude,
          rating,
          user_ratings_total: userRatingsTotal,
        });
        toast.success("Mekan başarıyla güncellendi");
      } else {
        await client.workplaces.addPlace({
          ...newPlace,
          wifi: wifiBool,
          parking: parkingBool,
          power_outlets: powerBool,
          suggested_by: user?.id || undefined,
          tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
          metadata: metadata,
          city: DEFAULT_VENUE_CITY,
          types: (newPlace as any).types || ["cafe"],
          address: (newPlace as any).address || undefined,
          district: (newPlace as any).district || undefined,
          latitude: (newPlace as any).latitude,
          longitude: (newPlace as any).longitude,
          rating,
          user_ratings_total: userRatingsTotal,
        } as any);
        toast.success("Mekan eklendi");
      }
      handleCloseModal();
      fetchPlaces();
    } catch (err) {
      console.error("Failed to save place:", err);
      toast.error("İşlem başarısız oldu");
    }
  };

  return (
    <div className="space-y-4">

      <WorkplacesFiltersBar
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">{t("loading")}</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="space-y-2">
            {filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onToggleFavorite={handleToggleFavorite}
                onToggleVisited={handleToggleVisited}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-app-surface rounded-2xl border border-app-border">
            <Coffee size={32} className="mx-auto text-app-muted mb-2" />
            <h3 className="text-sm font-bold text-app-text">{t("noResults")}</h3>
            <p className="text-xs text-app-muted mt-1">{t("noResultsHint")}</p>
          </div>
        )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-6 border-b">
                <h2 className="text-xl font-bold text-neutral-900">
                  {editingPlace ? "Mekanı Düzenle" : t("modal.title")}
                </h2>
                <p className="text-neutral-500 text-sm mt-1">
                  {editingPlace
                    ? "Lütfen mekan bilgilerini güncelleyin."
                    : "Mekan bilgilerini elle girin. Sadece eklenen mekanlar listede görünür."}
                </p>
              </div>

              <form onSubmit={handleAddPlace} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mekan Türleri</label>
                    <div className="flex flex-wrap gap-2">
                      {VENUE_PRIMARY_TYPES.map((type) => {
                        const isSelected = newPlace.types.includes(type.id);
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              const current = [...newPlace.types];
                              if (current.includes(type.id)) {
                                if (current.length > 1) {
                                  setNewPlace({ ...newPlace, types: current.filter(t => t !== type.id) });
                                }
                              } else {
                                current.push(type.id);
                                setNewPlace({ ...newPlace, types: current });
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-amber-100 border-amber-300 text-amber-900"
                                : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            {t(`venueTypes.${type.id}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.name")}</label>
                    <input
                      required
                      type="text"
                      value={newPlace.name}
                      onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder={t("placeholders.name")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.notes")}</label>
                    <textarea
                      value={newPlace.note}
                      onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none text-xs text-neutral-800 font-semibold"
                      placeholder={t("placeholders.notes")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">İlçe / Mahalle</label>
                    <input
                      type="text"
                      value={(newPlace as any).district || ""}
                      onChange={(e) => setNewPlace({ ...newPlace, district: e.target.value } as any)}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder="Örn. Onikişubat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Adres</label>
                    <input
                      type="text"
                      value={(newPlace as any).address || ""}
                      onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value } as any)}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder="Sokak, cadde..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.mapsUrl")}</label>
                    <input
                      type="url"
                      value={newPlace.url}
                      onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder={t("placeholders.mapsUrl")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Google Maps Puanı</label>
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={(newPlace as any).rating ?? ""}
                        onChange={(e) =>
                          setNewPlace({ ...newPlace, rating: e.target.value } as any)
                        }
                        className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                        placeholder="4.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Yorum Sayısı</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={(newPlace as any).user_ratings_total ?? ""}
                        onChange={(e) =>
                          setNewPlace({ ...newPlace, user_ratings_total: e.target.value } as any)
                        }
                        className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                        placeholder="246"
                      />
                    </div>
                  </div>
                  {isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Google Place ID (sadece fotoğraf için)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={(newPlace as any).google_place_id || ""}
                          onChange={(e) =>
                            setNewPlace({ ...newPlace, google_place_id: e.target.value } as any)
                          }
                          className="flex-1 px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                          placeholder="ChIJ... veya Maps linki"
                        />
                        <button
                          type="button"
                          onClick={handleFetchPhoto}
                          disabled={photoFetchLoading || !editingPlace}
                          className="shrink-0 px-3 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                        >
                          {photoFetchLoading ? "..." : "Foto"}
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Fotoğraf Google üzerinden proxy ile gösterilir; CDN&apos;e indirilmez.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Enlem</label>
                      <input
                        type="number"
                        step="any"
                        value={(newPlace as any).latitude ?? ""}
                        onChange={(e) =>
                          setNewPlace({
                            ...newPlace,
                            latitude: e.target.value ? Number(e.target.value) : undefined,
                          } as any)
                        }
                        className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                        placeholder="37.58"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Boylam</label>
                      <input
                        type="number"
                        step="any"
                        value={(newPlace as any).longitude ?? ""}
                        onChange={(e) =>
                          setNewPlace({
                            ...newPlace,
                            longitude: e.target.value ? Number(e.target.value) : undefined,
                          } as any)
                        }
                        className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                        placeholder="36.93"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 border-y border-neutral-100 my-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">WiFi Durumu</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(wifiLabels).map(([key, label]) => {
                          const isSelected = newPlace.wifi_status === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, wifi_status: key })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Kahve Fiyatı</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(priceLabels).map(([key, label]) => {
                          const isSelected = newPlace.coffee_price === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, coffee_price: key })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Priz / Güç Çıkışı</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(outletsLabels).map(([key, label]) => {
                          const isSelected = newPlace.outlets_status === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, outlets_status: key })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Manzara</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(viewLabels).map(([key, label]) => {
                          const isSelected = newPlace.view_status === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, view_status: key })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Otopark Seçenekleri</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(parkingLabels).map(([key, label]) => {
                          if (key === "NO") return null;
                          const isSelected = Array.isArray(newPlace.parking_status)
                            ? newPlace.parking_status.includes(key)
                            : false;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                let current = Array.isArray(newPlace.parking_status) ? [...newPlace.parking_status] : [];
                                if (current.includes(key)) {
                                  current = current.filter(k => k !== key);
                                } else {
                                  current.push(key);
                                }
                                setNewPlace({ ...newPlace, parking_status: current });
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Mevcut Alanlar</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(areaLabels).map(([key, label]) => {
                          const isSelected = Array.isArray(newPlace.areas)
                            ? newPlace.areas.includes(key)
                            : false;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                let current = Array.isArray(newPlace.areas) ? [...newPlace.areas] : [];
                                if (current.includes(key)) {
                                  current = current.filter(k => k !== key);
                                } else {
                                  current.push(key);
                                }
                                setNewPlace({ ...newPlace, areas: current });
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.tags")}</label>
                    <input
                      type="text"
                      value={newPlace.tags}
                      onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder={t("placeholders.tags")}
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors text-xs cursor-pointer"
                    >
                      {t("modal.cancel")}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition-colors shadow-sm text-xs cursor-pointer"
                    >
                      {editingPlace ? "Güncelle" : t("modal.submit")}
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

export default function WorkplacesPage() {
  return <WorkplacesContent />;
}
