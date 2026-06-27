"use client";

import React, { useState, useEffect } from "react";
import { Plus, CaretDown, Trash } from "@phosphor-icons/react";
interface CarcassonneScoreboardProps {
  gameSaveId: string;
}

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { mapGameSaveToFrontend } from "../lib/games";

const client = createBrowserClient();

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
  const { user: clerkUser } = useClerkUser();
  const [gameSave, setGameSave] = useState<any>(undefined);
  const [players, setPlayers] = useState<any[]>([]);

  // Fetch session and players
  useEffect(() => {
    if (clerkUser && gameSaveId) {
      const fetchData = async () => {
        try {
          const saveRes = await client.yazboz.getGameSaveById(clerkUser.id, gameSaveId);
          const playersRes = await client.yazboz.getPlayers(clerkUser.id);
          
          if (saveRes.gameSave) {
            setGameSave(mapGameSaveToFrontend(saveRes.gameSave));
          }
          setPlayers((playersRes.players || []).map((p: any) => ({ ...p, _id: p.id })));
        } catch (e) {
          console.error("Error loading Carcassonne data:", e);
        }
      };
      fetchData();
    }
  }, [clerkUser, gameSaveId]);

  const updateGameSave = async (args: any) => {
    if (!clerkUser || !gameSave) return;
    try {
      let newState = { ...(gameSave.state || {}) };
      let newSettings = gameSave.settings;
      
      if (args.settings !== undefined) newSettings = args.settings;
      if (args.specialPoints !== undefined) newState.specialPoints = args.specialPoints;
      if (args.state !== undefined) {
        newState = { ...newState, ...args.state };
      }
      
      const res = await client.yazboz.updateGameSave({
        userId: clerkUser.id,
        saveId: gameSaveId,
        settings: newSettings,
        state: newState
      });
      
      if (res.gameSave) {
        setGameSave(mapGameSaveToFrontend(res.gameSave));
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    (gameSave.players as any[]).forEach((playerId: string) => {
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
    setPlayerScores((prev: any) => {
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
    setPlayerScores((prev: any) => {
      const existing = prev[playerId];
      if (!existing) return prev;

      return {
        ...prev,
        [playerId]: {
          ...existing,
          entries: existing.entries.filter((e: any) => e.id !== entryId),
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
    score.entries.reduce((sum: number, e: any) => sum + (e.points || 0), 0);

  const getBreakdown = (score: PlayerScore): Record<ScoreType, number> => {
    return score.entries.reduce(
      (acc: any, e: any) => {
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

    (Object.keys(breakdown) as ScoreType[]).forEach((type: ScoreType) => {
      const pts = (breakdown as any)[type];
      if (pts !== 0) {
        parts.push(`${SCORE_TYPE_LABELS[type]}: ${pts}`);
      }
    });

    return parts.join(", ");
  };

  if (!gameSave || !players) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#FAF9F7]">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 font-medium">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  const activePlayer =
    modalPlayerId &&
    (gamePlayers as any[]).find((player: any) => player._id === modalPlayerId);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 bg-[#FAF9F7]"
    >
      {/* Modal */}
      {modalOpen && activePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm mx-4 p-6 border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">
              Puan Ekle
            </h2>
            <p className="text-sm text-gray-400 font-bold mb-6">
              {activePlayer.name} için yeni bir puan girişi oluştur.
            </p>

            {/* Tip seçimi */}
            <div className="mb-6">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
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
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selected
                          ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-900/20"
                          : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      {SCORE_TYPE_LABELS[type]} ({pointValue}pt)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Adet girdisi */}
            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
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
                className="w-full h-12 text-center text-lg font-black text-gray-900 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-amber-500 transition-all"
              />
          
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-900/20 transition-all active:scale-95"
              >
                <Plus size={16} weight="bold" />
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {(gamePlayers as any[]).map((player: any) => {
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
              className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-center space-x-4">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xl">
                      {player.initial}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-gray-900 truncate uppercase tracking-tight">
                    {player.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Toplam:
                    </span>
                    <span className="text-sm font-black text-amber-500">
                      {total}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModalForPlayer(player._id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all active:scale-95"
                >
                  <Plus size={20} weight="bold" />
                </button>

                {/* Expand button */}
                <button
                  onClick={toggleExpand}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  <CaretDown
                    size={18}
                    weight="bold"
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Preview row under card */}
              {preview && (
                <div className="mt-4 px-3 py-2 bg-gray-50 rounded-xl text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  <span>{preview}</span>
                </div>
              )}
              {/* Expanded detailed list */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {scores.entries.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 text-center py-2">
                      Henüz hiç puan girişi yapılmamış.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {[...scores.entries]
                        .slice()
                        .reverse()
                        .map((entry: any) => (
                          <li
                            key={entry.id}
                            className="flex items-center justify-between p-2 bg-gray-50/50 rounded-xl border border-gray-100/50"
                          >
                            <div className="flex-1">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                                {(SCORE_TYPE_LABELS as any)[entry.type]}
                              </span>
                              <span className="ml-2 text-[10px] font-black text-gray-400">
                                × {entry.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-black text-emerald-600">
                                +{entry.points}
                              </span>
                              <button
                                onClick={() => deleteScoreEntry(player._id, entry.id)}
                                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                title="Sil"
                              >
                                <Trash size={14} weight="bold" />
                              </button>
                            </div>
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
