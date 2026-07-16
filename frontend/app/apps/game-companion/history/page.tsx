"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "../components/ConfirmModal";
import Sidebar from "../components/Sidebar";
import AppBar from "../components/AppBar";
import Header from "../components/Header";
import GameHistoryCard from "../components/GameHistoryCard";
import { MOCK_GAMES, mapGameSaveToFrontend } from "../lib/games";

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

export default function HistoryPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useClerkUser();
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string | null>(null);

  const [gameSaves, setGameSaves] = useState<any[] | undefined>(undefined);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const games = MOCK_GAMES;

  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn) {
      router.replace("/");
    }
  }, [isClerkLoaded, isClerkSignedIn, router]);

  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const savesRes = await client.yazboz.getGameSaves(clerkUser.id);
          const playersRes = await client.yazboz.getPlayers(clerkUser.id);

          setGameSaves((savesRes.gameSaves || []).map(mapGameSaveToFrontend));
          setPlayers((playersRes.players || []).map((p: any) => ({ ...p, _id: p.id })));
        } catch (e) {
          console.error("Error loading history data:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isClerkLoaded, clerkUser]);

  const handleDelete = (gameSaveId: string) => {
    setGameToDelete(gameSaveId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (gameToDelete && clerkUser) {
      try {
        const res = await client.yazboz.deleteGameSave({
          userId: clerkUser.id,
          saveId: gameToDelete
        });
        if (res.success) {
          setGameSaves((prev) => prev?.filter((gs) => gs._id !== gameToDelete));
        }
      } catch (error) {
        console.error("Error deleting game save:", error);
      } finally {
        setShowConfirmModal(false);
        setGameToDelete(null);
      }
    }
  };

  const handleGameClick = (gameSaveId: string) => {
    router.push(`/apps/game-companion/game-session?gameSaveId=${gameSaveId}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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
      gameDate.getDate(),
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
    if (!gameSaves) return {};

    const grouped = gameSaves.reduce(
      (groups, gameSave) => {
        const group = getDateGroup(gameSave.createdTime);
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(gameSave);
        return groups;
      },
      {} as Record<string, any[]>,
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

  const getPlayerData = (playerIds: string[]) => {
    if (!playerIds || playerIds.length === 0) return [];

    return playerIds
      .map((id) => {
        const player = players.find((p) => p._id === id || p.id === id);
        return player;
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-app-bg">
      <Header activeTab="history" />

      <main className="px-4 py-6 pt-28 pb-8 max-w-xl mx-auto w-full">
        {/* Game History List */}
        <div className="space-y-6">
          {gameSaves === undefined ? (
            // Skeleton loading for game history
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-app-surface rounded-xl p-4 flex items-center justify-between border border-app-border shadow-sm"
              >
                <div className="flex-1">
                  <div className="h-6 bg-app-border rounded animate-pulse w-32 mb-2"></div>
                  <div className="h-4 bg-app-border rounded animate-pulse w-48 mb-1"></div>
                  <div className="h-3 bg-app-border rounded animate-pulse w-40"></div>
                </div>
                <div className="w-8 h-8 bg-app-border rounded animate-pulse"></div>
              </div>
            ))
          ) : gameSaves.length > 0 ? (
            (() => {
              const groupedGameSaves = groupGameSavesByDate(gameSaves);
              return Object.entries(groupedGameSaves).map(
                ([groupName, groupGameSaves]) => (
                  <div key={groupName} className="space-y-3">
                    <h2 className="text-sm font-black text-app-muted px-2 uppercase tracking-widest">
                      {groupName}
                    </h2>
                    <div className="space-y-2">
                      {groupGameSaves.map((gameSave) => {
                        const allPlayerIdsInGame = [
                          ...(gameSave.players || []),
                          ...(gameSave.redTeam || []),
                          ...(gameSave.blueTeam || []),
                        ];
                        // Remove duplicates
                        const uniquePlayerIds = Array.from(
                          new Set(allPlayerIdsInGame),
                        );
                        // Oyunculara skor/puan ekle
                        const playerData = getPlayerData(uniquePlayerIds).map(
                          (player) => {
                            let score = null;
                            if (
                              gameSave.scores &&
                              Array.isArray(gameSave.scores)
                            ) {
                              const found = gameSave.scores.find(
                                (s: any) => s.playerId === player._id,
                              );
                              if (found) score = found.score;
                            }
                            if (
                              score == null &&
                              gameSave.puanlar &&
                              Array.isArray(gameSave.puanlar)
                            ) {
                              const found = gameSave.puanlar.find(
                                (s: any) => s.playerId === player._id,
                              );
                              if (found) score = found.puan;
                            }
                            score = score ?? player.score ?? player.puan ?? 0;
                            return { ...player, score };
                          },
                        );

                        return (
                          <GameHistoryCard
                            key={gameSave._id}
                            gameSave={gameSave}
                            variant="full"
                            players={playerData}
                            onClick={() => handleGameClick(gameSave._id)}
                            showDelete={true}
                            onDelete={() => handleDelete(gameSave._id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ),
              );
            })()
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-app-tab-track rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-app-muted text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-app-text mb-2">
                Henüz oyun geçmişi yok
              </h3>
              <p className="text-app-muted font-medium">
                İlk oyununuzu oluşturarak başlayın
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Oyunu Sil"
        message="Bu oyunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive={true}
      />
    </div>
  );
}
