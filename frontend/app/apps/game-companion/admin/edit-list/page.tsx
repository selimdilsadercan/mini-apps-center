"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash,
  GameController,
  Check,
} from "@phosphor-icons/react";
import Sidebar from "../../components/Sidebar";
import { MOCK_GAMES, MOCK_GAME_LISTS } from "../../lib/mock-data";

// Type shim
type Id<T> = string;

// Local mock hooks
const useQuery = (apiPath: any, args?: any): any => {
  if (apiPath.toString().includes("getGameListById")) return MOCK_GAME_LISTS[0];
  if (apiPath.toString().includes("getGames")) return MOCK_GAMES;
  return [];
};

const useMutation = (apiPath: any) => async (args: any) => {
  console.log("Mock mutation:", apiPath, args);
  return true;
};

const api = {
  gameLists: { getGameList: "getGameList", updateGameList: "updateGameList", addGamesToList: "addGamesToList", removeGamesFromList: "removeGamesFromList" },
  games: { getGames: "getGames" }
} as any;
const GameImage = ({ game, size }: any) => <div className="w-8 h-8 bg-gray-200 rounded"></div>;

function EditListPageContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = searchParams.get("listId") as Id<"gameLists">;

  const [listName, setListName] = useState("");
  const [listEmoji, setListEmoji] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedGames, setSelectedGames] = useState<Id<"games">[]>([]);

  // Fetch data from Convex
  const gameList = useQuery(
    api.gameLists.getGameList,
    listId ? { id: listId } : "skip"
  );
  const games = useQuery(api.games.getGames);
  const updateGameList = useMutation(api.gameLists.updateGameList);
  const addGamesToList = useMutation(api.gameLists.addGamesToList);
  const removeGamesFromList = useMutation(api.gameLists.removeGamesFromList);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Load list data when available
  useEffect(() => {
    if (gameList) {
      setListName(gameList.name);
      setListEmoji(gameList.emoji || "");
      setIsActive(gameList.isActive);
      setSelectedGames(gameList.gameIds);
    }
  }, [gameList]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!gameList) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <p className="text-gray-600">Liste bulunamadı</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    router.push("/admin/lists");
  };

  const handleSave = async () => {
    if (!listName.trim()) return;

    try {
      await updateGameList({
        id: listId,
        name: listName.trim(),
        emoji: listEmoji.trim() || undefined,
        isActive,
      });

      // Update games in list
      const currentGameIds = gameList.gameIds;
      const gamesToAdd = selectedGames.filter(
        (id: any) => !currentGameIds.includes(id)
      );
      const gamesToRemove = currentGameIds.filter(
        (id: any) => !selectedGames.includes(id)
      );

      if (gamesToAdd.length > 0) {
        await addGamesToList({ listId, gameIds: gamesToAdd });
      }

      if (gamesToRemove.length > 0) {
        await removeGamesFromList({ listId, gameIds: gamesToRemove });
      }

      router.push("/admin/lists");
    } catch (error) {
      console.error("Error updating game list:", error);
    }
  };

  const handleGameToggle = (gameId: any) => {
    setSelectedGames((prev: any) =>
      prev.includes(gameId)
        ? prev.filter((id: any) => id !== gameId)
        : [...prev, gameId]
    );
  };

  const handleSelectAll = () => {
    if (games) {
      setSelectedGames((games as any[]).map((game: any) => game._id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedGames([]);
  };

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} weight="regular" className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Liste Düzenle</h1>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <Check size={20} weight="regular" />
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* List Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Liste Bilgileri
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liste Adı *
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Liste adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={listEmoji}
                  onChange={(e) => setListEmoji(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="🔥"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Liste aktif
                </label>
              </div>
            </div>
          </div>

          {/* Games Selection */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Oyunlar ({selectedGames.length} seçili)
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tümünü Seç
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Seçimi Kaldır
                </button>
              </div>
            </div>

            {games === undefined ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                <p className="text-gray-600">Oyunlar yükleniyor...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8">
                <GameController
                  size={48}
                  className="text-gray-400 mx-auto mb-4"
                />
                <p className="text-gray-600 dark:text-gray-400">Henüz oyun eklenmemiş</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(games as any[]).map((game: any) => (
                  <div
                    key={game._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedGames.includes(game._id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleGameToggle(game._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {selectedGames.includes(game._id) ? (
                          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <GameImage game={game} size="sm" />
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {game.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditListPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <EditListPageContent />
    </Suspense>
  );
}
