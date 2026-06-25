"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ChefHat,
  CaretLeft,
  Palette,
  ShareNetwork,
  FileCode,
  Layout,
  Tag,
  Eye,
  EyeSlash,
  Plus
} from "@phosphor-icons/react";
import { Toaster } from "react-hot-toast";
import { DigitalMenuProvider, useDigitalMenu } from "./context";
import { getAppRootUrl } from "@/lib/apps";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { toast } from "react-hot-toast";

const client = createBrowserClient();

function Sidebar() {
  const { id, business, menuCategories, menuItems, selectedCategoryId, setSelectedCategoryId, refreshData, refreshPreview } = useDigitalMenu();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

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
        await refreshData();
        refreshPreview();
        if (!selectedCategoryId) {
          setSelectedCategoryId(res.category.id);
        }
      }
    } catch (e) {
      toast.error("Hata oluştu.");
    }
  };

  const isDesignActive = pathname.endsWith("/design");
  const isShareActive = pathname.endsWith("/share");
  const isBulkActive = pathname.endsWith("/bulk");
  const isContentActive = !isDesignActive && !isShareActive && !isBulkActive;

  return (
    <aside className="w-80 h-full bg-white border-r border-stone-200/80 flex flex-col shrink-0 z-20 shadow-sm">
      {/* Sidebar Top: Back Button & Brand Header */}
      <div className="p-6 border-b border-stone-100 space-y-5">
        <button
          onClick={() => {
            window.location.href = getAppRootUrl();
          }}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-all bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-4 py-2.5 rounded-2xl active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
          <span>Geri</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-red-500/10">
            <ChefHat size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-base text-stone-900 leading-tight truncate">Menü Yönetimi</h1>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider mt-0.5 truncate">{business?.name}</p>
          </div>
        </div>
      </div>

      {/* Categories List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Studio Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Layout size={14} />
            Stüdyo
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => router.push(`/dashboard/digital-menu/design?id=${id}`)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                isDesignActive
                  ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black"
                  : "bg-transparent hover:bg-stone-50 text-stone-500 hover:text-stone-700 font-bold"
              }`}
            >
              <Palette size={18} weight={isDesignActive ? "fill" : "bold"} />
              <span className="text-xs">Tasarım Stili</span>
            </button>

            <button
              onClick={() => router.push(`/dashboard/digital-menu/share?id=${id}`)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                isShareActive
                  ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black"
                  : "bg-transparent hover:bg-stone-50 text-stone-500 hover:text-stone-700 font-bold"
              }`}
            >
              <ShareNetwork size={18} weight={isShareActive ? "fill" : "bold"} />
              <span className="text-xs">QR Kod & Paylaş</span>
            </button>

            <button
              onClick={() => router.push(`/dashboard/digital-menu/bulk?id=${id}`)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                isBulkActive
                  ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black"
                  : "bg-transparent hover:bg-stone-50 text-stone-500 hover:text-stone-700 font-bold"
              }`}
            >
              <FileCode size={18} weight={isBulkActive ? "fill" : "bold"} />
              <span className="text-xs">Toplu Ürün Ekle</span>
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
              <Tag size={14} />
              Kategoriler ({menuCategories.length})
            </h3>
            <button
              onClick={() => setIsAddCatOpen(true)}
              className="bg-stone-100 text-stone-900 hover:bg-stone-200 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all active:scale-95"
            >
              EKLE
            </button>
          </div>

          {menuCategories.length === 0 ? (
            <div className="text-center py-8 px-4 text-stone-400 text-[10px] font-black uppercase tracking-wider border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
              Henüz kategori yok
            </div>
          ) : (
            <div className="space-y-1.5">
              {menuCategories.map((cat) => {
                const isActive = isContentActive && cat.id === selectedCategoryId;
                const itemsCount = menuItems.filter((i) => i.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      router.push(`/dashboard/digital-menu?id=${id}`);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? "bg-red-50 text-red-600 border border-red-100 font-black"
                        : "bg-transparent hover:bg-stone-50 text-stone-500 hover:text-stone-700 font-bold"
                    }`}
                  >
                    <span className="text-xs truncate mr-2">{cat.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-red-100 text-red-600" : "bg-stone-100 text-stone-400"
                    }`}>
                      {itemsCount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Drawer */}
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
                Menü gruplarınızı yönetin
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
    </aside>
  );
}

function PreviewPanel() {
  const { id, previewRefreshKey } = useDigitalMenu();
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  return (
    <>
      {!isPreviewOpen && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="bg-stone-900 text-white shadow-2xl px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-stone-800 active:scale-95 transition-all cursor-pointer whitespace-nowrap border border-stone-800"
          >
            <Eye size={18} weight="bold" />
            Önizlemeyi Göster
          </button>
        </div>
      )}

      {isPreviewOpen && (
        <aside className="hidden lg:flex w-[400px] h-full bg-stone-50 border-l border-stone-200/60 flex-col shrink-0 items-center justify-center p-6 relative">
          <div className="absolute top-6 left-6 right-6 flex items-center justify-end">
            <button
              onClick={() => {}} // Handled by iframe key refresh automatically if needed, or just let it be
              className="text-[9px] font-black text-stone-500 hover:text-stone-900 transition-all uppercase tracking-widest bg-white border border-stone-200/60 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 cursor-pointer"
            >
              YENİLE
            </button>
          </div>

          <div className="relative w-[308px] h-[616px] bg-stone-950 rounded-[3.5rem] border-[12px] border-stone-900 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-[#FAF6EE] relative z-20">
              <iframe
                key={previewRefreshKey}
                src={`${typeof window !== "undefined" ? window.location.origin : ""}/apps/digital-menu?biz=${id}&v=${previewRefreshKey}`}
                className="border-none origin-top-left"
                style={{
                  width: "360px",
                  height: "746px",
                  transform: "scale(0.791)",
                }}
                title="Customer Menu Preview"
              />
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="bg-white text-stone-900 border border-stone-200 shadow-[0_12px_40px_rgba(0,0,0,0.15)] px-7 py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <EyeSlash size={18} weight="bold" />
              Önizlemeyi Gizle
            </button>
          </div>
        </aside>
      )}
    </>
  );
}

export default function DigitalMenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <DigitalMenuProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#FDFBF9] text-stone-900 font-sans relative">
        <Toaster position="top-center" />

        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-red-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-amber-500/5 blur-[120px]" />
        </div>

        <div className="flex flex-1 w-full h-full relative z-10 overflow-hidden">
          <Sidebar />
          <main className="flex-1 h-full flex flex-col min-w-0 bg-[#FAF9F5]/60 overflow-hidden">
            {children}
          </main>
          <PreviewPanel />
        </div>
      </div>
    </DigitalMenuProvider>
  );
}
