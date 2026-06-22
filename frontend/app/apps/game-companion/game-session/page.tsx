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
import GameRulesTab from "../components/GameRulesTab";
import PuanlarTab from "../components/PuanlarTab";
import WyrmspanHorizontalScorepad from "../components/WyrmspanHorizontalScorepad";
import CatanHorizontalScorepad from "../components/CatanHorizontalScorepad";
import CarcassoneScoreboard from "../components/CarcassoneScoreboard";
import { MOCK_GAMES, MOCK_USER } from "../lib/mock-data";

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { mapGameSaveToFrontend } from "../lib/mock-data";

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!gameSave) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <p className="text-red-500 mb-4">Oturum bulunamadı.</p>
          <button onClick={() => router.push("/apps/game-companion/history")} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            Geçmişe Dön
          </button>
        </div>
      </div>
    );
  }

  const gameName = gameSave?.name || "Oyun";
  const gameTemplateId = gameSave?.gameTemplate || "";

  const isWyrmspanGame = gameTemplateId === "j977daz379q5h1d266v0gkfq1h7swdvp" || gameTemplateId === "g7";
  const isCatanGame = gameTemplateId === "j97468qwc0r8f3n0a04bhpgtz57sww2t" || gameTemplateId === "g5";
  const isCarcassonneGame = gameTemplateId === "j977k8t8rhgtxyzvwyafvk0nc17wkqh3" || gameTemplateId === "g6";

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#100D16] shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{gameName}</h1>
          </div>
          <span className="text-sm text-gray-500">{getTimeAgo()}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-20 pb-6 overflow-y-auto">
        {isWyrmspanGame ? (
          <WyrmspanHorizontalScorepad gameSaveId={gameSaveId as any} />
        ) : isCatanGame ? (
          <CatanHorizontalScorepad gameSaveId={gameSaveId as any} />
        ) : isCarcassonneGame ? (
          <CarcassoneScoreboard gameSaveId={gameSaveId as any} />
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
