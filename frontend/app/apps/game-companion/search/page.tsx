"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, ArrowLeft } from "@phosphor-icons/react";
import Sidebar from "../components/Sidebar";
import GameImage from "../components/GameImage";
import { useTheme } from "../components/ThemeProvider";
import { MOCK_GAMES, MOCK_USER } from "../lib/mock-data";

// Local mock hooks
const useAuth = () => ({
  isSignedIn: true,
  isLoaded: true,
  user: MOCK_USER,
});

const useQuery = (apiPath: any, args?: any): any => {
  if (apiPath.toString().includes("getGames")) return MOCK_GAMES;
  if (apiPath.toString().includes("getRecentSearches")) return [];
  return [];
};

const useMutation = (apiPath: any) => async (args: any) => {
  console.log("Mock mutation:", apiPath, args);
  return true;
};

export default function SearchPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const games = useQuery("api.games.getGames") || [];

  // Get current user mock
  const currentUser = { _id: "u1" };

  // Get recent searches for the user
  const recentSearches: any[] = [];

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const saveRecentSearch = useMutation("api.recentSearches.saveRecentSearch");
  const removeRecentSearch = useMutation("api.recentSearches.removeRecentSearch");

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Focus on search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filter games based on search query
  useEffect(() => {
    if (!games) return;

    if (!searchQuery.trim()) {
      setFilteredGames(games);
    } else {
      const filtered = (games as any[]).filter((game: any) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredGames(filtered);
    }
  }, [games, searchQuery]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGameSelect = async (gameId: string) => {
    // Save the recent search if user is logged in
    if (currentUser) {
      const game = (games as any[])?.find((g: any) => g._id === gameId);
      if (game) {
        try {
          await saveRecentSearch({
            userId: currentUser._id,
            gameId: gameId as any,
            gameName: game.name,
            searchQuery: searchQuery.trim() || undefined,
          });
        } catch (error) {
          console.error("Error saving recent search:", error);
        }
      }
    }

    router.push(`/apps/game-companion/create-game?gameId=${gameId}`);
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleRemoveRecentSearch = async (
    searchId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent triggering the game selection
    try {
      await removeRecentSearch({ searchId: searchId as any });
    } catch (error) {
      console.error("Error removing recent search:", error);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="games" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6">
          {/* Search Input with Back Button */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button
                onClick={handleBackClick}
                className="mr-3 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ne oynamak istiyorsun?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[var(--card-background)] pl-4 pr-4 py-3 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none border-none text-lg rounded-lg"
                  style={{
                    boxShadow:
                      resolvedTheme === "dark"
                        ? "none"
                        : "0 0 8px 5px #297dff0a",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Searches or Search Results */}
          {!searchQuery ? (
            // Show popular and recent searches when no search query
            <div>
              {/* Popular Searches Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Popüler Aramalar
                </h2>
                <div className="space-y-3">
                  {games === undefined
                    ? // Loading state for popular games
                      Array.from({ length: 5 }).map((_, index: any) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                        >
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mr-3"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                          </div>
                        </div>
                      ))
                    : // Show popular games (first 5 games)
                      (games as any[]).slice(0, 5).map((game: any) => (
                        <div
                          key={game._id}
                          className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                          onClick={() => handleGameSelect(game._id)}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                            <GameImage game={game} size="lg" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-base">
                              {game.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Recent Searches Section - Only show if there are recent searches */}
              {recentSearches && recentSearches.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    Yakındaki aramalar
                  </h2>
                  <div className="space-y-3">
                    {recentSearches.map((search: any) => {
                      const game = (games as any[])?.find((g: any) => g._id === search.gameId);
                      if (!game) return null;

                      return (
                        <div
                          key={search._id}
                          className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                          onClick={() => handleGameSelect(game._id)}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-2xl">
                              {game.emoji || "🎮"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-base">
                              {game.name}
                            </h3>
                            {search.searchQuery && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                "{search.searchQuery}" ile arandı
                              </p>
                            )}
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={(e) =>
                                handleRemoveRecentSearch(search._id, e)
                              }
                              className="w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[var(--card-background)]/80 rounded-full flex items-center justify-center transition-colors"
                            >
                              <span className="text-lg">×</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Games Section */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Tüm Oyunlar
                </h2>
                <div className="space-y-3">
                  {games === undefined
                    ? // Loading state for all games
                      Array.from({ length: 8 }).map((_, index: any) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                        >
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mr-3"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                          </div>
                        </div>
                      ))
                    : // Show all games
                      (games as any[]).map((game: any) => (
                        <div
                          key={game._id}
                          className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--card-background)]/80 transition-colors"
                          style={{
                            boxShadow:
                              resolvedTheme === "dark"
                                ? "none"
                                : "0 0 8px 5px #297dff0a",
                          }}
                          onClick={() => handleGameSelect(game._id)}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                            <GameImage game={game} size="lg" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 dark:text-gray-200 text-base">
                              {game.name}
                            </h3>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          ) : games === undefined ? (
            // Skeleton loading for games
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index: any) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg"
                  style={{
                    boxShadow: "0 0 8px 5px #297dff0a",
                  }}
                >
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass
                  size={32}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                Sonuç bulunamadı
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aradığınız kriterlere uygun oyun bulunamadı
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map((game: any) => (
                <div
                  key={game._id}
                  className="flex items-center p-3 bg-white dark:bg-[var(--card-background)] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    boxShadow: "0 0 8px 5px #297dff0a",
                  }}
                  onClick={() => handleGameSelect(game._id)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-2xl">{game.emoji || "🎮"}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-base">
                      {game.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
