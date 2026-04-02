"use client";

import { useState, useEffect, useRef } from "react";
import PokerChipWrapper from "./PokerChipWrapper";

interface PokerGameProps {
  gameSaveId: string;
}

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useQuery = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getGameSaveById")) return { 
    _id: "ms1", 
    players: ["p1", "p2", "p3", "p4"] 
  };
  if (apiPath.includes("getPlayersByIds")) return [
    { _id: "p1", name: "Oyuncu 1", initial: "O1" },
    { _id: "p2", name: "Oyuncu 2", initial: "O2" },
    { _id: "p3", name: "Oyuncu 3", initial: "O3" },
    { _id: "p4", name: "Oyuncu 4", initial: "O4" },
  ];
  return undefined;
};

export default function PokerGame({ gameSaveId }: PokerGameProps) {
  // Fetch game save data
  const gameSave = useQuery(
    "api.gameSaves.getGameSaveById",
    gameSaveId ? { id: gameSaveId } : "skip"
  );
  const players = useQuery(
    "api.players.getPlayersByIds",
    gameSave?.players ? { playerIds: gameSave.players } : "skip"
  );

  // State for each player's bet and balance
  const [playerBets, setPlayerBets] = useState<{ [key: string]: number }>({});
  const [playerBalances, setPlayerBalances] = useState<{
    [key: string]: number;
  }>({});
  const [foldedPlayers, setFoldedPlayers] = useState<{
    [key: string]: boolean;
  }>({});
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);
  const [currentBet, setCurrentBet] = useState(0); // Highest bet in current round
  const [pendingRaises, setPendingRaises] = useState<{ [key: string]: number }>(
    {}
  ); // Pending raise amount for each player
  const [roundNumber, setRoundNumber] = useState(1); // Current round number (1-4)
  const [bettingRound, setBettingRound] = useState(1); // Current betting round (1-4)
  const [playersActed, setPlayersActed] = useState<{ [key: string]: boolean }>(
    {}
  ); // Track which players have acted in current round
  const [showWinnerModal, setShowWinnerModal] = useState(false); // Show winner selection modal
  const [roundPot, setRoundPot] = useState(0); // Pot for winner selection
  const entryFeePaidRef = useRef<boolean>(false); // Track if entry fee has been paid
  const initializedRef = useRef<string>("");

  // Chip values
  const chipValues = [1, 5, 10, 25, 100];

  // Get up to 4 players
  const gamePlayers = (players || []).slice(0, 4);

  // Initialize bets for players
  useEffect(() => {
    if (gamePlayers.length > 0) {
      const playerIds = gamePlayers
        .map((p) => p._id)
        .sort()
        .join(",");

      // Only initialize if player IDs have changed
      if (playerIds !== initializedRef.current) {
        // Initialize balances to $100 for each player
        setPlayerBalances((prev) => {
          const initialBalances: { [key: string]: number } = {};
          gamePlayers.forEach((player) => {
            if (!prev[player._id]) {
              initialBalances[player._id] = 100;
            }
          });
          return { ...prev, ...initialBalances };
        });

        // Deduct $5 entry fee only once when game first starts
        if (!entryFeePaidRef.current) {
          setPlayerBalances((prev) => {
            const updated = { ...prev };
            gamePlayers.forEach((player) => {
              if (updated[player._id] !== undefined) {
                updated[player._id] = Math.max(0, updated[player._id] - 5);
              }
            });
            return updated;
          });

          // Add entry fees to pot
          setPlayerBets((prev) => {
            const initialBets: { [key: string]: number } = {};
            gamePlayers.forEach((player) => {
              initialBets[player._id] = (prev[player._id] || 0) + 5; // Each player contributes $5 entry fee
            });
            initializedRef.current = playerIds;
            return initialBets;
          });

          entryFeePaidRef.current = true;
        } else {
          setPlayerBets((prev) => {
            const initialBets: { [key: string]: number } = {};
            gamePlayers.forEach((player) => {
              initialBets[player._id] = prev[player._id] || 0;
            });
            initializedRef.current = playerIds;
            return initialBets;
          });
        }
        // Initialize first player's turn and round
        if (gamePlayers.length > 0 && !currentTurn) {
          setCurrentTurn(gamePlayers[0]._id);
          setPlayersActed({});
          setRoundNumber(1);
          setBettingRound(1);
        }
      }
    }
  }, [gamePlayers, currentTurn]);

  const increaseBet = (playerId: string, amount: number) => {
    const currentBalance = playerBalances[playerId] || 100;
    const playerCurrentBet = playerBets[playerId] || 0;

    // Only allow betting if player has enough balance for the additional amount
    if (amount <= currentBalance) {
      const newBet = playerCurrentBet + amount;
      setPlayerBets((prev) => ({
        ...prev,
        [playerId]: newBet,
      }));
      setPlayerBalances((prev) => ({
        ...prev,
        [playerId]: currentBalance - amount,
      }));
      // Update current bet if this is higher
      if (newBet > currentBet) {
        setCurrentBet(newBet);
      }
    }
  };

  const handleFold = (playerId: string) => {
    setFoldedPlayers((prev) => ({
      ...prev,
      [playerId]: true,
    }));
    markPlayerActed(playerId);
    moveToNextPlayer(playerId);
  };

  const handleCheck = (playerId: string) => {
    // Check is valid if no bet has been made OR player's bet matches current bet
    const playerBet = playerBets[playerId] || 0;
    if (currentBet === 0 || playerBet === currentBet) {
      markPlayerActed(playerId);
      moveToNextPlayer(playerId);
    }
  };

  const addToPendingRaise = (playerId: string, amount: number) => {
    const currentBalance = playerBalances[playerId] || 100;
    const playerCurrentBet = playerBets[playerId] || 0;
    const neededToCall = currentBet - playerCurrentBet;
    const currentPending = pendingRaises[playerId] || 0;
    const newPending = currentPending + amount;
    const totalNeeded = neededToCall + newPending;

    // Only allow if player has enough balance
    if (totalNeeded <= currentBalance) {
      setPendingRaises((prev) => ({
        ...prev,
        [playerId]: newPending,
      }));
    }
  };

  const executeRaise = (playerId: string) => {
    const currentBalance = playerBalances[playerId] || 100;
    const playerCurrentBet = playerBets[playerId] || 0;
    const neededToCall = currentBet - playerCurrentBet;
    const pendingRaise = pendingRaises[playerId] || 0;

    // Raise amount is just the pending raise (not call + raise)
    // Total needed = call + raise
    const totalNeeded = neededToCall + pendingRaise;

    // Only allow if player has enough balance and raise amount is valid
    if (totalNeeded <= currentBalance && pendingRaise > 0) {
      // New bet = current bet + call + raise
      const newBet = currentBet + pendingRaise;
      setPlayerBets((prev) => ({
        ...prev,
        [playerId]: newBet,
      }));
      setPlayerBalances((prev) => ({
        ...prev,
        [playerId]: currentBalance - totalNeeded,
      }));
      setCurrentBet(newBet);
      // Clear pending raise
      setPendingRaises((prev) => {
        const updated = { ...prev };
        delete updated[playerId];
        return updated;
      });
      // Reset acted status for all players when someone raises (new betting round)
      setPlayersActed({ [playerId]: true });
      // Mark player as acted and move to next player
      markPlayerActed(playerId);
      moveToNextPlayer(playerId);
    }
  };

  const clearPendingRaise = (playerId: string) => {
    setPendingRaises((prev) => {
      const updated = { ...prev };
      delete updated[playerId];
      return updated;
    });
  };

  const markPlayerActed = (playerId: string) => {
    setPlayersActed((prev) => ({
      ...prev,
      [playerId]: true,
    }));
  };

  // Calculate total pot (sum of all player bets)
  const calculatePot = () => {
    return Object.values(playerBets).reduce((sum, bet) => sum + bet, 0);
  };

  const checkRoundEnd = () => {
    const activePlayers = gamePlayers.filter((p) => !foldedPlayers[p._id]);
    if (activePlayers.length <= 1) return false; // Game over

    // Check if all active players have acted
    const allActed = activePlayers.every((p) => playersActed[p._id] === true);
    if (!allActed) return false;

    // Check if all active players have the same bet
    const activePlayerBets = activePlayers.map((p) => playerBets[p._id] || 0);
    const allBetsEqual = activePlayerBets.every((bet) => bet === currentBet);

    return allBetsEqual;
  };

  const handleBettingRoundEnd = () => {
    // Check if this was the 4th betting round
    if (bettingRound >= 4) {
      // Game ends, show winner selection with all accumulated bets
      const finalPot = calculatePot();
      setRoundPot(finalPot);
      setShowWinnerModal(true);
    } else {
      // Start next betting round - don't reset bets, keep accumulating
      setBettingRound((prev) => prev + 1);
      setCurrentBet(0);
      setPlayersActed({});
      setPendingRaises({});

      // Set turn to first active player
      const activePlayers = gamePlayers.filter((p) => !foldedPlayers[p._id]);
      if (activePlayers.length > 0) {
        setCurrentTurn(activePlayers[0]._id);
      }
    }
  };

  const selectWinner = (winnerId: string) => {
    // Add total pot to winner's balance
    setPlayerBalances((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] || 100) + roundPot,
    }));

    // Reset everything for new game (but keep entry fee paid status)
    setPlayerBets({});
    setCurrentBet(0);
    setPlayersActed({});
    setPendingRaises({});
    setFoldedPlayers({});
    setRoundNumber((prev) => prev + 1);
    setBettingRound(1);
    setRoundPot(0);
    setShowWinnerModal(false);

    // Deduct entry fee for new game
    setPlayerBalances((prev) => {
      const updated = { ...prev };
      gamePlayers.forEach((player) => {
        if (updated[player._id] !== undefined) {
          updated[player._id] = Math.max(0, updated[player._id] - 5);
        }
      });
      return updated;
    });

    // Add entry fees to pot for new game
    setPlayerBets((prev) => {
      const initialBets: { [key: string]: number } = {};
      gamePlayers.forEach((player) => {
        initialBets[player._id] = 5; // Each player contributes $5 entry fee
      });
      return initialBets;
    });

    // Set turn to first player
    if (gamePlayers.length > 0) {
      setCurrentTurn(gamePlayers[0]._id);
    }
  };

  const startNewRound = () => {
    handleBettingRoundEnd();
  };

  const moveToNextPlayer = (currentPlayerId: string) => {
    const activePlayers = gamePlayers.filter((p) => !foldedPlayers[p._id]);

    // If only one player left, they win automatically
    if (activePlayers.length <= 1) {
      if (activePlayers.length === 1) {
        // Last player wins
        const winnerId = activePlayers[0]._id;
        const finalPot = calculatePot();
        setPlayerBalances((prev) => ({
          ...prev,
          [winnerId]: (prev[winnerId] || 100) + finalPot,
        }));
        // Reset for new game
        setPlayerBets({});
        setCurrentBet(0);
        setPlayersActed({});
        setPendingRaises({});
        setFoldedPlayers({});
        setRoundNumber((prev) => prev + 1);
        setBettingRound(1);
        setRoundPot(0);
        if (gamePlayers.length > 0) {
          setCurrentTurn(gamePlayers[0]._id);
        }
      }
      return;
    }

    // Check if round should end
    if (checkRoundEnd()) {
      startNewRound();
      return;
    }

    const currentIndex = activePlayers.findIndex(
      (p) => p._id === currentPlayerId
    );
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    setCurrentTurn(activePlayers[nextIndex]._id);
  };

  const resetBet = (playerId: string) => {
    const playerBet = playerBets[playerId] || 0;
    setPlayerBets((prev) => ({
      ...prev,
      [playerId]: 0,
    }));
    // Return bet to balance
    setPlayerBalances((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || 100) + playerBet,
    }));
    // Reset current bet if this was the highest
    if (playerBet === currentBet) {
      const remainingBets = Object.values(playerBets).filter(
        (bet, idx) => Object.keys(playerBets)[idx] !== playerId
      );
      setCurrentBet(Math.max(...remainingBets, 0));
    }
  };

  if (!gameSave || !players) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Ensure we have exactly 4 players (pad with empty slots if needed)
  const displayPlayers = [...gamePlayers];
  while (displayPlayers.length < 4) {
    displayPlayers.push(null as any);
  }

  // Arrange players in positions: [top, left, right, bottom]
  const topPlayer = displayPlayers[0] || null;
  const leftPlayer = displayPlayers[1] || null;
  const rightPlayer = displayPlayers[2] || null;
  const bottomPlayer = displayPlayers[3] || null;

  const PlayerCard = ({
    player,
    position,
  }: {
    player: any;
    position: "top" | "left" | "right" | "bottom";
  }) => {
    if (!player) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Empty
            </span>
          </div>
        </div>
      );
    }

    const isVertical = position === "left" || position === "right";
    const isFolded = foldedPlayers[player._id] || false;
    const isMyTurn = currentTurn === player._id;
    const playerBet = playerBets[player._id] || 0;
    const canCheck = currentBet === 0 || playerBet === currentBet;
    const neededToCall = currentBet - playerBet;
    const playerBalance = playerBalances[player._id] || 100;

    return (
      <div
        className={`flex flex-col items-center ${
          isVertical ? "flex-col" : "flex-row"
        } gap-3 ${isFolded ? "opacity-50" : ""} ${isMyTurn ? "ring-2 ring-yellow-400 rounded-lg p-2" : ""}`}
      >
        {/* Player Avatar */}
        <div className="relative flex flex-col items-center">
          {player.avatar ? (
            <img
              src={player.avatar}
              alt={player.name}
              className={`w-16 h-16 rounded-full border-2 ${
                isFolded
                  ? "border-red-500 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 ${
                isFolded
                  ? "bg-red-500 border-red-600"
                  : "bg-blue-500 border-gray-300 dark:border-gray-600"
              }`}
            >
              {player.initial}
            </div>
          )}
          {/* Bet amount displayed in center over/below avatar */}
          <div className="absolute -bottom-6 bg-blue-600 dark:bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
            ${playerBet}
          </div>
          {isFolded && (
            <div className="absolute -top-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
              FOLDED
            </div>
          )}
        </div>

        {/* Player Name */}
        <div className="text-center mt-4">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
            {player.name}
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Balance: ${playerBalance}
          </div>
          {isMyTurn && !isFolded && (
            <div className="text-xs text-yellow-600 dark:text-yellow-400 font-bold mt-1">
              Your Turn
            </div>
          )}
        </div>

        {/* Action Buttons (only show on player's turn) */}
        {isMyTurn && !isFolded && (
          <div className="flex flex-col gap-2 mt-2 w-full">
            <div className="flex gap-2">
              <button
                onClick={() => handleFold(player._id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
              >
                Fold
              </button>
              {canCheck ? (
                <button
                  onClick={() => handleCheck(player._id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Call: match the current bet
                    if (neededToCall <= playerBalance && neededToCall > 0) {
                      const newBet = playerBet + neededToCall;
                      setPlayerBets((prev) => ({
                        ...prev,
                        [player._id]: newBet,
                      }));
                      setPlayerBalances((prev) => ({
                        ...prev,
                        [player._id]: playerBalance - neededToCall,
                      }));
                      markPlayerActed(player._id);
                      moveToNextPlayer(player._id);
                    }
                  }}
                  disabled={neededToCall > playerBalance || neededToCall === 0}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    neededToCall > playerBalance || neededToCall === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  Call ${neededToCall}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chips (for raising) */}
        {isMyTurn && !isFolded && (
          <div className="mt-2 w-full">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 text-center">
              Select chips to raise:
            </div>
            <div
              className={`flex gap-2 ${
                isVertical ? "flex-col" : "flex-row"
              } items-center justify-center flex-wrap`}
            >
              {chipValues.map((value) => {
                const pendingRaise = pendingRaises[player._id] || 0;
                const totalNeeded = neededToCall + pendingRaise + value;
                const canAfford = playerBalance >= totalNeeded;
                return (
                  <button
                    key={value}
                    onClick={() => addToPendingRaise(player._id, value)}
                    disabled={!canAfford}
                    className={`hover:scale-110 transition-transform ${
                      canAfford
                        ? "cursor-pointer opacity-100"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    title={
                      canAfford
                        ? `Add $${value} to raise`
                        : "Insufficient balance"
                    }
                  >
                    <PokerChipWrapper value={value} />
                  </button>
                );
              })}
            </div>
            {pendingRaises[player._id] > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Pending Raise:
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${pendingRaises[player._id]}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Raise by: ${pendingRaises[player._id]} | Total needed: $
                    {neededToCall + pendingRaises[player._id]}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeRaise(player._id)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Raise ${pendingRaises[player._id]}
                  </button>
                  <button
                    onClick={() => clearPendingRaise(player._id)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Round Info */}
        <div className="mb-4 text-center space-y-3">
          <div className="inline-block bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg">
            <div className="text-lg font-bold">Oyun {roundNumber}</div>
            <div className="text-xs opacity-90">
              Mevcut Bahis: ${currentBet} | Ortadaki Para: ${calculatePot()}
            </div>
          </div>

          {/* Betting Rounds Visualization */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
              Bahis Turu:
            </span>
            {[1, 2, 3, 4].map((round) => (
              <div
                key={round}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  round < bettingRound
                    ? "bg-green-500 text-white"
                    : round === bettingRound
                      ? "bg-blue-500 text-white ring-4 ring-blue-300 dark:ring-blue-600 scale-110"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                }`}
              >
                {round}
              </div>
            ))}
          </div>
        </div>

        {/* Poker Table Layout */}
        <div className="relative min-h-[600px] flex items-center justify-center">
          {/* Top Player */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
            <PlayerCard player={topPlayer} position="top" />
          </div>

          {/* Left Player */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <PlayerCard player={leftPlayer} position="left" />
          </div>

          {/* Right Player */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <PlayerCard player={rightPlayer} position="right" />
          </div>

          {/* Bottom Player */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <PlayerCard player={bottomPlayer} position="bottom" />
          </div>
        </div>
      </div>

      {/* Winner Selection Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 text-center">
              Tur Kazananını Seç
            </h2>
            <div className="mb-4 text-center">
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Ortadaki Para:
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${roundPot}
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {gamePlayers
                .filter((p) => !foldedPlayers[p._id])
                .map((player) => (
                  <button
                    key={player._id}
                    onClick={() => selectWinner(player._id)}
                    className="w-full p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-3"
                  >
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold">
                        {player.initial}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs opacity-90">
                        Bakiye: ${playerBalances[player._id] || 100}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
