"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import IskambilShell from "./components/IskambilShell";
import GameListItem from "./components/GameListItem";
import { DiscoverPageSkeleton } from "./components/GameListSkeleton";
import { GAMES_DATA } from "./games-registry";

const client = createBrowserClient();

interface Game {
  id: string;
  name_tr: string;
  name_en: string;
  original_name: string | null;
  description_tr: string;
  description_en: string;
  rules_tr: string[];
  rules_en: string[];
  min_players: number;
  max_players: number;
  deck_count_tr: string;
  deck_count_en: string;
  category_tr: string;
  category_en: string;
  is_favorite: boolean;
  is_known: boolean;
  user_note: string | null;
  quick_rules_tr: string[] | null;
  quick_rules_en: string[] | null;
  setup_tr: string[] | null;
  setup_en: string[] | null;
  objective_tr: string | null;
  objective_en: string | null;
  gameplay_tr: string[] | null;
  gameplay_en: string[] | null;
  scoring_tr: string[] | null;
  scoring_en: string[] | null;
  ending_tr: string[] | null;
  ending_en: string[] | null;
  notes_tr: string[] | null;
  notes_en: string[] | null;
}

const translations = {
  tr: {
    loading: "Yükleniyor...",
    searchPlaceholder: "Oyun adı veya kural ara...",
    categories: "KATEGORİLER",
    playerCount: "OYUNCU SAYISI",
    gamesListed: "OYUN LİSTELENİYOR",
    noRules: "Bu oyun için henüz bir kural girişi bulunmuyor.",
    playerCapacity: "Oyuncu Kapasitesi",
    deckRequirement: "Deste Gereksinimi",
    gameType: "Oyun Türü",
    personalNotes: "KİŞİSEL NOTLAR & EV KURALLARI",
    notesPlaceholder: "Evde oynadığınız özel varyasyonları veya hatırlamak istediğiniz notları yazın...",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    all: "Tümü",
    myFavorites: "Favorilerim",
    knownGames: "Bildiğim Oyunlar",
    players: "Oyuncu",
    known: "Biliyorum",
    favorite: "Favori",
    noted: "Notlu",
    archiveTitle: "İskambil Rehberi",
    archiveSubtitle: "Popüler Kart Oyunları Arşivi",
    onePlayer: "1 Oyuncu",
    twoPlayers: "2 Oyuncu",
    threeFourPlayers: "3-4 Oyuncu",
    fivePlusPlayers: "5+ Oyuncu",
    searchNoResult: "Aramanızla eşleşen oyun bulunamadı.",
    back: "Geri",
    rulesHeader: "Oynanış ve Kurallar",
    popularGames: "Popüler Oyunlar",
    discoverGames: "Yeni Oyunlar Keşfet"
  },
  en: {
    loading: "Loading...",
    searchPlaceholder: "Search game name or rules...",
    categories: "CATEGORIES",
    playerCount: "PLAYER COUNT",
    gamesListed: "GAMES LISTED",
    noRules: "No rules entries found for this game yet.",
    playerCapacity: "Player Capacity",
    deckRequirement: "Deck Requirement",
    gameType: "Game Type",
    personalNotes: "PERSONAL NOTES & HOUSE RULES",
    notesPlaceholder: "Write down special house rules or notes you want to remember...",
    save: "Save",
    saving: "Saving...",
    all: "All",
    myFavorites: "My Favorites",
    knownGames: "Known Games",
    players: "Players",
    known: "I Know It",
    favorite: "Favorite",
    noted: "Has Note",
    archiveTitle: "Card Games Guide",
    archiveSubtitle: "Popular Card Games Archive",
    onePlayer: "1 Player",
    twoPlayers: "2 Players",
    threeFourPlayers: "3-4 Players",
    fivePlusPlayers: "5+ Players",
    searchNoResult: "No games found matching your search.",
    back: "Back",
    rulesHeader: "How to Play & Rules",
    popularGames: "Popular Games",
    discoverGames: "Explore New Games"
  }
};

