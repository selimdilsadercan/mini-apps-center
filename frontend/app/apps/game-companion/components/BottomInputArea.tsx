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
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[var(--card-background)] shadow-lg"
      style={{ zIndex: 60 }}
    >
      {showSettings ? (
        /* Settings Modal */
        <div className="p-4 border-b border-gray-200 dark:border-[var(--card-border)]">
          <div className="space-y-3">
            <button 
              onClick={() =>
                handleConfirmAction(undoLastRound, {
                title: "Son Turu Geri Al",
                message: "Son turu geri almak istediğinizden emin misiniz?",
                confirmText: "Geri Al",
                  isDestructive: true,
                })
              }
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-start py-2"
            >
              <ArrowCounterClockwise size={16} />
              <span className="text-sm font-medium">Son Turu Geri Al</span>
            </button>
            <button 
              onClick={() =>
                handleConfirmAction(resetAllRounds, {
                title: "Turları Sıfırla",
                  message:
                    "Tüm turları sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.",
                confirmText: "Sıfırla",
                  isDestructive: true,
                })
              }
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-start py-2"
            >
              <Trash size={16} />
              <span className="text-sm font-medium">Turları Sıfırla</span>
            </button>
            <div className="flex items-center space-x-2">
              <label
                htmlFor="hideTotalColumn"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Toplam Sütununu Gizle:
              </label>
              <input
                type="checkbox"
                id="hideTotalColumn"
                checked={gameSave?.settings.hideTotalColumn || false}
                onChange={toggleHideTotalColumn}
                className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Current Round Score Input */
        <div className="p-4 border-b border-gray-200 dark:border-[var(--card-border)]">
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
                                    className="w-6 h-6 rounded-full object-cover border border-white dark:border-[var(--card-background)]"
                                  />
                                ) : (
                                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center border border-white dark:border-[var(--card-background)]">
                                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-xs">
                                      {player.initial}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {redTeamPlayers.length > 2 && (
                              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border border-white dark:border-[var(--card-background)]">
                                <span className="text-gray-600 dark:text-gray-300 font-semibold text-xs">
                                  +{redTeamPlayers.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              K
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate max-w-[100px]">
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
                        className={`p-1 ${
                          crownWinners["redTeam"]
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CrownSimple size={20} weight="fill" />
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
                                className="w-24 h-12 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{
                                  borderColor: "rgba(134, 189, 255, 0.4)",
                                }}
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
                            className="w-6 h-6 flex items-center justify-center"
                          >
                            <Plus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
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
                            className={`w-6 h-6 flex items-center justify-center ${
                              (multipleScores["redTeam"] || [0]).length <= 1
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Minus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
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
                          className="w-20 h-10 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
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
                                      className="w-6 h-6 rounded-full object-cover border border-white dark:border-[var(--card-background)]"
                                  />
                                ) : (
                                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center border border-white dark:border-[var(--card-background)]">
                                      <span className="text-blue-600 dark:text-blue-300 font-semibold text-xs">
                                        {player.initial}
                                      </span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {blueTeamPlayers.length > 2 && (
                              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center border border-white dark:border-[var(--card-background)]">
                                <span className="text-gray-600 dark:text-gray-300 font-semibold text-xs">
                                  +{blueTeamPlayers.length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              M
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate max-w-[100px]">
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
                        className={`p-1 ${
                          crownWinners["blueTeam"]
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        <CrownSimple size={20} weight="fill" />
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
                                className="w-24 h-12 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{
                                  borderColor: "rgba(134, 189, 255, 0.4)",
                                }}
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
                            className="w-6 h-6 flex items-center justify-center"
                          >
                            <Plus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
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
                            className={`w-6 h-6 flex items-center justify-center ${
                              (multipleScores["blueTeam"] || [0]).length <= 1
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <Minus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
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
                          className="w-20 h-10 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
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
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2">
                          <span className="text-blue-600 dark:text-blue-300 font-semibold text-xs">
                            {player.initial}
                          </span>
                      </div>
                    )}
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate max-w-[200px]">
                        {player.name}
                      </span>
                  </div>
                  
                    {gameSave?.settings.calculationMode === "NoPoints" ? (
                    /* Crown Mode - Toggle crown for 1 point */
                    <button
                      onClick={() => toggleCrown(player._id)}
                      className={`p-1 ${
                        crownWinners[player._id] 
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      <CrownSimple size={20} weight="fill" />
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
                                className="w-24 h-12 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{
                                  borderColor: "rgba(134, 189, 255, 0.4)",
                                }}
                            placeholder="0"
                          />
                        </div>
                          )
                        )}
                      <div className="flex items-center space-x-2">
                             <button
                               onClick={() => addScoreInput(player._id)}
                               className="w-6 h-6 flex items-center justify-center"
                             >
                            <Plus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
                              weight="bold"
                            />
                             </button>
                             <button
                               onClick={() => removeScoreInput(player._id)}
                            disabled={
                              (multipleScores[player._id] || [0]).length <= 1
                            }
                               className={`w-6 h-6 flex items-center justify-center ${
                                 (multipleScores[player._id] || [0]).length <= 1 
                                ? "opacity-30 cursor-not-allowed"
                                : ""
                               }`}
                             >
                            <Minus
                              size={18}
                              className="text-gray-600 dark:text-gray-300"
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
                          className="w-20 h-10 bg-white dark:bg-[var(--card-background)] border-2 rounded-lg text-center font-medium text-gray-800 dark:text-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
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
      <div className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={endRound}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium text-center hover:bg-blue-600"
          >
            {getNextRoundNumber()}. Turu Bitir
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`ml-2 w-12 h-12 rounded-xl flex items-center justify-center ${
              showSettings 
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "border-2 border-blue-500 text-blue-500 bg-white dark:bg-[var(--card-background)] hover:bg-blue-50 dark:hover:bg-[var(--card-background)]"
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
