"use client";

import React from "react";
import { Trash, CrownSimple } from "@phosphor-icons/react";
// En yüksek puanlı oyuncunun playerId'sini döndürür
function getWinnerPlayerId(gameSave: any, players?: any[]) {
  if (!players || players.length === 0) return null;
  let maxScore = -Infinity;
  let winnerId = null;
  for (const p of players) {
    // puan veya score alanı olabilir
    const score = p.score ?? p.puan ?? 0;
    if (score > maxScore) {
      maxScore = score;
      winnerId = p._id;
    }
  }
  return winnerId;
}

type GameSave = any;

interface Props {
  gameSave: GameSave;
  isLoading?: boolean;
  showGameImage?: boolean;
  onClick?: () => void;
  variant?: "compact" | "full";
  players?: any[];
  playerIds?: string[];
  showDelete?: boolean;
  onDelete?: () => void;
  rightContent?: React.ReactNode;
}

export default function GameHistoryCard({
  gameSave,
  showGameImage = false,
  onClick,
  players,
  playerIds,
  showDelete = false,
  onDelete,
  rightContent,
}: Props) {
  const playerCount = players?.length ?? playerIds?.length ?? (gameSave?.players?.length ?? 0);

  const formattedDate = gameSave?.createdTime
    ? new Date(gameSave.createdTime).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete && onDelete();
  };

  return (
    <div className="bg-white/5 dark:bg-[var(--card-background)] rounded-lg p-4 flex items-start justify-between">
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate">{gameSave?.name || "Oyun"}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{formattedDate}</p>

        <div className="flex items-center gap-2 mt-3">
          {players && players.length > 0 ? (
            <div className="flex space-x-1">
              {(() => {
                const winnerId = getWinnerPlayerId(gameSave, players);
                return players.slice(0, 6).map((p: any, idx: number) => (
                  <div
                    key={p?._id || idx}
                    className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#0b0b0b] overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[11px] font-semibold text-gray-800 dark:text-gray-100 relative"
                    title={p?.name}
                  >
                    {p?.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[12px]">{p?.initial || (p?.name || "?")[0]}</span>
                    )}
                    {winnerId && p._id === winnerId && (
                      <span className="absolute -top-2 -right-2 rotate-[-20deg]">
                        <CrownSimple size={18} weight="fill" className="text-yellow-400 drop-shadow" />
                      </span>
                    )}
                  </div>
                ));
              })()}
              {players.length > 6 && (
                <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">+{players.length - 6}</div>
              )}
            </div>
          ) : (
            <p className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full inline-block">
              {playerCount} oyuncu
            </p>
          )}
        </div>
      </div>

      <div className="ml-4 flex items-start gap-2 flex-shrink-0">
        {rightContent}

        {showDelete && (
          <button
            onClick={handleDelete}
            className="ml-2 text-gray-400 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title="Sil"
          >
            <Trash size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
