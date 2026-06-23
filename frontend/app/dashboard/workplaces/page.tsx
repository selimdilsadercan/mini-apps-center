"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  MagnifyingGlass, 
  MapPin, 
  X, 
  WifiHigh, 
  Car, 
  Plug, 
  SpeakerLow, 
  Pencil, 
  Trash,
  Coffee,
  Globe,
  Clock,
  Phone,
  Tag,
  Coins,
  Eye
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkplaces } from "./context";
import { workplaces } from "@/lib/client";
import { createBrowserClient } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";

const client = createBrowserClient();

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

export default function WorkplacesPage() {
  const { places, loading, refreshPlaces, businessId } = useWorkplaces();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<workplaces.Place | null>(null);
  
  // Google Search Wizard States
  const [addStep, setAddStep] = useState<1 | 2>(1); // 1: Google Search, 2: Details Form
  const [searchMapQuery, setSearchMapQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [searchMapLoading, setSearchMapLoading] = useState(false);

  const [newPlace, setNewPlace] = useState({
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
  });

  const filteredPlaces = useMemo(() => {
    return places.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [places, searchQuery]);

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
    });
  };

  const handleEditClick = (place: workplaces.Place) => {
    setEditingPlace(place);
    
    let parsedParking: string[] = [];
    if (place.metadata?.parking_status) {
      parsedParking = Array.isArray(place.metadata.parking_status) 
        ? place.metadata.parking_status 
        : [place.metadata.parking_status];
    }

    let parsedAreas: string[] = [];
    if (place.metadata?.areas) {
      parsedAreas = Array.isArray(place.metadata.areas) 
        ? place.metadata.areas 
        : [place.metadata.areas];
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
      wifi_status: place.metadata?.wifi_status || "NO",
      parking_status: parsedParking,
      outlets_status: place.metadata?.outlets_status || "NO",
      outdoor_status: place.metadata?.outdoor_status || "NO",
      view_status: place.metadata?.view_status || "NO",
      areas: parsedAreas,
      coffee_price: place.metadata?.coffee_price || "MODERATE",
    } as any);
    setAddStep(2);
    setShowAddModal(true);
  };

  const handleSearchMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMapQuery.trim()) return;

    try {
      setSearchMapLoading(true);
      const res = await client.workplaces.searchPlace({ query: searchMapQuery });
      setMapSearchResults(res.results ?? []);
    } catch (err) {
      console.error("Failed to search maps:", err);
      toast.error("Arama yapılırken bir hata oluştu.");
    } finally {
      setSearchMapLoading(false);
    }
  };

  const handleSelectMapPlace = (place: any) => {
    setNewPlace({
      ...newPlace,
      name: place.name,
      url: place.url || "",
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      image_url: place.image_url,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      district: place.district,
      google_place_id: place.google_place_id,
    } as any);
    setAddStep(2);
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const wifiBool = newPlace.wifi_status !== "NO";
      const parkingBool = newPlace.parking_status.length > 0 && !newPlace.parking_status.includes("NO");
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

      const payload = {
        name: newPlace.name,
        note: newPlace.note,
        url: newPlace.url,
        wifi: wifiBool,
        parking: parkingBool,
        power_outlets: powerBool,
        quiet_level: newPlace.quiet_level,
        tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
        metadata: metadata,
        businessId: businessId,
        ...(newPlace as any).latitude && { latitude: (newPlace as any).latitude },
        ...(newPlace as any).longitude && { longitude: (newPlace as any).longitude },
        ...(newPlace as any).address && { address: (newPlace as any).address },
        ...(newPlace as any).image_url && { image_url: (newPlace as any).image_url },
        ...(newPlace as any).rating && { rating: (newPlace as any).rating },
        ...(newPlace as any).user_ratings_total && { user_ratings_total: (newPlace as any).user_ratings_total },
        ...(newPlace as any).district && { district: (newPlace as any).district },
        ...(newPlace as any).google_place_id && { google_place_id: (newPlace as any).google_place_id },
      };

      if (editingPlace) {
        await client.workplaces.updatePlace({
          ...payload,
          id: editingPlace.id,
          userId: user?.id || "",
        } as any);
        toast.success("Mekan güncellendi");
      } else {
        await client.workplaces.addPlace({
          ...payload,
          suggested_by: user?.id || undefined,
        } as any);
        toast.success("Mekan eklendi");
      }
      handleCloseModal();
      refreshPlaces();
    } catch (err) {
      console.error("Failed to save place:", err);
      toast.error("İşlem başarısız oldu");
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
      toast.success("Mekan silindi");
      refreshPlaces();
    } catch (err) {
      console.error("Failed to delete place:", err);
      toast.error("Mekan silinemedi");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Workplaces</h2>
          <p className="text-stone-500 text-sm font-bold mt-1">İşletmenize ait mekanları buradan yönetebilirsiniz.</p>
        </div>
        <button
          onClick={() => {
            setAddStep(1);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#6F4E37] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#6F4E37]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus size={20} weight="bold" />
          Yeni Mekan Ekle
        </button>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} weight="bold" />
        <input
          type="text"
          placeholder="Mekan adı, semt veya adres ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#6F4E37]/5 focus:border-[#6F4E37] transition-all text-sm font-bold shadow-sm"
        />
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-stone-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <div 
              key={place.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative h-40 bg-stone-100 overflow-hidden">
                {(place.image_url || place.metadata?.photos?.[0]) ? (
                  <img
                    src={place.image_url || place.metadata?.photos?.[0]}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Coffee size={48} weight="thin" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(place)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-stone-600 hover:text-[#6F4E37] shadow-sm transition-colors cursor-pointer"
                  >
                    <Pencil size={18} weight="bold" />
                  </button>
                  <button
                    onClick={() => handleDeletePlace(place.id)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-stone-600 hover:text-red-600 shadow-sm transition-colors cursor-pointer"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
                {place.district && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    {place.district}
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-stone-900 line-clamp-1">{place.name}</h3>
                <p className="text-xs text-stone-400 font-bold mt-1 line-clamp-1">{place.address || "Adres belirtilmemiş"}</p>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <StatusBadge active={place.wifi} icon={<WifiHigh size={14} />} label="WiFi" />
                  <StatusBadge active={place.parking} icon={<Car size={14} />} label="Otopark" />
                  <StatusBadge active={place.power_outlets} icon={<Plug size={14} />} label="Priz" />
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-50">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-xs font-black text-stone-900">{place.rating || "0.0"}</span>
                  </div>
                  <a 
                    href={`/apps/workplaces/place?placeId=${place.id}`}
                    target="_blank"
                    className="text-[10px] font-black text-[#6F4E37] uppercase tracking-widest hover:underline"
                  >
                    Detayları Gör
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin size={40} className="text-stone-300" weight="bold" />
          </div>
          <h3 className="text-xl font-black text-stone-900">Mekan Bulunamadı</h3>
          <p className="text-stone-500 mt-2 font-bold">Henüz bir mekan eklemediniz veya aramanızla eşleşen sonuç yok.</p>
          <button
            onClick={() => {
              setAddStep(1);
              setShowAddModal(true);
            }}
            className="mt-8 px-8 py-3 bg-stone-900 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-all cursor-pointer"
          >
            İlk Mekanınızı Ekleyin
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8"
            >
              <div className="px-8 py-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">
                    {editingPlace ? "Mekanı Düzenle" : (addStep === 1 ? "Mekan Ara" : "Mekan Detayları")}
                  </h2>
                  <p className="text-stone-500 text-xs font-bold mt-1 uppercase tracking-wider">
                    {editingPlace ? "Bilgileri güncelleyin" : (addStep === 1 ? "Google Haritalar'da bulun" : "Detayları doldurun")}
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
                  <X size={24} weight="bold" className="text-stone-400" />
                </button>
              </div>

              {addStep === 1 ? (
                <div className="p-8 space-y-6">
                  <form onSubmit={handleSearchMaps} className="flex gap-3">
                    <div className="relative flex-1">
                      <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} weight="bold" />
                      <input
                        type="text"
                        value={searchMapQuery}
                        onChange={(e) => setSearchMapQuery(e.target.value)}
                        placeholder="Mekan adını yazın..."
                        className="w-full pl-12 pr-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#6F4E37] rounded-2xl outline-none transition-all text-sm font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searchMapLoading}
                      className="px-8 py-3 bg-[#6F4E37] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#6F4E37]/10 cursor-pointer disabled:opacity-50"
                    >
                      {searchMapLoading ? "Aranıyor..." : "Ara"}
                    </button>
                  </form>

                  <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {mapSearchResults.length > 0 ? (
                      mapSearchResults.map((r, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectMapPlace(r)}
                          className="w-full text-left p-4 hover:bg-[#6F4E37]/5 rounded-2xl border border-stone-100 hover:border-[#6F4E37]/20 transition-all flex flex-col gap-1 cursor-pointer group"
                        >
                          <span className="font-black text-sm text-stone-900 group-hover:text-[#6F4E37]">{r.name}</span>
                          {r.address && <span className="text-[11px] text-stone-500 font-bold line-clamp-1">{r.address}</span>}
                          {r.rating > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-amber-500 text-xs">★</span>
                              <span className="text-[10px] text-stone-700 font-black">{r.rating} ({r.user_ratings_total})</span>
                            </div>
                          )}
                        </button>
                      ))
                    ) : searchMapQuery && !searchMapLoading ? (
                      <div className="text-center py-8 text-stone-400 font-bold text-sm">Sonuç bulunamadı.</div>
                    ) : null}
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setAddStep(2)}
                      className="flex-1 py-4 bg-stone-100 text-stone-600 font-black rounded-2xl hover:bg-stone-200 transition-all text-sm cursor-pointer"
                    >
                      Manuel Devam Et
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSavePlace} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Mekan Adı</label>
                        <input
                          required
                          type="text"
                          value={newPlace.name}
                          onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#6F4E37] rounded-2xl outline-none transition-all text-sm font-bold"
                          placeholder="Örn: Kahve Dünyası"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Maps URL</label>
                        <input
                          type="url"
                          value={newPlace.url}
                          onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#6F4E37] rounded-2xl outline-none transition-all text-sm font-bold"
                          placeholder="https://goo.gl/maps/..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Notlar / Açıklama</label>
                      <textarea
                        value={newPlace.note}
                        onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#6F4E37] rounded-2xl outline-none transition-all h-24 resize-none text-sm font-bold"
                        placeholder="Mekan hakkında kısa bilgi..."
                      />
                    </div>

                  <div className="space-y-6 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">İmkanlar & Özellikler</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">WiFi</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(wifiLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, wifi_status: key })}
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                newPlace.wifi_status === key
                                  ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-lg shadow-[#6F4E37]/20"
                                  : "bg-white border-stone-200 text-stone-500 hover:border-[#6F4E37]/20"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Priz</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(outletsLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, outlets_status: key })}
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                newPlace.outlets_status === key
                                  ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-lg shadow-[#6F4E37]/20"
                                  : "bg-white border-stone-200 text-stone-500 hover:border-[#6F4E37]/20"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Otopark</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(parkingLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                let current = [...newPlace.parking_status];
                                if (current.includes(key)) {
                                  current = current.filter(k => k !== key);
                                } else {
                                  if (key === "NO") current = ["NO"];
                                  else {
                                    current = current.filter(k => k !== "NO");
                                    current.push(key);
                                  }
                                }
                                setNewPlace({ ...newPlace, parking_status: current });
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                newPlace.parking_status.includes(key)
                                  ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-lg shadow-[#6F4E37]/20"
                                  : "bg-white border-stone-200 text-stone-500 hover:border-[#6F4E37]/20"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Fiyat</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(priceLabels).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setNewPlace({ ...newPlace, coffee_price: key })}
                              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                                newPlace.coffee_price === key
                                  ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-lg shadow-[#6F4E37]/20"
                                  : "bg-white border-stone-200 text-stone-500 hover:border-[#6F4E37]/20"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Etiketler</label>
                    <input
                      type="text"
                      value={newPlace.tags}
                      onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                      className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#6F4E37] rounded-2xl outline-none transition-all text-sm font-bold"
                      placeholder="Sessiz, Bahçeli, Çalışmaya Uygun (virgül ile ayırın)"
                    />
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-4 bg-stone-100 text-stone-600 font-black rounded-2xl hover:bg-stone-200 transition-all text-sm cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-2 py-4 bg-[#6F4E37] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#6F4E37]/20 hover:scale-[1.02] cursor-pointer"
                    >
                      {editingPlace ? "Güncelle" : "Kaydet"}
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

function StatusBadge({ active, icon, label }: { active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-colors ${
      active 
        ? "bg-[#6F4E37]/5 border-[#6F4E37]/10 text-[#6F4E37]" 
        : "bg-stone-50 border-stone-100 text-stone-400"
    }`}>
      {icon}
      {label}
    </div>
  );
}
