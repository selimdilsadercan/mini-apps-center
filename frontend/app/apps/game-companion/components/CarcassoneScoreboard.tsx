"use client";

import React, { useState, useEffect } from "react";
import { Plus, CaretDown, Trash } from "@phosphor-icons/react";
interface CarcassonneScoreboardProps {
  gameSaveId: string;
}

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useQuery = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getGameSaveById")) return { 
    _id: "ms1", 
    players: ["p1", "p2"],
    specialPoints: {} 
  };
  if (apiPath.includes("getPlayersByIds")) return [
    { _id: "p1", name: "Oyuncu 1", initial: "O1" },
    { _id: "p2", name: "Oyuncu 2", initial: "O2" },
  ];
  return undefined;
};

const useMutation = (apiPath: string) => async (args: any) => {
  console.log("Mock mutation:", apiPath, args);
  return true;
};

type ScoreType = "road" | "city" | "monastery" | "farm" | "other";

interface ScoreEntry {
  id: string;
  type: ScoreType;
  quantity: number;
  points: number;
}

interface PlayerScore {
  entries: ScoreEntry[];
}

type PlayerScoresState = Record<string, PlayerScore>;

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  road: "🛣️ Yol",
  city: "🏰 Şehir",
  monastery: "⛪ Manastır",
  farm: "🌾 Tarla",
  other: "🛡️ Diğer",
};

const SCORE_TYPE_POINTS: Record<ScoreType, number> = {
  road: 1,
  city: 3,
  monastery: 9,
  farm: 2,
  other: 1,
};

