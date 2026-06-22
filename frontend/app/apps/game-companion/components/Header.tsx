"use client";
import { getAppRootUrl } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { SquaresFour } from "@phosphor-icons/react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`bg-white dark:bg-[var(--card-background)] border-b border-gray-200 dark:border-[var(--card-border)] fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Back Button (SquaresFour) */}
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-sm font-medium shadow-sm"
          >
            <SquaresFour size={18} weight="fill" className="text-gray-600 dark:text-gray-400" />
            <span>Geri Dön</span>
          </button>

          {/* Logo Image */}
          <div className="flex items-center">
            <img
              src="/game-companion/logo.png"
              alt="Game Companion Logo"
              className="h-9 w-auto"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
