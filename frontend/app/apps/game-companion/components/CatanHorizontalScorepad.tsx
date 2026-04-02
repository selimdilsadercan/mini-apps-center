"use client";

import React, { useState } from "react";

interface CatanHorizontalScorepadProps {
  gameSaveId: string;
}

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useQuery = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getGameSaveById")) return { 
    _id: "ms1", 
    players: ["p1", "p2", "p3"] 
  };
  if (apiPath.includes("getPlayersByIds")) return [
    { _id: "p1", name: "Oyuncu 1", initial: "O1" },
    { _id: "p2", name: "Oyuncu 2", initial: "O2" },
    { _id: "p3", name: "Oyuncu 3", initial: "O3" },
  ];
  return undefined;
};

interface CatanScores {
  settlements: number;
  cities: number;
  vpCards: number;
  longestRoad: number;
  largestArmy: number;
  otherSpecial: number;
}

const CatanHorizontalScorepad: React.FC<CatanHorizontalScorepadProps> = ({
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
    [playerId: string]: CatanScores;
  }>({});

  const gamePlayers = players || [];

  const updatePlayerScore = (
    playerId: string,
    category: keyof CatanScores,
    value: number
  ) => {
    setPlayerScores((prev) => ({
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
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const SettlementIcon = () => (
    <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-sm"></div>
    </div>
  );

  const CityIcon = () => (
    <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
      <div className="w-3 h-3 bg-white rounded-sm"></div>
    </div>
  );

  const VPCardIcon = () => (
    <div className="w-4 h-4 bg-yellow-500 rounded-sm flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-sm"></div>
    </div>
  );

  const RoadIcon = () => (
    <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center">
      <div className="w-3 h-1 bg-white rounded-sm"></div>
    </div>
  );

  const ArmyIcon = () => (
    <div className="w-4 h-4 bg-red-600 rounded-sm flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-sm"></div>
    </div>
  );

  const SpecialIcon = () => (
    <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
      <div className="w-2 h-2 bg-white rounded-sm"></div>
    </div>
  );

  const ScoreCell = ({
    playerId,
    category,
    label,
    icon,
    subtext,
  }: {
    playerId: string;
    category: keyof CatanScores;
    label: string;
    icon: React.ReactNode;
    subtext?: string;
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
      key: "settlements" as keyof CatanScores,
      label: "Yerleşimler",
      icon: <SettlementIcon />,
      subtext: "(2 ZP her biri)",
    },
    {
      key: "cities" as keyof CatanScores,
      label: "Şehirler",
      icon: <CityIcon />,
      subtext: "(1 ZP her biri)",
    },
    {
      key: "vpCards" as keyof CatanScores,
      label: "ZP Kartları",
      icon: <VPCardIcon />,
      subtext: "(1 ZP her biri)",
    },
    {
      key: "longestRoad" as keyof CatanScores,
      label: "En Uzun Yol",
      icon: <RoadIcon />,
      subtext: "(2 ZP)",
    },
    {
      key: "largestArmy" as keyof CatanScores,
      label: "En Güçlü Ordu",
      icon: <ArmyIcon />,
      subtext: "(2 ZP)",
    },
    {
      key: "otherSpecial" as keyof CatanScores,
      label: "Diğer Özel",
      icon: <SpecialIcon />,
      subtext: "(Değişken ZP)",
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
            {gamePlayers.map((player) => (
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
                  {getPlayerTotal(player._id)} ZP
                </div>
              </div>
            ))}
          </div>

          {/* Scoring Category Rows */}
          {scoringCategories.map((category) => (
            <div key={category.key} className="flex min-w-max">
              {/* Category Name Column */}
              <div className="w-48 py-3 px-4 flex items-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  {category.icon}
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-medium text-sm">
                      {category.label}
                    </span>
                    {category.subtext && (
                      <span className="text-xs text-gray-500 italic">
                        {category.subtext}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Player Score Columns */}
              {gamePlayers.map((player) => (
                <ScoreCell
                  key={`${player._id}-${category.key}`}
                  playerId={player._id}
                  category={category.key}
                  label={category.label}
                  icon={category.icon}
                  subtext={category.subtext}
                />
              ))}
            </div>
          ))}

          {/* Total Row */}
          <div className="flex min-w-max">
            <div className="w-48 py-3 px-4 flex items-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm">
              <span className="text-gray-800 font-bold text-sm">TOPLAM</span>
            </div>
            {gamePlayers.map((player) => (
              <div
                key={`total-${player._id}`}
                className="min-w-[120px] py-3 px-3 flex items-center justify-center border-b border-gray-200 bg-white/90 dark:bg-[var(--card-background)] backdrop-blur-sm"
              >
                <div className="text-lg font-bold text-gray-800">
                  {getPlayerTotal(player._id)} ZP
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Rules Footer */}
      <div className="px-6 py-4 bg-white/80 dark:bg-[var(--card-background)] backdrop-blur-sm">
        <div className="text-sm text-gray-600 italic space-y-1">
          <div>ZP = Zafer Puanı (Victory Point)</div>
          <div>Oyunu kazanmak için 10 ZP'ye ulaşmanız gerekir</div>
        </div>
      </div>
    </div>
  );
};

export default CatanHorizontalScorepad;
