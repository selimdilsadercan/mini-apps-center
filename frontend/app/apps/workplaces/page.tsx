"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import dynamic from "next/dynamic";
import {
  Coffee,
  WifiHigh,
  Car,
  Plug,
  Plus,
  MagnifyingGlass,
  MapPin,
  X,
  List,
  House,
  Coins,
  Eye,
  SpeakerLow,
  Phone,
  Globe,
  Clock,
} from "@phosphor-icons/react";

const StudyPlacesMap = dynamic(() => import("@/components/maps/StudyPlacesMap"), {
  ssr: false,
});
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";
import { PlaceCard, Checkbox } from "./components/PlaceCard";

function WorkplacesContent() {
  const t = useTranslations("workplaces");
  const client = useMemo(() => createBrowserClient(), []);
  const { user } = useUser();
  const searchParams = useSearchParams();
  const suggestParam = searchParams.get("suggest");

  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterPower, setFilterPower] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPlace, setEditingPlace] = useState<workplaces.Place | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedPlace, setSelectedPlace] = useState<workplaces.Place | null>(null);

  // Google Search Wizard States
  const [addStep, setAddStep] = useState<1 | 2>(1); // 1: Google Search, 2: Details Form
  const [searchMapQuery, setSearchMapQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [searchMapLoading, setSearchMapLoading] = useState(false);

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
  });

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces({
        userId: user?.id,
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

  // Open suggest modal automatically if URL has ?suggest=true
  useEffect(() => {
    if (suggestParam === "true") {
      setShowAddModal(true);
    }
  }, [suggestParam]);

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

      const matchesWifi = !filterWifi || place.wifi;
      const matchesParking = !filterParking || place.parking;
      const matchesPower = !filterPower || place.power_outlets;

      return (
        matchesSearch &&
        matchesDistrict &&
        matchesWifi &&
        matchesParking &&
        matchesPower
      );
    });
  }, [
    places,
    searchQuery,
    filterDistrict,
    filterWifi,
    filterParking,
    filterPower,
  ]);

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
    } as any);
    setAddStep(2); // Skip directly to details/form step
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPlace(null);
    setAddStep(1);
    setSearchMapQuery("");
    setMapSearchResults([]);
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
    } as any);
  };

  const handleSearchMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMapQuery.trim()) return;

    try {
      setSearchMapLoading(true);
      const res = await client.workplaces.searchPlace({ query: searchMapQuery });
      setMapSearchResults(res.results ?? []);
      if (res.results?.length === 0) {
        toast.error("Hiçbir mekan bulunamadı.");
      }
    } catch (err) {
      console.error("Failed to search maps:", err);
      toast.error("Arama yapılırken bir hata oluştu.");
    } finally {
      setSearchMapLoading(false);
    }
  };

  const handleSelectMapPlace = (place: any) => {
    setNewPlace({
      name: place.name,
      note: "",
      url: place.url || "",
      wifi: false,
      parking: false,
      power_outlets: false,
      quiet_level: 3,
      tags: "",
      // Optional coordinates & address payload
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      image_url: place.image_url,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      district: place.district,
      google_place_id: place.google_place_id,
      wifi_status: "NO",
      parking_status: [] as string[],
      outlets_status: "NO",
      outdoor_status: "NO",
      view_status: "NO",
      areas: [] as string[],
      coffee_price: "MODERATE",
    } as any);
    setAddStep(2); // Go to final details step
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
        } as any);
        toast.success(isAdmin ? "Mekan eklendi" : "Öneri başarıyla gönderildi, admin onayı bekleniyor");
      }
      handleCloseModal();
      fetchPlaces();
    } catch (err) {
      console.error("Failed to save place:", err);
      toast.error("İşlem başarısız oldu");
    }
  };

  return (
    <div className={`flex flex-col bg-neutral-50 ${viewMode === "map" ? "h-[calc(100vh-53px)] md:h-screen w-full pb-0" : "min-h-screen pb-28"}`}>

      {/* Compact Sticky Search & Filter Toolbar */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
            {/* View Selector Tabs */}
            <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-250 shrink-0 w-full sm:w-auto shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-neutral-800 shadow-sm border border-neutral-200/40"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <List size={14} weight="bold" />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "map"
                    ? "bg-white text-neutral-800 shadow-sm border border-neutral-200/40"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <MapPin size={14} weight="bold" />
                Harita
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl outline-none transition-all text-xs text-neutral-800 placeholder-neutral-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
                  type="button"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>
            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full sm:w-auto items-center">
              
              {/* District Dropdown Selector */}
              {districts.length > 0 && (
                <div className="relative shrink-0">
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <select
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                    className={`pl-7 pr-6 py-1.5 rounded-xl text-xs font-semibold border appearance-none outline-none bg-white cursor-pointer transition-all ${
                      filterDistrict
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <option value="">{t("district.all")}</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
        </div>
      </div>

      {/* Main Content */}
      <div className={viewMode === "map" ? "w-full flex-1 flex relative" : "max-w-7xl mx-auto px-4 mt-8"}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">{t("loading")}</p>
          </div>
        ) : viewMode === "map" ? (
          <div className="relative w-full flex-1 min-h-0 bg-neutral-100 flex">
            {/* Map Container */}
            <div className="flex-1 h-full w-full">
              <StudyPlacesMap 
                places={filteredPlaces} 
                onSelectPlace={setSelectedPlace}
                selectedPlaceId={selectedPlace?.id}
              />
            </div>

            {/* Google-like Side Panel */}
            <AnimatePresence>
              {selectedPlace && (
                <motion.div
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "-100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="absolute left-4 right-4 sm:right-auto top-4 bottom-4 sm:w-[340px] bg-white rounded-2xl shadow-2xl z-[1000] flex flex-col overflow-hidden border border-neutral-200"
                >
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedPlace(null)}
                    className="absolute right-3 top-3 w-8 h-8 bg-white/90 hover:bg-white text-neutral-800 rounded-full flex items-center justify-center shadow-md z-10 transition-all cursor-pointer border border-neutral-100"
                  >
                    <X size={14} weight="bold" />
                  </button>

                  {/* Place Image / Gallery */}
                  <div className="w-full h-44 bg-neutral-150 relative shrink-0 overflow-hidden">
                    {selectedPlace.metadata?.photos && selectedPlace.metadata.photos.length > 0 ? (
                      <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth">
                        {selectedPlace.metadata.photos.map((photoUrl: string, idx: number) => (
                          <div key={idx} className="w-full h-full shrink-0 snap-start relative">
                            <img 
                              src={photoUrl} 
                              alt={`${selectedPlace.name} - Görsel ${idx + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute bottom-2 right-2 bg-neutral-900/60 backdrop-blur-sm text-[9px] text-white px-2 py-0.5 rounded-full font-bold">
                              {idx + 1} / {selectedPlace.metadata.photos.length}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <img 
                        src={selectedPlace.image_url || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop"} 
                        alt={selectedPlace.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop";
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-3.5 no-scrollbar">
                    <div>
                      {selectedPlace.district && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {selectedPlace.district}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-neutral-900 mt-1 leading-snug">{selectedPlace.name}</h3>
                      {selectedPlace.rating && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs">
                          <span className="text-amber-500">★</span>
                          <span className="text-neutral-850 font-bold">{selectedPlace.rating}</span>
                          {selectedPlace.user_ratings_total !== undefined && (
                            <span className="text-neutral-450">({selectedPlace.user_ratings_total})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedPlace.address && (
                      <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                        {selectedPlace.address}
                      </p>
                    )}

                    {/* Features list - 7 amenities grid simplified for side panel */}
                    <div className="space-y-2 pt-1 border-t border-neutral-100">
                      <p className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider">İmkanlar</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <WifiHigh size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">WiFi</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {selectedPlace.metadata?.wifi_status ? wifiLabels[selectedPlace.metadata.wifi_status] : (selectedPlace.wifi ? "Var" : "Yok")}
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <Plug size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Priz</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {selectedPlace.metadata?.outlets_status ? outletsLabels[selectedPlace.metadata.outlets_status] : (selectedPlace.power_outlets ? "Var" : "Yok")}
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <Car size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Otopark</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {Array.isArray(selectedPlace.metadata?.parking_status)
                                ? selectedPlace.metadata.parking_status.map((k: string) => parkingLabels[k] || k).join(", ")
                                : (parkingLabels[selectedPlace.metadata?.parking_status] || (selectedPlace.parking ? "Var" : "Yok"))}
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <Coins size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Fiyat</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {priceLabels[selectedPlace.metadata?.coffee_price] || "Orta / Normal"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <SpeakerLow size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Sessizlik</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {selectedPlace.quiet_level ? {
                                1: "Çok Gürültülü",
                                2: "Gürültülü",
                                3: "Orta",
                                4: "Sessiz",
                                5: "Çok Sessiz",
                              }[selectedPlace.quiet_level] || "Orta" : "Orta"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 flex items-center gap-2">
                          <Eye size={16} className="text-amber-700 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block">Manzara</span>
                            <span className="text-[11px] font-bold text-neutral-700 truncate block">
                              {viewLabels[selectedPlace.metadata?.view_status] || "Yok"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Hours */}
                    <div className="border-t border-neutral-100 pt-3 space-y-2">
                      <p className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider">İletişim & Saatler</p>
                      
                      {selectedPlace.metadata?.phone && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
                          <Phone size={14} className="text-amber-700 shrink-0" />
                          <a href={`tel:${selectedPlace.metadata.phone}`} className="hover:text-amber-800 transition-colors">
                            {selectedPlace.metadata.phone}
                          </a>
                        </div>
                      )}

                      {selectedPlace.metadata?.website && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
                          <Globe size={14} className="text-amber-700 shrink-0" />
                          <a href={selectedPlace.metadata.website} target="_blank" rel="noopener noreferrer" className="hover:text-amber-800 transition-colors truncate">
                            Web Sitesi
                          </a>
                        </div>
                      )}

                      {selectedPlace.metadata?.opening_hours && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 font-semibold">
                          <Clock size={14} className="text-amber-700 shrink-0" />
                          {selectedPlace.metadata.opening_hours.open_now !== undefined && (
                            <span className={selectedPlace.metadata.opening_hours.open_now ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                              {selectedPlace.metadata.opening_hours.open_now ? "Açık" : "Kapalı"}
                            </span>
                          )}
                          {(() => {
                            if (!selectedPlace.metadata?.opening_hours?.weekday_text) return null;
                            const weekdayText = selectedPlace.metadata.opening_hours.weekday_text;
                            const todayDay = new Date().getDay();
                            const googleIndex = todayDay === 0 ? 6 : todayDay - 1;
                            const rawText = weekdayText[googleIndex] || null;
                            if (!rawText) return null;
                            
                            const formatted = formatTo24Hour(rawText);
                            const firstColon = formatted.indexOf(":");
                            if (firstColon === -1) return formatted;
                            const timePart = formatted.substring(firstColon + 1).trim();
                            
                            const parts = timePart.split(/[–\-]/);
                            if (parts.length === 2 && selectedPlace.metadata.opening_hours.open_now) {
                              const closeTime = parts[1].trim();
                              if (closeTime === "00:00") return <span className="text-[11px] text-neutral-450">• 00:00'a kadar açık</span>;
                              
                              let suffix = "a";
                              if (closeTime.endsWith(":30")) {
                                suffix = "a";
                              } else if (closeTime.endsWith(":00")) {
                                const hour = closeTime.split(":")[0];
                                if (hour === "22" || hour === "02" || hour === "12") {
                                  suffix = "ye";
                                } else if (hour === "19" || hour === "09") {
                                  suffix = "a";
                                } else if (hour === "16" || hour === "06") {
                                  suffix = "ya";
                                } else {
                                  suffix = "e";
                                }
                              }
                              return <span className="text-[11px] text-neutral-450">• {closeTime}'{suffix} kadar açık</span>;
                            }
                            return <span className="text-[11px] text-neutral-450">• {timePart}</span>;
                          })()}
                        </div>
                      )}
                    </div>

                    {selectedPlace.note && (
                      <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-150 text-[11px] text-neutral-600 leading-relaxed font-semibold italic">
                        "{selectedPlace.note}"
                      </div>
                    )}
                  </div>

                  {/* Detail Link Footer */}
                  <div className="p-3 border-t border-neutral-100 bg-neutral-50 shrink-0">
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
        ) : filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleVisited={handleToggleVisited}
                  isAdmin={isAdmin}
                  onEdit={handleEditClick}
                  onDelete={handleDeletePlace}
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
                  {editingPlace ? "Mekanı Düzenle" : (addStep === 1 ? "Mekan Ara (Google Maps)" : t("modal.title"))}
                </h2>
                <p className="text-neutral-500 text-sm mt-1">
                  {editingPlace 
                    ? "Lütfen mekan bilgilerini güncelleyin." 
                    : (addStep === 1 
                        ? "Öncelikle mekanı Google Haritalar üzerinde aratıp seçin." 
                        : t("modal.subtitle"))}
                </p>
              </div>

              {addStep === 1 ? (
                <div className="p-6 space-y-4">
                  <form onSubmit={handleSearchMaps} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchMapQuery}
                        onChange={(e) => setSearchMapQuery(e.target.value)}
                        placeholder="Google Haritalar'da mekan arayın..."
                        className="w-full pl-4 pr-10 py-2 bg-neutral-100 border border-neutral-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      />
                      {searchMapQuery && (
                        <button
                          onClick={() => setSearchMapQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
                          type="button"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={searchMapLoading}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition-colors shadow-sm text-xs cursor-pointer disabled:opacity-50"
                    >
                      {searchMapLoading ? "Aranıyor..." : "Ara"}
                    </button>
                  </form>

                  <div className="max-h-60 overflow-y-auto space-y-2 mt-4 pr-1 scrollbar-thin">
                    {mapSearchResults.map((r, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectMapPlace(r)}
                        className="w-full text-left p-3 hover:bg-neutral-50 rounded-xl border border-neutral-100 transition-all flex flex-col gap-1 cursor-pointer"
                        type="button"
                      >
                        <span className="font-bold text-xs text-neutral-900">{r.name}</span>
                        {r.address && <span className="text-[10px] text-neutral-500 line-clamp-1">{r.address}</span>}
                        {r.rating && (
                          <span className="text-[9px] text-amber-600 font-bold">
                            ★ {r.rating} ({r.user_ratings_total})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors text-xs cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStep(2)}
                      className="flex-1 px-4 py-3 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors text-xs cursor-pointer"
                    >
                      Manuel Doldur
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddPlace} className="p-6 space-y-4">
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.mapsUrl")}</label>
                    <input
                      type="url"
                      value={newPlace.url}
                      onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all text-xs text-neutral-800 font-semibold"
                      placeholder={t("placeholders.mapsUrl")}
                    />
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
                    {!editingPlace && (
                      <button
                        type="button"
                        onClick={() => setAddStep(1)}
                        className="px-4 py-3 bg-neutral-100 text-neutral-600 font-bold border border-neutral-200 rounded-xl hover:bg-neutral-200 transition-colors text-xs cursor-pointer"
                      >
                        Geri
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl transition-colors shadow-sm text-xs cursor-pointer"
                    >
                      {editingPlace ? "Güncelle" : t("modal.submit")}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
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

export default function WorkplacesPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
      </div>
    }>
      <WorkplacesContent />
    </Suspense>
  );
}

const parkingLabels: Record<string, string> = {
  NO: "Yok",
  FREE: "Ücretsiz Otopark",
  PAID: "Ücretli Otopark",
  STREET: "Yol Üstü Park",
};

const areaLabels: Record<string, string> = {
  INDOOR: "İç Mekan",
  GARDEN: "Bahçe",
  TERRACE: "Teras",
  STUDY_ZONE: "Çalışma Masaları",
};

const priceLabels: Record<string, string> = {
  CHEAP: "Uygun / Ucuz",
  MODERATE: "Orta / Normal",
  EXPENSIVE: "Pahalı / Yüksek",
};

const wifiLabels: Record<string, string> = {
  NO: "Yok",
  FREE_FAST: "Ücretsiz & Hızlı",
  FREE_SLOW: "Ücretsiz & Yavaş",
  PAID: "Ücretli",
};

const outletsLabels: Record<string, string> = {
  NO: "Yok",
  PLENTY: "Fazlaca Priz",
  SOME: "Yeterli Priz",
  FEW: "Çok Az Priz",
};

const viewLabels: Record<string, string> = {
  NO: "Manzara Yok",
  SEA: "Deniz Manzarası",
  PARK: "Park / Yeşil Alan",
  CITY: "Şehir Manzarası",
};

function formatTo24Hour(text: string): string {
  if (!text) return text;
  return text.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (match, hh, mm, ampm) => {
    let hour = parseInt(hh, 10);
    const m = ampm.toUpperCase();
    if (m === "PM" && hour < 12) {
      hour += 12;
    } else if (m === "AM" && hour === 12) {
      hour = 0;
    }
    const hourStr = hour.toString().padStart(2, "0");
    return `${hourStr}:${mm}`;
  });
}
