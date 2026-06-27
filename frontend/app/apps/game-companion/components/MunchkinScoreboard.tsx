"use client";

import React, { useState, useEffect } from "react";
import { Plus, Minus, CaretDown } from "@phosphor-icons/react";
interface MunchkinScoreboardProps {
  gameSaveId: string;
}

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { mapGameSaveToFrontend } from "../lib/games";

const client = createBrowserClient();

interface PlayerScore {
  level: number;
  bonus: number;
  gender: "male" | "female";
}

export default function MunchkinScoreboard({
  gameSaveId,
}: MunchkinScoreboardProps) {
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
          console.error("Error loading Munchkin data:", e);
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

  // Initialize player scores from game save's specialPoints or default values
  const [playerScores, setPlayerScores] = useState<{
    [key: string]: PlayerScore;
  }>({});

  // Load scores from gameSave when it's available
  useEffect(() => {
    if (!gameSave?.players) return;

    const initialScores: { [key: string]: PlayerScore } = {};
    // Try to load from specialPoints if available
    const savedScores = gameSave.specialPoints as
      | { [key: string]: PlayerScore }
      | undefined;

    (gameSave.players as any[]).forEach((playerId: any) => {
      if (savedScores && savedScores[playerId]) {
        // Use saved scores from specialPoints
        initialScores[playerId] = savedScores[playerId];
      } else {
        // Use default values
        initialScores[playerId] = {
          level: 1,
          bonus: 0,
          gender: "male",
        };
      }
    });

    setPlayerScores(initialScores);
  }, [gameSave]);

  // Track expanded state for all players (global)
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  const gamePlayers = players || [];

  // Update specialPoints in game save when player scores change
  useEffect(() => {
    if (!gameSave || !gameSaveId) return;

    // Debounce: wait a bit before saving to avoid too many updates
    const timeoutId = setTimeout(async () => {
      try {
        await updateGameSave({
          id: gameSaveId,
          specialPoints: playerScores,
        });
      } catch (error) {
        console.error("Error updating specialPoints:", error);
      }
    }, 500); // Wait 500ms after last change

    return () => clearTimeout(timeoutId);
  }, [playerScores, gameSaveId, gameSave, updateGameSave]);

  const updatePlayerScore = (
    playerId: string,
    field: keyof PlayerScore,
    value: number | "male" | "female"
  ) => {
    setPlayerScores((prev: any) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const adjustValue = (playerId: string, field: "level", delta: number) => {
    const currentValue = playerScores[playerId]?.[field] || 1;
    const newValue = Math.max(1, Math.min(10, currentValue + delta));
    updatePlayerScore(playerId, field, newValue);
  };

  const toggleExpand = () => {
    setIsAllExpanded((prev) => !prev);
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

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 bg-[#FAF9F7]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {(gamePlayers as any[])
          .filter((player: any) => gameSave.players?.includes(player._id))
          .map((player: any) => {
          const scores = playerScores[player._id] || {
            level: 1,
            bonus: 0,
            gender: "male",
          };

          const isExpanded = isAllExpanded;

          return (
            <div
              key={player._id}
              className="bg-white rounded-3xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Player Header with Level and Expand Button */}
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
                      Güç:
                    </span>
                    <span className="text-sm font-black text-amber-500">
                      {scores.level + scores.bonus}
                    </span>
                  </div>
                </div>
                {/* Level Section - Moved to right side */}
                <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button
                    onClick={() => adjustValue(player._id, "level", -1)}
                    disabled={scores.level <= 1}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      scores.level <= 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-600 hover:text-gray-900 shadow-sm active:scale-90"
                    }`}
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <span className="text-lg font-black text-gray-900 min-w-[2rem] text-center">
                    {scores.level}
                  </span>
                  <button
                    onClick={() => adjustValue(player._id, "level", 1)}
                    disabled={scores.level >= 10}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      scores.level >= 10
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 active:scale-90"
                    }`}
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                </div>
                {/* Expand Button */}
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

              {/* Bonus and Gender Section - Collapsible */}
              {isExpanded && (
                <div className="space-y-4 pt-4 mt-4 border-t border-gray-100">
                  {/* Bonus Section */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-emerald-600" weight="bold" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                        Eşya Bonusu
                      </span>
                    </div>
                    <input
                      type="number"
                      value={scores.bonus}
                      onChange={(e) =>
                        updatePlayerScore(
                          player._id,
                          "bonus",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-16 h-10 text-center text-lg font-black text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all shadow-sm"
                      min="0"
                    />
                  </div>

                  {/* Gender Section */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">⚧</span>
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                        Cinsiyet
                      </span>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                      <button
                        onClick={() =>
                          updatePlayerScore(player._id, "gender", "male")
                        }
                        className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all ${
                          scores.gender === "male"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <span className="text-lg font-bold">♂</span>
                      </button>
                      <button
                        onClick={() =>
                          updatePlayerScore(player._id, "gender", "female")
                        }
                        className={`w-10 h-8 rounded-lg flex items-center justify-center transition-all ${
                          scores.gender === "female"
                            ? "bg-rose-500 text-white shadow-md shadow-rose-900/20"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <span className="text-lg font-bold">♀</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
