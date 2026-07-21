"use client";

import { useState } from "react";
import {
  Plus,
  Minus,
  Gear,
  CrownSimple,
  Trash,
  ArrowCounterClockwise,
  X,
} from "@phosphor-icons/react";

interface Player {
  _id: string;
  name: string;
  avatar?: string;
  initial: string;
}

interface GameSave {
  _id: string;
  settings: {
    gameplay: "herkes-tek" | "takimli";
    calculationMode: "Points" | "NoPoints";
    pointsPerRound?: "Single" | "Multiple";
    hideTotalColumn?: boolean;
  };
  redTeam?: string[];
  blueTeam?: string[];
}

interface BottomInputAreaProps {
  activeTab: string;
  gameSave: any;
  gamePlayers: Player[] | undefined;
  redTeamPlayers: Player[] | undefined;
  blueTeamPlayers: Player[] | undefined;
  currentScores: { [key: string]: number };
  setCurrentScores: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  multipleScores: { [key: string]: number[] };
  setMultipleScores: React.Dispatch<
    React.SetStateAction<{ [key: string]: number[] }>
  >;
  crownWinners: { [key: string]: boolean };
  setCrownWinners: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmModal: boolean;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  confirmModalConfig: {
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
  };
  setConfirmModalConfig: React.Dispatch<
    React.SetStateAction<{
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    }>
  >;
  setConfirmAction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  addScoreInput: (playerId: string) => void;
  removeScoreInput: (playerId: string) => void;
  updateMultipleScore: (
    playerId: string,
    index: number,
    value: number
  ) => void;
  toggleCrown: (playerId: string) => void;
  undoLastRound: () => void;
  resetAllRounds: () => void;
  toggleHideTotalColumn: () => void;
  endRound: () => void;
  getNextRoundNumber: () => number;
  handleConfirmAction: (
    action: () => void,
    config: {
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    }
  ) => void;
}

