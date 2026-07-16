"use client";
import { getAppRootUrl } from "@/lib/apps";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/clerk-react";

// Page enum for active state
export type PageType = "games" | "history" | "contacts" | "profile" | "admin";

// Navigation items configuration
const getNavigationItems = (isAdmin: boolean) => {
  const baseItems = [
    {
      href: "/apps/game-companion/games",
      page: "games" as PageType,
      label: "Ana Sayfa",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/apps/game-companion/history",
      page: "history" as PageType,
      label: "Geçmiş",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  // Add admin tab if user is admin
  if (isAdmin) {
    baseItems.push({
      href: "/apps/game-companion/admin",
      page: "admin" as PageType,
      label: "Admin",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    });
  }

  return baseItems;
};

interface SidebarProps {
  currentPage: PageType | null;
}

export default function Sidebar({ currentPage }: SidebarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  const player = { name: user?.fullName || user?.firstName || "Kullanıcı" };
  const isAdmin = false;

  const items = getNavigationItems(isAdmin);

  const isActive = (page: PageType) => {
    return currentPage === page;
  };

  return (
    <>
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-app-surface lg:border-r lg:border-app-border">
        {/* Sidebar Header */}
        <div className="flex items-center px-6 py-6 border-b border-app-border h-20">
          <Link href="/apps/game-companion/games" className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight text-app-text uppercase">
              Yazboz
            </h1>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive(item.page)
                  ? "text-blue-600 bg-blue-50 shadow-sm shadow-blue-900/5"
                  : "text-app-muted hover:text-app-text hover:bg-app-surface-muted"
              }`}
            >
              {item.icon}
              <span className="font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-app-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-app-tab-track rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-app-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-app-text truncate">
                {player?.name || "Kullanıcı"}
              </p>
              <p className="text-xs text-app-muted truncate">
                {user?.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <span className="text-sm font-bold">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-app-surface rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-app-text mb-2">Çıkış Yap</h3>
              <p className="text-sm text-app-muted mb-6">Hesabınızdan çıkmak istediğinizden emin misiniz?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-app-border rounded-xl text-app-text font-bold transition-colors hover:bg-app-surface-muted"
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    setShowLogoutConfirm(false);
                    router.push("/apps/game-companion");
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
