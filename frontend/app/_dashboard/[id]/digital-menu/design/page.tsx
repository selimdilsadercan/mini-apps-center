"use client";

import { useState, useEffect } from "react";
import { Palette, Tag, Check } from "@phosphor-icons/react";
import { useDigitalMenu } from "../context";
import { createBrowserClient } from "@/lib/api";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

export default function DesignPage() {
  const { id, business, refreshData, refreshPreview } = useDigitalMenu();
  
  const [themeColor, setThemeColor] = useState("#EF4444");
  const [fontFamily, setFontFamily] = useState("sans");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business) {
      setThemeColor(business.theme_color);
      setFontFamily(business.font_family || "sans");
    }
  }, [business]);

  const handleUpdateDesign = async () => {
    if (!business) return;
    try {
      setSaving(true);
      const res = await client.business.updateBusiness({
        businessId: id,
        name: business.name,
        description: business.description || "",
        logoUrl: business.logo_url || "",
        themeColor: themeColor,
        fontFamily: fontFamily
      });
      if (res.business) {
        toast.success("Tasarım ayarları güncellendi!");
        await refreshData();
        refreshPreview();
      }
    } catch (err) {
      console.error(err);
      toast.error("Tasarım güncellenirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-stone-200/60 px-8 py-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <Palette size={20} className="text-amber-500" />
            Tasarım Stili
          </h2>
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-0.5">
            Menünüzün görünümünü özelleştirin
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
          {/* Theme Color Selection */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                <Palette size={20} className="text-amber-500" />
                Tema Rengi
              </h3>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-1">
                Menünüzün ana vurgu rengini seçin
              </p>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                { name: "Kırmızı", color: "#EF4444" },
                { name: "Turuncu", color: "#F97316" },
                { name: "Amber", color: "#F59E0B" },
                { name: "Yeşil", color: "#10B981" },
                { name: "Mavi", color: "#3B82F6" },
                { name: "İndigo", color: "#6366F1" },
                { name: "Mor", color: "#8B5CF6" },
                { name: "Pembe", color: "#EC4899" },
                { name: "Taş", color: "#44403C" },
                { name: "Siyah", color: "#000000" },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setThemeColor(c.color)}
                  className={`group relative aspect-square rounded-2xl transition-all active:scale-90 flex items-center justify-center ${
                    themeColor === c.color ? "ring-2 ring-offset-4 ring-stone-900 shadow-lg" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.color }}
                >
                  {themeColor === c.color && (
                    <Check size={20} weight="bold" className="text-white drop-shadow-sm" />
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Selection */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                <Tag size={20} className="text-blue-500" />
                Yazı Tipi (Font)
              </h3>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-1">
                Menü metinlerinin stilini belirleyin
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "sans", name: "Modern Sans", desc: "Temiz ve modern görünüm", preview: "Abc 123", class: "font-sans" },
                { id: "serif", name: "Elegant Serif", desc: "Klasik ve şık restoran stili", preview: "Abc 123", class: "font-serif" },
                { id: "mono", name: "Minimal Mono", desc: "Teknik ve endüstriyel hava", preview: "Abc 123", class: "font-mono" },
                { id: "display", name: "Bold Display", desc: "Dikkat çekici ve güçlü", preview: "Abc 123", class: "font-black" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontFamily(f.id)}
                  className={`p-5 rounded-3xl border-2 text-left transition-all active:scale-[0.98] ${
                    fontFamily === f.id
                      ? "border-stone-900 bg-stone-900 text-white shadow-xl"
                      : "border-stone-100 bg-stone-50 text-stone-600 hover:border-stone-200"
                  }`}
                >
                  <div className={`text-2xl mb-2 ${f.class}`}>{f.preview}</div>
                  <div className="text-[11px] font-black uppercase tracking-wider">{f.name}</div>
                  <div className={`text-[9px] mt-1 opacity-60 ${fontFamily === f.id ? "text-white" : "text-stone-400"}`}>
                    {f.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleUpdateDesign}
              disabled={saving}
              className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={18} weight="bold" />
              )}
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
