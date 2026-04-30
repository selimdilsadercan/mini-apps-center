"use client";

import React, { useState, useEffect, useMemo } from "react";
import Client, { map_tracker, Local } from "@/lib/client";
import { 
  Plus, 
  MapTrifold as MapIcon, 
  List as ListIcon, 
  CheckCircle, 
  Circle, 
  MapPin,
  CaretRight
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ImportModal from "./components/ImportModal";

// Dynamic import for MapComponent to avoid window is not defined error
const MapComponent = dynamic(
  () => import("./components/MapComponent"),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-[#F1EDE2] animate-pulse flex items-center justify-center text-[#8D99AE]">Harita yükleniyor...</div>
  }
);

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
      setData({
        lists: res?.lists || [],
        items: res?.items || []
      });
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
        items: (prev?.items || []).map(item => 
          item.id === id ? { ...item, is_visited: !item.is_visited } : item
        )
      }));
    } catch (err) {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleImport = async (listName: string, items: any[]) => {
    try {
      await client.map_tracker.importItems({ listName, items });
      toast.success(`${listName} başarıyla içe aktarıldı`);
      fetchData();
    } catch (err) {
      toast.error("İçe aktarma sırasında bir hata oluştu");
      throw err;
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedListId === "all") return data?.items || [];
    return (data?.items || []).filter(item => item.list_id === selectedListId);
  }, [data.items, selectedListId]);

  return (
    <>
      <ImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImport}
      />

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
          {(data?.lists || []).map(list => (
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
                <MapComponent 
                  items={filteredItems} 
                  onToggleVisited={handleToggleVisited} 
                />
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
      </div>
    </>
  );
}
