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
    <div className="bg-app-surface rounded-2xl p-4 flex items-start justify-between border border-app-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <h3 className="font-black text-app-text text-lg tracking-tight uppercase">{gameSave?.name || "Oyun"}</h3>
        <p className="text-app-muted text-[10px] font-bold uppercase tracking-widest mt-1">{formattedDate}</p>

        <div className="flex items-center gap-2 mt-4">
          {players && players.length > 0 ? (
            <div className="flex -space-x-2">
              {(() => {
                const winnerId = getWinnerPlayerId(gameSave, players);
                return players.slice(0, 6).map((p: any, idx: number) => (
                  <div
                    key={p?._id || idx}
                    className="w-9 h-9 rounded-full ring-2 ring-white bg-app-tab-track flex items-center justify-center text-[11px] font-black text-app-text relative shadow-sm"
                    title={p?.name}
                  >
                    {p?.avatar ? (
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-[12px] uppercase">{p?.initial || (p?.name || "?")[0]}</span>
                    )}
                    {winnerId && p._id === winnerId && (
                      <span className="absolute -top-2.5 -left-1.5 rotate-[-20deg] z-10">
                        <CrownSimple size={18} weight="fill" className="text-yellow-400 drop-shadow-sm" />
                      </span>
                    )}
                  </div>
                ));
              })()}
              {players.length > 6 && (
                <div className="w-9 h-9 rounded-full ring-2 ring-white bg-app-surface-muted flex items-center justify-center text-[10px] font-black text-app-muted shadow-sm">
                  +{players.length - 6}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full inline-block">
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
            className="w-9 h-9 flex items-center justify-center text-app-muted hover:text-red-500 bg-app-surface-muted hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-app-border"
            title="Sil"
          >
            <Trash size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
