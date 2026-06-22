"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  SquaresFour, 
  Compass, 
  User,
  Sparkle,
  Globe,
  ChatTeardropDots
} from "@phosphor-icons/react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

// Aktif sayfa enum'u
export enum ActivePage {
  HUB = "hub",
  DISCOVER = "discover",
  FEED = "feed",  
  AI_CHAT = "ai-chat",
  NOTIFICATIONS = "notifications",
  PROFILE = "profile",
  GROCERIES = "groceries",
  PLAN = "plan",
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

  return (
    <>
      {/* Feedback Floating Button */}
      <Link
        href="/f?board=9be81ce2"
        className="fixed bottom-[6.5rem] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-zinc-200 shadow-xl px-4 py-2 rounded-full z-50 flex items-center gap-2 hover:bg-violet-50 hover:border-violet-200 transition-all group active:scale-95"
      >
        <ChatTeardropDots size={18} weight="fill" className="text-violet-600 group-hover:scale-110 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-violet-700">Feedback Ver</span>
      </Link>

      <nav
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2.5rem] py-3 z-50 transition-all duration-300 ${
          isAdmin ? "w-[95%] max-w-sm px-2" : "w-fit px-5"
        }`}
      >
      <div
        className={`flex items-center transition-all duration-300 ${
          isAdmin ? "justify-around w-full" : "gap-5"
        }`}
      >
        {/* Hub */}
        <Link
          href="/home"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.HUB ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.HUB ? "bg-indigo-600 shadow-lg shadow-indigo-200" : "bg-transparent group-hover:bg-indigo-50"
          }`}>
            <SquaresFour 
              size={24} 
              weight={activePage === ActivePage.HUB ? "fill" : "bold"}
              color={activePage === ActivePage.HUB ? "white" : "#1F2937"} 
            />
          </div>
        </Link>

        {/* Discover */}
        <Link
          href="/discover"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.DISCOVER ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.DISCOVER ? "bg-[#34C759] shadow-lg shadow-green-100" : "bg-transparent group-hover:bg-green-50"
          }`}>
            <Compass 
              size={24} 
              weight={activePage === ActivePage.DISCOVER ? "fill" : "bold"}
              color={activePage === ActivePage.DISCOVER ? "white" : "#1F2937"} 
            />
          </div>
        </Link>

        {/* AI Chat — admin only */}
        {isAdmin && (
        <Link
          href="/ai-chat"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.AI_CHAT ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.AI_CHAT ? "bg-violet-600 shadow-lg shadow-violet-100" : "bg-transparent group-hover:bg-violet-50"
          }`}>
            <Sparkle 
              size={24} 
              weight={activePage === ActivePage.AI_CHAT ? "fill" : "bold"}
              color={activePage === ActivePage.AI_CHAT ? "white" : "#1F2937"} 
            />
          </div>
        </Link>
        )}

        {/* Feed — admin only */}
        {isAdmin && (
        <Link
          href="/feed"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.FEED ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.FEED ? "bg-blue-600 shadow-lg shadow-blue-100" : "bg-transparent group-hover:bg-blue-50"
          }`}>
            <Globe 
              size={24} 
              weight={activePage === ActivePage.FEED ? "fill" : "bold"}
              color={activePage === ActivePage.FEED ? "white" : "#1F2937"} 
            />
          </div>
        </Link>
        )}

        {/* Profil */}
        <Link
          href="/profile"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.PROFILE ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className="relative">
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
              activePage === ActivePage.PROFILE ? "bg-gray-900 shadow-lg shadow-gray-200" : "bg-transparent group-hover:bg-gray-100"
            }`}>
              <User 
                size={24} 
                weight={activePage === ActivePage.PROFILE ? "fill" : "bold"}
                color={activePage === ActivePage.PROFILE ? "white" : "#1F2937"} 
              />
            </div>
            {hasBadge && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
        </Link>
      </div>
    </nav>
    </>
  );
}
