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
import GameAskTab from "../components/GameAskTab";
import PokerAssistantTab from "../components/PokerAssistantTab";
import PokerGame from "../components/PokerGame";
import PuanlarTab from "../components/PuanlarTab";
import WyrmspanHorizontalScorepad from "../components/WyrmspanHorizontalScorepad";
import CatanHorizontalScorepad from "../components/CatanHorizontalScorepad";
import CarcassoneScoreboard from "../components/CarcassoneScoreboard";
import { MOCK_GAMES, MOCK_USER } from "../lib/mock-data";

// Mock hooks
const useAuthMock = () => ({
  isSignedIn: true,
  isLoaded: true,
  user: MOCK_USER,
});

const useQueryMock = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getUserByFirebaseId")) return { _id: "u1", playerId: "p1" };
  if (apiPath.includes("getGameSaveById")) {
    return {
      _id: "mock-save-id",
      name: "Örnek Oyun",
      gameTemplate: MOCK_GAMES[0]._id,
      createdTime: Date.now() - 1000 * 60 * 30, // 30 mins ago
      settings: {
        gameplay: "herkes-tek",
        calculationMode: "NoPoints",
      }
    };
  }
  return undefined;
};

// Mock Interstitial Ad
const useInterstitialAdMock = (args: any) => ({
  showInterstitial: async () => console.log("Ad shown"),
  isAdReady: false,
});

function GameSessionContent() {
  const { isSignedIn, isLoaded } = useAuthMock();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get("gameSaveId");

  const [activeTab, setActiveTab] = useState("puan-tablosu");

  const { showInterstitial, isAdReady } = useInterstitialAdMock({});
  const currentUser = useQueryMock("api.users.getUserByFirebaseId");
  const gameSave = useQueryMock("api.gameSaves.getGameSaveById");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/apps/game-companion/games");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || (isLoaded && !isSignedIn) || gameSave === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const gameName = gameSave?.name || "Oyun";
  const gameTemplateId = gameSave?.gameTemplate || "";

  const isWyrmspanGame = gameTemplateId === "j977daz379q5h1d266v0gkfq1h7swdvp";
  const isCatanGame = gameTemplateId === "j97468qwc0r8f3n0a04bhpgtz57sww2t";
  const isCarcassonneGame = gameTemplateId === "j977k8t8rhgtxyzvwyafvk0nc17wkqh3";
  const isPokerGame = gameTemplateId === "j973hj02fpn4jjr9txpb84fy717rfekq";

  const handleBack = () => {
    router.push("/apps/game-companion/history");
  };

  const getTimeAgo = () => "30 dakika önce";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#100D16] shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{gameName}</h1>
          </div>
          <span className="text-sm text-gray-500">{getTimeAgo()}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { id: "puan-tablosu", label: "Puanlar", icon: <ChartBar size={16} /> },
              { id: "kural-sor", label: "Sor", icon: <ChatCircle size={16} /> },
              { id: "tum-kurallar", label: "Kurallar", icon: <ListBullets size={16} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-lg transition-colors ${
                  activeTab === tab.id ? "bg-blue-500 text-white" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-32 pb-6 overflow-y-auto">
        {activeTab === "puan-tablosu" ? (
          isPokerGame ? (
            <PokerGame gameSaveId={gameSaveId as any} />
          ) : isWyrmspanGame ? (
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
          )
        ) : activeTab === "tum-kurallar" ? (
          <GameRulesTab gameId={gameTemplateId} />
        ) : activeTab === "kural-sor" ? (
          <GameAskTab gameId={gameTemplateId} />
        ) : null}
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
