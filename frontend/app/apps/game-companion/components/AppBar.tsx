"use client";

import Link from "next/link";

// Page enum for active state
export type PageType = "games" | "history" | "contacts" | "profile";

// Navigation items configuration
const navigationItems = [
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

interface AppBarProps {
  currentPage: PageType;
}

export default function AppBar({ currentPage }: AppBarProps) {
  const isActive = (page: PageType) => {
    return currentPage === page;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[var(--background)] border-t border-gray-200 dark:border-[var(--card-border)]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center py-3 px-4 gap-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 ${
                isActive(item.page)
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-[var(--card-background)]"
                  : "text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
