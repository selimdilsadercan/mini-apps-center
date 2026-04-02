"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  PencilSimple,
  Trash,
  Clock,
  UserPlus,
  CheckCircle,
  Check,
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import EditPlayerModal from "../components/EditPlayerModal";
import ConfirmModal from "../components/ConfirmModal";
import Sidebar from "../components/Sidebar";
import AppBar from "../components/AppBar";
import Header from "../components/Header";
import { useTheme } from "../components/ThemeProvider";
import GameImage from "../components/GameImage";
import GameHistoryCard from "../components/GameHistoryCard";
import { MOCK_PLAYERS, MOCK_GROUPS, MOCK_USER, MOCK_GAMES } from "../lib/mock-data";

// UI-only mode logic: Mocking the database hooks
const useAuthMock = () => ({
  isSignedIn: true,
  isLoaded: true,
  user: MOCK_USER,
});

const useQueryMock = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getPlayerById")) return MOCK_PLAYERS.find(p => p._id === args?.id) || MOCK_PLAYERS[0];
  if (apiPath.includes("getUserById")) return MOCK_USER;
  if (apiPath.includes("getGroups")) return MOCK_GROUPS;
  if (apiPath.includes("getUserByFirebaseId")) return { _id: "u1", playerId: "p1" };
  if (apiPath.includes("getGameSaves")) return [];
  if (apiPath.includes("getPlayersByIds")) return MOCK_PLAYERS;
  if (apiPath.includes("getGames")) return MOCK_GAMES;
  return undefined;
};

const useMutationMock = (apiPath: string) => async (args: any) => {
  console.log("Mock mutation called:", apiPath, args);
  return { _id: "new-id" };
};

