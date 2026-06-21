"use client";

import { useState } from "react";
import { FileCode, Plus } from "@phosphor-icons/react";
import { useDigitalMenu } from "../context";
import { createBrowserClient } from "@/lib/api";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

export default function BulkPage() {
  const { id, menuCategories, refreshData, refreshPreview } = useDigitalMenu();
  
  const [bulkJson, setBulkJson] = useState("");
  const [importing, setImporting] = useState(false);

  const handleBulkImport = async () => {
    try {
      const data = JSON.parse(bulkJson);
      
      setImporting(true);
      toast.loading("Ürünler içe aktarılıyor...", { id: "bulk-import" });

      const categoryMap = new Map<string, string>();
      menuCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id));

      // Handle both formats: flat array or nested categories object
      const categories = Array.isArray(data) 
        ? [{ name: "Genel", items: data }] 
        : (data.categories || []);

      for (const cat of categories) {
        const catName = cat.name || "Genel";
        let catId = categoryMap.get(catName.toLowerCase());

        if (!catId) {
          const res = await client.digital_menu.addCategory({ businessId: id, name: catName });
          if (res.category) {
            catId = res.category.id;
            categoryMap.set(catName.toLowerCase(), catId);
          } else {
            throw new Error(`Kategori oluşturulamadı: ${catName}`);
          }
        }

        const items = cat.items || [];
        for (const item of items) {
          await client.digital_menu.addMenuItem({
            categoryId: catId,
            name: item.name,
            description: item.description || "",
            price: parseFloat(item.price) || 0,
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
            dietaryFlags: item.dietaryFlags || []
          });
        }
      }

      toast.success("Tüm ürünler başarıyla eklendi!", { id: "bulk-import" });
      setBulkJson("");
      await refreshData();
      refreshPreview();
    } catch (err: any) {
      console.error(err);
      toast.error(`Hata: ${err.message}`, { id: "bulk-import" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-stone-200/60 px-8 py-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <FileCode size={20} className="text-purple-500" />
            Toplu Ürün Ekle
          </h2>
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-0.5">
            JSON formatında menü içeriği yükleyin
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                <FileCode size={20} className="text-purple-500" />
                JSON Verisi
              </h3>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-1">
                Aşağıdaki formatta ürün listenizi yapıştırın
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder={`[
  {
    "category": "Kahveler",
    "name": "Espresso",
    "description": "Double shot",
    "price": 50,
    "imageUrl": "",
    "dietaryFlags": ["vegan"]
  }
]`}
                className="w-full h-80 bg-stone-50 border border-stone-200 rounded-3xl p-6 text-xs font-mono text-stone-800 focus:border-purple-500 focus:bg-white outline-none transition-all resize-none"
              />
              
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <p className="text-[9px] text-purple-700 font-bold leading-relaxed">
                  💡 İpucu: Kategori mevcut değilse otomatik olarak oluşturulacaktır. Fiyatları sayı formatında girin.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleBulkImport}
              disabled={importing || !bulkJson.trim()}
              className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-stone-900/20 hover:bg-stone-800 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {importing ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={18} weight="bold" />
              )}
              Ürünleri İçe Aktar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
