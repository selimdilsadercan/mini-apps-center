"use client";

import React, { useState, useEffect, useMemo } from "react";
import Client, { map_tracker, Local } from "@/lib/client";
import { 
  Plus, 
  Map as MapIcon, 
  List as ListIcon, 
  CheckCircle, 
  Circle, 
  Upload,
  X,
  MapPin,
  CaretRight,
  Info
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Leaflet is client-side only
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DefaultIcon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}) : null;

const client = new Client(Local);

export default function MapTrackerPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [data, setData] = useState<{ lists: any[]; items: any[] }>({ lists: [], items: [] });
  const [selectedListId, setSelectedListId] = useState<string | "all">("all");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await client.map_tracker.getData();
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisited = async (id: string) => {
    try {
      await client.map_tracker.toggleVisited(id);
      setData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.id === id ? { ...item, is_visited: !item.is_visited } : item
        )
      }));
    } catch (err) {
      toast.error("Durum güncellenemedi");
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedListId === "all") return data.items;
    return data.items.filter(item => item.list_id === selectedListId);
  }, [data.items, selectedListId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.split('.')[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.type === "FeatureCollection") {
            const items = json.features.map((f: any) => ({
              name: f.properties.location?.name || f.properties.name || "Adsız Mekan",
              address: f.properties.location?.address || f.properties.address,
              google_maps_url: f.properties.google_maps_url || f.properties.url,
              latitude: f.geometry.coordinates[1],
              longitude: f.geometry.coordinates[0],
              note: f.properties.note,
              metadata: f.properties
            }));
            await client.map_tracker.importItems({ listName: fileName, items });
            toast.success(`${fileName} başarıyla içe aktarıldı`);
            fetchData();
            setIsImportOpen(false);
          }
        } catch (err) {
          toast.error("JSON işlenirken hata oluştu");
        }
      };
      reader.readAsText(file);
    } else if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const items = results.data.map((row: any) => ({
              name: row["Başlık"] || row["Title"],
              google_maps_url: row["URL"],
              note: row["Not"] || row["Note"],
              metadata: row
            })).filter(i => i.name);
            
            await client.map_tracker.importItems({ listName: fileName, items });
            toast.success(`${fileName} başarıyla içe aktarıldı`);
            fetchData();
            setIsImportOpen(false);
          } catch (err) {
            toast.error("CSV işlenirken hata oluştu");
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#4A4A4A] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FDFCF8]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#E9E5D9]">
        <div>
          <h1 className="text-xl font-semibold text-[#3D405B]">Harita Takip</h1>
          <p className="text-xs text-[#8D99AE]">Kezbanın chill gezi rehberi</p>
        </div>
        
        <div className="flex bg-[#F1EDE2] rounded-full p-1 shadow-inner">
          <button 
            onClick={() => setView("map")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === "map" ? "bg-white text-[#3D405B] shadow-sm" : "text-[#8D99AE]"}`}
          >
            Harita
          </button>
          <button 
            onClick={() => setView("list")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === "list" ? "bg-white text-[#3D405B] shadow-sm" : "text-[#8D99AE]"}`}
          >
            Liste
          </button>
        </div>

        <button 
          onClick={() => setIsImportOpen(true)}
          className="bg-[#A3B18A] hover:bg-[#8A9A5B] text-white p-2 rounded-full transition-colors shadow-md"
        >
          <Plus weight="bold" size={20} />
        </button>
      </header>

      {/* Categories Bar */}
      <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide border-b border-[#E9E5D9]">
        <button 
          onClick={() => setSelectedListId("all")}
          className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedListId === "all" ? "bg-[#3D405B] text-white" : "bg-[#F1EDE2] text-[#4A4A4A] hover:bg-[#E9E5D9]"}`}
        >
          Tümü
        </button>
        {data.lists.map(list => (
          <button 
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${selectedListId === list.id ? "bg-[#3D405B] text-white" : "bg-[#F1EDE2] text-[#4A4A4A] hover:bg-[#E9E5D9]"}`}
          >
            {list.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="h-[calc(100vh-140px)] relative">
        <AnimatePresence mode="wait">
          {view === "map" ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-[#E5E5E5]"
            >
              {typeof window !== 'undefined' && (
                <MapContainer 
                  center={[41.0082, 28.9784]} 
                  zoom={12} 
                  className="h-full w-full"
                  style={{ background: '#F1EDE2' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {filteredItems.filter(i => i.latitude && i.longitude).map(item => (
                    <Marker 
                      key={item.id} 
                      position={[item.latitude, item.longitude]}
                      icon={DefaultIcon!}
                    >
                      <Popup>
                        <div className="p-1 font-sans">
                          <h3 className="font-bold text-[#3D405B]">{item.name}</h3>
                          <p className="text-xs text-[#8D99AE] mb-2">{item.address}</p>
                          <button 
                            onClick={() => handleToggleVisited(item.id)}
                            className={`w-full py-1.5 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors ${item.is_visited ? "bg-[#A3B18A] text-white" : "bg-[#F1EDE2] text-[#4A4A4A]"}`}
                          >
                            {item.is_visited ? <CheckCircle weight="fill" /> : <Circle />}
                            {item.is_visited ? "Gidildi" : "Gidilmedi"}
                          </button>
                          {item.google_maps_url && (
                            <a 
                              href={item.google_maps_url} 
                              target="_blank" 
                              className="block mt-2 text-center text-xs text-blue-500 underline"
                            >
                              Maps'te Aç
                            </a>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="h-full overflow-y-auto p-4 space-y-3"
            >
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <MapPin size={64} weight="light" />
                  <p className="mt-4 font-medium">Burada henüz bir yer yok.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-[#F1EDE2] flex items-center gap-4 group hover:shadow-md transition-shadow"
                  >
                    <button 
                      onClick={() => handleToggleVisited(item.id)}
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.is_visited ? "bg-[#A3B18A] text-white" : "bg-[#F1EDE2] text-[#8D99AE]"}`}
                    >
                      {item.is_visited ? <CheckCircle size={24} weight="fill" /> : <Circle size={24} />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#3D405B] truncate">{item.name}</h3>
                      <p className="text-xs text-[#8D99AE] truncate">{item.address || "Adres bilgisi yok"}</p>
                    </div>

                    <a 
                      href={item.google_maps_url} 
                      target="_blank"
                      className="shrink-0 w-8 h-8 rounded-full bg-[#FDFCF8] flex items-center justify-center border border-[#F1EDE2] text-[#8D99AE] hover:text-[#3D405B] transition-colors"
                    >
                      <CaretRight weight="bold" />
                    </a>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#3D405B]/20 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsImportOpen(false)}
                className="absolute top-6 right-6 text-[#8D99AE] hover:text-[#3D405B]"
              >
                <X size={24} weight="bold" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#F1EDE2] rounded-3xl flex items-center justify-center text-[#A3B18A] mb-4">
                  <Upload size={32} weight="duotone" />
                </div>
                <h2 className="text-xl font-bold text-[#3D405B]">Liste Yükle</h2>
                <p className="text-sm text-[#8D99AE] mt-2 mb-8">
                  Google Maps'ten indirdiğin .json veya .csv dosyasını buraya bırakabilirsin.
                </p>

                <label className="w-full">
                  <input 
                    type="file" 
                    accept=".json,.csv" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <div className="w-full py-4 bg-[#A3B18A] hover:bg-[#8A9A5B] text-white rounded-2xl font-bold transition-colors cursor-pointer shadow-lg shadow-[#A3B18A]/30">
                    Dosya Seç
                  </div>
                </label>

                <div className="mt-8 p-4 bg-[#F1EDE2] rounded-2xl w-full text-left flex gap-3">
                  <Info size={20} className="shrink-0 text-[#A3B18A]" />
                  <p className="text-[11px] text-[#4A4A4A] leading-relaxed">
                    Maps {">"} Yerleriniz {">"} Liste Seç {">"} Paylaş/Dışa Aktar adımlarını izleyerek dosyayı alabilirsin.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
