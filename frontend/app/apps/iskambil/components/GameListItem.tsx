"use client";

import { Heart, CheckCircle } from "@phosphor-icons/react";

export interface GameListItemData {
  id: string;
  name: string;
  category: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  deckCount: string;
  isFavorite: boolean;
  isKnown: boolean;
  hasNote: boolean;
}

interface GameListItemProps {
  game: GameListItemData;
  labels: {
    noRules: string;
    players: string;
    known: string;
    noted: string;
    favorite: string;
  };
  onOpen: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onToggleKnown: (e: React.MouseEvent) => void;
}

export default function GameListItem({
  game,
  labels,
  onOpen,
  onToggleFavorite,
  onToggleKnown,
}: GameListItemProps) {
  const playerLabel =
    game.minPlayers === game.maxPlayers
      ? `${game.minPlayers} ${labels.players.toLowerCase()}`
      : `${game.minPlayers}-${game.maxPlayers} ${labels.players.toLowerCase()}`;

  const metaParts = [game.category, playerLabel];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="w-full px-3 py-2.5 bg-app-surface rounded-2xl border border-app-border shadow-sm hover:border-app-muted/40 active:scale-[0.99] transition-all cursor-pointer text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <h3 className="text-[13px] font-black text-app-text tracking-tight truncate leading-snug capitalize">
            {game.name}
          </h3>
          <p className="text-[10px] text-app-muted font-medium truncate">
            {metaParts.join(" · ")}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleKnown}
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              game.isKnown
                ? "bg-gray-900 border-gray-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900"
                : "bg-app-surface border-app-border text-app-muted hover:text-app-text"
            }`}
            title={labels.known}
          >
            <CheckCircle size={14} weight={game.isKnown ? "fill" : "bold"} />
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
              game.isFavorite
                ? "bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/40 dark:border-rose-900/50"
                : "bg-app-surface border-app-border text-app-muted hover:text-rose-400"
            }`}
            title={labels.favorite}
          >
            <Heart size={14} weight={game.isFavorite ? "fill" : "bold"} />
          </button>
        </div>
      </div>
    </div>
  );
}
