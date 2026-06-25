"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Plus,
  Storefront,
  CaretLeft,
  CaretRight,
  Trash,
  Image as ImageIcon,
  UploadSimple,
  CaretDown,
  Check
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { getAppRootUrl, BUSINESS_APPS, MiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/image";
import { useRef } from "react";

const client = createBrowserClient();

export default function BusinessPanelPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Create Business Dialog State
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

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchBusinesses();
    }
  }, [isUserLoaded, user]);

  const fetchBusinesses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await client.business.getOwnedBusinesses(user.id);
      const bizList = res.businesses || [];
      setBusinesses(bizList);
      
      if (bizList.length > 0 && !selectedBusinessId) {
        // En son seçilen işletmeyi hatırla
        const savedId = localStorage.getItem(`last_selected_business_${user.id}`);
        const businessExists = bizList.some(b => b.id === savedId);
        
        if (savedId && businessExists) {
          setSelectedBusinessId(savedId);
        } else {
          setSelectedBusinessId(bizList[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("İşletmeler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Seçili işletme değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (user?.id && selectedBusinessId) {
      localStorage.setItem(`last_selected_business_${user.id}`, selectedBusinessId);
    }
  }, [selectedBusinessId, user?.id]);

  const selectedBusiness = useMemo(() => 
    businesses.find(b => b.id === selectedBusinessId) || null
  , [businesses, selectedBusinessId]);

  const enabledBusinessApps = useMemo(() => {
    if (!selectedBusiness) return [];
    return BUSINESS_APPS.filter(app => 
      app.isImplemented && 
      !app.isCancelled && 
      selectedBusiness.enabled_apps?.includes(app.id)
    );
  }, [selectedBusiness]);

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
        fetchBusinesses();
      }
    } catch (err) {
      toast.error("İşletme oluşturulurken hata oluştu.");
    }
  };

  if (!isUserLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 text-center">
        <Storefront size={48} className="text-gray-900 mb-4" />
        <h1 className="text-2xl font-black mb-2">İşletme Girişi</h1>
        <p className="text-gray-500 text-sm max-w-xs mb-6 font-medium">
          İşletme paneline erişmek ve dükkanlarınızı yönetmek için lütfen giriş yapın.
        </p>
        <button
          onClick={() => (window.location.href = `${getAppRootUrl()}sign-in`)}
          className="bg-gray-900 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-md"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-12">
      <Toaster position="top-center" />

      <main className="px-5 py-2 max-w-lg mx-auto w-full">
        {/* Header Section with Back Button and Account Switcher */}
        <section className="mt-8 mb-8 flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-white hover:border-gray-200 shrink-0"
          >
            <CaretLeft size={20} weight="bold" />
          </button>

          <button 
            onClick={() => setIsSwitcherOpen(true)}
            className="flex items-center gap-3 group cursor-pointer text-left min-w-0"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:border-gray-200 transition-all">
              {selectedBusiness?.logo_url ? (
                <img src={selectedBusiness.logo_url} alt={selectedBusiness.name} className="w-full h-full object-cover" />
              ) : (
                <Storefront size={24} weight="fill" className="text-gray-300" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-[1000] text-gray-900 tracking-tighter uppercase truncate max-w-[180px]">
                  {selectedBusiness?.name || "İşletme Seç"}
                </h1>
                <CaretDown size={14} weight="bold" className="text-gray-400 group-hover:text-gray-900 transition-colors mt-0.5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                İşletme Paneli
              </p>
            </div>
          </button>
        </section>

        {/* Business Apps List */}
        <div className="space-y-0">
          {businesses.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 p-8">
              <Storefront size={48} weight="light" className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-900 font-black text-sm uppercase tracking-tight">Henüz işletmen yok</p>
              <p className="text-gray-400 text-xs mt-2 mb-6">İlk işletmeni oluşturarak araçları kullanmaya başla.</p>
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 active:scale-95 transition-all"
              >
                İşletme Oluştur
              </button>
            </div>
          ) : enabledBusinessApps.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-[2rem] border border-gray-100 p-6">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Aktif Uygulama Yok</p>
              <p className="text-gray-300 text-[10px] mt-1">Bu işletme için henüz bir uygulama yetkilendirilmemiş.</p>
            </div>
          ) : (
            enabledBusinessApps.map((app, index) => (
              <AppRow 
                key={app.id} 
                app={app} 
                index={index} 
                onClick={() => {
                  const path = app.id === "tutor-crm" ? "/apps/tutor-crm" :
                              app.id === "campus-events" ? `/dashboard/events?id=${selectedBusinessId}` :
                              app.id === "stamp-card" ? `/dashboard/stamp?id=${selectedBusinessId}` :
                              `/dashboard/${app.id}?id=${selectedBusinessId}`;
                  router.push(path);
                }}
              />
            ))
          )}
        </div>
      </main>

      {/* Account Switcher Drawer */}
      <Drawer.Root open={isSwitcherOpen} onOpenChange={setIsSwitcherOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[70] max-w-lg mx-auto border-t border-gray-100 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 bg-gray-100 rounded-full mb-8" />
              
              <div className="flex items-center gap-4 mb-8 px-2">
                <div className="w-16 h-16 rounded-[2rem] bg-gray-900 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-gray-200">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="User" className="w-full h-full object-cover rounded-[2rem]" />
                  ) : (
                    user?.firstName?.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">{user?.fullName}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Hesap Sahibi</p>
                </div>
              </div>

              <div className="h-px bg-gray-50 mb-8" />

              <Drawer.Title className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">
                İşletmeleriniz
              </Drawer.Title>

              <div className="space-y-3 mb-8">
                {businesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      setSelectedBusinessId(biz.id);
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-[0.98] group ${
                      selectedBusinessId === biz.id 
                        ? "bg-slate-100 text-slate-900 shadow-sm" 
                        : "bg-white text-slate-900 hover:bg-slate-50 border border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {biz.logo_url ? (
                        <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <span className="font-bold text-sm text-slate-300">{biz.name.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-[14px] truncate text-slate-900">{biz.name}</p>
                      <p className="text-[10px] truncate text-slate-500 font-medium mt-0.5">
                        {biz.description || "İşletme Profili"}
                      </p>
                    </div>
                    {selectedBusinessId === biz.id && (
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0 shadow-md">
                        <Check size={14} weight="bold" className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsSwitcherOpen(false);
                  setIsCreateOpen(true);
                }}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-100 transition-all active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm group-hover:border-slate-300 transition-colors">
                  <Plus size={20} weight="bold" className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-[14px] text-slate-900">Yeni İşletme Ekle</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Yeni bir dükkan profili oluşturun</p>
                </div>
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Create Business Drawer */}
      <Drawer.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-lg mx-auto border-t border-gray-100 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 bg-gray-100 rounded-full mb-8" />
              <Drawer.Title className="text-xl font-black text-gray-900 tracking-tight mb-1">
                İŞLETME <span className="text-red-500">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-gray-400 text-[9px] font-black uppercase tracking-wider mb-8">
                Yeni dükkanınız için işletme profili oluşturun
              </Drawer.Description>

              <form onSubmit={handleCreateBusiness} className="space-y-6 pb-12">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider ml-4">İşletme Adı</label>
                  <input
                    required
                    placeholder="Brew Lab Coffee"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] p-5 text-sm font-bold text-gray-900 focus:border-red-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider ml-4">Açıklama / Slogan</label>
                  <input
                    placeholder="En taze gurme kahveler ve el yapımı kruvasanlar"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] p-5 text-sm font-bold text-gray-900 focus:border-red-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider ml-4">İşletme Logosu</label>
                  <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-[2.5rem] p-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 relative group shadow-sm">
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
                        <ImageIcon size={24} weight="bold" className="text-gray-200" />
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-gray-100 border-t-red-500 rounded-full animate-spin" />
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
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                      >
                        <UploadSimple size={14} weight="bold" />
                        {newLogo ? "Logoyu Değiştir" : "Logo Seç"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-black text-gray-400 tracking-wider ml-4 block mb-1">Tema Rengi</label>
                  <div className="flex gap-3 px-2">
                    {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#845EF7", "#EC4899"].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={`w-10 h-10 rounded-full border-4 transition-all ${
                          newColor === color ? "border-gray-900 scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-98 mt-4"
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

function AppRow({ 
  app, 
  index, 
  onClick 
}: { 
  app: MiniApp; 
  index: number; 
  onClick: () => void;
}) {
  const Icon = app.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="relative group"
    >
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 py-4 px-1 transition-all active:scale-[0.98] text-left border-b border-gray-50 last:border-0 cursor-pointer"
      >
        <div 
          className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
          style={{ backgroundColor: app.color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <Icon size={24} weight="fill" className="text-white relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="font-black text-gray-900 text-[15px] tracking-tight truncate group-hover:text-indigo-600 transition-colors">
              {app.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-[12px] font-medium line-clamp-2 leading-tight">
              {app.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
