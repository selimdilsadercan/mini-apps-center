"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_USER } from "../lib/mock-data";

// Mock hooks to keep UI-only mode functional
const useAuthMock = () => ({
  user: MOCK_USER,
  signOut: async () => console.log("Mock sign out"),
});

const useQueryMock = (apiPath: string, args?: any): any => {
  if (apiPath.includes("isUserAdmin")) return false;
  if (apiPath.includes("getPlayerById")) return { name: MOCK_USER.displayName, avatar: null };
  return undefined;
};

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
    {
      href: "/apps/game-companion/contacts",
      page: "contacts" as PageType,
      label: "Rehber",
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      href: "/apps/game-companion/profile",
      page: "profile" as PageType,
      label: "Profil",
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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
  const { user, signOut } = useAuthMock();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  // Mocked state for player and admin status
  const player = useQueryMock("api.players.getPlayerById");
  const isAdmin = useQueryMock("api.users.isUserAdmin");

  const items = getNavigationItems(isAdmin || false);

  const isActive = (page: PageType) => {
    return currentPage === page;
  };

  return (
    <>
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white dark:bg-[var(--card-background)] lg:border-r lg:border-gray-200 dark:border-[var(--card-border)]">
        {/* Sidebar Header */}
        <div className="flex items-center px-6 py-6 border-b border-gray-200 dark:border-[var(--card-border)]">
          <Link href="/apps/game-companion/games" className="flex items-center gap-3">
            <img
              src="/game-companion/logo.png"
              alt="Game Companion Logo"
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Back to Home Link */}
          <Link
            href="/home"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-[var(--card-background)] transition-all duration-200 mb-4 border-b border-gray-100 dark:border-gray-800 pb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium text-sm">Ana Merkez</span>
          </Link>

          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive(item.page)
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[var(--card-background)]"
                  : "text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-[var(--card-background)]"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-[var(--card-border)]">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-[var(--card-background)] rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-800 dark:text-gray-400"
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                {player?.name || "Kullanıcı"}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-400 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-[var(--card-background)] rounded-lg transition-colors"
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
            <span className="text-sm font-medium">Çıkış Yap</span>
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--card-background)] rounded-2xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">Çıkış Yap</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Hesabınızdan çıkmak istediğinizden emin misiniz?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={async () => {
                    await signOut();
                    setShowLogoutConfirm(false);
                    router.push("/apps/game-companion");
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
