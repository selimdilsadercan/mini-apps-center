"use client";

import React, { useEffect, useState, useMemo } from "react";
import Client, { workplaces, Local } from "@/lib/client";
import {
  Coffee,
  WifiHigh,
  Car,
  Plug,
  SpeakerLow,
  Plus,
  MagnifyingGlass,
  ArrowSquareOut,
  Tag,
  Info,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const client = new Client(Local);

export default function WorkplacesPage() {
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterPower, setFilterPower] = useState(false);

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

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const res = await client.workplaces.listPlaces();
      setPlaces(res.places);
    } catch (err) {
      console.error("Failed to fetch places:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesSearch =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesWifi = !filterWifi || place.wifi;
      const matchesParking = !filterParking || place.parking;
      const matchesPower = !filterPower || place.power_outlets;

      return matchesSearch && matchesWifi && matchesParking && matchesPower;
    });
  }, [places, searchQuery, filterWifi, filterParking, filterPower]);

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.workplaces.addPlace({
        ...newPlace,
        tags: newPlace.tags.split(",").map((t) => t.trim()).filter(Boolean),
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
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
                <Coffee className="text-amber-700" weight="fill" />
                Workplaces
              </h1>
              <p className="text-neutral-500 mt-1">
                Çalışmaya uygun en iyi kütüphane ve kafeler
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-amber-800 transition-colors shadow-sm"
            >
              <Plus weight="bold" />
              Mekan Öner
            </button>
          </div>

          {/* Search & Filters */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Mekan adı, etiket veya notlarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <FilterButton
                active={filterWifi}
                onClick={() => setFilterWifi(!filterWifi)}
                icon={<WifiHigh weight={filterWifi ? "fill" : "regular"} />}
                label="WiFi"
              />
              <FilterButton
                active={filterParking}
                onClick={() => setFilterParking(!filterParking)}
                icon={<Car weight={filterParking ? "fill" : "regular"} />}
                label="Otopark"
              />
              <FilterButton
                active={filterPower}
                onClick={() => setFilterPower(!filterPower)}
                icon={<Plug weight={filterPower ? "fill" : "regular"} />}
                label="Priz"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
            <p className="text-neutral-500 font-medium">Mekanlar yükleniyor...</p>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlass size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Mekan bulunamadı</h3>
            <p className="text-neutral-500 mt-2">
              Arama kriterlerine uygun mekan bulamadık.
            </p>
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
                <h2 className="text-xl font-bold text-neutral-900">Yeni Mekan Öner</h2>
                <p className="text-neutral-500 text-sm mt-1">
                  Çalışmaya uygun olduğunu düşündüğün bir yeri paylaş.
                </p>
              </div>
              <form onSubmit={handleAddPlace} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Mekan Adı</label>
                  <input
                    required
                    type="text"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder="Örn: Bulgur Palas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notlar</label>
                  <textarea
                    value={newPlace.note}
                    onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none"
                    placeholder="Mekan hakkında kısa bilgi..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Google Maps URL</label>
                  <input
                    type="url"
                    value={newPlace.url}
                    onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <Checkbox
                    label="WiFi"
                    checked={newPlace.wifi}
                    onChange={(checked) => setNewPlace({ ...newPlace, wifi: checked })}
                    icon={<WifiHigh />}
                  />
                  <Checkbox
                    label="Otopark"
                    checked={newPlace.parking}
                    onChange={(checked) => setNewPlace({ ...newPlace, parking: checked })}
                    icon={<Car />}
                  />
                  <Checkbox
                    label="Priz"
                    checked={newPlace.power_outlets}
                    onChange={(checked) => setNewPlace({ ...newPlace, power_outlets: checked })}
                    icon={<Plug />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Etiketler (Virgülle ayır)</label>
                  <input
                    type="text"
                    value={newPlace.tags}
                    onChange={(e) => setNewPlace({ ...newPlace, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                    placeholder="kütüphane, sakin, kahve..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 transition-colors shadow-sm"
                  >
                    Ekle
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

function PlaceCard({ place }: { place: workplaces.Place }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-3xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all group flex flex-col h-full"
    >
      {/* Image Header */}
      <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Coffee size={48} weight="thin" />
          </div>
        )}
        {place.district && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full">
            {place.district}
          </div>
        )}
        {place.rating && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-neutral-900 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm">
            <span className="text-amber-500">★</span>
            {place.rating}
            <span className="text-neutral-400 font-normal">({place.user_ratings_total})</span>
          </div>
        )}
      </div>

      <div className="p-6 flex-1">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 group-hover:text-amber-800 transition-colors">
              {place.name}
            </h3>
            {place.address && (
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                {place.address}
              </p>
            )}
          </div>
          {place.url && (
            <a
              href={place.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-neutral-50 text-neutral-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all shrink-0"
            >
              <ArrowSquareOut size={20} weight="bold" />
            </a>
          )}
        </div>

        {place.note && (
          <p className="text-neutral-600 mt-3 text-sm line-clamp-3 leading-relaxed">
            {place.note}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 bg-neutral-100 text-neutral-500 text-xs font-medium rounded-lg flex items-center gap-1"
            >
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 bg-neutral-50 border-t flex items-center justify-between">
        <div className="flex gap-3">
          <StatusIcon active={place.wifi} icon={<WifiHigh size={18} />} tooltip="WiFi" />
          <StatusIcon active={place.parking} icon={<Car size={18} />} tooltip="Otopark" />
          <StatusIcon active={place.power_outlets} icon={<Plug size={18} />} tooltip="Priz" />
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
    </motion.div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
      } border`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusIcon({ active, icon, tooltip }: { active: boolean; icon: React.ReactNode; tooltip: string }) {
  return (
    <div
      className={`p-2 rounded-lg transition-colors relative group/tooltip ${
        active ? "text-amber-700 bg-amber-100" : "text-neutral-300 bg-neutral-100"
      }`}
    >
      {icon}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {tooltip}: {active ? "Var" : "Yok"}
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
