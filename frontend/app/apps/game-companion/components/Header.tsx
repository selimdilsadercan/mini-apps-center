import { CaretLeft, GameController, House, Clock, Cards } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import Link from "next/link";

interface HeaderProps {
  className?: string;
  activeTab?: "games" | "history" | "iskambil";
}

export default function Header({ className = "", activeTab }: HeaderProps) {
  const tabClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <header
      className={`app-chrome-top fixed top-0 left-0 right-0 z-50 ${className}`}
    >
      <div className="max-w-xl mx-auto w-full px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => (window.location.href = getAppRootUrl())}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-blue-500" />
          </button>

          <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
            <GameController size={18} weight="fill" className="text-blue-500 shrink-0" />
            <span className="truncate">Yazboz</span>
          </h1>
        </div>

        {activeTab && (
          <div className="flex">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
              <Link href="/apps/game-companion/games" className={tabClass(activeTab === "games")}>
                <House size={13} weight={activeTab === "games" ? "fill" : "bold"} className={activeTab === "games" ? "text-blue-500" : "text-app-muted"} />
                <span className="normal-case">Oyunlar</span>
              </Link>
              <Link href="/apps/game-companion/iskambil" className={tabClass(activeTab === "iskambil")}>
                <Cards size={13} weight={activeTab === "iskambil" ? "fill" : "bold"} className={activeTab === "iskambil" ? "text-blue-500" : "text-app-muted"} />
                <span className="normal-case">İskambil</span>
              </Link>
              <Link href="/apps/game-companion/history" className={tabClass(activeTab === "history")}>
                <Clock size={13} weight={activeTab === "history" ? "fill" : "bold"} className={activeTab === "history" ? "text-blue-500" : "text-app-muted"} />
                <span className="normal-case">Oyun Geçmişi</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
