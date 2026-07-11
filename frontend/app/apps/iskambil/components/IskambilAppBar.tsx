"use client";
import { getAppRootUrl } from "@/lib/apps";

import { Cards, SquaresFour, Compass, Heart, CaretLeft } from "@phosphor-icons/react";
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
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="max-w-xl mx-auto w-full px-4 py-3 flex items-center gap-2">

          {/* Back Button (CaretLeft) */}
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            title={t.back}
          >
            <CaretLeft size={14} weight="bold" className="text-zinc-950" />
          </button>

          {/* Brand/Title */}
          <h1
            onClick={() => router.push("/apps/iskambil")}
            className="flex-1 min-w-0 text-base font-black tracking-tight flex items-center gap-1.5 uppercase leading-none text-gray-900 cursor-pointer hover:opacity-85 select-none truncate"
          >
            <Cards size={18} weight="fill" className="text-zinc-950 shrink-0" />
            <span className="truncate">{t.archiveTitle}</span>
          </h1>

        </div>
      </header>

      {/* Bottom Appbar (Navigation) */}
      {activeTab !== "none" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-4 py-2 pb-safe-area-inset-bottom">
          <div className="flex items-center w-full max-w-md mx-auto gap-1">
            <button
              onClick={() => router.push("/apps/iskambil")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${activeTab === "discover"
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${activeTab === "foryou"
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