export default function BottomInputArea({
  activeTab,
  gameSave,
  gamePlayers,
  redTeamPlayers,
  blueTeamPlayers,
  currentScores,
  setCurrentScores,
  multipleScores,
  setMultipleScores,
  crownWinners,
  setCrownWinners,
  showSettings,
  setShowSettings,
  showConfirmModal,
  setShowConfirmModal,
  confirmModalConfig,
  setConfirmModalConfig,
  setConfirmAction,
  addScoreInput,
  removeScoreInput,
  updateMultipleScore,
  toggleCrown,
  undoLastRound,
  resetAllRounds,
  toggleHideTotalColumn,
  endRound,
  getNextRoundNumber,
  handleConfirmAction,
}: BottomInputAreaProps) {
  // Hide when Tüm Kurallar or Kural Sor tab is selected
  if (activeTab !== "puan-tablosu") {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-app-surface shadow-2xl border-t border-app-border"
      style={{ zIndex: 60 }}
    >
      {showSettings ? (
        /* Settings Modal */
        <div className="p-4 border-b border-app-border bg-app-surface">
          <div className="space-y-3">
            <button 
              onClick={() =>
                handleConfirmAction(() => {
                  undoLastRound();
                  setShowSettings(false);
                }, {
                  title: "Son Turu Geri Al",
                  message: "Son turu geri almak istediğinizden emin misiniz? Puanlar giriş alanlarına geri yüklenecektir.",
                  confirmText: "Geri Al",
                  isDestructive: true,
                })
              }
              className="flex items-center space-x-2 text-rose-500 hover:text-rose-600 w-full justify-start py-3 px-4 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl font-bold transition-all active:scale-[0.99] cursor-pointer"
            >
              <ArrowCounterClockwise size={18} weight="bold" />
              <span className="text-sm">Son Turu Geri Al</span>
            </button>
          </div>
        </div>
      ) : (
        /* Current Round Score Input */
        <div className="p-4 border-b border-app-border">
          <div
            className={`grid ${
              gameSave?.settings?.gameplay === "herkes-tek" &&
              gamePlayers &&
              gamePlayers.length > 4
                ? "grid-cols-3"
                : "grid-cols-2"
            } gap-x-4 gap-y-6 max-h-100 overflow-y-auto place-content-center pb-4`}
          >
            {gameSave?.settings.gameplay === "takimli" ? (
              // Team Mode - Show Teams for Score Input (one input per team)
              <>
                {/* Red Team Score Input */}
                <div className="flex flex-col space-y-2 items-end">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center flex-row">
                      <div className="relative mr-2">
                        {redTeamPlayers && redTeamPlayers.length > 0 ? (
                          <div className="flex -space-x-1">
                            {redTeamPlayers.slice(0, 2).map((player, index) => (
                              <div
                                key={player._id}
                                className="relative"
                                style={{
                                  zIndex: Math.min(
                                    redTeamPlayers.length - index,
                                    5
                                  ),
                                }}
                              >
                                {player.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="w-6 h-6 rounded-full object-cover border border-app-surface"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center border border-app-surface">
                                    <span className="text-blue-600 font-bold text-[10px]">
                                      {player.initial}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {redTeamPlayers.length > 2 && (
                              <div className="w-6 h-6 bg-app-surface-muted rounded-full flex items-center justify-center border border-app-surface">
                                <span className="text-app-muted font-bold text-[10px]">
                                  +{redTeamPlayers.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">
                              K
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-app-text text-xs truncate max-w-[100px] tracking-tight">
                        {redTeamPlayers?.map((p) => p.name).join(", ") ||
                          "Kırmızı Takım"}
                      </span>
                    </div>
                    
                    {gameSave?.settings.calculationMode === "NoPoints" ? (
                      /* Crown Mode for Teams */
                      <button
                        onClick={() => {
                          setCrownWinners((prev) => ({
                            ...prev,
                            redTeam: !prev["redTeam"],
                          }));
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          crownWinners["redTeam"]
                            ? "bg-yellow-50 text-yellow-500 shadow-sm"
                            : "bg-app-surface-muted text-app-muted"
                        }`}
                      >
                        <CrownSimple size={24} weight="fill" />
                      </button>
                    ) : gameSave?.settings.pointsPerRound === "Multiple" ? (
                      /* Multiple Scores Mode for Teams - Multiple input fields with horizontal buttons */
                      <div className="flex flex-col items-center space-y-2">
                        {(multipleScores["redTeam"] || [0]).map(
                          (score, scoreIndex) => (
                            <div
                              key={scoreIndex}
                              className="flex flex-col items-center space-y-1"
                            >
                            <input
                              type="text"
                                value={score || ""}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                  setMultipleScores((prev) => {
                                    const currentScores = prev["redTeam"] || [
                                      0,
                                    ];
                                  const updatedScores = [...currentScores];
                                    updatedScores[scoreIndex] = Math.max(
                                      0,
                                      value
                                    );
                                  return {
                                    ...prev,
                                      redTeam: updatedScores,
                                  };
                                });
                              }}
                                className="w-24 h-12 bg-app-surface border-2 border-app-border rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                              placeholder="0"
                            />
                          </div>
                          )
                        )}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setMultipleScores((prev) => ({
                              ...prev,
                                redTeam: [...(prev["redTeam"] || []), 0],
                              }))
                            }
                            className="w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-blue-600 transition-colors"
                          >
                            <Plus
                              size={18}
                              weight="bold"
                            />
                          </button>
                          <button
                            onClick={() =>
                              setMultipleScores((prev) => ({
                              ...prev,
                                redTeam: prev["redTeam"]?.slice(0, -1) || [],
                              }))
                            }
                            disabled={
                              (multipleScores["redTeam"] || [0]).length <= 1
                            }
                            className={`w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-rose-600 transition-colors ${
                              (multipleScores["redTeam"] || [0]).length <= 1
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Minus
                              size={18}
                              weight="bold"
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Single Score Mode for Teams - Direct input field */
                      <div className="flex items-center justify-center">
                        <input
                          type="text"
                          value={currentScores["redTeam"] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setCurrentScores((prev) => ({
                              ...prev,
                              redTeam: Math.max(0, value),
                            }));
                          }}
                          className="w-20 h-10 bg-app-surface border-2 border-blue-100 rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Blue Team Score Input */}
                <div className="flex flex-col space-y-2 items-start">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center flex-row">
                      <div className="relative mr-2">
                        {blueTeamPlayers && blueTeamPlayers.length > 0 ? (
                          <div className="flex -space-x-1">
                            {blueTeamPlayers
                              .slice(0, 2)
                              .map((player, index) => (
                              <div
                                key={player._id}
                                className="relative"
                                  style={{
                                    zIndex: Math.min(
                                      blueTeamPlayers.length - index,
                                      5
                                    ),
                                  }}
                              >
                                {player.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.name}
                                      className="w-6 h-6 rounded-full object-cover border border-app-surface"
                                  />
                                ) : (
                                    <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center border border-app-surface">
                                      <span className="text-blue-600 font-bold text-[10px]">
                                        {player.initial}
                                      </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {blueTeamPlayers.length > 2 && (
                              <div className="w-6 h-6 bg-app-surface-muted rounded-full flex items-center justify-center border border-app-surface">
                                <span className="text-app-muted font-bold text-[10px]">
                                  +{blueTeamPlayers.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">
                              M
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-app-text text-xs truncate max-w-[100px] tracking-tight">
                        {blueTeamPlayers?.map((p) => p.name).join(", ") ||
                          "Mavi Takım"}
                      </span>
                    </div>
                    
                    {gameSave?.settings.calculationMode === "NoPoints" ? (
                      /* Crown Mode for Teams */
                      <button
                        onClick={() => {
                          setCrownWinners((prev) => ({
                            ...prev,
                            blueTeam: !prev["blueTeam"],
                          }));
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          crownWinners["blueTeam"]
                            ? "bg-yellow-50 text-yellow-500 shadow-sm"
                            : "bg-app-surface-muted text-app-muted"
                        }`}
                      >
                        <CrownSimple size={24} weight="fill" />
                      </button>
                    ) : gameSave?.settings.pointsPerRound === "Multiple" ? (
                      /* Multiple Scores Mode for Teams - Multiple input fields with horizontal buttons */
                      <div className="flex flex-col items-center space-y-2">
                        {(multipleScores["blueTeam"] || [0]).map(
                          (score, scoreIndex) => (
                            <div
                              key={scoreIndex}
                              className="flex flex-col items-center space-y-1"
                            >
                            <input
                              type="text"
                                value={score || ""}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                  setMultipleScores((prev) => {
                                    const currentScores = prev["blueTeam"] || [
                                      0,
                                    ];
                                  const updatedScores = [...currentScores];
                                    updatedScores[scoreIndex] = Math.max(
                                      0,
                                      value
                                    );
                                  return {
                                    ...prev,
                                      blueTeam: updatedScores,
                                  };
                                });
                              }}
                                className="w-24 h-12 bg-app-surface border-2 border-app-border rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                              placeholder="0"
                            />
                          </div>
                          )
                        )}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              setMultipleScores((prev) => ({
                              ...prev,
                                blueTeam: [...(prev["blueTeam"] || []), 0],
                              }))
                            }
                            className="w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-blue-600 transition-colors"
                          >
                            <Plus
                              size={18}
                              weight="bold"
                            />
                          </button>
                          <button
                            onClick={() =>
                              setMultipleScores((prev) => ({
                              ...prev,
                                blueTeam: prev["blueTeam"]?.slice(0, -1) || [],
                              }))
                            }
                            disabled={
                              (multipleScores["blueTeam"] || [0]).length <= 1
                            }
                            className={`w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-rose-600 transition-colors ${
                              (multipleScores["blueTeam"] || [0]).length <= 1
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Minus
                              size={18}
                              weight="bold"
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Single Score Mode for Teams - Direct input field */
                      <div className="flex items-center justify-center">
                        <input
                          type="text"
                          value={currentScores["blueTeam"] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setCurrentScores((prev) => ({
                              ...prev,
                              blueTeam: Math.max(0, value),
                            }));
                          }}
                          className="w-20 h-10 bg-app-surface border-2 border-blue-100 rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // Individual Mode - Show Individual Players for Score Input
              (gamePlayers || []).map((player, index) => (
                <div
                  key={player._id}
                  className={`flex flex-col space-y-2 ${
                    (gamePlayers && gamePlayers.length > 4)
                      ? "items-center"
                      : (index % 2 === 0 ? "items-end mr-4" : "items-start ml-4")
                  }`}
                >
                <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`flex items-center ${
                        gameSave?.settings.calculationMode === "NoPoints"
                          ? "justify-center"
                          : ""
                      }`}
                    >
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-6 h-6 rounded-full object-cover mr-2"
                      />
                    ) : (
                        <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center mr-2">
                          <span className="text-blue-600 font-bold text-[10px]">
                            {player.initial}
                          </span>
                      </div>
                    )}
                       <span className="font-bold text-app-text text-xs truncate max-w-[85px] tracking-tight">
                        {player.name}
                      </span>
                  </div>
                  
                    {gameSave?.settings.calculationMode === "NoPoints" ? (
                    /* Crown Mode - Toggle crown for 1 point */
                    <button
                      onClick={() => toggleCrown(player._id)}
                      className={`p-2 rounded-xl transition-all ${
                        crownWinners[player._id] 
                            ? "bg-yellow-50 text-yellow-500 shadow-sm"
                            : "bg-app-surface-muted text-app-muted"
                      }`}
                    >
                      <CrownSimple size={24} weight="fill" />
                    </button>
                    ) : gameSave?.settings.pointsPerRound === "Multiple" ? (
                    /* Multiple Scores Mode - Multiple input fields with horizontal buttons */
                    <div className="flex flex-col items-center space-y-2">
                        {(multipleScores[player._id] || [0]).map(
                          (score, scoreIndex) => (
                            <div
                              key={scoreIndex}
                              className="flex flex-col items-center space-y-1"
                            >
                          <input
                            type="text"
                                value={score || ""}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                                  updateMultipleScore(
                                    player._id,
                                    scoreIndex,
                                    value
                                  );
                            }}
                                className="w-24 h-12 bg-app-surface border-2 border-app-border rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                            placeholder="0"
                          />
                        </div>
                          )
                        )}
                      <div className="flex items-center space-x-2">
                             <button
                               onClick={() => addScoreInput(player._id)}
                               className="w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-blue-600 transition-colors"
                             >
                            <Plus
                              size={18}
                              weight="bold"
                            />
                             </button>
                             <button
                               onClick={() => removeScoreInput(player._id)}
                            disabled={
                              (multipleScores[player._id] || [0]).length <= 1
                            }
                               className={`w-8 h-8 flex items-center justify-center bg-app-surface-muted rounded-lg text-app-muted hover:text-rose-600 transition-colors ${
                                 (multipleScores[player._id] || [0]).length <= 1 
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                               }`}
                             >
                            <Minus
                              size={18}
                              weight="bold"
                            />
                             </button>
                           </div>
                    </div>
                  ) : (
                    /* Single Score Mode - Direct input field */
                    <div className="flex items-center justify-center">
                      <input
                        type="text"
                          value={currentScores[player._id] || ""}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                            setCurrentScores((prev) => ({
                            ...prev,
                              [player._id]: Math.max(0, value),
                          }));
                        }}
                          className="w-20 h-10 bg-app-surface border-2 border-app-border rounded-xl text-center font-black text-app-text text-lg focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 pb-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={endRound}
            className="flex-1 bg-blue-600 text-white h-11 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-blue-700 shadow-md shadow-blue-900/10 transition-all active:scale-95 cursor-pointer"
          >
            {getNextRoundNumber()}. Turu Bitir
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer ${
              showSettings 
                ? "bg-zinc-900 text-white shadow-zinc-900/10"
                : "bg-app-surface border border-app-border text-app-muted hover:text-app-text"
            }`}
          >
            {showSettings ? (
              <X size={20} weight="bold" />
            ) : (
              <Gear size={20} weight="bold" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
