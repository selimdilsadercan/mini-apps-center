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
  SquaresFour,
  CaretUp,
  Plus,
  Image as ImageIcon,
  UploadSimple,
  Trash,
  X
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { digital_menu } from "@/lib/client";
import { uploadImage } from "@/lib/image";
import { useRef } from "react";

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
  const [selectedItem, setSelectedItem] = useState<GroupedMenuItem | null>(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);

  // Favorites state (stored in localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Active Menu State for customer
  const [menuCategories, setMenuCategories] = useState<digital_menu.Category[]>([]);
  const [menuItems, setMenuItems] = useState<digital_menu.MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isScrollingToCategory, setIsScrollingToCategory] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filtering
  const [searchQuery, setSearchQuery] = useState("");

  // Create Business State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [newHeader, setNewHeader] = useState("");
  const [newColor, setNewColor] = useState("#EF4444");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const publicUrl = await uploadImage(file, {
        folder: "logos",
        client
      });
      setNewLogo(publicUrl);
      toast.success("Logo başarıyla yüklendi!");
    } catch (err) {
      console.error(err);
      toast.error("Logo yüklenirken bir hata oluştu.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingHeader(true);
      const publicUrl = await uploadImage(file, {
        folder: "headers",
        client
      });
      setNewHeader(publicUrl);
      toast.success("Header görseli başarıyla yüklendi!");
    } catch (err) {
      console.error(err);
      toast.error("Header yüklenirken bir hata oluştu.");
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = "";
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await client.business.createBusiness({
        userId: user.id,
        name: newName,
        description: newDesc,
        logoUrl: newLogo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80",
        headerUrl: newHeader,
        themeColor: newColor
      });
      if (res.business) {
        toast.success("İşletme profili başarıyla oluşturuldu!");
        setIsCreateOpen(false);
        setNewName("");
        setNewDesc("");
        setNewLogo("");
        fetchAllBusinesses();
      }
    } catch (err) {
      toast.error("İşletme oluşturulurken hata oluştu.");
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

  // Helper to shuffle array
  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const scrollToCategory = (categoryId: string) => {
    setViewMode("list");
    setActiveCategory(categoryId);
    setIsScrollingToCategory(true);
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        const offset = 120; // Sticky header offset
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
      // Reset after animation
      setTimeout(() => setIsScrollingToCategory(false), 1000);
    }, 100);
  };

  // Scroll detection for active category
  useEffect(() => {
    if (viewMode !== "list" || isScrollingToCategory) return;

    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -70% 0px',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.id.replace('category-', '');
          setActiveCategory(categoryId);
          
          // Scroll the sticky header to the active category
          const navElement = document.getElementById(`nav-item-${categoryId}`);
          if (navElement) {
            navElement.parentElement?.scrollTo({
              left: navElement.offsetLeft - 100,
              behavior: 'smooth'
            });
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const sections = document.querySelectorAll('section[id^="category-"]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [viewMode, menuCategories, isScrollingToCategory]);

  return (
    <div className={`flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 relative ${currentFontClass}`}>
      <Toaster position="top-center" />

      {/* Decorative premium background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full blur-[120px] opacity-[0.05]" 
          style={{ backgroundColor: currentThemeColor }}
        />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation & Header */}
        <div className="px-4 pt-8 mb-8 flex items-center justify-between">
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

          {user && !selectedBusiness && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all"
            >
              <Plus size={14} weight="bold" />
              <span>İşletme Oluştur</span>
            </button>
          )}
        </div>

        {/* RESTAURANT LIST VIEW */}
        {!selectedBusiness ? (
          <div className="px-4 space-y-6">
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
                      <div className="w-20 h-12 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-md overflow-hidden shrink-0">
                        {biz.header_url || biz.logo_url ? (
                          <img src={(biz.header_url || biz.logo_url) as string} alt={biz.name} className="w-full h-full object-cover" />
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
                      <div className="w-20 h-12 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-md overflow-hidden shrink-0">
                        {biz.header_url || biz.logo_url ? (
                          <img src={(biz.header_url || biz.logo_url) as string} alt={biz.name} className="w-full h-full object-cover" />
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
          <div className="flex flex-col pb-32">
            
            {/* Main Header Banner */}
            <div className="px-4 mb-8">
              <div className="relative rounded-[2.5rem] overflow-hidden bg-stone-900 border border-stone-200/80 shadow-lg h-56 shrink-0">
                <img
                  src={selectedBusiness.header_url || selectedBusiness.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80"}
                  alt={selectedBusiness.name}
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] p-4 text-center">
                  <h2 className="font-serif font-black text-white text-2xl tracking-wide drop-shadow-lg">{selectedBusiness.name}</h2>
                  <p className="text-[11px] text-white/90 font-bold uppercase tracking-[0.25em] mt-2 drop-shadow-md">{selectedBusiness.description || "Hoş Geldiniz"}</p>
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="px-4 space-y-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Kategoriler</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {menuCategories.map((cat) => {
                    const img = cat.image_url || getCategoryImageUrl(cat.name);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        className="flex flex-col gap-2 cursor-pointer group hover:-translate-y-0.5 transition-all"
                      >
                        <div className="h-28 w-full rounded-2xl overflow-hidden shadow-sm border border-stone-200/40 relative">
                          <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <span className="font-serif font-black text-stone-800 text-xs uppercase tracking-wider text-center block">
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* STICKY CATEGORY NAV */}
                <div className="sticky top-[-1px] z-40 px-4 py-4 pt-[calc(1rem+1px)] bg-white/95 backdrop-blur-xl border-b border-stone-200/50 mb-8 shadow-sm will-change-transform">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                      id="nav-item-all"
                      onClick={() => setViewMode("grid")}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center border-2 border-white shadow-sm group-hover:bg-stone-200 transition-all">
                        <SquaresFour size={24} weight="bold" className="text-stone-400" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-stone-400">KATEGORİ</span>
                    </button>

                    {menuCategories.map((cat) => {
                      const img = cat.image_url || getCategoryImageUrl(cat.name);
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          id={`nav-item-${cat.id}`}
                          onClick={() => scrollToCategory(cat.id)}
                          className={`flex flex-col items-center gap-1.5 shrink-0 transition-all ${isActive ? "scale-105" : "opacity-60 hover:opacity-100"}`}
                        >
                          <div 
                            className="w-14 h-14 rounded-2xl overflow-hidden border-2 shadow-sm transition-all"
                            style={{ borderColor: isActive ? currentThemeColor : 'white' }}
                          >
                            <img src={img} alt={cat.name} className="w-full h-full object-cover" />
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-tighter text-center w-14 truncate ${isActive ? "text-stone-900" : "text-stone-400"}`}>
                            {cat.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

            {/* ALL ITEMS LISTED BY CATEGORY */}
            <div className="px-4 space-y-16 pb-20">
              {menuCategories.map((cat) => {
                const allGroupedItems = getGroupedItems(menuItems.filter(i => i.category_id === cat.id));
                if (allGroupedItems.length === 0) return null;

                const featuredItems = shuffle(allGroupedItems.filter(group => group.image_url));

                return (
                  <section key={cat.id} id={`category-${cat.id}`} className="scroll-mt-24 space-y-8">
                    {/* Category Header */}
                    <div className="flex items-start gap-4 px-1">
                      <h3 className="font-serif font-black text-xl uppercase tracking-wider" style={{ color: currentThemeColor }}>
                        {cat.name}
                      </h3>
                      <div className="h-[1px] flex-1 bg-stone-200/60 mt-4" />
                    </div>

                    {/* Standard List with Integrated Images */}
                    <div className="space-y-12 px-1">
                      {allGroupedItems.map((group) => (
                        <div 
                          key={group.baseName} 
                          onClick={() => {
                            setSelectedItem(group);
                            setIsItemDetailOpen(true);
                          }}
                          className={`flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all ${!group.is_available ? "opacity-60" : ""}`}
                        >
                          {group.image_url && (
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-stone-100">
                              <img src={group.image_url} alt={group.baseName} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-serif font-black text-sm uppercase tracking-wide leading-tight text-stone-800 line-clamp-2">
                                  {group.baseName}
                                </h4>
                              </div>
                              
                              <div className="flex items-center gap-3 shrink-0 pt-0.5">
                                {group.variations.length === 1 && !group.variations[0].optionName && (
                                  <span className="font-serif font-black text-sm whitespace-nowrap" style={{ color: currentThemeColor }}>
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
                              <p className="text-[11px] text-stone-500 font-medium leading-relaxed pr-4 line-clamp-2">
                                {group.description}
                              </p>
                            )}

                            {(group.variations.length > 1 || (group.variations.length === 1 && group.variations[0].optionName)) && (
                              <div className="space-y-1.5 pt-1">
                                {group.variations.map((v) => (
                                  <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="font-serif font-medium text-stone-600 shrink-0">{v.optionName || "Porsiyon"}</span>
                                    <div className="flex-1 border-b border-dashed border-stone-200 h-3 mx-1" />
                                    <span className="font-serif font-black shrink-0" style={{ color: currentThemeColor }}>{v.price.toFixed(2)} ₺</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-8 right-6 z-50 p-4 rounded-full bg-white border border-stone-200 shadow-2xl transition-all duration-300 active:scale-90 ${
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        }`}
        style={{ color: currentThemeColor }}
      >
        <CaretUp size={24} weight="bold" />
      </button>

      {/* Item Detail Drawer */}
      <Drawer.Root open={isItemDetailOpen} onOpenChange={setIsItemDetailOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl overflow-hidden">
            <div className="p-0 overflow-y-auto">
              {selectedItem && (
                <>
                  <Drawer.Title className="sr-only">{selectedItem.baseName}</Drawer.Title>
                  <Drawer.Description className="sr-only">{selectedItem.description || selectedItem.baseName}</Drawer.Description>
                </>
              )}
              
              <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-center pointer-events-none">
                <div className="w-12 h-1.5 bg-white/40 backdrop-blur-md rounded-full shadow-sm border border-white/20" />
              </div>

              <button 
                onClick={() => setIsItemDetailOpen(false)}
                className="absolute top-4 right-6 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all active:scale-90"
              >
                <X size={20} weight="bold" />
              </button>

              {selectedItem && (
                <div className="pb-12">
                  {selectedItem.image_url && (
                    <div className="w-full aspect-[4/3] relative overflow-hidden bg-stone-100">
                      <img src={selectedItem.image_url} alt={selectedItem.baseName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className={`px-8 space-y-6 ${selectedItem.image_url ? 'mt-8' : 'mt-16'}`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <h2 className="text-2xl font-serif font-black text-stone-900 uppercase tracking-tight leading-tight">
                          {selectedItem.baseName}
                        </h2>
                        {selectedItem.variations.length === 1 && !selectedItem.variations[0].optionName && (
                          <span className="text-xl font-serif font-black shrink-0" style={{ color: currentThemeColor }}>
                            {selectedItem.variations[0].price.toFixed(2)} ₺
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {selectedItem.dietary_flags.map((flag) => (
                          <span key={flag} className="px-2 py-1 bg-stone-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-stone-500">
                            {flag === "vegan" ? "🌱 VEGAN" : flag === "gluten-free" ? "🌾 GLUTEN-FREE" : flag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {selectedItem.description && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">İçerik & Detaylar</h4>
                        <p className="text-sm text-stone-600 font-medium leading-relaxed">
                          {selectedItem.description}
                        </p>
                      </div>
                    )}

                    {(selectedItem.variations.length > 1 || (selectedItem.variations.length === 1 && selectedItem.variations[0].optionName)) && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Seçenekler</h4>
                        <div className="space-y-3">
                          {selectedItem.variations.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                              <span className="font-serif font-bold text-stone-800">{v.optionName || "Porsiyon"}</span>
                              <span className="font-serif font-black" style={{ color: currentThemeColor }}>{v.price.toFixed(2)} ₺</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Create Business Drawer */}
      <Drawer.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                İŞLETME <span className="text-red-500">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Yeni dükkanınız için işletme profili oluşturun
              </Drawer.Description>

              <form onSubmit={handleCreateBusiness} className="space-y-4 pb-12">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">İşletme Adı</label>
                  <input
                    required
                    placeholder="Brew Lab Coffee"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Açıklama / Slogan</label>
                  <input
                    placeholder="En taze gurme kahveler ve el yapımı kruvasanlar"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">İşletme Logosu</label>
                  <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-stone-150 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm">
                      {newLogo ? (
                        <>
                          <img src={newLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                          <div 
                            onClick={() => setNewLogo("")}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash size={18} weight="bold" className="text-white" />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={20} weight="bold" className="text-stone-300" />
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-stone-200 border-t-red-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        <UploadSimple size={14} weight="bold" />
                        {newLogo ? "Logoyu Değiştir" : "Logo Seç"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Geniş Logo / Banner (Opsiyonel)</label>
                  <div className="flex flex-col gap-3 bg-stone-50 border border-stone-200 rounded-2xl p-3">
                    <div className="w-full h-24 rounded-xl bg-white border border-stone-150 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm">
                      {newHeader ? (
                        <>
                          <img src={newHeader} alt="Header Preview" className="w-full h-full object-cover" />
                          <div 
                            onClick={() => setNewHeader("")}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash size={18} weight="bold" className="text-white" />
                          </div>
                        </>
                      ) : (
                        <ImageIcon size={20} weight="bold" className="text-stone-300" />
                      )}
                      {uploadingHeader && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-stone-200 border-t-red-500 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={headerInputRef}
                        onChange={handleHeaderUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => headerInputRef.current?.click()}
                        disabled={uploadingHeader}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        <UploadSimple size={14} weight="bold" />
                        {newHeader ? "Görseli Değiştir" : "Geniş Logo Seç"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider block mb-1">Tema Rengi</label>
                  <div className="flex gap-2">
                    {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#845EF7", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newColor === color ? "border-stone-900 scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-98 mt-4"
                >
                  İşletmeyi Kaydet
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}
