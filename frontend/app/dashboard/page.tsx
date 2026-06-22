"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ChefHat,
  Plus,
  Storefront,
  CaretLeft,
  ArrowRight,
  Sparkle
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { digital_menu, stamp_card } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { useRouter } from "next/navigation";

const client = createBrowserClient();

export default function BusinessListPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // User Owned Businesses (merged list from digital_menu & stamp_card)
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Create Business Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [newColor, setNewColor] = useState("#EF4444");

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
      setBusinesses(res.businesses || []);
    } catch (e) {
      console.error(e);
      toast.error("İşletmeler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Create Business
  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await client.business.createBusiness({
        userId: user.id,
        name: newName,
        description: newDesc,
        logoUrl: newLogo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=150&auto=format&fit=crop&q=80",
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

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF9] p-6 text-center">
        <Storefront size={48} className="text-stone-900 mb-4" />
        <h1 className="text-2xl font-black mb-2">İşletme Girişi</h1>
        <p className="text-stone-550 text-sm max-w-xs mb-6 font-medium">
          İşletme paneline erişmek ve dükkanlarınızı yönetmek için lütfen giriş yapın.
        </p>
        <button
          onClick={() => (window.location.href = `${getAppRootUrl()}sign-in`)}
          className="bg-stone-900 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-md"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative font-sans">
      <Toaster position="top-center" />

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (window.location.href = getAppRootUrl())}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" />
            <span>Ana Sayfa</span>
          </button>
        </div>

        {/* Business List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              İşletmelerim ({businesses.length})
            </h2>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm shadow-red-500/10 cursor-pointer"
            >
              <Plus size={10} weight="bold" />
              Yeni Ekle
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs font-semibold animate-pulse uppercase tracking-widest">
              İşletmeler yükleniyor...
            </div>
          ) : businesses.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-stone-200 p-6 shadow-sm">
              <Storefront size={32} className="text-stone-300 mx-auto mb-2" />
              <p className="text-stone-850 text-xs font-black uppercase">İşletme bulunamadı</p>
              <p className="text-stone-450 text-[10px] max-w-[200px] mx-auto mt-1 leading-normal">
                Kampanyalarınızı ve menülerinizi yönetmek için ilk işletme profilinizi oluşturun.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => router.push(`/dashboard/business?id=${biz.id}`)}
                  className="bg-white p-4.5 rounded-[2rem] border border-stone-200/80 shadow-sm flex items-center gap-4 hover:border-red-400 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-98"
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                    {biz.logo_url ? (
                      <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                    ) : (
                      biz.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-stone-900 truncate">{biz.name}</h3>
                    <p className="text-[10px] text-stone-450 truncate mt-0.5">{biz.description || "Açıklama belirtilmedi."}</p>
                  </div>
                  <ArrowRight size={16} className="text-stone-400 mr-1 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

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
                  <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Logo Görsel Linki</label>
                  <input
                    placeholder="https://..."
                    value={newLogo}
                    onChange={(e) => setNewLogo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none"
                  />
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
