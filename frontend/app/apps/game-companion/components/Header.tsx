import { CaretLeft, GameController, House, Clock } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import Link from "next/link";

interface HeaderProps {
  className?: string;
  activeTab?: "games" | "history";
}

export default function Header({ className = "", activeTab }: HeaderProps) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <header
      className={`bg-white/95 backdrop-blur-md border-b border-gray-200/60 fixed top-0 left-0 right-0 z-50 shadow-sm ${className}`}
    >
      <div className="max-w-xl mx-auto w-full px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          {/* Back Button (CaretLeft) */}
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-blue-500" />
          </button>

          {/* Brand Title */}
          <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
            <GameController size={18} weight="fill" className="text-blue-500 shrink-0" />
            <span className="truncate">Yazboz</span>
          </h1>
        </div>

        {activeTab && (
          <div className="flex">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
              <Link href="/apps/game-companion/games" className={tabClass(activeTab === "games")}>
                <House size={13} weight={activeTab === "games" ? "fill" : "bold"} className={activeTab === "games" ? "text-blue-500" : "text-gray-400"} />
                <span className="normal-case">Oyunlar</span>
              </Link>
              <Link href="/apps/game-companion/history" className={tabClass(activeTab === "history")}>
                <Clock size={13} weight={activeTab === "history" ? "fill" : "bold"} className={activeTab === "history" ? "text-blue-500" : "text-gray-400"} />
                <span className="normal-case">Oyun Geçmişi</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
