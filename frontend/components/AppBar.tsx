"use client";

import Link from "next/link";
import { 
  SquaresFour, 
  Compass, 
  Bell, 
  User
} from "@phosphor-icons/react";

// Aktif sayfa enum'u
export enum ActivePage {
  HUB = "hub",
  DISCOVER = "discover",
  NOTIFICATIONS = "notifications",
  PROFILE = "profile",
  GROCERIES = "groceries",
  PLAN = "plan",
}

interface AppBarProps {
  activePage: ActivePage;
}

export default function AppBar({ activePage }: AppBarProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2.5rem] px-2 py-3 z-50">
      <div className="flex items-center justify-around">
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
        {/* Notifications */}
        <Link
          href="/apps/morning"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.NOTIFICATIONS ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.NOTIFICATIONS ? "bg-amber-500 shadow-lg shadow-amber-100" : "bg-transparent group-hover:bg-amber-50"
          }`}>
            <Bell 
              size={24} 
              weight={activePage === ActivePage.NOTIFICATIONS ? "fill" : "bold"}
              color={activePage === ActivePage.NOTIFICATIONS ? "white" : "#1F2937"} 
            />
          </div>
        </Link>

        {/* Profil */}
        <Link
          href="/profile"
          className={`flex flex-col items-center group transition-all duration-300 ${
            activePage === ActivePage.PROFILE ? "scale-110" : "opacity-50 hover:opacity-100"
          }`}
        >
          <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
            activePage === ActivePage.PROFILE ? "bg-gray-900 shadow-lg shadow-gray-200" : "bg-transparent group-hover:bg-gray-100"
          }`}>
            <User 
              size={24} 
              weight={activePage === ActivePage.PROFILE ? "fill" : "bold"}
              color={activePage === ActivePage.PROFILE ? "white" : "#1F2937"} 
            />
          </div>
        </Link>
      </div>
    </nav>

  );
}
