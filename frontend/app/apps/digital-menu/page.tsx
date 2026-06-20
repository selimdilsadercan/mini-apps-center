"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ChefHat,
  CaretLeft,
  Storefront,
  Sparkle,
  Check,
  Star,
  Warning,
  Eye,
  MagnifyingGlass,
  Bell,
  Notebook
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { digital_menu } from "@/lib/client";

const client = createBrowserClient();

export default function DigitalMenuPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  // Business lists
  const [allBusinesses, setAllBusinesses] = useState<digital_menu.Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<digital_menu.Business | null>(null);

  // Favorites state (stored in localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);

  // Active Menu State for customer
  const [menuCategories, setMenuCategories] = useState<digital_menu.Category[]>([]);
  const [menuItems, setMenuItems] = useState<digital_menu.MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<string | null>(null); // 'vegan', 'gluten-free'

  // Customer Table State
  const [tableNumber, setTableNumber] = useState("");
  const [draftOrder, setDraftOrder] = useState<Record<string, number>>({}); // item_id -> quantity

  // Handle URL Params (e.g. ?biz=ID&table=5) & Load General Data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bizParam = params.get("biz");
      const tableParam = params.get("table");

      if (tableParam) {
        setTableNumber(tableParam);
      }

      if (bizParam) {
        fetchSpecificBusiness(bizParam);
      } else {
        fetchAllBusinesses();
      }
    }
  }, []);

  // Load Favorites from DB (or fallback to localStorage for guests)
  useEffect(() => {
    async function loadFavorites() {
      if (user?.id) {
        try {
          const res = await client.digital_menu.getUserFavorites(user.id);
          setFavorites(res.businessIds || []);
        } catch (e) {
          console.error("Failed to load DB favorites", e);
        }
      } else {
        // Fallback to localStorage for guest
        const savedFavorites = localStorage.getItem("menu_favorites");
        if (savedFavorites) {
          try {
            setFavorites(JSON.parse(savedFavorites));
          } catch (e) {
            console.error("Failed to parse favorites", e);
          }
        }
      }
    }
    loadFavorites();
  }, [user]);

  // Fetch specific business when scanned by QR
  const fetchSpecificBusiness = async (bizId: string) => {
    try {
      setLoading(true);
      const bizRes = await client.digital_menu.getBusiness(bizId);
      if (bizRes.business) {
        setSelectedBusiness(bizRes.business);
        // Load menu
        const menuRes = await client.digital_menu.getMenuData(bizId);
        setMenuCategories(menuRes.categories || []);
        setMenuItems(menuRes.items || []);
      } else {
        toast.error("İşletme bulunamadı. Genel listeye yönlendiriliyorsunuz.");
        fetchAllBusinesses();
      }
    } catch (err) {
      console.error(err);
      fetchAllBusinesses();
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBusinesses = async () => {
    try {
      setLoading(true);
      const res = await client.digital_menu.getAllBusinesses();
      setAllBusinesses(res.businesses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBusiness = async (biz: digital_menu.Business) => {
    setSelectedBusiness(biz);
    try {
      setLoading(true);
      const menuRes = await client.digital_menu.getMenuData(biz.id);
      setMenuCategories(menuRes.categories || []);
      setMenuItems(menuRes.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (bizId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (user?.id) {
      try {
        const res = await client.digital_menu.toggleFavorite({
          userId: user.id,
          businessId: bizId
        });
        if (res.isFavorited) {
          setFavorites(prev => [...prev, bizId]);
          toast.success("Favorilere eklendi! ⭐");
        } else {
          setFavorites(prev => prev.filter(id => id !== bizId));
          toast.success("Favorilerden çıkarıldı.");
        }
      } catch (err) {
        toast.error("Favori işlemi gerçekleştirilemedi.");
      }
    } else {
      // LocalStorage fallback for guests
      let updated: string[];
      if (favorites.includes(bizId)) {
        updated = favorites.filter(id => id !== bizId);
        toast.success("Favorilerden çıkarıldı.");
      } else {
        updated = [...favorites, bizId];
        toast.success("Favorilere eklendi! ⭐ (Misafir)");
      }
      setFavorites(updated);
      localStorage.setItem("menu_favorites", JSON.stringify(updated));
    }
  };

  // Waiter Call
  const handleCallWaiter = async () => {
    if (!selectedBusiness) return;
    if (!tableNumber) {
      toast.error("Lütfen masa numaranızı belirtin!");
      return;
    }

    try {
      const res = await client.digital_menu.callWaiter({
        businessId: selectedBusiness.id,
        tableNumber: tableNumber
      });
      if (res.success) {
        toast.success(`Masa ${tableNumber} için garson çağrıldı! 🔔`);
      }
    } catch (err) {
      toast.error("Garson çağrılırken bir hata oluştu.");
    }
  };

  // Draft Order Calculation
  const handleAddToDraft = (itemId: string) => {
    setDraftOrder(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const handleRemoveFromDraft = (itemId: string) => {
    setDraftOrder(prev => {
      const val = prev[itemId] || 0;
      if (val <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: val - 1
      };
    });
  };

  const getDraftTotal = () => {
    let total = 0;
    Object.entries(draftOrder).forEach(([itemId, qty]) => {
      const item = menuItems.find(i => i.id === itemId);
      if (item) {
        total += item.price * qty;
      }
    });
    return total;
  };

  const getDraftCount = () => {
    return Object.values(draftOrder).reduce((a, b) => a + b, 0);
  };

  // Filtered menu items for customer
  const filteredCustomerItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    const matchesDiet = !dietFilter || item.dietary_flags.includes(dietFilter);
    return matchesSearch && matchesCategory && matchesDiet;
  });

  const favoriteBusinesses = allBusinesses.filter(biz => favorites.includes(biz.id));
  const normalBusinesses = allBusinesses.filter(biz => !favorites.includes(biz.id));

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative font-sans">
      <Toaster position="top-center" />

      {/* Decorative premium background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (selectedBusiness) {
                setSelectedBusiness(null);
                setDraftOrder({});
              } else {
                window.location.href = getAppRootUrl();
              }
            }}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" />
            <span>{selectedBusiness ? "Menüden Çık" : "Geri"}</span>
          </button>
        </div>

        {/* Hero Title Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-gradient-to-tr from-red-500 to-orange-600 p-5 rounded-[2.5rem] shadow-[0_20px_40px_rgba(239,68,68,0.15)] mb-4"
          >
            <ChefHat size={36} weight="fill" className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-stone-900">
            Dijital <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">Menü</span>
          </h1>
        </div>

        {/* RESTAURANT LIST VIEW */}
        {!selectedBusiness ? (
          <div className="space-y-6">
            
            {/* Favorites List */}
            {favoriteBusinesses.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                  <Star size={15} weight="fill" />
                  Favori İşletmelerim
                </h2>
                <div className="space-y-2.5">
                  {favoriteBusinesses.map((biz) => (
                    <div
                      key={biz.id}
                      onClick={() => handleSelectBusiness(biz)}
                      className="bg-white p-4 rounded-[2rem] border border-amber-300 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-400 transition-all hover:-translate-y-0.5 active:scale-98"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-md overflow-hidden shrink-0">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          biz.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-stone-850 truncate">{biz.name}</h3>
                        <p className="text-[10px] text-stone-400 truncate mt-0.5">{biz.description}</p>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(biz.id, e)}
                        className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                      >
                        <Star size={20} weight="fill" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Restaurants List */}
            <div className="space-y-3">
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                <Storefront size={15} className="text-red-500" />
                {favoriteBusinesses.length > 0 ? "Diğer İşletmeler" : "Tüm İşletmeler"}
              </h2>

              {loading ? (
                <div className="py-20 text-center text-stone-400 text-xs font-bold animate-pulse uppercase tracking-widest">
                  Yükleniyor...
                </div>
              ) : allBusinesses.length === 0 ? (
                <div className="py-14 text-center bg-white rounded-[2.5rem] border border-dashed border-stone-250 flex flex-col items-center justify-center p-8 shadow-sm">
                  <p className="text-stone-850 text-xs font-black uppercase tracking-wider mb-2">Henüz İşletme Yok</p>
                  <p className="text-stone-400 text-[10px] max-w-[200px] leading-relaxed">
                    Sistemde henüz kayıtlı bir dijital menü işletmesi bulunmuyor.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {normalBusinesses.map((biz) => (
                    <div
                      key={biz.id}
                      onClick={() => handleSelectBusiness(biz)}
                      className="bg-white p-4 rounded-[2rem] border border-stone-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-400 transition-all hover:-translate-y-0.5 active:scale-98"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-md overflow-hidden shrink-0">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          biz.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-stone-850 truncate">{biz.name}</h3>
                        <p className="text-[10px] text-stone-400 truncate mt-0.5">{biz.description}</p>
                      </div>
                      <button
                        onClick={(e) => toggleFavorite(biz.id, e)}
                        className="p-2 text-stone-300 hover:text-amber-500 transition-colors"
                      >
                        <Star size={20} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          // ACTIVE RESTAURANT MENU VIEW
          <div className="space-y-5">
            {/* Active Restaurant Header */}
            <div className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  {selectedBusiness.logo_url ? (
                    <img src={selectedBusiness.logo_url} alt={selectedBusiness.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedBusiness.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-stone-900 text-sm leading-tight truncate">{selectedBusiness.name}</h2>
                  <button
                    onClick={() => {
                      setSelectedBusiness(null);
                      setDraftOrder({});
                    }}
                    className="text-[9px] text-red-500 font-bold uppercase tracking-wider mt-1 hover:underline block"
                  >
                    Kataloga Dön
                  </button>
                </div>
              </div>

              {/* Table Input */}
              <div className="text-right w-24">
                <label className="text-[8px] font-black text-stone-450 uppercase tracking-widest block mb-1">
                  MASA NO
                </label>
                <input
                  type="text"
                  placeholder="Masa #"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-center font-bold text-xs focus:border-red-400 outline-none"
                />
              </div>
            </div>

            {/* Search & Dietary Filters */}
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-400">
                  <MagnifyingGlass size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Menüde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200/80 rounded-2xl pl-10 pr-4 py-3 text-xs font-semibold focus:border-red-400 outline-none shadow-sm"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDietFilter(dietFilter === "vegan" ? null : "vegan")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                    dietFilter === "vegan"
                      ? "bg-green-500 border-green-500 text-white shadow-sm shadow-green-500/10"
                      : "bg-white border-stone-200 text-stone-500 hover:text-stone-700"
                  }`}
                >
                  🌱 Vegan
                </button>
                <button
                  onClick={() => setDietFilter(dietFilter === "gluten-free" ? null : "gluten-free")}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                    dietFilter === "gluten-free"
                      ? "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10"
                      : "bg-white border-stone-200 text-stone-500 hover:text-stone-700"
                  }`}
                >
                  🌾 Glütensiz
                </button>
              </div>
            </div>

            {/* Categories Scrollable Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none no-scrollbar -mx-4 px-4">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${
                  activeCategory === "all"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600"
                }`}
              >
                Hepsi
              </button>
              {menuCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${
                    activeCategory === cat.id
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "bg-white border-stone-200 text-stone-600"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu Items List */}
            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs font-bold animate-pulse">
                Menü yükleniyor...
              </div>
            ) : filteredCustomerItems.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-semibold bg-white rounded-3xl border border-stone-200/60">
                Kriterlere uygun ürün bulunamadı.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCustomerItems.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-[2rem] border border-stone-200/80 overflow-hidden shadow-sm flex relative ${
                      !item.is_available ? "opacity-60" : ""
                    }`}
                  >
                    {/* Image */}
                    <div className="w-28 h-28 bg-stone-100 border-r border-stone-150 shrink-0 overflow-hidden relative">
                      <img src={item.image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider">
                          TÜKENDİ
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-black text-xs text-stone-850 truncate">{item.name}</h3>
                          <span className="font-extrabold text-xs text-red-500 shrink-0">
                            {item.price.toFixed(2)} ₺
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-450 line-clamp-2 mt-1 leading-normal font-medium">
                          {item.description || "Açıklama belirtilmemiş."}
                        </p>
                      </div>

                      {/* Dietary indicators & Add controls */}
                      <div className="flex justify-between items-end mt-2">
                        <div className="flex gap-1">
                          {item.dietary_flags.map((flag) => (
                            <span
                              key={flag}
                              className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 uppercase tracking-widest"
                            >
                              {flag === "vegan" ? "🌱" : flag === "gluten-free" ? "🌾" : flag}
                            </span>
                          ))}
                        </div>

                        {item.is_available && (
                          <div className="flex items-center gap-2">
                            {draftOrder[item.id] > 0 && (
                              <>
                                <button
                                  onClick={() => handleRemoveFromDraft(item.id)}
                                  className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-600 active:scale-90"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black w-4 text-center">
                                  {draftOrder[item.id]}
                                </span>
                              </>
                            )}
                            <button
                              onClick={() => handleAddToDraft(item.id)}
                              className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/10 active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* DRAFT ORDER BAR (Customer only) */}
      {selectedBusiness && getDraftCount() > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-50 px-4 max-w-md mx-auto">
          <div className="bg-stone-900 text-white p-4.5 rounded-[2rem] shadow-xl flex items-center justify-between border border-stone-850">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-red-400">
                <Notebook size={20} weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Planlanan Sipariş</p>
                <p className="text-xs font-black">{getDraftCount()} Ürün • <span className="text-red-400">{getDraftTotal().toFixed(2)} ₺</span></p>
              </div>
            </div>

            <button
              onClick={() => {
                toast.success("Sipariş planınız hazırlandı! Garsona iletebilirsiniz. ☕");
              }}
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-3 px-5 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              Tamamla
            </button>
          </div>
        </div>
      )}

      {/* CALL WAITER FLOATING BUTTON (Customer only) */}
      {selectedBusiness && (
        <button
          onClick={handleCallWaiter}
          className="fixed bottom-24 right-6 z-40 bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-90 hover:bg-red-600 transition-all border-4 border-white"
          title="Garson Çağır"
        >
          <Bell size={24} weight="bold" />
        </button>
      )}

    </div>
  );
}
