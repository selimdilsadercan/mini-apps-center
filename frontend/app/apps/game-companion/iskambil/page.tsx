"use client";

import { useRouter } from "next/navigation";
import { Cards, ArrowRight } from "@phosphor-icons/react";
import Header from "../components/Header";
import GameImage from "../components/GameImage";
import { MOCK_GAMES } from "../lib/games";

export default function IskambilCompanionPage() {
  const router = useRouter();

  // Filter games under "İskambil Oyunları"
  const iskambilGames = MOCK_GAMES.filter((g: any) => g.listName === "İskambil Oyunları");

  const handleGameSelect = (gameId: string) => {
    router.push(`/apps/game-companion/create-game?gameId=${gameId}`);
  };

  const handleDiscoverMore = () => {
    // Redirect to the main iskambil app
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        const port = window.location.port ? `:${window.location.port}` : "";
        window.location.href = `${window.location.protocol}//my.localhost${port}/apps/iskambil`;
      } else {
        const domain = hostname.replace("yazboz.", "");
        window.location.href = `${window.location.protocol}//my.${domain}/apps/iskambil`;
      }
    } else {
      router.push("/apps/iskambil");
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <Header activeTab="iskambil" />

      <main className="px-4 py-6 pt-28 pb-8 max-w-xl mx-auto w-full flex flex-col gap-6">
        {/* Intro Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col gap-1.5">
          <div className="absolute right-[-10px] bottom-[-15px] opacity-10 rotate-12">
            <Cards size={120} weight="fill" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-200">İskambil Skor Defteri</h2>
          <p className="text-xs text-white/95 leading-relaxed font-medium">
            Kart oyunlarınız için dijital skor tahtası. Katılımcıları belirleyin, turları kaydedin ve kazananı anlık görün.
          </p>
        </div>

        {/* Games Grid */}
        <div className="space-y-3">
          <span className="text-[9px] font-black text-app-muted tracking-widest px-1 uppercase">
            Hızlı Skor Girişi
          </span>
          <div className="grid grid-cols-2 gap-3">
            {iskambilGames.map((game: any) => (
              <div
                key={game._id}
                className="bg-app-surface border border-app-border rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md p-3 h-[52px] flex items-center shadow-sm"
                onClick={() => handleGameSelect(game._id)}
              >
                <div className="flex items-center h-full w-full">
                  <GameImage
                    game={game}
                    size="md"
                    className="mr-3 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-app-text text-sm leading-tight truncate capitalize">
                      {game.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Discover More Callout */}
        <div 
          onClick={handleDiscoverMore}
          className="group bg-app-surface border border-app-border rounded-2xl p-4 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Cards size={20} weight="duotone" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-app-text leading-tight uppercase tracking-tight">Daha Çok Oyun Keşfet</h4>
              <p className="text-[10px] text-app-muted font-medium truncate mt-0.5">Klasik kart oyunlarının tüm kuralları ve detaylı rehberleri</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-app-muted group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </main>
    </div>
  );
}
