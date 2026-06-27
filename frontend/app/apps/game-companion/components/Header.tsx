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
      className={`bg-white/80 backdrop-blur-md border-b border-gray-100 fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-md mx-auto px-4 py-2 h-20 flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Back Button (SquaresFour) */}
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 rounded-xl border border-gray-200/60 h-9 shadow-sm transition-all active:scale-95"
          >
            <SquaresFour size={16} weight="fill" className="text-blue-500 shrink-0" />
            <span className="text-xs font-bold">Geri Dön</span>
          </button>

          {/* Brand Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">
              Yazboz
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
