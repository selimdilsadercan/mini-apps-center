"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Storefront,
  Sparkle,
  Check,
  Star,
  Warning,
  Eye,
  MagnifyingGlass,
  Notebook,
  SquaresFour
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { digital_menu } from "@/lib/client";

const client = createBrowserClient();

const getCategoryImageUrl = (name: string) => {
  const clean = name.toLowerCase();
  if (clean.includes("pizza")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("makarna") || clean.includes("pasta") || clean.includes("noodle")) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("kahve") || clean.includes("coffee") || clean.includes("sıcak") || clean.includes("soğuk") || clean.includes("içecek")) return "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("tatlı") || clean.includes("dessert") || clean.includes("kek")) return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("başlangıç") || clean.includes("appetizer") || clean.includes("meze")) return "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("çorba") || clean.includes("soup")) return "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("tost") || clean.includes("toast") || clean.includes("sandviç") || clean.includes("burger")) return "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80";
  if (clean.includes("lezzet") || clean.includes("salata") || clean.includes("salad")) return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80";
  
  // Default elegant table setup
  return "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=80";
};

interface GroupedMenuItem {
  baseName: string;
  description: string;
  image_url: string;
  is_available: boolean;
  dietary_flags: string[];
  variations: {
    id: string;
    optionName: string;
    price: number;
    is_available: boolean;
  }[];
}

const getGroupedItems = (items: digital_menu.MenuItem[]): GroupedMenuItem[] => {
  const grouped: Record<string, GroupedMenuItem> = {};

  items.forEach(item => {
    let baseName = item.name;
    let optionName = "";
    
    // Check for dash divider
    if (item.name.includes(" - ")) {
      const parts = item.name.split(" - ");
      baseName = parts[0].trim();
      optionName = parts.slice(1).join(" - ").trim();
    } else if (item.name.includes("-")) {
      const parts = item.name.split("-");
      baseName = parts[0].trim();
      optionName = parts.slice(1).join("-").trim();
    }

    if (!grouped[baseName]) {
      grouped[baseName] = {
        baseName,
        description: item.description || "",
        image_url: item.image_url || "",
        is_available: item.is_available,
        dietary_flags: item.dietary_flags || [],
        variations: []
      };
    }

    // Add to variations
    grouped[baseName].variations.push({
      id: item.id,
      optionName: optionName,
      price: item.price,
      is_available: item.is_available
    });
  });

  return Object.values(grouped);
};