export default function IskambilRehberi() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlayers, setSelectedPlayers] = useState("all");

  const t = translations[lang];

  const fetchGames = async (userId: string) => {
    try {
      setIsLoading(true);
      const resp = await client.iskambil.getGames(userId);

      const dbStateMap = new Map((resp.games || []).map(g => [g.id, g]));

      const merged = GAMES_DATA.map((g) => {
        const dbState = dbStateMap.get(g.id);
        return {
          id: g.id,
          name_tr: g.name_tr,
          name_en: g.name_en,
          original_name: g.originalName || null,
          description_tr: g.description_tr,
          description_en: g.description_en,
          rules_tr: g.rules_tr || g.quickRules_tr || [],
          rules_en: g.rules_en || g.quickRules_en || [],
          min_players: g.minPlayers,
          max_players: g.maxPlayers,
          deck_count_tr: g.deckCount_tr,
          deck_count_en: g.deckCount_en,
          category_tr: g.category_tr,
          category_en: g.category_en,
          is_favorite: dbState ? dbState.is_favorite : false,
          is_known: dbState ? dbState.is_known : false,
          user_note: dbState ? dbState.user_note : null,
          quick_rules_tr: g.quickRules_tr || null,
          quick_rules_en: g.quickRules_en || null,
          setup_tr: g.setup_tr || null,
          setup_en: g.setup_en || null,
          objective_tr: g.objective_tr || null,
          objective_en: g.objective_en || null,
          gameplay_tr: g.gameplay_tr || null,
          gameplay_en: g.gameplay_en || null,
          scoring_tr: g.scoring_tr || null,
          scoring_en: g.scoring_en || null,
          ending_tr: g.ending_tr || null,
          ending_en: g.ending_en || null,
          notes_tr: g.notes_tr || null,
          notes_en: g.notes_en || null,
        };
      });

      setGames(merged);
    } catch (err) {
      console.error("Failed to load games:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded) return;
    const userId = user?.id ?? "guest";
    fetchGames(userId);
  }, [isUserLoaded, user?.id]);

  const playerOptions = [
    { id: "all", label: t.all },
    { id: "1", label: t.onePlayer },
    { id: "2", label: t.twoPlayers },
    { id: "3-4", label: t.threeFourPlayers },
    { id: "5+", label: t.fivePlusPlayers }
  ];

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const catA = lang === "tr" ? a.category_tr : a.category_en;
      const catB = lang === "tr" ? b.category_tr : b.category_en;
      const catCompare = catA.localeCompare(catB, lang);
      if (catCompare !== 0) return catCompare;

      const nameA = lang === "tr" ? a.name_tr : a.name_en;
      const nameB = lang === "tr" ? b.name_tr : b.name_en;
      return nameA.localeCompare(nameB, lang);
    });
  }, [games, lang]);

  const filteredGames = useMemo(() => {
    return sortedGames.filter(game => {
      if (game.category_tr === "Casino / Bahis" || game.category_en === "Casino / Betting") {
        return false;
      }

      const name = lang === "tr" ? game.name_tr : game.name_en;
      const desc = lang === "tr" ? game.description_tr : game.description_en;
      const rules = lang === "tr" ? game.rules_tr : game.rules_en;

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.original_name && game.original_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      if (selectedCategory === "favorites") {
        matchesCategory = game.is_favorite;
      } else if (selectedCategory === "known") {
        matchesCategory = game.is_known;
      } else if (selectedCategory !== "all") {
        const catValue = lang === "tr" ? game.category_tr : game.category_en;
        matchesCategory = catValue === selectedCategory;
      }

      let matchesPlayers = true;
      if (selectedPlayers === "1") {
        matchesPlayers = game.min_players === 1;
      } else if (selectedPlayers === "2") {
        matchesPlayers = game.min_players <= 2 && game.max_players >= 2;
      } else if (selectedPlayers === "3-4") {
        matchesPlayers = (game.min_players <= 4 && game.max_players >= 3);
      } else if (selectedPlayers === "5+") {
        matchesPlayers = game.max_players >= 5;
      }

      return matchesSearch && matchesCategory && matchesPlayers;
    });
  }, [sortedGames, searchQuery, selectedCategory, selectedPlayers, lang]);

  const POPULAR_GAME_IDS = [
    "batak-spades",
    "esli-batak",
    "gommeli-batak",
    "pisti",
    "pis-yedili",
    "51",
    "blof",
    "papaz-kacti"
  ];

  const { popularGames, otherGames } = useMemo(() => {
    const popular: Game[] = [];
    const others: Game[] = [];
    for (const game of filteredGames) {
      if (POPULAR_GAME_IDS.includes(game.id)) {
        popular.push(game);
      } else {
        others.push(game);
      }
    }
    return { popularGames: popular, otherGames: others };
  }, [filteredGames]);

  const handleToggleFavorite = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      const resp = await client.iskambil.toggleFavorite({
        gameId,
        userId: user.id
      });
      if (resp.success) {
        setGames(prev => prev.map(g =>
          g.id === gameId ? { ...g, is_favorite: resp.isFavorite } : g
        ));
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handleToggleKnown = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      const resp = await client.iskambil.toggleKnown({
        gameId,
        userId: user.id
      });
      if (resp.success) {
        setGames(prev => prev.map(g =>
          g.id === gameId ? { ...g, is_known: resp.isKnown } : g
        ));
      }
    } catch (err) {
      console.error("Known toggle error:", err);
    }
  };

  if (!isUserLoaded || isLoading) {
    return (
      <IskambilShell activeTab="discover">
        <DiscoverPageSkeleton />
      </IskambilShell>
    );
  }

  return (
    <IskambilShell activeTab="discover">
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:border-app-muted transition-all text-app-text placeholder-app-muted shadow-sm"
          />
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
        </div>

        <section className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-app-muted tracking-widest px-1 uppercase">
            {t.playerCount}
          </span>
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track overflow-x-auto max-w-full">
            {playerOptions.map((playOpt) => (
              <button
                key={playOpt.id}
                type="button"
                onClick={() => setSelectedPlayers(playOpt.id)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
                  selectedPlayers === playOpt.id
                    ? "bg-app-tab-active text-app-text shadow-sm"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                {playOpt.label}
              </button>
            ))}
          </div>
        </section>

        {filteredGames.length === 0 ? (
          <div className="text-center py-12 bg-app-surface border border-app-border rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-app-muted">{t.searchNoResult}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {popularGames.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[9px] font-black text-app-muted tracking-widest px-1 uppercase">
                  {t.popularGames}
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {popularGames.map((game) => {
                      const gameName = lang === "tr" ? game.name_tr : game.name_en;
                      const gameCategory = lang === "tr" ? game.category_tr : game.category_en;
                      const gameRules = lang === "tr" ? game.rules_tr : game.rules_en;
                      const deckCount = lang === "tr" ? game.deck_count_tr : game.deck_count_en;

                      return (
                        <motion.div
                          key={game.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <GameListItem
                            game={{
                              id: game.id,
                              name: gameName,
                              category: gameCategory,
                              description: gameRules[0] || "",
                              minPlayers: game.min_players,
                              maxPlayers: game.max_players,
                              deckCount,
                              isFavorite: game.is_favorite,
                              isKnown: game.is_known,
                              hasNote: !!game.user_note,
                            }}
                            labels={{
                              noRules: t.noRules,
                              players: t.players,
                              known: t.known,
                              noted: t.noted,
                              favorite: t.favorite,
                            }}
                            onOpen={() => router.push(`/apps/iskambil/${game.id}`)}
                            onToggleFavorite={(e) => handleToggleFavorite(game.id, e)}
                            onToggleKnown={(e) => handleToggleKnown(game.id, e)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {otherGames.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[9px] font-black text-app-muted tracking-widest px-1 uppercase">
                  {t.discoverGames}
                </h3>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {otherGames.map((game) => {
                      const gameName = lang === "tr" ? game.name_tr : game.name_en;
                      const gameCategory = lang === "tr" ? game.category_tr : game.category_en;
                      const gameRules = lang === "tr" ? game.rules_tr : game.rules_en;
                      const deckCount = lang === "tr" ? game.deck_count_tr : game.deck_count_en;

                      return (
                        <motion.div
                          key={game.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <GameListItem
                            game={{
                              id: game.id,
                              name: gameName,
                              category: gameCategory,
                              description: gameRules[0] || "",
                              minPlayers: game.min_players,
                              maxPlayers: game.max_players,
                              deckCount,
                              isFavorite: game.is_favorite,
                              isKnown: game.is_known,
                              hasNote: !!game.user_note,
                            }}
                            labels={{
                              noRules: t.noRules,
                              players: t.players,
                              known: t.known,
                              noted: t.noted,
                              favorite: t.favorite,
                            }}
                            onOpen={() => router.push(`/apps/iskambil/${game.id}`)}
                            onToggleFavorite={(e) => handleToggleFavorite(game.id, e)}
                            onToggleKnown={(e) => handleToggleKnown(game.id, e)}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </IskambilShell>
  );
}
