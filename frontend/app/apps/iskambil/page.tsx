"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlass,
  Heart,
  Users,
  Cards,
  Note,
  ClipboardText,
  Tag,
  Star,
  FloppyDisk,
  X,
  XCircle,
  Hash,
  Play,
  CheckCircle,
  ArrowLeft
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react"; 
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import IskambilAppBar from "./components/IskambilAppBar";
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
    rulesHeader: "Oynanış ve Kurallar"
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
    rulesHeader: "How to Play & Rules"
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
    // Giriş yoksa da oyun listesini göster (favori/not DB'si boş kalır)
    const userId = user?.id ?? "guest";
    fetchGames(userId);
  }, [isUserLoaded, user?.id]);

  // Kategoriler
  const categories = useMemo(() => {
    const list = new Set(games.map(g => lang === "tr" ? g.category_tr : g.category_en));
    return [
      { id: "all", label: t.all },
      ...Array.from(list).map(cat => ({ id: cat, label: cat }))
    ];
  }, [games, lang, t]);

  // Oyuncu Sayısı Seçenekleri
  const playerOptions = [
    { id: "all", label: t.all },
    { id: "1", label: t.onePlayer },
    { id: "2", label: t.twoPlayers },
    { id: "3-4", label: t.threeFourPlayers },
    { id: "5+", label: t.fivePlusPlayers }
  ];

  // Alfabetik olarak sıralanmış oyunlar
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const nameA = lang === "tr" ? a.name_tr : a.name_en;
      const nameB = lang === "tr" ? b.name_tr : b.name_en;
      return nameA.localeCompare(nameB, lang);
    });
  }, [games, lang]);

  // Filtrelenmiş Oyunlar
  const filteredGames = useMemo(() => {
    return sortedGames.filter(game => {
      // Arama filtresi
      const name = lang === "tr" ? game.name_tr : game.name_en;
      const desc = lang === "tr" ? game.description_tr : game.description_en;
      const rules = lang === "tr" ? game.rules_tr : game.rules_en;
      
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.original_name && game.original_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        rules.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

      // Kategori filtresi
      let matchesCategory = true;
      if (selectedCategory === "favorites") {
        matchesCategory = game.is_favorite;
      } else if (selectedCategory === "known") {
        matchesCategory = game.is_known;
      } else if (selectedCategory !== "all") {
        const catValue = lang === "tr" ? game.category_tr : game.category_en;
        matchesCategory = catValue === selectedCategory;
      }

      // Oyuncu sayısı filtresi
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

  // Kategorilere göre gruplanmış oyunlar
  const groupedGames = useMemo(() => {
    const groups: { [key: string]: Game[] } = {};
    filteredGames.forEach(game => {
      const cat = lang === "tr" ? game.category_tr : game.category_en;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(game);
    });
    
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as { [key: string]: Game[] });
  }, [filteredGames, lang]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] text-[#0c3122]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-[#0c3122] rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-[#0c3122]">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea] text-[#1a2d22] font-sans selection:bg-[#0c3122] selection:text-white overflow-x-hidden">

      {/* Header */}
      <IskambilAppBar activeTab="discover" />

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-28 pb-8 flex flex-col gap-6 relative z-10">

        {/* Unified Search */}
        <div className="relative w-full">
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#ffffff] border border-[#e2dec5] rounded-xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-[#fbf9f3] transition-all text-slate-800 placeholder-slate-400"
          />
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        </div>

        {/* Filters Panel */}
        <section className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
          {/* Categories Tab */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-[#0c3122]/70 tracking-widest px-1">{t.categories}</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? "bg-[#0c3122] text-white border-[#0c3122] shadow-sm"
                      : "bg-[#f5f2e9] text-[#0c3122] border border-[#e2dcc8] hover:bg-[#eae6df] hover:text-[#0c3122]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Player Count Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-[#0c3122]/70 tracking-widest px-1">{t.playerCount}</span>
            <div className="flex flex-wrap gap-2">
              {playerOptions.map((playOpt) => (
                <button
                  key={playOpt.id}
                  onClick={() => setSelectedPlayers(playOpt.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedPlayers === playOpt.id
                      ? "bg-[#0c3122] text-white border-[#0c3122]"
                      : "bg-[#f5f2e9] text-[#0c3122] border border-[#e2dcc8] hover:bg-[#eae6df]"
                  }`}
                >
                  {playOpt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results Info */}
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            {filteredGames.length} {t.gamesListed}
          </span>
        </div>

        {/* Grouped Games Sections */}
        <div className="space-y-12">
          {filteredGames.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#e2dec5] rounded-2xl">
              <p className="text-sm font-bold text-slate-500">{t.searchNoResult}</p>
            </div>
          ) : (
            Object.entries(groupedGames).map(([category, gamesInCat]) => (
              <div key={category} className="space-y-4">
                {/* Category Header separator */}
                <div className="flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#0c3122] rounded-full" />
                  <h2 className="text-sm font-black text-[#0c3122] tracking-[0.2em]">
                    {category.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    ({gamesInCat.length} {lang === "tr" ? "OYUN" : "GAMES"})
                  </span>
                  <div className="h-px bg-slate-200 flex-1 ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {gamesInCat.map((game) => {
                      const gameName = lang === "tr" ? game.name_tr : game.name_en;
                      const gameCategory = lang === "tr" ? game.category_tr : game.category_en;
                      const gameRules = lang === "tr" ? game.rules_tr : game.rules_en;
                      const deckCount = lang === "tr" ? game.deck_count_tr : game.deck_count_en;
                      
                      return (
                        <motion.div
                          key={game.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => router.push(`/apps/iskambil/${game.id}`)}
                          className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-6 relative flex flex-col min-h-[220px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden text-[#1a2d22]"
                        >
                          {/* Decorative suit symbol inside background of card */}
                          <div className="absolute -bottom-10 -right-10 text-[10rem] font-serif opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500 pointer-events-none select-none text-[#0c3122]">
                            {game.category_tr === "Tek Kişilik" && "♠"}
                            {game.category_tr === "Kozlu / Löf" && "♣"}
                            {game.category_tr === "Casino / Bahis" && "♦"}
                            {game.category_tr === "Rumi / Okey" && "♥"}
                            {!["Tek Kişilik", "Kozlu / Löf", "Casino / Bahis", "Rumi / Okey"].includes(game.category_tr) && "♠"}
                          </div>

                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black text-white bg-[#0c3122] px-3 py-1 rounded-full tracking-widest">
                              {gameCategory.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => handleToggleKnown(game.id, e)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f5f2e9] hover:bg-[#eae6df] border border-[#e2dcc8] text-slate-500 hover:text-emerald-700 transition-all active:scale-90 cursor-pointer"
                                title={t.known}
                              >
                                <CheckCircle size={16} weight={game.is_known ? "fill" : "bold"} className={game.is_known ? "text-emerald-600" : ""} />
                              </button>

                              <button
                                onClick={(e) => handleToggleFavorite(game.id, e)}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#f5f2e9] hover:bg-[#eae6df] border border-[#e2dcc8] text-slate-500 hover:text-red-500 transition-all active:scale-90 cursor-pointer"
                                title={t.favorite}
                              >
                                <Heart size={16} weight={game.is_favorite ? "fill" : "bold"} className={game.is_favorite ? "text-red-500" : ""} />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-lg font-black text-[#0c3122] tracking-tight transition-colors duration-300">
                            {gameName.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
                          </h3>

                          <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                            {gameRules.length > 0 ? gameRules[0] : t.noRules}
                          </p>

                          {/* Footer statistics */}
                          <div className="flex gap-4 border-t border-[#f0ede4] pt-4 mt-auto">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500">
                              <Users size={14} className="text-[#0c3122]/60" />
                              <span>
                                {game.min_players === game.max_players 
                                  ? `${game.min_players} ${t.players}` 
                                  : `${game.min_players}-${game.max_players} ${t.players}`}
                              </span>
                            </div>
                            {deckCount !== "1 Deste" && deckCount !== "1" && deckCount !== "1 Deck" && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-500">
                                <Cards size={14} className="text-[#0c3122]/60" />
                                <span>{deckCount}</span>
                              </div>
                            )}
                            {game.is_known && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 ml-auto">
                                <CheckCircle size={14} weight="fill" />
                                <span>{t.known}</span>
                              </div>
                            )}
                            {game.user_note && (
                              <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 ${!game.is_known ? "ml-auto" : ""}`}>
                                <Note size={14} weight="fill" />
                                <span>{t.noted}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>

      </main>



    </div>
  );
}
