"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  ChartBar,
  ListBullets,
  ChatCircle,
  Plus,
  MagnifyingGlass,
  Spade,
  CaretDown,
} from "@phosphor-icons/react";
import toast from "react-hot-toast";
import GameRulesTab from "../components/GameRulesTab";
import CreateModal from "../components/CreateModal";
import EditPlayerModal from "../components/EditPlayerModal";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { MOCK_GAMES, MOCK_USER } from "../lib/mock-data";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();


function CreateGameContent() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useClerkUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId");

  const game = MOCK_GAMES.find(g => g._id === gameId) || MOCK_GAMES[0];
  const gameName = game?.name || "Oyun";

  const [players, setPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  // ALL STATE HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState("oyun-kur");
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [redTeam, setRedTeam] = useState<string[]>([]);
  const [blueTeam, setBlueTeam] = useState<string[]>([]);
  const [gameSettings, setGameSettings] = useState({
    gameplay: game?.settings?.gameplay || "herkes-tek",
    calculationMode: game?.settings?.calculationMode || "NoPoints",
    roundWinner: game?.settings?.roundWinner || "Highest",
    pointsPerRound: (game?.settings as any)?.pointsPerRound || "Single",
    scoringTiming: (game?.settings as any)?.scoringTiming || "tur-sonu",
    hideTotalColumn: (game?.settings as any)?.hideTotalColumn || false,
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<
    "player" | null
  >(null);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);

  // Fetch players on load and manage the "Ben" user player
  useEffect(() => {
    if (isClerkLoaded) {
      if (clerkUser) {
        const fetchPlayers = async () => {
          try {
            setLoadingPlayers(true);
            const res = await client.yazboz.getPlayers(clerkUser.id);
            let dbPlayers = res.players || [];
            
            const myName = clerkUser.fullName || clerkUser.firstName || "Ben";
            let me = dbPlayers.find(p => p.name === myName || p.name === "Ben");
            
            if (!me) {
              const createRes = await client.yazboz.createPlayer({
                userId: clerkUser.id,
                name: myName,
                initial: myName.charAt(0).toUpperCase()
              });
              if (createRes.player) {
                dbPlayers = [createRes.player, ...dbPlayers];
                me = createRes.player;
              }
            }
            
            const formatted = dbPlayers.map((p: any) => ({
              ...p,
              _id: p.id
            }));
            
            setPlayers(formatted);
            if (me) {
              setSelectedPlayers([me.id]);
            } else if (formatted.length > 0) {
              setSelectedPlayers([formatted[0]._id]);
            }
          } catch (e) {
            console.error("Error loading players:", e);
          } finally {
            setLoadingPlayers(false);
          }
        };
        fetchPlayers();
      } else {
        setPlayers([]);
        setLoadingPlayers(false);
      }
    }
  }, [isClerkLoaded, clerkUser]);

  // Update settings when game data loads
  useEffect(() => {
    if (game?.settings) {
      setGameSettings({
        gameplay: game.settings.gameplay || "herkes-tek",
        calculationMode: game.settings.calculationMode || "NoPoints",
        roundWinner: game.settings.roundWinner || "Highest",
        pointsPerRound: (game.settings as any)?.pointsPerRound || "Single",
        scoringTiming: (game.settings as any)?.scoringTiming || "tur-sonu",
        hideTotalColumn: (game.settings as any)?.hideTotalColumn || false,
      });
    }
  }, [game]);


  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn) {
      router.replace("/");
    }
  }, [isClerkLoaded, isClerkSignedIn, router]);

  // Show loading state while checking authentication
  if (!isClerkLoaded || (isClerkLoaded && !isClerkSignedIn)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (currentStep === 2) {
      router.back();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      if (selectedPlayers.length === 0) {
        toast.error("En az bir oyuncu seçmelisiniz!");
        return;
      }
      setCurrentStep(3);
    } else {
      // Create game save and start the game (step 3)
      if (!clerkUser || !gameId) {
        console.error("Missing clerkUser or game ID");
        return;
      }

      // Validate team assignments for team mode
      if (gameSettings.gameplay === "takimli") {
        const allTeamPlayers = [...redTeam, ...blueTeam];
        const unassignedPlayers = selectedPlayers.filter(
          (playerId: any) => !allTeamPlayers.includes(playerId),
        );

        if (unassignedPlayers.length > 0) {
          toast.error(
            "Tüm oyuncular takımlara atanmalıdır. Lütfen tüm oyuncuları kırmızı veya mavi takıma atayın.",
          );
          return;
        }

        // Check if any team has 0 players
        if (redTeam.length === 0 || blueTeam.length === 0) {
          toast.error("Her iki takımda da en az bir oyuncu olmalıdır!");
          return;
        }
      }

      try {
        const statePayload = {
          redTeam: gameSettings.gameplay === "takimli" ? redTeam : undefined,
          blueTeam: gameSettings.gameplay === "takimli" ? blueTeam : undefined,
          laps: [],
          teamLaps: [],
        };

        const res = await client.yazboz.createGameSave({
          userId: clerkUser.id,
          name: gameName,
          gameTemplate: gameId as string,
          players: selectedPlayers,
          settings: {
            gameplay: gameSettings.gameplay as "herkes-tek" | "takimli",
            calculationMode: gameSettings.calculationMode as
              | "NoPoints"
              | "Points",
            roundWinner: gameSettings.roundWinner as "Highest" | "Lowest",
            pointsPerRound: gameSettings.pointsPerRound as
              | "Single"
              | "Multiple"
              | undefined,
            scoringTiming: gameSettings.scoringTiming as
              | "tur-sonu"
              | "oyun-sonu"
              | undefined,
            hideTotalColumn: gameSettings.hideTotalColumn,
          },
          state: statePayload,
        });

        if (res.gameSave) {
          console.log("Game save created:", res.gameSave.id);
          router.push(`/apps/game-companion/game-session?gameSaveId=${res.gameSave.id}`);
        }
      } catch (error) {
        console.error("Error creating game save:", error);
        toast.error(
          "Oyun kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
        );
      }
    }
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayers((prev: any) =>
      prev.includes(playerId)
        ? prev.filter((id: any) => id !== playerId)
        : [...prev, playerId],
    );
  };

  const updateGameSetting = (key: string, value: string | boolean) => {
    setGameSettings((prev: any) => {
      const newSettings = { ...prev, [key]: value };

      // Reset round winner when calculation mode changes
      if (key === "calculationMode") {
        if (value === "NoPoints") {
          newSettings.roundWinner = "Highest";
        } else if (value === "Points") {
          newSettings.roundWinner = "Highest";
        }
      }

      return newSettings;
    });

    // Reset teams when switching from team mode to individual mode
    if (key === "gameplay" && value === "herkes-tek") {
      setRedTeam([]);
      setBlueTeam([]);
    }

    // Initialize all selected players to red team when switching to team mode
    if (key === "gameplay" && value === "takimli") {
      setRedTeam([...selectedPlayers]);
      setBlueTeam([]);
    }
  };

  const movePlayerToTeam = (playerId: string, team: "red" | "blue") => {
    // Remove player from both teams first
    setRedTeam((prev: any) => prev.filter((id: any) => id !== playerId));
    setBlueTeam((prev: any) => prev.filter((id: any) => id !== playerId));

    // Add to the specified team
    if (team === "red") {
      setRedTeam((prev: any) => [...prev, playerId]);
    } else {
      setBlueTeam((prev: any) => [...prev, playerId]);
    }
  };

  const removePlayerFromTeams = (playerId: string) => {
    setRedTeam((prev: any) => prev.filter((id: any) => id !== playerId));
    setBlueTeam((prev: any) => prev.filter((id: any) => id !== playerId));
  };

  const handleCreatePlayer = async (name: string, avatar?: string) => {
    if (!clerkUser) return;

    try {
      const result = await client.yazboz.createPlayer({
        userId: clerkUser.id,
        name,
        initial: name.charAt(0).toUpperCase(),
      });

      if (result.player) {
        const newPlayer = { ...result.player, _id: result.player.id };
        setPlayers((prev) => [...prev, newPlayer]);
        setSelectedPlayers((prev: any) => [...prev, newPlayer._id]);
        toast.success(`${name} oyuncu olarak eklendi!`);
      }
    } catch (error) {
      console.error("Error creating player:", error);
      toast.error("Oyuncu eklenirken hata oluştu!");
    }
  };

  const openCreateModal = (type: "player") => {
    setCreateModalType(type);
    setShowCreateModal(true);
  };

  const openEditPlayerModal = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowEditPlayerModal(true);
  };

  const closeEditPlayerModal = () => {
    setShowEditPlayerModal(false);
    setSelectedPlayerId(null);
  };

  // Helper function to get team information for debugging/logging
  const getTeamInfo = () => {
    if (gameSettings.gameplay !== "takimli") return null;

    return {
      redTeam: redTeam.map(
        (id: any) => allPlayers.find((p: any) => p._id === id)?.name || "Unknown",
      ),
      blueTeam: blueTeam.map(
        (id: any) => allPlayers.find((p: any) => p._id === id)?.name || "Unknown",
      ),
      totalPlayers: selectedPlayers.length,
      assignedPlayers: redTeam.length + blueTeam.length,
      unassignedPlayers: selectedPlayers.filter(
        (id) => !redTeam.includes(id) && !blueTeam.includes(id),
      ).length,
    };
  };

  // Filter players based on search query
  const filterPlayers = (playerList: typeof players) => {
    if (!searchQuery.trim()) return playerList;
    return (
      playerList?.filter((player: any) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ) || []
    );
  };

  const myName = clerkUser?.fullName || clerkUser?.firstName || "Ben";
  const userPlayer = players.find(p => p.name === myName || p.name === "Ben");

  // Filter players based on search query, excluding the current user's player (by ID and Name)
  const filteredPlayers = filterPlayers(
    players?.filter((player: any) => {
      const isMe = (userPlayer && player._id === userPlayer._id) || player.name === myName || player.name === "Ben";
      return !isMe;
    }) || []
  );

  // Combine all players including current user
  const allPlayers = players || [];

  // Simple player component for team display
  function TeamPlayer({ player, team }: { player: any; team: "red" | "blue" }) {
    const getTeamColor = () => {
      if (team === "red") return "#F05757";
      if (team === "blue") return "#365376";
      return "#F05757";
    };

    return (
      <div
        className="rounded-full px-3 py-2 flex items-center space-x-2"
        style={{ backgroundColor: getTeamColor() }}
      >
        {player.avatar ? (
          <img
            src={player.avatar}
            alt={player.name}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span
              className={`font-semibold text-sm ${team === "blue" ? "text-blue-600" : "text-red-600"}`}
            >
              {player.initial}
            </span>
          </div>
        )}
        <span className="font-medium text-sm text-white truncate max-w-[70px]">
          {player.name}
        </span>
        <button
          onClick={() =>
            movePlayerToTeam(player._id, team === "red" ? "blue" : "red")
          }
          className="ml-2 text-white hover:text-gray-200"
        >
          {team === "red" ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#100D16] shadow-sm"
        style={{ opacity: 1 }}
      >
        <div className="px-4 py-4 flex items-center justify-between border-b border-gray-200 dark:border-[var(--card-border)]">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {gameName}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col pt-20 pb-6"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Content will be handled by the bottom panel based on currentStep */}
        </div>
      </div>

      {/* Fixed White Rectangle at Bottom - Hide when Sor or Kurallar tab is selected */}
      {activeTab === "oyun-kur" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[var(--card-background)] rounded-t-3xl shadow-lg">
          <div className="p-6">
            {currentStep === 1 ? null : currentStep === 2 ? (
              // Player Selection in Bottom Panel
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-4 -mx-0.5">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Oyuncu Seç
                  </h2>
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => setShowSearchBar(!showSearchBar)}
                      className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
                    >
                      <MagnifyingGlass size={16} />
                      Ara
                    </button>
                    <button
                      onClick={() => openCreateModal("player")}
                      className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Search Input - Conditionally shown */}
                {showSearchBar && (
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Oyuncu ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 dark:text-gray-200 bg-white dark:bg-[var(--card-background)]"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Player Selection Container with Max Height and Scroll */}
                <div className="max-h-92 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {/* Current User */}
                  {userPlayer && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Ben
                      </h3>
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between py-1">
                          <div
                            className="flex items-center space-x-3 cursor-pointer flex-1"
                            onClick={() =>
                              openEditPlayerModal(userPlayer._id)
                            }
                          >
                            {clerkUser?.imageUrl ? (
                              <img
                                src={clerkUser.imageUrl}
                                alt={clerkUser.fullName || "Sen"}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {clerkUser?.firstName?.charAt(0) || userPlayer.initial}
                                </span>
                              </div>
                            )}
                            <span className="font-normal text-black dark:text-gray-200 text-sm">
                              {clerkUser?.fullName || userPlayer.name}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              togglePlayer(userPlayer._id)
                            }
                            className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                              selectedPlayers.includes(userPlayer._id)
                                ? "bg-blue-500 border-blue-500"
                                : "bg-white dark:bg-[var(--card-background)] border-blue-500"
                            }`}
                          >
                            {selectedPlayers.includes(
                              userPlayer._id,
                            ) && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Players List */}
                  {filteredPlayers && filteredPlayers.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Kişiler
                      </h3>
                      <div className="space-y-0.5">
                        {filteredPlayers.map((player: any) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between py-1"
                          >
                            <div
                              className="flex items-center space-x-3 cursor-pointer flex-1"
                              onClick={() => openEditPlayerModal(player._id)}
                            >
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                  {player.initial}
                                </span>
                              </div>
                              <span className="font-normal text-black dark:text-gray-200 text-sm truncate max-w-[200px]">
                                {player.name}
                              </span>
                            </div>
                            <button
                              onClick={() => togglePlayer(player._id)}
                              className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${
                                selectedPlayers.includes(player._id)
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white dark:bg-[var(--card-background)] border-blue-500"
                              }`}
                            >
                              {selectedPlayers.includes(player._id) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : currentStep === 3 ? (
              // Game Settings / Options State
              <>
                <div className="space-y-6">
                  {/* Oyuncular - Show teams if team mode is selected */}
                  {gameSettings.gameplay === "takimli" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Kırmızı Takım */}
                        <div>
                          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Kırmızı Takım:
                          </h2>
                          <div className="min-h-[120px] p-4 border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-950/30">
                            <div className="flex flex-wrap gap-2">
                              {redTeam.map((playerId: any) => {
                                const player = (allPlayers as any[]).find(
                                  (p: any) => p._id === playerId,
                                );
                                return player ? (
                                  <TeamPlayer
                                    key={playerId}
                                    player={player}
                                    team="red"
                                  />
                                ) : null;
                              })}
                            </div>
                            {redTeam.length === 0 && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Kırmızı takım oyuncuları
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Mavi Takım */}
                        <div>
                          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Mavi Takım:
                          </h2>
                          <div className="min-h-[120px] p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <div className="flex flex-wrap gap-2">
                              {blueTeam.map((playerId: any) => {
                                const player = (allPlayers as any[]).find(
                                  (p: any) => p._id === playerId,
                                );
                                return player ? (
                                  <TeamPlayer
                                    key={playerId}
                                    player={player}
                                    team="blue"
                                  />
                                ) : null;
                              })}
                            </div>
                            {blueTeam.length === 0 && (
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Mavi takım oyuncuları
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Oyuncular:
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlayers.map((playerId: any) => {
                          const player = (allPlayers as any[]).find(
                            (p: any) => p._id === playerId,
                          );
                          return player ? (
                            <div
                              key={playerId}
                              className="rounded-full px-2 py-1.5 flex items-center space-x-2"
                              style={{ backgroundColor: "#F05757" }}
                            >
                              {player.avatar ? (
                                <img
                                  src={player.avatar}
                                  alt={player.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-semibold text-sm">
                                    {player.initial}
                                  </span>
                                </div>
                              )}
                              <span className="text-white font-medium text-sm truncate max-w-[70px]">
                                {player.name}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Oynanış */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Oynanış:
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateGameSetting("gameplay", "herkes-tek")
                        }
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          gameSettings.gameplay === "herkes-tek"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          gameSettings.gameplay === "herkes-tek"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Herkes Tek
                      </button>
                      <button
                        onClick={() => updateGameSetting("gameplay", "takimli")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          gameSettings.gameplay === "takimli"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          gameSettings.gameplay === "takimli"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Takımlı
                      </button>
                    </div>
                  </div>

                  {/* Advanced Settings - Collapsible */}
                  <div className="space-y-4">
                    <button
                      onClick={() =>
                        setShowAdvancedSettings(!showAdvancedSettings)
                      }
                      className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-[rgba(247,247,248,0.05)] rounded-lg hover:bg-gray-100 dark:hover:bg-[rgba(247,247,248,0.1)] transition-colors"
                    >
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Gelişmiş Ayarlar
                      </h2>
                      <CaretDown
                        size={16}
                        className={`text-gray-600 transition-transform duration-200 ${
                          showAdvancedSettings ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showAdvancedSettings && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        {/* Hesaplama Modu */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            Hesaplama Modu:
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateGameSetting("calculationMode", "NoPoints")
                              }
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                gameSettings.calculationMode === "NoPoints"
                                  ? "text-white"
                                  : "text-gray-800 dark:text-gray-300"
                              }`}
                              style={
                                gameSettings.calculationMode === "NoPoints"
                                  ? { backgroundColor: "#365376" }
                                  : {}
                              }
                            >
                              Puansız
                            </button>
                            <button
                              onClick={() =>
                                updateGameSetting("calculationMode", "Points")
                              }
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                gameSettings.calculationMode === "Points"
                                  ? "text-white"
                                  : "text-gray-800 dark:text-gray-300"
                              }`}
                              style={
                                gameSettings.calculationMode === "Points"
                                  ? { backgroundColor: "#365376" }
                                  : {}
                              }
                            >
                              Puanlı
                            </button>
                          </div>
                        </div>

                        {/* Puanlama */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            Puanlama:
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updateGameSetting("scoringTiming", "tur-sonu")
                              }
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                gameSettings.scoringTiming === "tur-sonu"
                                  ? "text-white"
                                  : "text-gray-800 dark:text-gray-300"
                              }`}
                              style={
                                gameSettings.scoringTiming === "tur-sonu"
                                  ? { backgroundColor: "#365376" }
                                  : {}
                              }
                            >
                              Tur Sonu
                            </button>
                            <button
                              onClick={() =>
                                updateGameSetting("scoringTiming", "oyun-sonu")
                              }
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                gameSettings.scoringTiming === "oyun-sonu"
                                  ? "text-white"
                                  : "text-gray-800 dark:text-gray-300"
                              }`}
                              style={
                                gameSettings.scoringTiming === "oyun-sonu"
                                  ? { backgroundColor: "#365376" }
                                  : {}
                              }
                            >
                              Oyun Sonu
                            </button>
                          </div>
                        </div>

                        {/* Tur Kazananı - Conditional based on calculation mode */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            Kazanan:
                          </h3>
                          <div className="flex gap-2">
                            {gameSettings.calculationMode === "NoPoints" ? (
                              // Options for Puansız mode
                              <>
                                <button
                                  onClick={() =>
                                    updateGameSetting("roundWinner", "Highest")
                                  }
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                    gameSettings.roundWinner === "Highest"
                                      ? "text-white"
                                      : "text-gray-800 dark:text-gray-300"
                                  }`}
                                  style={
                                    gameSettings.roundWinner === "Highest"
                                      ? { backgroundColor: "#365376" }
                                      : {}
                                  }
                                >
                                  <span>↑</span>
                                  <span>En Yüksek</span>
                                </button>
                                <button
                                  onClick={() =>
                                    updateGameSetting("roundWinner", "Lowest")
                                  }
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                    gameSettings.roundWinner === "Lowest"
                                      ? "text-white"
                                      : "text-gray-800 dark:text-gray-300"
                                  }`}
                                  style={
                                    gameSettings.roundWinner === "Lowest"
                                      ? { backgroundColor: "#365376" }
                                      : {}
                                  }
                                >
                                  <span>↓</span>
                                  <span>En Düşük</span>
                                </button>
                              </>
                            ) : gameSettings.calculationMode === "Points" ? (
                              // Options for Puanlı mode
                              <>
                                <button
                                  onClick={() =>
                                    updateGameSetting("roundWinner", "Highest")
                                  }
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                    gameSettings.roundWinner === "Highest"
                                      ? "text-white"
                                      : "text-gray-800 dark:text-gray-300"
                                  }`}
                                  style={
                                    gameSettings.roundWinner === "Highest"
                                      ? { backgroundColor: "#365376" }
                                      : {}
                                  }
                                >
                                  <span>↑</span>
                                  <span>En Yüksek</span>
                                </button>
                                <button
                                  onClick={() =>
                                    updateGameSetting("roundWinner", "Lowest")
                                  }
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                                    gameSettings.roundWinner === "Lowest"
                                      ? "text-white"
                                      : "text-gray-800 dark:text-gray-300"
                                  }`}
                                  style={
                                    gameSettings.roundWinner === "Lowest"
                                      ? { backgroundColor: "#365376" }
                                      : {}
                                  }
                                >
                                  <span>↓</span>
                                  <span>En Düşük</span>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {/* Tur İçi Puan Sayısı - Only show when Puanlı is selected with animation */}
                        {gameSettings.calculationMode === "Points" && (
                          <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              Tur İçi Puan Sayısı:
                            </h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  updateGameSetting("pointsPerRound", "Single")
                                }
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                                  gameSettings.pointsPerRound === "Single"
                                    ? "text-white"
                                    : "text-gray-800 dark:text-gray-300"
                                }`}
                                style={
                                  gameSettings.pointsPerRound === "Single"
                                    ? { backgroundColor: "#365376" }
                                    : {}
                                }
                              >
                                Tek
                              </button>
                              <button
                                onClick={() =>
                                  updateGameSetting(
                                    "pointsPerRound",
                                    "Multiple",
                                  )
                                }
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                                  gameSettings.pointsPerRound === "Multiple"
                                    ? "text-white"
                                    : "text-gray-800 dark:text-gray-300"
                                }`}
                                style={
                                  gameSettings.pointsPerRound === "Multiple"
                                    ? { backgroundColor: "#365376" }
                                    : {}
                                }
                              >
                                Çok
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Toplam Sütununu Gizle */}
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            Toplam Sütununu Gizle:
                          </h3>
                          <button
                            onClick={() =>
                              updateGameSetting(
                                "hideTotalColumn",
                                !gameSettings.hideTotalColumn,
                              )
                            }
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              gameSettings.hideTotalColumn
                                ? "border-gray-300 dark:border-gray-600"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            style={
                              gameSettings.hideTotalColumn
                                ? { backgroundColor: "#365376" }
                                : {}
                            }
                          >
                            {gameSettings.hideTotalColumn && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {currentStep > 2 && (
                <button
                  onClick={handleBack}
                  className="flex-1 bg-white dark:bg-[var(--card-background)] border-2 border-blue-500 text-blue-500 dark:text-blue-400 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={20} />
                  <span>Önceki</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <span>
                  {currentStep === 1 || currentStep === 2
                    ? "Sonraki"
                    : "Başlat"}
                </span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateModalType(null);
        }}
        type={createModalType || "player"}
        onPlayerCreated={(newPlayer) => {
          setPlayers((prev) => [...prev, newPlayer]);
          setSelectedPlayers((prev) => [...prev, newPlayer._id]);
        }}
      />

      {/* Edit Player Modal */}
      {showEditPlayerModal && selectedPlayerId && (
        <EditPlayerModal
          player={players.find((p) => p._id === selectedPlayerId)}
          onClose={closeEditPlayerModal}
          onUpdate={(updatedPlayer) => {
            setPlayers((prev) =>
              prev.map((p) => (p._id === updatedPlayer._id ? updatedPlayer : p))
            );
          }}
          onDelete={(id) => {
            setPlayers((prev) => prev.filter((p) => p._id !== id));
            setSelectedPlayers((prev) => prev.filter((pid) => pid !== id));
          }}
        />
      )}
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateGameContent />
    </Suspense>
  );
}
