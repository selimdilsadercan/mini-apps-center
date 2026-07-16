"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChartBar,
  ListBullets,
  ChatCircle,
  Spade,
} from "@phosphor-icons/react";

// Local imports
import PuanlarTab from "../components/PuanlarTab";
import WyrmspanHorizontalScorepad from "../components/WyrmspanHorizontalScorepad";
import CatanHorizontalScorepad from "../components/CatanHorizontalScorepad";
import CarcassoneScoreboard from "../components/CarcassoneScoreboard";
import MunchkinScoreboard from "../components/MunchkinScoreboard";
import { MOCK_GAMES, mapGameSaveToFrontend } from "../lib/games";

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

function GameSessionContent() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useClerkUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get("gameSaveId");

  const [gameSave, setGameSave] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn) {
      router.push("/apps/game-companion/games");
    }
  }, [isClerkLoaded, isClerkSignedIn, router]);

  useEffect(() => {
    if (isClerkLoaded && clerkUser && gameSaveId) {
      const fetchSession = async () => {
        try {
          setLoading(true);
          const res = await client.yazboz.getGameSaveById(clerkUser.id, gameSaveId);
          setGameSave(mapGameSaveToFrontend(res.gameSave));
        } catch (e) {
          console.error("Error fetching session:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchSession();
    }
  }, [isClerkLoaded, clerkUser, gameSaveId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-app-muted font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!gameSave) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-bold">Oturum bulunamadı.</p>
          <button onClick={() => router.push("/apps/game-companion/history")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20">
            Geçmişe Dön
          </button>
        </div>
      </div>
    );
  }

  const gameName = gameSave?.name || "Oyun";
  const gameTemplateId = gameSave?.gameTemplate || "";

  const isWyrmspanGame = gameTemplateId === "j977daz379q5h1d266v0gkfq1h7swdvp" || gameTemplateId === "g7" || gameTemplateId === "g12" || gameName === "Wyrmspan";
  const isCatanGame = gameTemplateId === "j97468qwc0r8f3n0a04bhpgtz57sww2t" || gameTemplateId === "g5" || gameTemplateId === "g9" || gameName === "Catan";
  const isCarcassonneGame = gameTemplateId === "j977k8t8rhgtxyzvwyafvk0nc17wkqh3" || gameTemplateId === "g6" || gameTemplateId === "g11" || gameName === "Carcassonne";
  const isMunchkinGame = gameTemplateId === "g10" || gameName === "Munchkin";

  const handleBack = () => {
    router.push("/apps/game-companion/history");
  };

  const getTimeAgo = () => {
    if (!gameSave.createdTime) return "";
    const diff = Date.now() - gameSave.createdTime;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Az önce";
    if (mins < 60) return `${mins} dakika önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    return new Date(gameSave.createdTime).toLocaleDateString("tr-TR");
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 app-chrome-top">
        <div className="px-4 py-3 max-w-xl mx-auto flex items-center gap-2">
          <button
            onClick={handleBack}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
          >
            <ArrowLeft size={14} weight="bold" className="text-blue-500" />
          </button>
          <h1 className="flex-1 min-w-0 text-base font-black text-app-text tracking-tight uppercase leading-none truncate">{gameName}</h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-app-muted shrink-0">{getTimeAgo()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-14 pb-6 max-w-xl mx-auto">
        {isWyrmspanGame ? (
          <WyrmspanHorizontalScorepad gameSaveId={gameSaveId as any} />
        ) : isCatanGame ? (
          <CatanHorizontalScorepad gameSaveId={gameSaveId as any} />
        ) : isCarcassonneGame ? (
          <CarcassoneScoreboard gameSaveId={gameSaveId as any} />
        ) : isMunchkinGame ? (
          <MunchkinScoreboard gameSaveId={gameSaveId as any} />
        ) : (
          <PuanlarTab
            gameSaveId={gameSaveId as any}
            isAdReady={false}
            showInterstitial={async () => {}}
          />
        )}
      </div>
    </div>
  );
}

export default function GameSessionPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <GameSessionContent />
    </Suspense>
  );
}
