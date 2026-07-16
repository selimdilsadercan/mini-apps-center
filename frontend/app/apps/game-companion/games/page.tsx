"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MagnifyingGlass,
} from "@phosphor-icons/react";

// Local imports
import Sidebar from "../components/Sidebar";
import AppBar from "../components/AppBar";
import Header from "../components/Header";
import GameImage from "../components/GameImage";
import { MOCK_GAMES, mapGameSaveToFrontend } from "../lib/games";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

export default function GamesPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const router = useRouter();
  
  const games = MOCK_GAMES;
  // Generate gameLists dynamically by grouping games by their listName from games.json
  const listNames = Array.from(new Set(games.map((g: any) => g.listName).filter(Boolean)));
  const gameLists = listNames.map((name, index) => ({
    _id: `list-${index}`,
    name: name,
    gameIds: games.filter((g: any) => g.listName === name).map((g: any) => g._id)
  }));

  const [gameSaves, setGameSaves] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);


  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      const fetchHistory = async () => {
        try {
          setLoadingHistory(true);
          const res = await client.yazboz.getGameSaves(clerkUser.id);
          setGameSaves((res.gameSaves || []).map(mapGameSaveToFrontend));
        } catch (e) {
          console.error("Error fetching game saves:", e);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [isClerkLoaded, clerkUser]);

  const handleGameSelect = (gameId: string) => {
    router.push(`/apps/game-companion/create-game?gameId=${gameId}`);
  };

  const handleSearchClick = () => {
    router.push("/apps/game-companion/search");
  };

  // Get games in a specific list
  const getGamesInList = (listId: string) => {
    if (!games) return [];
    const list = gameLists?.find((l: any) => l._id === listId);
    if (!list) return [];

    return games.filter((game: any) => list.gameIds?.includes(game._id) || false);
  };

  // Get recently played games with fallback to random games
  const getRecentlyPlayedGames = () => {
    if (!games) return [];
    
    // Show only the featured games requested by the user (Monopoly removed, Carcassonne added)
    const featuredNames = ["101 Okey", "Okey", "Uno", "Catan", "Munchkin", "Carcassonne"];
    const featured = games.filter((game: any) => featuredNames.includes(game.name));
    
    // Order them as requested: 101 Okey, Okey, Uno, Catan, Munchkin, Carcassonne
    return featured.sort((a: any, b: any) => {
      return featuredNames.indexOf(a.name) - featuredNames.indexOf(b.name);
    });
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <Header activeTab="games" />

      <main className="px-4 py-6 pt-28 pb-8 max-w-xl mx-auto w-full">
        {/* Search Button */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-muted"
            />
            <button
              onClick={handleSearchClick}
              className="w-full bg-app-surface rounded-xl border border-app-border pl-10 pr-4 py-3 text-left text-app-muted hover:bg-app-surface-muted transition-all cursor-pointer shadow-sm"
            >
              Oyun ara...
            </button>
          </div>
        </div>

        {/* Game Lists Sections */}
        {games === undefined || gameLists === undefined ? (
          // Skeleton loading for games
          <div className="space-y-8 mb-8">
            {["Loading..."].map((section, index) => (
              <div key={index}>
                <div className="h-6 bg-app-border rounded animate-pulse w-32 mb-4"></div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, gameIndex) => (
                    <div
                      key={gameIndex}
                      className="bg-app-surface rounded-xl border border-app-border h-[100px] p-4 shadow-sm"
                    >
                      <div className="flex flex-col justify-center h-full">
                        <div className="h-5 bg-app-border rounded animate-pulse w-20 mb-2"></div>
                        <div className="h-3 bg-app-border rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-app-tab-track rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-app-muted" />
            </div>
            <h3 className="text-lg font-medium text-app-muted mb-2">
              Henüz oyun eklenmemiş
            </h3>
          </div>
        ) : (
          <div className="space-y-8 mb-8">
            {/* Recently Played Games Section */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {getRecentlyPlayedGames().map((game: any) => (
                  <div
                    key={game._id}
                    className="bg-app-surface rounded-xl border border-app-border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md p-3 h-[50px] flex items-center shadow-sm"
                    onClick={() => handleGameSelect(game._id)}
                  >
                    <div className="flex items-center h-full w-full">
                      <GameImage
                        game={game}
                        size="md"
                        className="mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-app-text text-sm leading-tight truncate">
                          {game.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Game Lists */}
            {gameLists && gameLists.length > 0
              ? gameLists.map((list: any) => {
                  const gamesInList = getGamesInList(list._id);
                  if (gamesInList.length === 0) return null;

                  return (
                    <div key={list._id}>
                      <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-black text-app-text uppercase tracking-tight">
                          {list.name}
                        </h2>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {gamesInList.map((game: any) => (
                          <div
                            key={game._id}
                            className="bg-app-surface rounded-xl border border-app-border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md flex-shrink-0 w-[140px] h-[100px] p-4 flex flex-col justify-center items-center text-center shadow-sm"
                            onClick={() => handleGameSelect(game._id)}
                          >
                            <GameImage
                              game={game}
                              size="lg"
                              className="mb-1"
                            />
                            <h3 className="font-bold text-app-text text-sm leading-tight truncate w-full">
                              {game.name}
                            </h3>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              : null}

            {/* Tüm Oyunlar - Always show as last section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-black text-app-text uppercase tracking-tight">
                  Tüm Oyunlar
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {games?.map((game: any) => (
                  <div
                    key={game._id}
                    className="bg-app-surface rounded-xl border border-app-border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md flex-shrink-0 w-[140px] h-[100px] p-4 flex flex-col justify-center items-center text-center shadow-sm"
                    onClick={() => handleGameSelect(game._id)}
                  >
                    <GameImage game={game} size="lg" className="mb-1" />
                    <h3 className="font-bold text-app-text text-sm leading-tight truncate w-full">
                      {game.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