function PlayerDetailContent() {
  const { isSignedIn, isLoaded, user } = useAuthMock();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const playerId = searchParams.get("playerId");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopiedModal, setShowCopiedModal] = useState(false);

  // Get player data
  const player = useQueryMock("api.players.getPlayerById", { id: playerId });

  // Get user data if player has linkedUserId (linked via login)
  const playerUser = useQueryMock("api.users.getUserById", { id: player?.linkedUserId });

  // Get groups for edit modal
  const groups = useQueryMock("api.groups.getGroups");

  // Get current user for game saves
  const currentUser = useQueryMock("api.users.getUserByFirebaseId");

  // Get all game saves for current user
  const allGameSaves = useQueryMock("api.gameSaves.getGameSaves", { userId: currentUser?._id });

  // Collect all player ids from the available game saves
  const allPlayerIds = allGameSaves
    ? Array.from(
        new Set(
          allGameSaves.flatMap((gs: any) => [
            ...(gs.players || []),
            ...(gs.redTeam || []),
            ...(gs.blueTeam || []),
          ])
        )
      )
    : [];

  const allGamePlayers = useQueryMock("api.players.getPlayersByIds", { playerIds: allPlayerIds });

  // Get games for game names
  const games = useQueryMock("api.games.getGames");

  // Filter game saves to only include games where this player participated
  const playerGameSaves = allGameSaves?.filter((gameSave: any) => {
    if (!playerId) return false;
    if (gameSave.players?.includes(playerId)) return true;
    if (gameSave.redTeam?.includes(playerId)) return true;
    if (gameSave.blueTeam?.includes(playerId)) return true;
    return false;
  }) || [];

  const deletePlayer = useMutationMock("api.players.deletePlayer");

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/apps/game-companion/games");
    }
  }, [isLoaded, isSignedIn, router]);

  // Redirect to contacts if no playerId or player not found
  useEffect(() => {
    if (!playerId || player === null) {
      router.replace("/contacts");
    }
  }, [playerId, player, router]);

  const handleBack = () => {
    router.back();
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!playerId) return;
    setIsDeleting(true);
    try {
      await deletePlayer({ id: playerId });
      router.push("/contacts");
    } catch (error) {
      console.error("Error deleting player:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("tr-TR", options);
  };

  const getDateGroup = (timestamp: number) => {
    const now = new Date();
    const gameDate = new Date(timestamp);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const gameDateOnly = new Date(
      gameDate.getFullYear(),
      gameDate.getMonth(),
      gameDate.getDate()
    );

    if (gameDateOnly.getTime() === today.getTime()) {
      return "Bugün";
    } else if (gameDateOnly.getTime() === yesterday.getTime()) {
      return "Dün";
    } else if (gameDate >= weekAgo) {
      return "Bu Hafta";
    } else if (gameDate >= monthAgo) {
      return "Bu Ay";
    } else {
      return "Daha Önce";
    }
  };

  const groupGameSavesByDate = (gameSaves: any[]) => {
    if (!gameSaves || gameSaves.length === 0) return {};

    const grouped = gameSaves.reduce(
      (groups, gameSave) => {
        const group = getDateGroup(gameSave.createdTime);
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(gameSave);
        return groups;
      },
      {} as Record<string, any[]>
    );

    // Sort groups in the desired order
    const groupOrder = ["Bugün", "Dün", "Bu Hafta", "Bu Ay", "Daha Önce"];
    const orderedGroups: Record<string, any[]> = {};

    groupOrder.forEach((groupName) => {
      if (grouped[groupName]) {
        orderedGroups[groupName] = grouped[groupName];
      }
    });

    return orderedGroups;
  };

  const getGameName = (gameTemplateId: any) => {
    if (!games) return "Bilinmeyen Oyun";
    const game = games.find((g: any) => g._id === gameTemplateId);
    return game?.name || "Bilinmeyen Oyun";
  };

  const groupedGameSaves = groupGameSavesByDate(playerGameSaves);

  // Show loading state
  if (!isLoaded || (isLoaded && !isSignedIn) || player === undefined) {
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

  // Show error state if player not found
  if (player === null || !playerId) {
    return null;
  }

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header for mobile screens */}
      <div className="lg:hidden">
        <Header />
      </div>

      {/* Sidebar for wide screens */}
      <Sidebar currentPage="contacts" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} className="mr-2" />
              <span>Geri</span>
            </button>
          </div>

          {/* Player Header */}
          <div
            className="bg-white dark:bg-[var(--card-background)] rounded-lg p-4 mb-6"
            style={{
              boxShadow:
                resolvedTheme === "dark" ? "none" : "0 0 8px 5px #297dff0a",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              {/* Avatar, Name and Group */}
              <div className="flex items-center flex-1 min-w-0">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover mr-3 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                      {player.initial}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                    {player.name}
                  </h1>
                  {player.groupId && groups && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {groups.find((g) => g._id === player.groupId)?.name ||
                        "Bilinmiyor"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-4 flex-shrink-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                  title="Düzenle"
                >
                  <PencilSimple size={20} />
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="border border-red-300 dark:border-red-500 text-red-600 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Sil"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>

            {/* User Connection Status */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              {playerUser ? (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle
                    size={16}
                    className="text-green-500 mr-2 flex-shrink-0"
                  />
                  <span className="truncate">
                    Bağlı - {playerUser.name}
                    {playerUser.email && (
                      <span className="text-gray-500 dark:text-gray-500 ml-1">
                        ({playerUser.email})
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    User'a bağlı değil
                  </div>
                  {playerId && (
                    <button
                      onClick={() => {
                        const inviteLink = `https://eslikci-three.vercel.app/?invitePlayerId=${playerId}`;
                        navigator.clipboard.writeText(inviteLink).then(() => {
                          setShowCopiedModal(true);
                        });
                      }}
                      className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      <UserPlus size={16} />
                      <span>Kullanıcıyı Davet Et</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Game History */}
          <div
            className="bg-white dark:bg-[var(--card-background)] rounded-lg p-6"
            style={{
              boxShadow:
                resolvedTheme === "dark" ? "none" : "0 0 8px 5px #297dff0a",
            }}
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Clock size={20} className="mr-2" />
              Geçmiş Oyunlar
            </h2>
            {playerGameSaves.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  Bu kişiyle henüz oyun oynanmamış
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedGameSaves).map((groupName) => (
                  <div key={groupName}>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                      {groupName}
                    </h3>
                    <div className="space-y-2">
                      {groupedGameSaves[groupName].map((gameSave) => {
                        const allPlayerIdsInGame = [
                          ...(gameSave.players || []),
                          ...(gameSave.redTeam || []),
                          ...(gameSave.blueTeam || []),
                        ];
                        const uniquePlayerIds = Array.from(
                          new Set(allPlayerIdsInGame)
                        );

                        const playerData = allGamePlayers
                          ? uniquePlayerIds
                              .map((id: any) => allGamePlayers.find((p: any) => p._id === id))
                              .filter(Boolean)
                          : [];

                        return (
                          <GameHistoryCard
                            key={gameSave._id}
                            gameSave={gameSave}
                            variant="full"
                            players={playerData}
                            playerIds={uniquePlayerIds}
                            onClick={() =>
                              router.push(
                                `/game-session?gameSaveId=${gameSave._id}`
                              )
                            }
                            showDelete={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPlayerModal
          playerId={playerId}
          onClose={() => setShowEditModal(false)}
          groups={groups || []}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Kişiyi Sil"
        message="Bu kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Copied Modal */}
      <Drawer.Root
        open={showCopiedModal}
        onOpenChange={(open) => !open && setShowCopiedModal(false)}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[70]" />
          <Drawer.Content className="bg-white dark:bg-[#1C1922] h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[70]">
            {/* Gesture bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <Check
                    size={32}
                    className="text-green-600 dark:text-green-400"
                    weight="bold"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Kopyalandı!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Davet linki panoya kopyalandı
                </p>
                <button
                  onClick={() => setShowCopiedModal(false)}
                  className="mt-6 w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="contacts" />
      </div>
    </div>
  );
}

export default function PlayerDetailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <PlayerDetailContent />
    </Suspense>
  );
}
