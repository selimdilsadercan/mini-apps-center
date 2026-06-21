"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FloppyDisk,
  X,
  Plus,
  ListBullets,
  Check,
} from "@phosphor-icons/react";
import RichTextEditor from "../../components/RichTextEditor";
import Sidebar from "../../components/Sidebar";
import PdfUpload from "../../components/PdfUpload";
import PdfViewer from "../../components/PdfViewer";
import ImageUpload from "../../components/ImageUpload";
import { MOCK_GAMES, MOCK_GAME_LISTS } from "../../lib/mock-data";

// Type shim for UI-only mode
type Id<T> = string;

// Local mock hooks
const useAuth = () => ({
  isSignedIn: true,
  isLoaded: true,
});

const useQuery = (apiPath: any, args?: any): any => {
  if (apiPath.toString().includes("getGameById")) return MOCK_GAMES[0];
  if (apiPath.toString().includes("getAllGameLists")) return MOCK_GAME_LISTS;
  return [];
};

const useMutation = (apiPath: any) => async (args: any) => {
  console.log("Mock mutation:", apiPath, args);
  return true;
};

function EditGameContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") || "g1";

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
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

  const [gameName, setGameName] = useState("");
  const [gameEmoji, setGameEmoji] = useState("");
  const [gameImageFile, setGameImageFile] = useState<string | undefined>(
    undefined,
  );
  const [gameRules, setGameRules] = useState("");
  const [rulesSections, setRulesSections] = useState<
    Array<{ id: string; title: string; content: string }>
  >([]);
  const [gameplay, setGameplay] = useState("herkes-tek");
  const [calculationMode, setCalculationMode] = useState("NoPoints");
  const [roundWinner, setRoundWinner] = useState("Highest");
  const [pointsPerRound, setPointsPerRound] = useState("Single");
  const [scoringTiming, setScoringTiming] = useState("tur-sonu");
  const [hideTotalColumn, setHideTotalColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rulesMode, setRulesMode] = useState<"text" | "json">("text");
  const [activeTab, setActiveTab] = useState("genel");
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [rulesPdfId, setRulesPdfId] = useState<string | undefined>(undefined);

  // Fetch game data
  const game = useQuery(
    "api.games.getGameById",
    gameId ? { id: gameId } : "skip",
  );
  const gameLists = useQuery("api.gameLists.getAllGameLists");
  const updateGame = useMutation("api.games.updateGame");
  const addGamesToList = useMutation("api.gameLists.addGamesToList");
  const removeGamesFromList = useMutation("api.gameLists.removeGamesFromList");

  // Populate form when game data loads
  useEffect(() => {
    if (game) {
      setGameName(game.name);
      setGameEmoji(game.emoji || "");
      setGameImageFile(game.imageFile);
      setGameRules(game.rules || "");
      setGameplay(game.settings?.gameplay || "herkes-tek");
      setCalculationMode(game.settings?.calculationMode || "NoPoints");
      setRoundWinner(game.settings?.roundWinner || "Highest");
      setPointsPerRound((game.settings as any)?.pointsPerRound || "Single");
      setScoringTiming((game.settings as any)?.scoringTiming || "tur-sonu");
      setHideTotalColumn(game.settings?.hideTotalColumn || false);
      setRulesPdfId(game.rulesPdf);

      // Parse rules sections if they exist
      if (game.rules) {
        try {
          const parsed = JSON.parse(game.rules);
          if (Array.isArray(parsed)) {
            setRulesSections(parsed);
          }
        } catch {
          // If not JSON, treat as plain text
          setRulesSections([
            { id: "1", title: "Genel Kurallar", content: game.rules },
          ]);
        }
      }
    }
  }, [game]);

  // Load current list assignments
  useEffect(() => {
    if (game && gameLists) {
      const currentLists = (gameLists as any[])
        .filter((list: any) => list.gameIds.includes(game._id))
        .map((list: any) => list._id);
      setSelectedLists(currentLists);
    }
  }, [game, gameLists]);

  const handleBack = () => {
    router.back();
  };

  const addRulesSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: "",
      content: "",
    };
    setRulesSections([...rulesSections, newSection]);
  };

  const convertToJson = () => {
    const jsonRules = JSON.stringify(rulesSections, null, 2);
    setGameRules(jsonRules);
    setRulesMode("json");
  };

  const convertToText = () => {
    try {
      const parsedRules = JSON.parse(gameRules);
      if (Array.isArray(parsedRules)) {
        setRulesSections(parsedRules);
        setRulesMode("text");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Geçersiz JSON formatı!");
    }
  };

  const validateAndSaveJson = () => {
    try {
      const parsedRules = JSON.parse(gameRules);
      if (Array.isArray(parsedRules)) {
        // Validate that each rule has required fields
        const isValid = parsedRules.every(
          (rule) => rule.id && rule.title && rule.content !== undefined,
        );

        if (isValid) {
          setRulesSections(parsedRules);
          setRulesMode("text");
        }
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  };

  const updateRulesSection = (
    id: string,
    field: "title" | "content",
    value: string,
  ) => {
    setRulesSections((sections) =>
      sections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section,
      ),
    );
  };

  const removeRulesSection = (id: string) => {
    setRulesSections((sections) =>
      sections.filter((section) => section.id !== id),
    );
  };

  const handleSave = async () => {
    if (!gameName.trim() || !gameId) return;

    setIsLoading(true);
    try {
      await updateGame({
        id: gameId,
        name: gameName.trim(),
        emoji: gameEmoji.trim(),
        imageFile: gameImageFile,
        rules: JSON.stringify(rulesSections),
        settings: {
          gameplay,
          calculationMode,
          roundWinner,
          pointsPerRound,
          scoringTiming,
          hideTotalColumn,
        },
      });

      // Update list assignments
      if (gameLists) {
        const currentLists = (gameLists as any[])
          .filter((list: any) => list.gameIds.includes(gameId))
          .map((list: any) => list._id);

        const listsToAdd = selectedLists.filter(
          (id) => !currentLists.includes(id),
        );
        const listsToRemove = currentLists.filter(
          (id) => !selectedLists.includes(id),
        );

        // Add to new lists
        for (const listId of listsToAdd) {
          await addGamesToList({ listId, gameIds: [gameId] });
        }

        // Remove from old lists
        for (const listId of listsToRemove) {
          await removeGamesFromList({ listId, gameIds: [gameId] });
        }
      }

      router.back();
    } catch (error) {
      console.error("Error updating game:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUploadComplete = (pdfId: Id<"_storage">) => {
    setRulesPdfId(pdfId);
  };

  const handlePdfDelete = () => {
    setRulesPdfId(undefined);
  };

  if (!game) {
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

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="admin" />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white dark:bg-[var(--card-background)] shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft
                  size={20}
                  weight="regular"
                  className="text-gray-600 dark:text-gray-400"
                />
              </button>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Oyunu Düzenle
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={!gameName.trim() || isLoading}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              <FloppyDisk size={20} weight="regular" />
              <span>{isLoading ? "Kaydediliyor..." : "Kaydet"}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("genel")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "genel"
                  ? "bg-white dark:bg-[var(--card-background)] text-gray-900 dark:text-gray-200 shadow-sm"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Genel
            </button>
            <button
              onClick={() => setActiveTab("kurallar")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "kurallar"
                  ? "bg-white dark:bg-[var(--card-background)] text-gray-900 dark:text-gray-200 shadow-sm"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Kurallar
            </button>
            <button
              onClick={() => setActiveTab("listeler")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "listeler"
                  ? "bg-white dark:bg-[var(--card-background)] text-gray-900 dark:text-gray-200 shadow-sm"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Listeler
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === "genel" && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Temel Bilgiler
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Oyun Adı *
                    </label>
                    <input
                      type="text"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-[var(--card-background)]"
                      placeholder="Oyun adını girin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emoji
                    </label>
                    <input
                      type="text"
                      value={gameEmoji}
                      onChange={(e) => setGameEmoji(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-[var(--card-background)]"
                      placeholder="Oyun emojisini girin (örn: 🎮, 🃏, ⚡)"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resim Dosyası Yükle
                    </label>
                    <ImageUpload
                      value={gameImageFile}
                      onChange={setGameImageFile}
                      previewSize="md"
                      accept="image/*"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Resim dosyası yüklemek için yukarıdaki alana tıklayın veya
                      dosyayı sürükleyin
                    </p>
                  </div>
                </div>
              </div>

              {/* Game Settings */}
              <div className="border-t border-gray-200 dark:border-[var(--card-border)] pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Oyun Ayarları
                </h3>

                <div className="space-y-6">
                  {/* Oynanış */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Oynanış:
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGameplay("herkes-tek")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          gameplay === "herkes-tek"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          gameplay === "herkes-tek"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Herkes Tek
                      </button>
                      <button
                        onClick={() => setGameplay("takimli")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          gameplay === "takimli"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          gameplay === "takimli"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Takımlı
                      </button>
                    </div>
                  </div>

                  {/* Hesaplama Modu */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Hesaplama Modu:
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCalculationMode("NoPoints")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          calculationMode === "NoPoints"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          calculationMode === "NoPoints"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Puansız
                      </button>
                      <button
                        onClick={() => setCalculationMode("Points")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          calculationMode === "Points"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          calculationMode === "Points"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Puanlı
                      </button>
                    </div>
                  </div>

                  {/* Puanlama Zamanı */}
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Puanlama:
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setScoringTiming("tur-sonu")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          scoringTiming === "tur-sonu"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          scoringTiming === "tur-sonu"
                            ? { backgroundColor: "#365376" }
                            : {}
                        }
                      >
                        Tur Sonu
                      </button>
                      <button
                        onClick={() => setScoringTiming("oyun-sonu")}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                          scoringTiming === "oyun-sonu"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-300"
                        }`}
                        style={
                          scoringTiming === "oyun-sonu"
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
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Kazanan:
                    </h2>
                    <div className="flex gap-2">
                      {calculationMode === "NoPoints" ? (
                        // Options for Puansız mode
                        <>
                          <button
                            onClick={() => setRoundWinner("Highest")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                              roundWinner === "Highest"
                                ? "text-white"
                                : "text-gray-800 dark:text-gray-300"
                            }`}
                            style={
                              roundWinner === "Highest"
                                ? { backgroundColor: "#365376" }
                                : {}
                            }
                          >
                            <span>↑</span>
                            <span>En Yüksek</span>
                          </button>
                          <button
                            onClick={() => setRoundWinner("Lowest")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                              roundWinner === "Lowest"
                                ? "text-white"
                                : "text-gray-800 dark:text-gray-300"
                            }`}
                            style={
                              roundWinner === "Lowest"
                                ? { backgroundColor: "#365376" }
                                : {}
                            }
                          >
                            <span>↓</span>
                            <span>En Düşük</span>
                          </button>
                        </>
                      ) : calculationMode === "Points" ? (
                        // Options for Puanlı mode
                        <>
                          <button
                            onClick={() => setRoundWinner("Highest")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                              roundWinner === "Highest"
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                            style={
                              roundWinner === "Highest"
                                ? { backgroundColor: "#365376" }
                                : {}
                            }
                          >
                            <span>↑</span>
                            <span>En Yüksek</span>
                          </button>
                          <button
                            onClick={() => setRoundWinner("Lowest")}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                              roundWinner === "Lowest"
                                ? "text-white"
                                : "text-gray-800 dark:text-gray-300"
                            }`}
                            style={
                              roundWinner === "Lowest"
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
                  {calculationMode === "Points" && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        Tur İçi Puan Sayısı:
                      </h2>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPointsPerRound("Single")}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            pointsPerRound === "Single"
                              ? "text-white"
                              : "text-gray-800 dark:text-gray-300"
                          }`}
                          style={
                            pointsPerRound === "Single"
                              ? { backgroundColor: "#365376" }
                              : {}
                          }
                        >
                          Tek
                        </button>
                        <button
                          onClick={() => setPointsPerRound("Multiple")}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            pointsPerRound === "Multiple"
                              ? "text-white"
                              : "text-gray-800 dark:text-gray-300"
                          }`}
                          style={
                            pointsPerRound === "Multiple"
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
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      Toplam Sütununu Gizle:
                    </h2>
                    <button
                      onClick={() => setHideTotalColumn(!hideTotalColumn)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        hideTotalColumn
                          ? "border-gray-300 dark:border-gray-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={
                        hideTotalColumn ? { backgroundColor: "#365376" } : {}
                      }
                    >
                      {hideTotalColumn && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "kurallar" && (
            <div className="space-y-6">
              {/* PDF Upload Section */}
              <PdfUpload
                gameId={gameId}
                currentPdfId={rulesPdfId}
                onUploadComplete={handlePdfUploadComplete}
                onDelete={handlePdfDelete}
              />

              {/* PDF Preview Section */}
              {rulesPdfId && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    PDF Önizleme
                  </h3>
                  <PdfViewer
                    pdfId={rulesPdfId}
                    fileName={`${gameName} - Kurallar.pdf`}
                  />
                </div>
              )}

              {/* Text Rules Section */}
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Metin Kuralları
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    PDF yüklediyseniz, bu kurallar PDF ile birlikte
                    görüntülenecek. PDF yoksa sadece bu kurallar gösterilir.
                  </p>
                </div>

                {/* Inner Tabs for Rules Mode */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                    <button
                      onClick={() => setRulesMode("text")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        rulesMode === "text"
                          ? "bg-white dark:bg-[var(--card-background)] text-gray-900 dark:text-gray-200 shadow-sm"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      Metin Modu
                    </button>
                    <button
                      onClick={() => setRulesMode("json")}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        rulesMode === "json"
                          ? "bg-white dark:bg-[var(--card-background)] text-gray-900 dark:text-gray-200 shadow-sm"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      JSON Modu
                    </button>
                  </div>
                </div>

                {/* Rules Content based on Mode */}
                {rulesMode === "text" ? (
                  <div className="space-y-4">
                    {rulesSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="border border-gray-200 dark:border-[var(--card-border)] rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                            Bölüm {index + 1}
                          </h4>
                          <button
                            onClick={() => removeRulesSection(section.id)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                          >
                            <X size={16} weight="regular" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Bölüm Başlığı
                            </label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) =>
                                updateRulesSection(
                                  section.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 bg-white dark:bg-[var(--card-background)]"
                              placeholder="Örn: TAKIMLARIN OTURMA DÜZENİ"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Bölüm İçeriği
                            </label>
                            <RichTextEditor
                              content={section.content}
                              onChange={(content: string) =>
                                updateRulesSection(
                                  section.id,
                                  "content",
                                  content,
                                )
                              }
                              placeholder="Bu bölümün kurallarını yazın..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {rulesSections.length === 0 && (
                      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                        <p>Henüz kural bölümü eklenmemiş</p>
                        <p className="text-sm">
                          Aşağıdaki "Bölüm Ekle" butonuna tıklayarak başlayın
                        </p>
                      </div>
                    )}

                    {/* Add Section Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={addRulesSection}
                        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        <Plus size={16} weight="regular" />
                        <span>Bölüm Ekle</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        JSON Kurallar
                      </label>
                      <textarea
                        value={gameRules}
                        onChange={(e) => setGameRules(e.target.value)}
                        className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200 font-mono text-sm bg-white dark:bg-[var(--card-background)]"
                        placeholder='[{"id":"1","title":"Bölüm Başlığı","content":"<p>Bölüm içeriği...</p>"}]'
                      />
                    </div>

                    <div className="flex justify-center">
                      <button
                        onClick={validateAndSaveJson}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        JSON'u Doğrula ve Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "listeler" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Oyun Listeleri
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Bu oyunu hangi listelerde göstermek istediğinizi seçin.
              </p>

              {gameLists === undefined ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                  <p className="text-gray-600">Listeler yükleniyor...</p>
                </div>
              ) : gameLists.length === 0 ? (
                <div className="text-center py-8">
                  <ListBullets
                    size={48}
                    className="text-gray-400 mx-auto mb-4"
                  />
                  <p className="text-gray-600 dark:text-gray-400">
                    Henüz liste oluşturulmamış
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    <a
                      href="/admin/lists"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Liste oluşturmak için tıklayın
                    </a>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(gameLists as any[]).map((list: any) => (
                    <div
                      key={list._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedLists.includes(list._id)
                          ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                          : "border-gray-200 dark:border-[var(--card-border)] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      onClick={() => {
                        setSelectedLists((prev) =>
                          prev.includes(list._id)
                            ? prev.filter((id) => id !== list._id)
                            : [...prev, list._id],
                        );
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {selectedLists.includes(list._id) ? (
                            <div className="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {list.emoji && (
                              <span className="text-lg">{list.emoji}</span>
                            )}
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                              {list.name}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {list.gameIds.length} oyun
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditGamePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <EditGameContent />
    </Suspense>
  );
}
