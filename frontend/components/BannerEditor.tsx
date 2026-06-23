"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toBlob } from "html-to-image";
import { 
  X, 
  Check, 
  Image as ImageIcon, 
  UploadSimple, 
  ArrowsOut, 
  Palette,
  Layout
} from "@phosphor-icons/react";

interface BannerEditorProps {
  logoUrl: string | null;
  initialHeaderUrl: string | null;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export const BannerEditor: React.FC<BannerEditorProps> = ({
  logoUrl,
  initialHeaderUrl,
  onSave,
  onClose
}) => {
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgImage, setBgImage] = useState<string | null>(initialHeaderUrl);
  const [logoPos, setLogoPos] = useState({ x: 0, y: 0 });
  const [logoSize, setLogoSize] = useState(100);
  const [isSaving, setIsSaving] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (prev) => setBgImage(prev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!bannerRef.current) return;
    try {
      setIsSaving(true);
      // We use a higher scale for better quality
      const blob = await toBlob(bannerRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      if (blob) {
        await onSave(blob);
      }
    } catch (err) {
      console.error("Banner save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-stone-900 tracking-tight">Banner Tasarımcısı</h3>
            <p className="text-stone-400 text-xs font-medium">Görseli sürükleyerek yerini ayarlayın, arka planı özelleştirin.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-all"
          >
            <X size={24} weight="bold" className="text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8">
          {/* Preview Area */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">Önizleme (1200x400)</label>
            <div className="relative w-full aspect-[3/1] rounded-3xl overflow-hidden border-2 border-stone-200 shadow-inner bg-stone-50">
              <div 
                ref={bannerRef}
                className="absolute inset-0 w-full h-full"
                style={{ backgroundColor: bgColor }}
              >
                {bgImage && (
                  <img 
                    src={bgImage} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                )}
                
                {logoUrl && (
                  <motion.div
                    drag
                    dragMomentum={false}
                    dragConstraints={bannerRef}
                    initial={logoPos}
                    onDragEnd={(_, info) => setLogoPos({ x: info.point.x, y: info.point.y })}
                    className="absolute cursor-move touch-none"
                    style={{ 
                      width: logoSize, 
                      height: logoSize,
                      left: "50%",
                      top: "50%",
                      marginLeft: -logoSize / 2,
                      marginTop: -logoSize / 2
                    }}
                  >
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-full h-full object-contain pointer-events-none drop-shadow-lg" 
                    />
                  </motion.div>
                )}
              </div>
              
              {/* Overlay info */}
              <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Sürükle & Bırak</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Background Controls */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-900">
                  <Palette size={20} weight="bold" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Arka Plan</h4>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider ml-1">Renk Seçimi</p>
                  <div className="flex flex-wrap gap-2">
                    {["#ffffff", "#f5f5f4", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#000000"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setBgColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          bgColor === c ? "border-stone-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input 
                      type="color" 
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-full border-none p-0 overflow-hidden cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider ml-1">Arka Plan Görseli</p>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={bgInputRef}
                      onChange={handleBgUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => bgInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all"
                    >
                      <UploadSimple size={16} weight="bold" />
                      Görsel Yükle
                    </button>
                    {bgImage && (
                      <button
                        onClick={() => setBgImage(null)}
                        className="px-4 py-2.5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Controls */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-stone-900">
                  <ArrowsOut size={20} weight="bold" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Logo Ayarları</h4>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Logo Boyutu</p>
                    <span className="text-[10px] font-black text-stone-900">{logoSize}px</span>
                  </div>
                  <input 
                    type="range"
                    min="40"
                    max="300"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="w-full accent-stone-900"
                  />
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                    <Layout size={14} className="inline mr-1 mb-0.5" weight="bold" />
                    Logoyu önizleme alanında istediğiniz yere sürükleyerek bırakabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-stone-500 hover:bg-stone-100 transition-all"
          >
            Vazgeç
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-stone-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-stone-900/10 hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={18} weight="bold" />
            )}
            {isSaving ? "Hazırlanıyor..." : "Tasarımı Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
};
