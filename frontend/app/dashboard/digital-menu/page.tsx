"use client";

import { useState } from "react";
import { Tag, Plus, Eye, EyeSlash, Check } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { toast } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { useDigitalMenu } from "./context";
import { digital_menu } from "@/lib/client";

const client = createBrowserClient();

export default function MenuContentPage() {
  const { id, loading, menuCategories, menuItems, selectedCategoryId, refreshData, refreshPreview } = useDigitalMenu();
  
  // Forms
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<digital_menu.MenuItem | null>(null);
  
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemDietary, setNewItemDietary] = useState<string[]>([]);

  // Unsplash Search
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<string[]>([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);

  const selectedCategory = menuCategories.find(c => c.id === selectedCategoryId);
  const itemsInSelectedCategory = menuItems.filter(i => i.category_id === selectedCategoryId);

  const handleEditClick = (item: digital_menu.MenuItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description || "");
    setNewItemPrice(item.price.toString());
    setNewItemImage(item.image_url || "");
    setNewItemCategory(item.category_id);
    setNewItemDietary(item.dietary_flags || []);
    setUnsplashQuery(item.name);
    setUnsplashResults([]);
    setIsAddItemOpen(true);
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemImage("");
    setNewItemCategory(selectedCategoryId || "");
    setNewItemDietary([]);
    setUnsplashQuery("");
    setUnsplashResults([]);
    setIsAddItemOpen(true);
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const catToUse = newItemCategory || selectedCategoryId;
    if (!catToUse) {
      toast.error("Lütfen bir kategori seçin.");
      return;
    }
    try {
      if (editingItem) {
        const res = await client.digital_menu.updateMenuItem({
          itemId: editingItem.id,
          categoryId: catToUse,
          name: newItemName,
          description: newItemDesc,
          price: parseFloat(newItemPrice) || 0,
          imageUrl: newItemImage,
          dietaryFlags: newItemDietary
        });
        if (res.item) {
          toast.success("Ürün güncellendi!");
          setIsAddItemOpen(false);
          await refreshData();
          refreshPreview();
        }
      } else {
        const res = await client.digital_menu.addMenuItem({
          categoryId: catToUse,
          name: newItemName,
          description: newItemDesc,
          price: parseFloat(newItemPrice) || 0,
          imageUrl: newItemImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
          dietaryFlags: newItemDietary
        });
        if (res.item) {
          toast.success("Ürün menüye eklendi!");
          setIsAddItemOpen(false);
          await refreshData();
          refreshPreview();
        }
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const handleToggleItemAvailability = async (itemId: string) => {
    try {
      const res = await client.digital_menu.toggleAvailability(itemId);
      if (res.success) {
        toast.success(res.isAvailable ? "Ürün satışa açıldı." : "Ürün tükendi olarak işaretlendi.");
        await refreshData();
        refreshPreview();
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  const handleUnsplashSearch = async () => {
    const q = unsplashQuery.trim() || newItemName.trim();
    if (!q) {
      toast.error("Lütfen bir arama kelimesi girin.");
      return;
    }
    try {
      setSearchingUnsplash(true);
      const res = await client.digital_menu.searchUnsplash({ query: q });
      setUnsplashResults(res.urls || []);
    } catch (err) {
      toast.error("Görsel aranırken hata oluştu.");
    } finally {
      setSearchingUnsplash(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Panel */}
      <div className="bg-white border-b border-stone-200/60 px-8 py-6 flex justify-between items-center shrink-0">
        {selectedCategory ? (
          <div>
            <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
              <Tag size={20} className="text-red-500" />
              {selectedCategory.name}
            </h2>
            <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-0.5">
              Bu kategoride {itemsInSelectedCategory.length} ürün listeleniyor
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
              <Tag size={20} className="text-stone-300" />
              Menü İçeriği
            </h2>
            <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-0.5">
              Lütfen sol panelden bir kategori seçin
            </p>
          </div>
        )}
        
        {selectedCategory && (
          <button
            onClick={handleAddClick}
            className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3.5 rounded-2xl shadow-md shadow-red-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            ÜRÜN EKLE
          </button>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedCategory ? (
          itemsInSelectedCategory.length === 0 ? (
            <div className="h-full max-h-[400px] border border-dashed border-stone-200/80 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center bg-white shadow-sm">
              <Tag size={40} className="text-stone-300 mb-3" />
              <p className="text-stone-800 text-xs font-black uppercase tracking-wider">Bu Kategori Boş</p>
              <p className="text-stone-450 text-[10px] max-w-[240px] leading-relaxed mt-1">
                Bu kategoriye henüz ürün eklemediniz. Sağ üstten Ürün Ekle butonunu kullanarak başlayın.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-6">
              {itemsInSelectedCategory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[2rem] border border-stone-200/80 shadow-sm p-4.5 flex flex-col justify-between hover:border-red-200 transition-all group hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="w-full h-36 rounded-2xl bg-stone-50 border border-stone-150 overflow-hidden relative shrink-0">
                      <img src={item.image_url || ""} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-stone-200/65">
                        <span className="text-[11px] font-black text-red-500">{item.price.toFixed(2)} ₺</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-stone-900 text-xs truncate">{item.name}</h3>
                      <p className="text-[10px] text-stone-450 leading-snug line-clamp-2 h-7.5">{item.description || "Açıklama girilmedi."}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="px-5 py-2.5 rounded-full border border-stone-200 text-[10px] font-black uppercase tracking-wider text-stone-700 hover:bg-stone-50 transition-all active:scale-95 cursor-pointer"
                    >
                      DÜZENLE
                    </button>
                    
                    <button
                      onClick={() => handleToggleItemAvailability(item.id)}
                      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer active:scale-95 ${
                        item.is_available
                          ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-850"
                          : "bg-white text-red-500 border-red-200 hover:bg-red-50/50"
                      }`}
                    >
                      {item.is_available ? (
                        <><EyeSlash size={14} weight="bold" /> GİZLE</>
                      ) : (
                        <><Eye size={14} weight="bold" /> AÇ</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/40 rounded-[2.5rem] border border-dashed border-stone-200">
            <Tag size={48} className="text-stone-300 mb-3" />
            <p className="text-stone-850 text-xs font-black uppercase tracking-wider">Kategori Seçilmedi</p>
            <p className="text-stone-450 text-[10px] max-w-[200px] leading-relaxed mt-1">
              Ürünleri listelemek ve yönetmek için sol panelden bir kategori seçin.
            </p>
          </div>
        )}
      </div>

      {/* Add MenuItem Drawer */}
      <Drawer.Root open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                ÜRÜNÜ {editingItem ? <span className="text-red-500">GÜNCELLE</span> : <span className="text-red-500">EKLE</span>}
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                {editingItem ? "Mevcut ürün kartını güncelleyin" : "Menünüze yeni bir ürün kartı ekleyin"}
              </Drawer.Description>

              <form onSubmit={handleAddMenuItem} className="space-y-4 pb-12">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Kategori Seçimi</label>
                  <select
                    required
                    value={newItemCategory || selectedCategoryId || ""}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 outline-none focus:border-red-500"
                  >
                    <option value="">Seçiniz...</option>
                    {menuCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Ürün Adı</label>
                  <input
                    required
                    placeholder="Cortado"
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value);
                      setUnsplashQuery(e.target.value);
                    }}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Açıklama</label>
                  <input
                    placeholder="Eşit miktarda espresso ve sıcak süt köpüğü ile"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Fiyat (TL)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="85.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="bg-stone-50 p-4 rounded-3xl border border-stone-150 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Unsplash'ten Görsel Seç</label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Görsel ara..."
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      disabled={searchingUnsplash}
                      onClick={handleUnsplashSearch}
                      className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {searchingUnsplash ? "..." : "ARA"}
                    </button>
                  </div>

                  {unsplashResults.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1 max-h-44 overflow-y-auto pr-1">
                      {unsplashResults.map((url) => (
                        <div
                          key={url}
                          onClick={() => setNewItemImage(url)}
                          className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                            newItemImage === url ? "border-red-500 scale-95 shadow-md" : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                        >
                          <img src={url} alt="suggestion" className="w-full h-full object-cover" />
                          {newItemImage === url && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <span className="bg-red-500 text-white rounded-full p-0.5 shadow-sm"><Check size={12} weight="bold" /></span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  {editingItem ? "Ürünü Güncelle" : "Ürünü Ekle"}
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
