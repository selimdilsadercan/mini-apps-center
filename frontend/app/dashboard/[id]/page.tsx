"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useRouter } from "next/navigation";
import {
  ChefHat,
  Cards,
  Plus,
  QrCode,
  Sparkle,
  Check,
  Warning,
  Eye,
  MagnifyingGlass,
  Bell,
  Trash,
  SlidersHorizontal,
  CheckCircle,
  CaretLeft,
  CaretRight,
  GraduationCap,
  Storefront
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { digital_menu, stamp_card } from "@/lib/client";

const client = createBrowserClient();

export default function BusinessDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");

  // Sub-view tool state: "none", "menu", "stamp", "tutor"
  const [activeTool, setActiveTool] = useState<"none" | "menu" | "stamp" | "tutor">("none");

  // ─── Digital Menu State ───
  const [menuCategories, setMenuCategories] = useState<digital_menu.Category[]>([]);
  const [menuItems, setMenuItems] = useState<digital_menu.MenuItem[]>([]);
  const [waiterCalls, setWaiterCalls] = useState<digital_menu.WaiterCall[]>([]);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemDietary, setNewItemDietary] = useState<string[]>([]);
  const [qrTableNum, setQrTableNum] = useState("1");

  // ─── Stamp Card State ───
  const [stampCampaign, setStampCampaign] = useState<stamp_card.UserOwnedBusiness | null>(null);
  const [isCreateStampOpen, setIsCreateStampOpen] = useState(false);
  const [stampLimit, setStampLimit] = useState("8");
  const [rewardTitle, setRewardTitle] = useState("1 Hediye Kahve");
  const [pinCode, setPinCode] = useState("1234");

  const handleCreateStampCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.stamp_card.createBusiness({
        businessId: id,
        stampLimit: parseInt(stampLimit) || 8,
        rewardTitle,
        pinCode
      });
      if (res.success) {
        toast.success("Sadakat kampanyası başarıyla aktifleştirildi!");
        setIsCreateStampOpen(false);
        loadBusinessDetails();
      }
    } catch (err) {
      toast.error("Kampanya oluşturulurken hata oluştu.");
    }
  };

  // Fetch business details
  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadBusinessDetails();
    }
  }, [isUserLoaded, user, id]);

  // Polling for waiter calls
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTool === "menu" && id) {
      fetchWaiterCalls();
      interval = setInterval(fetchWaiterCalls, 8000);
    }
    return () => clearInterval(interval);
  }, [activeTool, id]);

  const fetchWaiterCalls = async () => {
    try {
      const res = await client.digital_menu.getWaiterCalls(id);
      setWaiterCalls(res.calls || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBusinessDetails = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let name = "";
      let desc = "";
      let logo = "";

      const bizRes = await client.business.getBusiness(id);
      if (bizRes.business) {
        name = bizRes.business.name;
        desc = bizRes.business.description || "";
        logo = bizRes.business.logo_url || "";
      }

      // Check if they have a stamp card campaign with this ID or business name
      const stampRes = await client.stamp_card.getUserData(user.id);
      const matchedStamp = (stampRes.my_businesses || []).find(
        (b) => b.id === id || b.name.toLowerCase() === name.toLowerCase()
      );

      if (matchedStamp) {
        setStampCampaign(matchedStamp);
      } else {
        setStampCampaign(null);
      }

      setBusinessName(name || "İşletme Profili");
      setBusinessDesc(desc || "İşletme detayları");
      setBusinessLogo(logo || "");

      // Preload menu data
      const menuData = await client.digital_menu.getMenuData(id);
      setMenuCategories(menuData.categories || []);
      setMenuItems(menuData.items || []);
    } catch (err) {
      console.error(err);
      toast.error("İşletme detayları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // Resolve Waiter Call
  const handleResolveWaiterCall = async (callId: string) => {
    try {
      const res = await client.digital_menu.resolveWaiterCall({ callId });
      if (res.success) {
        toast.success("Çağrı kapatıldı.");
        fetchWaiterCalls();
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.digital_menu.addCategory({
        businessId: id,
        name: newCatName
      });
      if (res.category) {
        toast.success("Kategori eklendi!");
        setIsAddCatOpen(false);
        setNewCatName("");
        const menuData = await client.digital_menu.getMenuData(id);
        setMenuCategories(menuData.categories || []);
      }
    } catch (e) {
      toast.error("Hata oluştu.");
    }
  };

  // Add Menu Item
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCategory) {
      toast.error("Lütfen bir kategori seçin.");
      return;
    }
    try {
      const res = await client.digital_menu.addMenuItem({
        categoryId: newItemCategory,
        name: newItemName,
        description: newItemDesc,
        price: parseFloat(newItemPrice) || 0,
        imageUrl: newItemImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80",
        dietaryFlags: newItemDietary
      });
      if (res.item) {
        toast.success("Ürün menüye eklendi!");
        setIsAddItemOpen(false);
        setNewItemName("");
        setNewItemDesc("");
        setNewItemPrice("");
        setNewItemImage("");
        setNewItemDietary([]);
        const menuData = await client.digital_menu.getMenuData(id);
        setMenuItems(menuData.items || []);
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
        const menuData = await client.digital_menu.getMenuData(id);
        setMenuItems(menuData.items || []);
      }
    } catch (err) {
      toast.error("Hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative font-sans">
      <Toaster position="top-center" />

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              if (activeTool !== "none") {
                setActiveTool("none");
              } else {
                router.push("/business");
              }
            }}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" />
            <span>{activeTool !== "none" ? "İşletme Detayı" : "İşletmelerim"}</span>
          </button>
        </div>

        {/* Business Header Card */}
        {activeTool === "none" && (
          <div className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 shadow-sm flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
              ) : (
                businessName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-black text-lg text-stone-900 leading-tight">{businessName}</h1>
              <p className="text-xs text-stone-400 mt-1 leading-normal font-medium">{businessDesc || "İşletme profili düzenleme."}</p>
            </div>
          </div>
        )}

        {/* ───────────────── VIEW 1: ADMIN TOOLS LIST (Cards style) ───────────────── */}
        {activeTool === "none" && (
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
              Yönetici Panelleri
            </h2>

            {/* CARD 1: DIGITAL MENU */}
            <div
              onClick={() => setActiveTool("menu")}
              className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-red-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-[1.2rem] bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/10">
                  <ChefHat size={24} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-stone-900 text-sm">Dijital Menü</h3>
                  <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                    Menü ürünlerini ve garson çağrılarını yönet!
                  </p>
                </div>
              </div>
              <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-red-500 transition-colors ml-2" />
            </div>

            {/* CARD 2: STAMP CARD */}
            <div
              onClick={() => {
                if (stampCampaign) {
                  setActiveTool("stamp");
                } else {
                  setIsCreateStampOpen(true);
                }
              }}
              className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10">
                  <Cards size={24} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-stone-900 text-sm">Sadakat Kartı (Stamp)</h3>
                  <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                    {stampCampaign ? "Müşteri kaşe kampanyasını ve PIN kodunu yönet." : "Sadakat kampanyasını kurun ve aktifleştirin."}
                  </p>
                </div>
              </div>
              <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-amber-500 transition-colors ml-2" />
            </div>

            {/* CARD 3: TUTOR PLACE */}
            <div
              onClick={() => router.push("/apps/tutor-crm")}
              className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10">
                  <GraduationCap size={24} weight="fill" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-stone-900 text-sm">Tutor Place</h3>
                  <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                    Öğrenci CRM panelini ve ödeme takip sistemini aç.
                  </p>
                </div>
              </div>
              <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-indigo-500 transition-colors ml-2" />
            </div>
          </div>
        )}

        {/* ───────────────── VIEW 2: DIGITAL MENU TOOL PANEL ───────────────── */}
        {activeTool === "menu" && (
          <div className="space-y-6">
            
            {/* Waiter Calls */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-stone-450 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Bell size={14} className="text-red-500 animate-bounce" />
                Masa Çağrıları ({waiterCalls.length})
              </h4>

              {waiterCalls.length === 0 ? (
                <div className="py-6 text-center text-stone-400 text-[10px] font-black uppercase tracking-widest bg-white rounded-2xl border border-stone-200/60 shadow-sm">
                  Aktif çağrı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {waiterCalls.map((call) => (
                    <div
                      key={call.id}
                      className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-sm"
                    >
                      <div>
                        <p className="font-black text-xs text-stone-850">Masa {call.table_number}</p>
                        <span className="text-[8px] text-stone-450 font-bold uppercase block mt-0.5">
                          {new Date(call.created_at).toLocaleTimeString("tr-TR")}
                        </span>
                      </div>
                      <button
                        onClick={() => handleResolveWaiterCall(call.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest py-2 px-4 rounded-xl shadow-sm active:scale-95"
                      >
                        Kapat
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black text-stone-450 uppercase tracking-widest">
                  Kategoriler & Yemekler
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddCatOpen(true)}
                    className="bg-stone-900 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl"
                  >
                    Kategori +
                  </button>
                  <button
                    disabled={menuCategories.length === 0}
                    onClick={() => setIsAddItemOpen(true)}
                    className="bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl"
                  >
                    Ürün +
                  </button>
                </div>
              </div>

              {menuCategories.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-[10px] font-black uppercase tracking-widest bg-white rounded-3xl border border-stone-200/60 shadow-sm">
                  Menüde henüz kategori yok.
                </div>
              ) : (
                <div className="space-y-4">
                  {menuCategories.map((cat) => {
                    const itemsInCat = menuItems.filter((i) => i.category_id === cat.id);
                    return (
                      <div key={cat.id} className="space-y-2">
                        <h4 className="text-xs font-black text-stone-750 bg-stone-100/60 px-3 py-1.5 rounded-lg inline-block">
                          {cat.name} ({itemsInCat.length})
                        </h4>

                        {itemsInCat.length === 0 ? (
                          <p className="text-[10px] text-stone-400 pl-3">Kategoriye ait ürün bulunmuyor.</p>
                        ) : (
                          <div className="space-y-2.5 pl-1">
                            {itemsInCat.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-sm flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-150 overflow-hidden shrink-0">
                                    <img src={item.image_url || ""} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-stone-850 truncate">{item.name}</p>
                                    <p className="text-[9px] text-red-500 font-extrabold mt-0.5">{item.price.toFixed(2)} ₺</p>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleToggleItemAvailability(item.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                    item.is_available
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                      : "bg-red-50 border-red-200 text-red-500"
                                  }`}
                                >
                                  {item.is_available ? "Satışta" : "Tükendi"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* QR Button */}
            <button
              onClick={() => setIsQrOpen(true)}
              className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5"
            >
              <QrCode size={18} />
              Masa QR Kodu Üret
            </button>
          </div>
        )}

        {/* ───────────────── VIEW 3: STAMP CARD TOOL PANEL ───────────────── */}
        {activeTool === "stamp" && stampCampaign && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 shadow-sm space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">KAŞE LİMİTİ</p>
                  <p className="text-sm font-black text-stone-850">{stampCampaign.stamp_limit} Adet</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">ÖDÜL KUPONU</p>
                  <p className="text-xs font-black text-amber-600 truncate uppercase">{stampCampaign.reward_title}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-wider mb-0.5">ONAY PIN KODU</p>
                  <span className="font-mono text-sm font-black bg-stone-100 px-3 py-1.5 rounded-xl text-amber-600 block text-center">
                    {stampCampaign.pin_code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl">
                    <Check size={12} weight="bold" />
                    Kampanya Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/40 rounded-[2rem] border border-amber-300/30 p-5 space-y-3">
              <h4 className="text-xs font-black text-amber-850 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkle size={16} weight="fill" />
                Nasıl Kaşe Basılır?
              </h4>
              <p className="text-[10px] text-stone-600 leading-normal font-medium">
                Müşterileriniz kaşe talep ettiğinde, yukarıdaki 4 haneli PIN kodunu müşterinin cihazındaki Stamp Wallet alanına girerek kaşe işlemini tamamlayabilirsiniz.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* ───────────────── DRAWERS & DIALOGS ───────────────── */}

      {/* 1. Add Category Drawer */}
      <Drawer.Root open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[60vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                KATEGORİ <span className="text-red-500">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Menü gruplarınızı yönetin (Ana Yemekler, İçecekler vb.)
              </Drawer.Description>

              <form onSubmit={handleAddCategory} className="space-y-4 pb-12">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Kategori Adı</label>
                  <input
                    required
                    placeholder="Sıcak Kahveler"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Kategori Oluştur
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 2. Add Item Drawer */}
      <Drawer.Root open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                ÜRÜN <span className="text-red-500">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Menünüze yeni bir ürün kartı ekleyin
              </Drawer.Description>

              <form onSubmit={handleAddMenuItem} className="space-y-4 pb-12">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Kategori Seçimi</label>
                  <select
                    required
                    value={newItemCategory}
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
                    onChange={(e) => setNewItemName(e.target.value)}
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

                <div className="grid grid-cols-2 gap-4">
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

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Diyet Etiketleri</label>
                    <div className="flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemDietary((prev) =>
                            prev.includes("vegan") ? prev.filter((f) => f !== "vegan") : [...prev, "vegan"]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                          newItemDietary.includes("vegan")
                            ? "bg-green-500 text-white"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        🌱 Vegan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewItemDietary((prev) =>
                            prev.includes("gluten-free") ? prev.filter((f) => f !== "gluten-free") : [...prev, "gluten-free"]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                          newItemDietary.includes("gluten-free")
                            ? "bg-amber-500 text-white"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        🌾 Glütensiz
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Ürün Görseli</label>
                  <input
                    placeholder="https://..."
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Ürünü Ekle
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 3. QR Menu Drawer */}
      <Drawer.Root open={isQrOpen} onOpenChange={setIsQrOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                MASA <span className="text-red-500">QR KODU</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Masaya özel QR kod linki üretin
              </Drawer.Description>

              <div className="space-y-6 pb-12 flex flex-col items-center">
                <div className="w-full space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Masa Numarası</label>
                  <input
                    type="text"
                    value={qrTableNum}
                    onChange={(e) => setQrTableNum(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-center text-stone-850 focus:border-red-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="bg-stone-50 p-5 rounded-3xl border border-stone-150 w-full flex flex-col items-center gap-4 text-center">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                    <QrCode size={160} weight="thin" className="text-stone-850" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-stone-850 uppercase tracking-wider">Masa {qrTableNum} QR Linki</p>
                    <p className="text-[9px] text-stone-400 font-mono break-all max-w-[280px] mt-1 select-all">
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/apps/digital-menu?biz=${id}&table=${qrTableNum}`
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/apps/digital-menu?biz=${id}&table=${qrTableNum}`;
                    navigator.clipboard.writeText(link);
                    toast.success("Masa QR Linki panoya kopyalandı!");
                  }}
                  className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Linki Kopyala
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      {/* 4. Create Stamp Campaign Drawer */}
      <Drawer.Root open={isCreateStampOpen} onOpenChange={setIsCreateStampOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                SADAKAT <span className="text-amber-500">KAMPANYASI KUR</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Müşterileriniz için kaşe limiti ve ödül tanımlayın
              </Drawer.Description>

              <form onSubmit={handleCreateStampCampaign} className="space-y-4 pb-12">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Kaşe Limiti</label>
                  <select
                    value={stampLimit}
                    onChange={(e) => setStampLimit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 outline-none focus:border-amber-500"
                  >
                    <option value="5">5 Kaşe</option>
                    <option value="8">8 Kaşe</option>
                    <option value="10">10 Kaşe</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Ödül Başlığı</label>
                  <input
                    required
                    placeholder="1 Hediye Filtre Kahve"
                    value={rewardTitle}
                    onChange={(e) => setRewardTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Onay PIN Kodu (4 Hane)</label>
                  <input
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 focus:border-amber-500 focus:bg-white outline-none font-mono text-center tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                >
                  Kampanyayı Başlat
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}
