"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className = "" }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`bg-white dark:bg-[var(--card-background)] border-b border-gray-200 dark:border-[var(--card-border)] fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-md mx-auto px-4 pt-2 pb-3 relative">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => router.push("/home")}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-200" />
          </button>

          {/* Logo Image */}
          <div className="flex-1 flex justify-center">
            <img
              src="/game-companion/logo.png"
              alt="Game Companion Logo"
              className="h-10 w-auto"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
