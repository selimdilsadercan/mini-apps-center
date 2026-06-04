"use client";
import { getAppRootUrl } from "@/lib/apps";

import { Cards, ArrowLeft, Compass, Heart } from "@phosphor-icons/react";
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
    back: "Geri"
  },
  en: {
    archiveTitle: "Card Games Guide",
    archiveSubtitle: "Popular Card Games Archive",
    discoverTab: "Discover",
    foryouTab: "For You",
    back: "Back"
  }
};

export default function IskambilAppBar({ activeTab }: IskambilAppBarProps) {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#ffffff] border-b border-[#e2dec5] shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
        
        {/* Brand/Title & Back Button */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f2e9] border border-[#e2dcc8] text-[#0c3122] hover:bg-[#eae6df] transition-all cursor-pointer flex-shrink-0"
            title={t.back}
          >
            <ArrowLeft size={18} weight="bold" />
          </button>
          
          <div className="flex flex-col min-w-0">
            <h1 
              onClick={() => router.push("/apps/iskambil")}
              className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-[#0c3122] cursor-pointer hover:opacity-85 select-none truncate"
            >
              <Cards size={24} weight="fill" className="text-[#0c3122] flex-shrink-0 hidden sm:inline-block" />
              {t.archiveTitle}
            </h1>
            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.2em] mt-1 hidden sm:block truncate">
              {t.archiveSubtitle}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[#f5f2e9] border border-[#e2dcc8] p-1 rounded-2xl">
          <button
            onClick={() => router.push("/apps/iskambil")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "discover"
                ? "bg-[#0c3122] text-white shadow-sm"
                : "text-[#0c3122] hover:bg-[#eae6df]"
            }`}
          >
            <Compass size={16} weight={activeTab === "discover" ? "fill" : "bold"} />
            <span>{t.discoverTab}</span>
          </button>

          <button
            onClick={() => router.push("/apps/iskambil/for-you")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "foryou"
                ? "bg-[#0c3122] text-white shadow-sm"
                : "text-[#0c3122] hover:bg-[#eae6df]"
            }`}
          >
            <Heart size={16} weight={activeTab === "foryou" ? "fill" : "bold"} />
            <span>{t.foryouTab}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
