"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle, Info, Trash, Check, MapPin } from "@phosphor-icons/react";
import Papa from "papaparse";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (listName: string, items: any[]) => Promise<void>;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [fileName, setFileName] = useState("");
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.split('.')[0];
    setFileName(name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.type === "FeatureCollection") {
            const items = json.features.map((f: any) => {
              const url = f.properties.google_maps_url || f.properties.url;
              const coords = extractCoordsFromUrl(url);
              return {
                name: f.properties.location?.name || f.properties.name || "Adsız Mekan",
                address: f.properties.location?.address || f.properties.address,
                google_maps_url: url,
                latitude: f.geometry?.coordinates?.[1] || coords.lat,
                longitude: f.geometry?.coordinates?.[0] || coords.lng,
                note: f.properties.note,
                metadata: f.properties
              };
            });
            processItems(items);
          }
        } catch (err) {
          alert("JSON işlenirken hata oluştu");
        }
      };
      reader.readAsText(file);
    } else if (extension === 'csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        
        console.log("--- CSV OKUMA BAŞLADI ---");
        console.log("İlk 5 satır:", lines.slice(0, 5));

        let headerIndex = lines.findIndex(l => 
          l.toUpperCase().includes('URL') || 
          l.toUpperCase().includes('BAŞLIK') || 
          l.toUpperCase().includes('TITLE')
        );
        
        console.log("Header Satırı Indeksi:", headerIndex);
        if (headerIndex === -1) {
          console.warn("Başlık satırı bulunamadı, 0. satırdan başlanıyor.");
          headerIndex = 0;
        }
        
        const cleanContent = lines.slice(headerIndex).join('\n');

        Papa.parse(cleanContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("PapaParse Sonuçları (İlk 2 Satır):", results.data.slice(0, 2));
            try {
              const items = results.data.map((row: any, idx: number) => {
                const url = row["URL"] || row["url"] || "";
                const coords = extractCoordsFromUrl(url);
                
                // Debug log for each row (Limit to first 5)
                if (idx < 5) console.log(`Satır ${idx} işleniyor:`, { name: row["Başlık"] || row["Title"], url, coords });

                const rawLat = row["Latitude"] || row["Enlem"] || row["latitude"] || row["enlem"];
                const rawLng = row["Longitude"] || row["Boylam"] || row["longitude"] || row["boylam"];

                return {
                  name: row["Başlık"] || row["Title"] || row["Name"] || row["name"] || row["başlık"],
                  address: row["Adres"] || row["Address"] || row["address"] || row["adres"],
                  google_maps_url: url,
                  latitude: rawLat ? parseFloat(String(rawLat)) : coords.lat,
                  longitude: rawLng ? parseFloat(String(rawLng)) : coords.lng,
                  note: row["Not"] || row["Note"] || row["Comment"] || row["note"] || row["not"],
                  metadata: row
                };
              }).filter((i: any) => i.name);
              
              console.log("İşlem Tamamlandı. Toplam Mekan:", items.length);
              processItems(items);
            } catch (err) {
              console.error("CSV Parse Error:", err);
              alert("CSV işlenirken hata oluştu");
            }
          }
        });
      };
      reader.readAsText(file);
    }
  };

  // Helper to extract coordinates from Google Maps URLs (Expanded patterns)
  const extractCoordsFromUrl = (url: string) => {
    if (!url || typeof url !== 'string') return { lat: undefined, lng: undefined };
    
    // Pattern 1: @41.0082,28.9784 (Standard Search/Place)
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = url.match(atPattern);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    // Pattern 2: !3d41.0082!4d28.9784 (Place Details)
    const bangPattern = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const bangMatch = url.match(bangPattern);
    if (bangMatch) return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]) };

    // Pattern 3: ll=41.0082,28.9784 (Legacy/Embed)
    const llPattern = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = url.match(llPattern);
    if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

    return { lat: undefined, lng: undefined };
  };

  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeMissingItems = async () => {
    setIsGeocoding(true);
    const newItems = [...parsedItems];
    
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (!item.latitude || !item.longitude) {
        try {
          // Nominatim usage policy: 1 request per second
          const query = encodeURIComponent(`${item.name}, İstanbul`);
          const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
          const data = await response.json();
          
          if (data && data[0]) {
            newItems[i] = {
              ...item,
              latitude: parseFloat(data[0].lat),
              longitude: parseFloat(data[0].lon),
              address: data[0].display_name // Adresi de güncelleyelim
            };
            setParsedItems([...newItems]);
          }
          
          // Wait 1 second before next request to respect OSM policy
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error("Geocoding error for:", item.name, err);
        }
      }
    }
    setIsGeocoding(false);
  };

  const processItems = (items: any[]) => {
    setParsedItems(items);
    setSelectedIndices(new Set(items.map((_, i) => i)));
    setStep("preview");
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) newSelected.delete(index);
    else newSelected.add(index);
    setSelectedIndices(newSelected);
  };

  const handleFinalImport = async () => {
    setIsImporting(true);
    try {
      const finalItems = parsedItems.filter((_, i) => selectedIndices.has(i));
      await onImport(fileName, finalItems);
      onClose();
      // Reset state for next time
      setTimeout(() => {
        setStep("upload");
        setParsedItems([]);
      }, 500);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#3D405B]/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            className={`w-full max-w-2xl bg-[#FDFCF8] rounded-[40px] shadow-2xl relative z-10 border border-[#E9E5D9] mx-4 transition-all duration-300 ${step === "preview" ? "h-[80vh]" : "h-auto"}`}
          >
            <div className="p-8 sm:p-10 h-full flex flex-col">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-[#8D99AE] hover:text-[#3D405B] transition-colors"
              >
                <X size={24} weight="bold" />
              </button>

              {step === "upload" ? (
                <div className="flex flex-col items-center text-center">
                  <div className="flex gap-3 mb-8">
                    <div className="w-16 h-16 bg-[#E9EDC9] rounded-2xl flex items-center justify-center text-[#606C38] rotate-[-5deg] shadow-md border border-white">
                      <span className="font-bold text-sm">JSON</span>
                    </div>
                    <div className="w-16 h-16 bg-[#FEFAE0] rounded-2xl flex items-center justify-center text-[#D4A373] rotate-[5deg] shadow-md border border-[#E9E5D9]">
                      <span className="font-bold text-sm">CSV</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black text-[#3D405B] mb-3">Yeni Yerler Ekle</h2>
                  <p className="text-sm text-[#8D99AE] mb-10 leading-relaxed px-4">
                    Google Maps'ten aldığın dosyayı sürükle, senin için haritaya dizelim.
                  </p>

                  <label className="w-full group cursor-pointer">
                    <input 
                      type="file" 
                      accept=".json,.csv" 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <div className="w-full py-12 bg-white border-2 border-dashed border-[#E9E5D9] group-hover:border-[#A3B18A] group-hover:bg-[#F1EDE2]/30 rounded-[32px] transition-all flex flex-col items-center justify-center gap-4">
                      <div className="w-14 h-14 bg-[#F1EDE2] rounded-full flex items-center justify-center text-[#A3B18A] group-hover:scale-110 transition-transform shadow-sm">
                        <Upload size={28} weight="bold" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[#4A4A4A]">Dosyayı Seç veya Sürükle</p>
                        <p className="text-[10px] text-[#8D99AE] mt-1">Google Takeout veya Liste Paylaşımı</p>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black text-[#3D405B] truncate pr-4">{fileName}</h2>
                      <p className="text-sm text-[#8D99AE]">{parsedItems.length} mekan bulundu, aktarılacakları seç.</p>
                    </div>
                    {parsedItems.some(i => !i.latitude || !i.longitude) && (
                      <button 
                        onClick={geocodeMissingItems}
                        disabled={isGeocoding}
                        className="shrink-0 px-4 py-2 bg-[#FEFAE0] hover:bg-[#F9F4C6] text-[#D4A373] rounded-xl text-[10px] font-bold border border-[#E9E5D9] transition-all flex items-center gap-2"
                      >
                        {isGeocoding ? (
                          <div className="w-3 h-3 border-2 border-[#D4A373]/30 border-t-[#D4A373] rounded-full animate-spin" />
                        ) : (
                          <MapPin weight="bold" size={14} />
                        )}
                        {isGeocoding ? "Aranıyor..." : "Konumları Bul (OSM)"}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2 mb-6">
                    {parsedItems.map((item, index) => (
                      <div 
                        key={index}
                        onClick={() => toggleSelect(index)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedIndices.has(index) ? "bg-white border-[#A3B18A] shadow-sm" : "bg-[#F1EDE2]/30 border-transparent opacity-60"}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${selectedIndices.has(index) ? "bg-[#A3B18A] border-[#A3B18A] text-white" : "border-[#E9E5D9]"}`}>
                          {selectedIndices.has(index) && <Check size={14} weight="bold" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#3D405B] text-sm truncate">{item.name}</p>
                          <p className="text-[10px] text-[#8D99AE] truncate">{item.address || "Adres bilgisi yok"}</p>
                        </div>
                        {(!item.latitude || !item.longitude) && (
                          <div className="px-2 py-1 bg-[#FEFAE0] rounded-md border border-[#E9E5D9] flex items-center gap-1 shrink-0">
                            <Info size={12} className="text-[#D4A373]" />
                            <span className="text-[9px] font-bold text-[#D4A373]">
                              {item.google_maps_url ? "Sadece Link" : "Konum Yok"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStep("upload")}
                      className="px-6 py-4 rounded-2xl font-bold text-[#8D99AE] hover:bg-[#F1EDE2] transition-colors"
                    >
                      Geri
                    </button>
                    <button 
                      onClick={handleFinalImport}
                      disabled={isImporting || selectedIndices.size === 0}
                      className="flex-1 py-4 bg-[#A3B18A] hover:bg-[#8A9A5B] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#A3B18A]/30 flex items-center justify-center gap-2"
                    >
                      {isImporting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle weight="bold" size={20} />
                          {selectedIndices.size} Mekanı Aktar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
