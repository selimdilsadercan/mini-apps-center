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
}

interface AppBarProps {
  activePage: ActivePage;
}

export default function AppBar({ activePage }: AppBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-4 py-2 pb-safe z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* Hub */}
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200 ${
            activePage === ActivePage.HUB ? "scale-110" : "opacity-60"
          }`}
        >
          <div className={`p-2 rounded-2xl transition-colors ${
            activePage === ActivePage.HUB ? "bg-indigo-50" : ""
          }`}>
            <SquaresFour 
              size={26} 
              weight={activePage === ActivePage.HUB ? "fill" : "regular"}
              color={activePage === ActivePage.HUB ? "#4F46E5" : "#6B7280"} 
            />
          </div>
          <span className={`text-[10px] font-bold ${activePage === ActivePage.HUB ? "text-indigo-600" : "text-gray-500"}`}>
            Hub
          </span>
        </Link>

        {/* Discover */}
        <Link
          href="/discover"
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200 ${
            activePage === ActivePage.DISCOVER ? "scale-110" : "opacity-60"
          }`}
        >
          <div className={`p-2 rounded-2xl transition-colors ${
            activePage === ActivePage.DISCOVER ? "bg-indigo-50" : ""
          }`}>
            <Compass 
              size={26} 
              weight={activePage === ActivePage.DISCOVER ? "bold" : "regular"}
              color={activePage === ActivePage.DISCOVER ? "#4F46E5" : "#6B7280"} 
            />
          </div>
          <span className={`text-[10px] font-bold ${activePage === ActivePage.DISCOVER ? "text-indigo-600" : "text-gray-500"}`}>
            Explore
          </span>
        </Link>

        {/* Notifications */}
        <Link
          href="/apps/morning"
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200 ${
            activePage === ActivePage.NOTIFICATIONS ? "scale-110" : "opacity-60"
          }`}
        >
          <div className={`p-2 rounded-2xl transition-colors ${
            activePage === ActivePage.NOTIFICATIONS ? "bg-indigo-50" : ""
          }`}>
            <Bell 
              size={26} 
              weight={activePage === ActivePage.NOTIFICATIONS ? "fill" : "regular"}
              color={activePage === ActivePage.NOTIFICATIONS ? "#4F46E5" : "#6B7280"} 
            />
          </div>
          <span className={`text-[10px] font-bold ${activePage === ActivePage.NOTIFICATIONS ? "text-indigo-600" : "text-gray-500"}`}>
            Alerts
          </span>
        </Link>

        {/* Profil */}
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-all duration-200 ${
            activePage === ActivePage.PROFILE ? "scale-110" : "opacity-60"
          }`}
        >
          <div className={`p-2 rounded-2xl transition-colors ${
            activePage === ActivePage.PROFILE ? "bg-indigo-50" : ""
          }`}>
            <User 
              size={26} 
              weight={activePage === ActivePage.PROFILE ? "fill" : "regular"}
              color={activePage === ActivePage.PROFILE ? "#4F46E5" : "#6B7280"} 
            />
          </div>
          <span className={`text-[10px] font-bold ${activePage === ActivePage.PROFILE ? "text-indigo-600" : "text-gray-500"}`}>
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}
