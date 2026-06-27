"use client";
import { getAppRootUrl } from "@/lib/apps";

import { Cards, SquaresFour, Compass, Heart } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

interface IskambilAppBarProps {
  activeTab: "discover" | "foryou" | "none";
}

const translations = {
  tr: {
    archiveTitle: "İskambil Rehberi",
    archiveSubtitle: "Popüler Kart Oyunları Arşivi",
    discoverTab: "Keşfet",
    foryouTab: "Sana Özel",
    back: "Geri Dön"
  },
  en: {
    archiveTitle: "Card Games Guide",
    archiveSubtitle: "Popular Card Games Archive",
    discoverTab: "Discover",
    foryouTab: "For You",
    back: "Go Back"
  }
};

export default function IskambilAppBar({ activeTab }: IskambilAppBarProps) {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang];

  return (
    <>
      {/* Top Header (Title & Back button) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Brand/Title & Back Button */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => window.location.href = getAppRootUrl()}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200/60 h-9 shadow-sm transition-all active:scale-95 flex-shrink-0"
              title={t.back}
            >
              <SquaresFour size={16} weight="fill" className="text-zinc-900 shrink-0" />
              <span className="text-xs font-bold">{t.back}</span>
            </button>
            
            <div className="flex flex-col min-w-0">
              <h1 
                onClick={() => router.push("/apps/iskambil")}
                className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-gray-900 cursor-pointer hover:opacity-85 select-none truncate"
              >
                <Cards size={24} weight="fill" className="text-zinc-900 flex-shrink-0" />
                {t.archiveTitle}
              </h1>
              <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 hidden sm:block truncate">
                {t.archiveSubtitle}
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* Bottom Appbar (Navigation) */}
      {activeTab !== "none" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-4 py-2 pb-safe-area-inset-bottom">
          <div className="flex items-center w-full max-w-md mx-auto gap-1">
            <button
              onClick={() => router.push("/apps/iskambil")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "discover"
                  ? "text-zinc-900 bg-zinc-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "discover" ? "bg-zinc-100" : ""}`}>
                <Compass size={20} weight={activeTab === "discover" ? "fill" : "bold"} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">{t.discoverTab}</span>
            </button>

            <button
              onClick={() => router.push("/apps/iskambil/for-you")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "foryou"
                  ? "text-zinc-900 bg-zinc-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-colors ${activeTab === "foryou" ? "bg-zinc-100" : ""}`}>
                <Heart size={20} weight={activeTab === "foryou" ? "fill" : "bold"} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">{t.foryouTab}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