const getFontClass = (font: string | null | undefined) => {
  switch (font) {
    case "serif": return "font-serif";
    case "mono": return "font-mono";
    case "display": return "font-black";
    default: return "font-sans";
  }
};

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");

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
    setViewMode("grid");
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
    return matchesSearch && matchesCategory;
  });

  const favoriteBusinesses = allBusinesses.filter(biz => favorites.includes(biz.id));
  const normalBusinesses = allBusinesses.filter(biz => !favorites.includes(biz.id));

  const currentFontClass = selectedBusiness ? getFontClass(selectedBusiness.font_family) : "font-sans";
  const currentThemeColor = selectedBusiness?.theme_color || "#EF4444";

  const scrollToCategory = (categoryId: string) => {
    setViewMode("list");
    setActiveCategory(categoryId);
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        const offset = 80; // Sticky header offset
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  return (
    <div className={`flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative ${currentFontClass}`}>
      <Toaster position="top-center" />

      {/* Decorative premium background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-[0.05]" 
          style={{ backgroundColor: currentThemeColor }}
        />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (viewMode === "list") {
                setViewMode("grid");
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (selectedBusiness) {
                setSelectedBusiness(null);
                setDraftOrder({});
              } else {
                window.location.href = getAppRootUrl();
              }
            }}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            <SquaresFour size={16} weight="bold" />
            <span>{viewMode === "list" ? "Kategorilere Dön" : selectedBusiness ? "Geri Dön" : "Geri"}</span>
          </button>
        </div>

        {/* RESTAURANT LIST VIEW */}
        {!selectedBusiness ? (
          <div className="space-y-6">
            {/* ... (existing business list code) ... */}
          </div>
        ) : (
          // ACTIVE RESTAURANT MENU VIEW
          <div className="space-y-8">
            
            {/* Main Header Banner */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-stone-900 border border-stone-200/80 shadow-lg h-48 shrink-0">
              <img
                src={selectedBusiness.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"}
                alt={selectedBusiness.name}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-xl overflow-hidden flex items-center justify-center mb-3">
                  {selectedBusiness.logo_url ? (
                    <img src={selectedBusiness.logo_url} alt={selectedBusiness.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-black text-stone-850 text-base">{selectedBusiness.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <h2 className="font-serif font-black text-white text-xl tracking-wide drop-shadow-md">{selectedBusiness.name}</h2>
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-[0.2em] mt-1">{selectedBusiness.description || "Hoş Geldiniz"}</p>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kategoriler</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {menuCategories.map((cat, idx) => {
                    const isWide = idx % 3 === 0;
                    const img = getCategoryImageUrl(cat.name);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-stone-200/40 hover:-translate-y-0.5 active:scale-98 transition-all group ${
                          isWide ? "col-span-2 h-36" : "col-span-1 h-32"
                        }`}
                      >
                        <img src={img} alt={cat.name} className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 flex items-center justify-center p-3 text-center">
                          <span className="font-serif font-black text-white text-xs uppercase tracking-widest drop-shadow-md">{cat.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* STICKY CATEGORY NAV */}
                <div className="sticky top-4 z-30 -mx-4 px-4 py-2">
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                    <button
                      onClick={() => setViewMode("grid")}
                      className="px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm border bg-white/80 backdrop-blur-md text-stone-500 border-stone-200 hover:border-stone-300"
                    >
                      <SquaresFour size={14} weight="bold" className="inline mr-1.5" />
                      IZGARA
                    </button>
                    {menuCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm border ${
                          activeCategory === cat.id
                            ? "text-white border-transparent"
                            : "bg-white/80 backdrop-blur-md text-stone-500 border-stone-200 hover:border-stone-300"
                        }`}
                        style={{ 
                          backgroundColor: activeCategory === cat.id ? currentThemeColor : undefined,
                          borderColor: activeCategory === cat.id ? currentThemeColor : undefined
                        }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

            {/* ALL ITEMS LISTED BY CATEGORY */}
            <div className="space-y-16 pb-20">
              {menuCategories.map((cat) => {
                const allGroupedItems = getGroupedItems(menuItems.filter(i => i.category_id === cat.id));
                if (allGroupedItems.length === 0) return null;

                const featuredItems = allGroupedItems.filter(group => group.image_url);

                return (
                  <section key={cat.id} id={`category-${cat.id}`} className="scroll-mt-24 space-y-8">
                    {/* Category Header */}
                    <div className="flex items-center gap-4 px-1">
                      <h3 className="font-serif font-black text-xl uppercase tracking-wider whitespace-nowrap" style={{ color: currentThemeColor }}>
                        {cat.name}
                      </h3>
                      <div className="h-[1px] flex-1 bg-stone-200/60" />
                    </div>

                    {/* Featured Items Horizontal Scroll (Only if there are items with images) */}
                    {featuredItems.length > 0 && (
                      <div className="-mx-4 px-4">
                        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                          {featuredItems.map((group) => (
                            <div 
                              key={`featured-${group.baseName}`}
                              className="w-40 shrink-0 bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden flex flex-col"
                            >
                              <div className="h-28 w-full relative">
                                <img src={group.image_url} alt={group.baseName} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-3">
                                <h4 className="font-serif font-black text-[10px] uppercase tracking-wide text-stone-800 line-clamp-2 leading-tight">
                                  {group.baseName}
                                </h4>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standard Text List for All Items */}
                    <div className="space-y-10 px-1">
                      {allGroupedItems.map((group) => (
                        <div key={group.baseName} className={`space-y-2 ${!group.is_available ? "opacity-60" : ""}`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-serif font-black text-sm uppercase tracking-wide leading-tight text-stone-800">
                                {group.baseName}
                              </h4>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              {group.variations.length === 1 && !group.variations[0].optionName && (
                                <span className="font-serif font-black text-sm" style={{ color: currentThemeColor }}>
                                  {group.variations[0].price.toFixed(2)} ₺
                                </span>
                              )}
                              <div className="flex gap-1">
                                {group.dietary_flags.map((flag) => (
                                  <span key={flag} className="text-[10px]">{flag === "vegan" ? "🌱" : flag === "gluten-free" ? "🌾" : ""}</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {group.description && (
                            <p className="text-[11px] text-stone-500 font-serif leading-relaxed italic pr-8">
                              {group.description}
                            </p>
                          )}

                          {(group.variations.length > 1 || (group.variations.length === 1 && group.variations[0].optionName)) && (
                            <div className="space-y-2 pt-2">
                              {group.variations.map((v) => (
                                <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-serif font-medium text-stone-600 shrink-0">{v.optionName || "Porsiyon"}</span>
                                  <div className="flex-1 border-b border-dashed border-stone-200 h-3.5 mx-1" />
                                  <span className="font-serif font-black shrink-0" style={{ color: currentThemeColor }}>{v.price.toFixed(2)} ₺</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
              </>
            )}
            
          </div>
        )}

      </main>

    </div>
  );
}
