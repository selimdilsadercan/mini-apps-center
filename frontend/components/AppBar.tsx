"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  MapTrifold,
  Heart,
  House,
  Wallet,
  Users,
  Sparkle,
  Wrench
} from "@phosphor-icons/react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// Aktif sayfa enum'u
export enum ActivePage {
  EXPLORE = "explore",
  SOCIAL = "social",
  HOBBY = "hobby",
  WALLET = "wallet",
  LIFE = "life",
  TOOLS = "tools",
  HOME = "home",
  // Diğer sayfalar (sidebar'da olmayanlar için uyumluluk)
  HUB = "hub",
  PROFILE = "profile",
  FEED = "feed",
  AI_CHAT = "ai_chat",
  DISCOVER = "discover",
  PLAN = "plan",
  GROCERIES = "groceries"
}

interface AppBarProps {
  activePage: ActivePage;
}

export default function AppBar({ activePage }: AppBarProps) {
  const [hasBadge, setHasBadge] = useState(false);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasBadge(localStorage.getItem("has_pending_requests") === "true");
    }

    const handleBadgeUpdate = (e: any) => {
      setHasBadge(e.detail.hasPending);
    };

    window.addEventListener("incoming-requests-badge", handleBadgeUpdate);
    return () => {
      window.removeEventListener("incoming-requests-badge", handleBadgeUpdate);
    };
  }, []);

  const isActive = (page: ActivePage) => activePage === page;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-gray-100 pb-safe-area-inset-bottom transition-all duration-500">
      <div className="max-w-lg mx-auto w-full relative">
        <div className="flex items-center justify-around py-2 px-1 gap-0.5">
          {/* Bugün (Hub) */}
          <Link
            href="/home?tab=discover"
            className={`relative flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
              isActive(ActivePage.HOME) ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <House 
              size={20} 
              weight={isActive(ActivePage.HOME) ? "fill" : "bold"}
              className="flex-shrink-0"
            />
            <span className="text-[9px] font-black uppercase tracking-tighter">Bugün</span>
          </Link>

          {/* Şehrini Keşfet */}
          <Link
            href="/home?tab=explore"
            className={`relative flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
              isActive(ActivePage.EXPLORE) ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <MapTrifold 
              size={20} 
              weight={isActive(ActivePage.EXPLORE) ? "fill" : "bold"}
              className="flex-shrink-0"
            />
            <span className="text-[9px] font-black uppercase tracking-tighter">Keşfet</span>
          </Link>

          {/* Hobiler */}
          <Link
            href="/home?tab=hobby"
            className={`relative flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
              isActive(ActivePage.HOBBY) ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Heart 
              size={20} 
              weight={isActive(ActivePage.HOBBY) ? "fill" : "bold"}
              className="flex-shrink-0"
            />
            <span className="text-[9px] font-black uppercase tracking-tighter">Hobilerim</span>
          </Link>

          {/* Cüzdan */}
          <Link
            href="/home?tab=wallet"
            className={`relative flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
              isActive(ActivePage.WALLET) ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Wallet 
              size={20} 
              weight={isActive(ActivePage.WALLET) ? "fill" : "bold"}
              className="flex-shrink-0"
            />
            <span className="text-[9px] font-black uppercase tracking-tighter">Cüzdan</span>
          </Link>

          {/* Yaşam */}
          <Link
            href="/home?tab=life"
            className={`relative flex-1 flex flex-col items-center gap-1 py-1 rounded-xl transition-all duration-200 ${
              isActive(ActivePage.LIFE) ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Sparkle 
              size={20} 
              weight={isActive(ActivePage.LIFE) ? "fill" : "bold"}
              className="flex-shrink-0"
            />
            <span className="text-[9px] font-black uppercase tracking-tighter">Yaşam</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
  