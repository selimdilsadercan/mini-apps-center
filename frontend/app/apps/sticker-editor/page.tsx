"use client";

import React, { useEffect, useRef, useState } from "react";
import { registerPlugin, Capacitor } from "@capacitor/core";
import * as fabric from "fabric";
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Undo, 
  Redo, 
  Smile, 
  Save, 
  ArrowLeft,
  Settings2,
  Layers,
  Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "react-hot-toast";

const STICKER_SIZE = 512;

interface WhatsAppStickerPlugin {
  addStickerPack(options: {
    identifier: string;
    name: string;
    publisher: string;
    stickerBase64: string;
    trayIconBase64?: string;
  }): Promise<void>;
}

const WhatsAppSticker = registerPlugin<WhatsAppStickerPlugin>("WhatsAppSticker");

export default function StickerEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "text" | "stickers" | "settings">("image");
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  
  // Debug log helper
  const logDebug = (msg: string) => {
    console.log(`[DEBUG] ${msg}`);
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    logDebug(`Platform: ${Capacitor.getPlatform()}`);
    logDebug(`WhatsAppSticker Plugin: ${WhatsAppSticker ? "Defined" : "Undefined"}`);
    
    if (!canvasRef.current) return;

    // Fabric 6.x initialization
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: STICKER_SIZE,
      height: STICKER_SIZE,
      backgroundColor: "transparent",
    });

    setCanvas(fabricCanvas);

    fabricCanvas.on("selection:created", (e) => setSelectedObject(e.selected?.[0] || null));
    fabricCanvas.on("selection:updated", (e) => setSelectedObject(e.selected?.[0] || null));
    fabricCanvas.on("selection:cleared", () => setSelectedObject(null));

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = async (f) => {
      const data = f.target?.result as string;
      
      // Fabric 6.x Image loading
      try {
        const img = await fabric.FabricImage.fromURL(data);
        
        const scale = Math.min(
          (STICKER_SIZE * 0.8) / img.width!,
          (STICKER_SIZE * 0.8) / img.height!
        );
        
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: STICKER_SIZE / 2,
          top: STICKER_SIZE / 2,
          originX: "center",
          originY: "center",
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      } catch (err) {
        console.error("Error loading image", err);
        toast.error("Resim yüklenirken hata oluştu.");
      }
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText("Sticker Yazısı", {
      left: STICKER_SIZE / 2,
      top: STICKER_SIZE / 2,
      fontFamily: "Inter",
      fontSize: 40,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const exportAsWebP = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: "webp",
      quality: 0.8,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = "whatsapp-sticker.webp";
    link.href = dataURL;
    link.click();
    toast.success("Sticker WebP olarak indirildi!");
  };

  const addToWhatsApp = async () => {
    if (!canvas) return;

    if (Capacitor.getPlatform() === "web") {
      toast.error("WhatsApp'a doğrudan ekleme özelliği sadece mobil uygulamada çalışır. Lütfen sticker'ı indirip manuel paylaşın.");
      return;
    }

    const loadingToast = toast.loading("WhatsApp'a hazırlanıyor...");
    
    logDebug("WhatsApp'a ekleme başlatıldı...");
    
    try {
      // 1. Ana Sticker: 512x512
      const stickerBase64 = canvas.toDataURL({
        format: 'webp',
        quality: 0.8,
        multiplier: 1,
      });
      logDebug(`Sticker hazır (Base64: ${stickerBase64.length})`);

      // 2. Tray Icon: 96x96
      const trayBase64 = canvas.toDataURL({
        format: 'png',
        quality: 0.7,
        multiplier: 96 / STICKER_SIZE,
      });
      logDebug(`Tray Icon hazır (96x96)`);

      // 3. Native Plugin'i çağır
      logDebug("Native plugin çağrılıyor: addStickerPack...");
      await WhatsAppSticker.addStickerPack({
        identifier: "mini_apps_pack_" + Date.now(),
        name: "Mini Apps Sticker",
        publisher: "Mini Apps Center",
        stickerBase64: stickerBase64,
        trayIconBase64: trayBase64,
      });

      logDebug("Native çağrı başarılı, WhatsApp açılıyor olmalı.");
      toast.success("WhatsApp'a yönlendiriliyorsunuz!", { id: loadingToast });
    } catch (err: any) {
      logDebug(`HATA: ${err.message}`);
      console.error("Native Bridge Error:", err);
      toast.error("Hata: " + err.message, { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Sticker Maker
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAsWebP} className="gap-2 border-white/20 bg-white/5">
            <Download className="w-4 h-4" /> İndir
          </Button>
          <Button size="sm" onClick={addToWhatsApp} className="gap-2 bg-green-600 hover:bg-green-500 text-white">
            <Save className="w-4 h-4" /> WhatsApp'a Ekle
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex items-center justify-center relative">
          <div className="relative group">
            {/* Checkerboard pattern background */}
            <div className="absolute inset-0 w-[512px] h-[512px] bg-[#111] bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px] rounded-lg shadow-2xl border border-white/5" />
            
            <div className="relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-lg overflow-hidden border border-white/10">
              <canvas ref={canvasRef} />
            </div>

            {/* Canvas Actions Overlay */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="secondary" size="sm" onClick={deleteSelected} disabled={!selectedObject} className="bg-red-900/80 backdrop-blur-md border border-red-500/20">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Tools */}
        <div className="w-full lg:w-80 flex flex-col gap-4 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex gap-1 p-1 bg-black/30 rounded-lg">
            {[
              { id: "image", icon: ImageIcon, label: "Resim" },
              { id: "text", icon: Type, label: "Yazı" },
              { id: "settings", icon: Settings2, label: "Paket" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all ${
                  activeTab === tab.id ? "bg-white/10 text-green-400 shadow-lg" : "text-neutral-500 hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === "image" && (
                <motion.div
                  key="image"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Resim Yükle</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-neutral-500 mb-2 group-hover:text-green-500 transition-colors" />
                        <p className="text-xs text-neutral-400">PNG veya JPG seçin</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-300 leading-relaxed">
                      💡 <b>İpucu:</b> Şeffaf arka planlı (PNG) resimler WhatsApp'ta daha profesyonel görünür.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "text" && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <Button onClick={addText} className="w-full gap-2 bg-white/10 hover:bg-white/20 border border-white/10">
                    <Plus className="w-4 h-4" /> Metin Ekle
                  </Button>
                  
                  {selectedObject?.type === "i-text" && (
                    <div className="p-4 bg-black/40 rounded-xl space-y-4 border border-white/5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-tighter">Renk</label>
                        <div className="flex flex-wrap gap-2">
                          {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"].map((color) => (
                            <button
                              key={color}
                              className="w-8 h-8 rounded-full border border-white/10 shadow-inner hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                (selectedObject as fabric.IText).set("fill", color);
                                canvas?.renderAll();
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1">Paket Adı</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Komik Miimler" 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1">Yapımcı</label>
                      <input 
                        type="text" 
                        placeholder="Senin Adın" 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {canvas?.getObjects().length || 0} Katman</span>
            <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> 512x512 WebP</span>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      {/* Debug Console Toggle & Overlay */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-2">
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => setShowDebug(!showDebug)}
          className="rounded-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg text-[10px] h-8 px-3"
        >
          {showDebug ? "Debug Kapat" : "Debug Console"}
        </Button>

        {showDebug && (
          <div className="w-[300px] max-h-[200px] bg-black/90 border border-yellow-500/50 rounded-lg overflow-y-auto p-2 font-mono text-[10px] text-yellow-500 shadow-2xl backdrop-blur-xl">
            <div className="flex justify-between items-center mb-1 border-b border-yellow-500/20 pb-1">
              <span className="font-bold">SYSTEM LOGS</span>
              <button onClick={() => setLogs([])} className="underline opacity-70">Clear</button>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="mb-1 last:mb-0 break-all">{log}</div>
            ))}
            {logs.length === 0 && <div className="opacity-50 italic">Log yok...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