export default function CarcassonneScoreboard({
  gameSaveId,
}: CarcassonneScoreboardProps) {
  // Game save + players
  const gameSave = useQuery(
    "api.gameSaves.getGameSaveById",
    gameSaveId ? { id: gameSaveId } : "skip"
  );
  const players = useQuery(
    "api.players.getPlayersByIds",
    gameSave?.players ? { playerIds: gameSave.players } : "skip"
  );

  const updateGameSave = useMutation("api.gameSaves.updateGameSave");

  const [playerScores, setPlayerScores] = useState<PlayerScoresState>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlayerId, setModalPlayerId] = useState<string | null>(null);
  const [newScoreType, setNewScoreType] = useState<ScoreType>("city");
  const [newScoreQuantity, setNewScoreQuantity] = useState<number>(1);

  // Global expand/collapse
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const gamePlayers = players || [];

  // Load scores from gameSave.specialPoints
  useEffect(() => {
    if (!gameSave?.players) return;

    const savedScores = gameSave.specialPoints as
      | PlayerScoresState
      | undefined;

    const initial: PlayerScoresState = {};
    gameSave.players.forEach((playerId) => {
      if (savedScores && savedScores[playerId]) {
        initial[playerId] = {
          entries: savedScores[playerId].entries || [],
        };
      } else {
        initial[playerId] = { entries: [] };
      }
    });

    setPlayerScores(initial);
  }, [gameSave]);

  // Persist to Convex (debounced)
  useEffect(() => {
    if (!gameSave || !gameSaveId) return;

    const timeoutId = setTimeout(async () => {
      try {
        await updateGameSave({
          id: gameSaveId,
          specialPoints: playerScores,
        });
      } catch (error) {
        console.error("Error updating specialPoints:", error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [playerScores, gameSaveId, gameSave, updateGameSave]);

  const toggleExpand = () => setIsAllExpanded((prev) => !prev);

  const openModalForPlayer = (playerId: string) => {
    setModalPlayerId(playerId);
    setNewScoreType("city");
    setNewScoreQuantity(1);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalPlayerId(null);
  };

  const addScoreEntry = (playerId: string, entry: Omit<ScoreEntry, "id">) => {
    setPlayerScores((prev) => {
      const existing = prev[playerId] ?? { entries: [] };
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      return {
        ...prev,
        [playerId]: {
          ...existing,
          entries: [...existing.entries, { ...entry, id }],
        },
      };
    });
  };

  const deleteScoreEntry = (playerId: string, entryId: string) => {
    setPlayerScores((prev) => {
      const existing = prev[playerId];
      if (!existing) return prev;

      return {
        ...prev,
        [playerId]: {
          ...existing,
          entries: existing.entries.filter((e) => e.id !== entryId),
        },
      };
    });
  };

  const calculatePoints = (type: ScoreType, quantity: number): number => {
    return SCORE_TYPE_POINTS[type] * quantity;
  };

  const handleConfirmAdd = () => {
    if (!modalPlayerId) return;
    if (!Number.isFinite(newScoreQuantity)) return;

    const points = calculatePoints(newScoreType, newScoreQuantity);

    addScoreEntry(modalPlayerId, {
      type: newScoreType,
      quantity: newScoreQuantity,
      points: points,
    });

    closeModal();
  };

  const getTotalPoints = (score: PlayerScore): number =>
    score.entries.reduce((sum, e) => sum + (e.points || 0), 0);

  const getBreakdown = (score: PlayerScore): Record<ScoreType, number> => {
    return score.entries.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + e.points;
        return acc;
      },
      { road: 0, city: 0, monastery: 0, farm: 0, other: 0 } as Record<
        ScoreType,
        number
      >
    );
  };

  const getPreviewText = (score: PlayerScore): string => {
    const breakdown = getBreakdown(score);
    const parts: string[] = [];

    (Object.keys(breakdown) as ScoreType[]).forEach((type) => {
      const pts = breakdown[type];
      if (pts !== 0) {
        parts.push(`${SCORE_TYPE_LABELS[type]}: ${pts}`);
      }
    });

    return parts.join(", ");
  };

  if (!gameSave || !players) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const activePlayer =
    modalPlayerId &&
    gamePlayers.find((player) => player._id === modalPlayerId);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Modal */}
      {modalOpen && activePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[var(--card-background)] rounded-2xl shadow-xl w-full max-w-sm mx-4 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Puan Ekle
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {activePlayer.name} için yeni bir puan girişi oluştur.
            </p>

            {/* Tip seçimi */}
            <div className="mb-4">
              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Puan Tipi
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SCORE_TYPE_LABELS) as ScoreType[]).map((type) => {
                  const selected = newScoreType === type;
                  const pointValue = SCORE_TYPE_POINTS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewScoreType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-gray-50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {SCORE_TYPE_LABELS[type]} ({pointValue}pt)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adet girdisi */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Adet
              </label>
              <input
                type="number"
                value={Number.isFinite(newScoreQuantity) ? newScoreQuantity : ""}
                placeholder="1"
                onChange={(e) =>
                  setNewScoreQuantity(
                    parseInt(e.target.value, 10)
                  )
                }
                className="w-24 h-9 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
          
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600"
              >
                <Plus size={14} />
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {gamePlayers.map((player) => {
          const scores =
            playerScores[player._id] || ({
              entries: [],
            } as PlayerScore);

          const isExpanded = isAllExpanded;
          const total = getTotalPoints(scores);
          const preview = getPreviewText(scores);

          return (
            <div
              key={player._id}
              className="bg-white dark:bg-[var(--card-background)] rounded-2xl p-4 border border-gray-200 dark:border-[var(--card-border)] shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center space-x-3">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-lg">
                      {player.initial}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200 truncate">
                    {player.name}
                  </h3>
                </div>

                {/* Total score */}
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Puan
                  </span>
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {total}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openModalForPlayer(player._id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                >
                  <Plus size={14} />
                  Ekle
                </button>

                {/* Expand button */}
                <button
                  onClick={toggleExpand}
                  className="flex-shrink-0 w-6 h-6 ml-1 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  <CaretDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Preview row under card */}
              {preview && (
                <div className="mt-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <span>{preview}</span>
                </div>
              )}
              {/* Expanded detailed list */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[var(--card-border)]">
                  {scores.entries.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Henüz hiç puan girişi yapılmamış.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto">
                      {[...scores.entries]
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <li
                            key={entry.id}
                            className="flex items-start justify-between"
                          >
                            <div className="flex-1 pr-2">
                              <span className="font-medium">
                                {SCORE_TYPE_LABELS[entry.type]}
                              </span>
                              <span className="ml-1 text-gray-500 dark:text-gray-400">
                                × {entry.quantity}
                              </span>
                            </div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-3">
                              +{entry.points}
                            </span>
                            <button
                              onClick={() => deleteScoreEntry(player._id, entry.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Sil"
                            >
                              <Trash size={14} />
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
