"use client";

import { Suspense, useState, useEffect, createContext, useContext } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ChefHat,
  Cards,
  CaretLeft,
  CaretRight,
  GraduationCap,
  ChatTeardropDots,
  Gear,
  SquaresFour,
  SignOut,
  Layout,
  Storefront,
  GameController,
  Coffee,
  Megaphone
} from "@phosphor-icons/react";
import { Toaster, toast } from "react-hot-toast";
import * as Popover from "@radix-ui/react-popover";
import { createBrowserClient } from "@/lib/api";
import { stamp_card, business } from "@/lib/client";

const client = createBrowserClient();

interface BusinessContextType {
  id: string;
  business: business.Business | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
  stampCampaign: stamp_card.UserOwnedBusiness | null;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within a BusinessProvider");
  return context;
};

function BusinessLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<business.Business | null>(null);
  const [stampCampaign, setStampCampaign] = useState<stamp_card.UserOwnedBusiness | null>(null);

  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadBusinessDetails();
    }
  }, [isUserLoaded, user, id]);

  const loadBusinessDetails = async () => {
    if (!user || !id) return;
    try {
      setLoading(true);
      const bizRes = await client.business.getBusiness(id);
      setBizData(bizRes.business || null);

      const stampRes = await client.stamp_card.getUserData(user.id);
      const matchedStamp = (stampRes.my_businesses || []).find(
        (b) => b.id === id || (b.name && bizRes.business?.name && b.name.toLowerCase() === bizRes.business.name.toLowerCase())
      );
      setStampCampaign(matchedStamp || null);
    } catch (err) {
      console.error(err);
      toast.error("İşletme detayları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
          <h1 className="text-lg font-black text-stone-900 mb-2">Geçersiz Link</h1>
          <p className="text-sm text-stone-500">İşletme linkinde ID bulunamadı.</p>
        </div>
      </div>
    );
  }

  const apps = [
    {
      id: "digital-menu",
      title: "Dijital Menü",
      Icon: ChefHat,
      color: "bg-red-500",
      path: `/dashboard/digital-menu?id=${id}`
    },
    {
      id: "stamp",
      title: "Sadakat Kartı",
      Icon: Cards,
      color: "bg-amber-500",
      path: `/dashboard/stamp?id=${id}`
    },
    {
      id: "tutor",
      title: "Tutor Place",
      Icon: GraduationCap,
      color: "bg-indigo-500",
      path: "/apps/tutor-crm"
    },
    {
      id: "feedback",
      title: "Feedback Board",
      Icon: ChatTeardropDots,
      color: "bg-violet-600",
      path: `/dashboard/feedback-board?id=${id}`
    },
    {
      id: "board-game-clubs",
      title: "Board Game Clubs",
      Icon: GameController,
      color: "bg-[#D4A830]",
      path: `/dashboard/board-game-clubs?id=${id}`
    },
    {
      id: "workplaces",
      title: "Workplaces",
      Icon: Coffee,
      color: "bg-[#6F4E37]",
      path: `/dashboard/workplaces?id=${id}`
    },
    {
      id: "events",
      title: "Events",
      Icon: Megaphone,
      color: "bg-[#00aeef]",
      path: `/dashboard/events?id=${id}`
    }
  ];

  const isDashboard = pathname === "/dashboard/business";
  const isSettings = pathname === "/dashboard/business/settings";

  return (
    <BusinessContext.Provider value={{ id, business: bizData, loading, refreshBusiness: loadBusinessDetails, stampCampaign }}>
      <div className="flex h-screen bg-[#F8F9FA] text-stone-900 font-sans overflow-hidden">
        <Toaster position="top-center" />

        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-stone-200 shadow-sm z-30">
          <div className="p-6 border-b border-stone-100">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                {bizData?.logo_url ? (
                  <img src={bizData.logo_url} alt={bizData.name} className="w-full h-full object-cover" />
                ) : (
                  bizData?.name?.slice(0, 2).toUpperCase() || "??"
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-xs text-stone-900 truncate">{bizData?.name || "Yükleniyor..."}</h2>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Yönetici</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-3 mb-4">Menü</h3>
              <button
                onClick={() => router.push(`/dashboard/business?id=${id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm text-left cursor-pointer ${
                  isDashboard 
                    ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black" 
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50 font-bold"
                }`}
              >
                <Layout size={20} weight={isDashboard ? "fill" : "bold"} />
                Dashboard
              </button>
              <button
                onClick={() => router.push(`/dashboard/business/settings?id=${id}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm text-left cursor-pointer ${
                  isSettings 
                    ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black" 
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50 font-bold"
                }`}
              >
                <Gear size={20} weight={isSettings ? "fill" : "bold"} className={!isSettings ? "group-hover:rotate-45 transition-transform" : ""} />
                Ayarlar
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-3 mb-4">Uygulamalar</h3>
              {apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => router.push(app.path)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all font-bold text-sm group text-left cursor-pointer"
                >
                  <div className={`w-7 h-7 rounded-lg ${app.color} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <app.Icon size={16} weight="fill" />
                  </div>
                  {app.title}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Top Header */}
          <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-8 shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="md:hidden p-2 text-stone-600 cursor-pointer"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
              <div>
                <h1 className="text-lg font-black text-stone-900 tracking-tight">
                  {isSettings ? "Ayarlar" : "Dashboard"}
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    İşletmelerim
                  </button>
                  <CaretRight size={8} weight="bold" />
                  <span className="text-stone-600">{bizData?.name || "..." }</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 overflow-hidden shadow-sm cursor-pointer hover:ring-2 hover:ring-red-500/20 transition-all outline-none">
                    <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content 
                    className="w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                    sideOffset={8}
                    align="end"
                  >
                    <div className="p-3 border-b border-stone-100 mb-1">
                      <p className="text-xs font-black text-stone-900 truncate">{user?.fullName || "Kullanıcı"}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">Yönetici</p>
                    </div>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all font-black text-[11px] text-left cursor-pointer"
                    >
                      <SignOut size={16} weight="bold" />
                      Çıkış Yap
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </BusinessContext.Provider>
  );
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#F8F9FA] items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
        </div>
      }
    >
      <BusinessLayoutContent>{children}</BusinessLayoutContent>
    </Suspense>
  );
}
