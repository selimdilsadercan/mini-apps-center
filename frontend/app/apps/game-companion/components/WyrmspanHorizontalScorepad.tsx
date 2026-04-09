"use client";

import React, { useState } from "react";

interface WyrmspanHorizontalScorepadProps {
  gameSaveId: string;
}

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useQuery = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getGameSaveById")) return { 
    _id: "ms1", 
    players: ["p1", "p2"] 
  };
  if (apiPath.includes("getPlayersByIds")) return [
    { _id: "p1", name: "Oyuncu 1", initial: "O1" },
    { _id: "p2", name: "Oyuncu 2", initial: "O2" },
  ];
  return undefined;
};

interface WyrmspanScores {
  dragonGuildMarkers: number;
  printedDragons: number;
  endGameAbilities: number;
  eggs: number;
  cachedResources: number;
  tuckedCards: number;
  publicObjectives: number;
  coins: number;
  items: number;
}

const WyrmspanHorizontalScorepad: React.FC<WyrmspanHorizontalScorepadProps> = ({
  gameSaveId,
}) => {
  // Fetch game save data and players
  const gameSave = useQuery(
    "api.gameSaves.getGameSaveById",
    gameSaveId ? { id: gameSaveId } : "skip"
  );
  const players = useQuery(
    "api.players.getPlayersByIds",
    gameSave?.players ? { playerIds: gameSave.players } : "skip"
  );

  // Initialize scores for each player
  const [playerScores, setPlayerScores] = useState<{
    [playerId: string]: WyrmspanScores;
  }>({});

  const gamePlayers = players || [];

  const updatePlayerScore = (
    playerId: string,
    category: keyof WyrmspanScores,
    value: number
  ) => {
    setPlayerScores((prev: any) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [category]: Math.max(0, value),
      },
    }));
  };

  const getPlayerTotal = (playerId: string) => {
    const scores = playerScores[playerId];
    if (!scores) return 0;
    return Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);
  };

  const ScoreIcon = ({ value = 1 }: { value?: number }) => (
    <div className="relative inline-flex items-center justify-center w-5 h-5">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
        <path
          d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z"
          fill="currentColor"
        />
      </svg>
      {value !== 1 && (
        <span className="absolute -top-1 -right-1 text-xs font-bold text-gray-800 bg-white rounded-full w-3 h-3 flex items-center justify-center text-[10px]">
          {value}
        </span>
      )}
    </div>
  );

  const FlagIcon = () => (
    <div className="relative inline-flex items-center justify-center w-5 h-5">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
        <path
          d="M14.4 6L14 4H5V21H7V14H12.6L13 16H20V6H14.4Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );

  const ResourceIcon = ({ type }: { type: "gem" | "leaf" | "crystal" }) => {
    const colors = {
      gem: "text-yellow-500",
      leaf: "text-blue-400",
      crystal: "text-purple-500",
    };

    const shapes = {
      gem: "M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z",
      leaf: "M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 6 17.25C7.5 17.25 9 16.5 9 16.5C9 16.5 7.5 18 6 18C3.5 18 1 15.5 1 13.5C1 11.5 3 7.25 8 6.25C13 5.25 20 5 21 3C22 3 19 20 8 20C7.64 20 7.14 19.87 6.66 19.7L5.71 22L3.82 21.34C5.9 16.17 8 10 17 8Z",
      crystal:
        "M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z",
    };

    return (
      <div className={`w-3 h-3 ${colors[type]}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <path d={shapes[type]} fill="currentColor" />
        </svg>
      </div>
    );
  };

  const ScoreCell = ({
    playerId,
    category,
    label,
    icon,
    subtext,
    showResourceIcons = false,
  }: {
    playerId: string;
    category: keyof WyrmspanScores;
    label: string;
    icon: React.ReactNode;
    subtext?: string;
    showResourceIcons?: boolean;
  }) => {
    const score = playerScores[playerId]?.[category] || 0;

    return (
      <div className="py-2 px-3 border-b border-gray-200 bg-white/80 dark:bg-[var(--card-background)] backdrop-blur-sm min-w-[120px]">
        <div className="flex items-center justify-center">
          <input
            type="text"
            value={score || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              updatePlayerScore(playerId, category, Math.max(0, value));
            }}
            className="w-20 h-10 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ borderColor: "rgba(134, 189, 255, 0.4)" }}
            placeholder="0"
          />
        </div>
      </div>
    );
  };

  const scoringCategories = [
    {
      key: "dragonGuildMarkers" as keyof WyrmspanScores,
      label: "Dragon Guild",
      icon: <ScoreIcon />,
    },
    {
      key: "printedDragons" as keyof WyrmspanScores,
      label: "Printed Dragons",
      icon: <ScoreIcon />,
    },
    {
      key: "endGameAbilities" as keyof WyrmspanScores,
      label: "End-game Abilities",
      icon: <FlagIcon />,
    },
    {
      key: "eggs" as keyof WyrmspanScores,
      label: "Eggs*",
      icon: <ScoreIcon value={1} />,
    },
    {
      key: "cachedResources" as keyof WyrmspanScores,
      label: "Cached Resources*",
      icon: <ScoreIcon value={1} />,
    },
    {
      key: "tuckedCards" as keyof WyrmspanScores,
      label: "Tucked Cards*",
      icon: <ScoreIcon value={1} />,
    },
    {
      key: "publicObjectives" as keyof WyrmspanScores,
      label: "Public Objectives",
      icon: <ScoreIcon />,
      subtext: "(ties are friendly)",
    },
    {
      key: "coins" as keyof WyrmspanScores,
      label: "Coins",
      icon: <ScoreIcon value={1} />,
    },
    {
      key: "items" as keyof WyrmspanScores,
      label: "Items (per 4)",
      icon: <ScoreIcon value={1} />,
      showResourceIcons: true,
      subtext: "(round down)",
    },
  ];

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-auto"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="min-w-full">
        {/* Table - Row by Row Rendering */}
        <div className="px-2 py-2 flex flex-col min-h-max">
          {/* Header Row with Player Names */}
          <div className="flex min-w-max">
            {/* Empty cell for category names */}
            <div className="w-48 py-4"></div>

            {/* Player Columns */}
            {(gamePlayers as any[]).map((player: any) => (
              <div
                key={player._id}
                className="min-w-[120px] py-4 px-3 flex flex-col items-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2 mb-2">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {player.initial}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-medium text-gray-800 text-sm text-center">
                  {player.name}
                </span>
                <div className="mt-2 text-lg font-bold text-gray-800">
                  {getPlayerTotal(player._id)}
                </div>
              </div>
            ))}
          </div>

          {/* Scoring Category Rows */}
          {(scoringCategories as any[]).map((category: any) => (
            <div key={category.key} className="flex min-w-max">
              {/* Category Name Column */}
              <div className="w-48 py-3 px-4 flex items-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <span className="text-gray-800 font-medium text-sm">
                    {category.label}
                  </span>
                </div>
                {category.subtext && (
                  <div className="text-xs text-gray-500 italic ml-2">
                    {category.subtext}
                  </div>
                )}
                {category.showResourceIcons && (
                  <div className="flex items-center space-x-1 ml-2">
                    <ResourceIcon type="gem" />
                    <ResourceIcon type="leaf" />
                    <ResourceIcon type="crystal" />
                  </div>
                )}
              </div>

              {/* Player Score Columns */}
              {(gamePlayers as any[]).map((player: any) => (
                <ScoreCell
                  key={`${player._id}-${category.key}`}
                  playerId={player._id}
                  category={category.key}
                  label={category.label}
                  icon={category.icon}
                  subtext={category.subtext}
                  showResourceIcons={category.showResourceIcons}
                />
              ))}
            </div>
          ))}

          {/* Total Row */}
          <div className="flex min-w-max">
            <div className="w-48 py-3 px-4 flex items-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm">
              <span className="text-gray-800 font-bold text-sm">TOTAL</span>
            </div>
            {(gamePlayers as any[]).map((player: any) => (
              <div
                key={`total-${player._id}`}
                className="min-w-[120px] py-3 px-3 flex items-center justify-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm"
              >
                <div className="text-lg font-bold text-gray-800">
                  {getPlayerTotal(player._id)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footnotes */}
      <div className="px-6 py-4 bg-white/80 dark:bg-[var(--card-background)] backdrop-blur-sm">
        <div className="text-sm text-gray-600 italic space-y-1">
          <div>*unless otherwise specified</div>
          <div>Final score tiebreaker: Most dragons on player mat</div>
        </div>
      </div>
    </div>
  );
};

export default WyrmspanHorizontalScorepad;
