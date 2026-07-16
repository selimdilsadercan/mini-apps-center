"use client";

import Link from "next/link";

export type PageType = "games" | "history" | "contacts" | "profile";

const navigationItems = [
  {
    href: "/apps/game-companion/games",
    page: "games" as PageType,
    label: "Ana Sayfa",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/apps/game-companion/history",
    page: "history" as PageType,
    label: "Geçmiş",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

interface AppBarProps {
  currentPage: PageType;
}

export default function AppBar({ currentPage }: AppBarProps) {
  const isActive = (page: PageType) => currentPage === page;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 app-chrome-bottom flex items-center justify-around px-4 py-2 pb-safe-area-inset-bottom">
      <div className="flex items-center w-full max-w-md mx-auto gap-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${
              isActive(item.page)
                ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                : "text-app-muted hover:text-app-text hover:bg-app-surface-muted"
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${isActive(item.page) ? "bg-blue-100/50 dark:bg-blue-950/40" : ""}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
