"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  CheckCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";

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
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlayers, setSelectedPlayers] = useState("all");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lang, setLang] = useState<"tr" | "en">("tr");

  const t = translations[lang];

  const fetchGames = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const resp = await client.iskambil.getGames(user.id);
      // Backend Game interface might have name_tr, rules_tr etc.
      // We map the response games directly into our Game state
      setGames(resp.games || []);
    } catch (err) {
      console.error("Failed to load games:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      fetchGames();
    }
  }, [isUserLoaded, user?.id]);

  // Kategoriler
  const categories = useMemo(() => {
    const list = new Set(games.map(g => lang === "tr" ? g.category_tr : g.category_en));
    return [
      { id: "all", label: t.all },
      { id: "favorites", label: t.myFavorites },
      { id: "known", label: t.knownGames },
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
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, is_favorite: resp.isFavorite } : null);
        }
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
        if (selectedGame?.id === gameId) {
          setSelectedGame(prev => prev ? { ...prev, is_known: resp.isKnown } : null);
        }
      }
    } catch (err) {
      console.error("Known toggle error:", err);
    }
  };

  const handleOpenDetail = (game: Game) => {
    setSelectedGame(game);
    setNoteText(game.user_note || "");
  };

  const handleSaveNote = async () => {
    if (!user?.id || !selectedGame) return;
    try {
      setIsSavingNote(true);
      const resp = await client.iskambil.saveNote({
        gameId: selectedGame.id,
        userId: user.id,
        note: noteText
      });
      if (resp.success) {
        setGames(prev => prev.map(g =>
          g.id === selectedGame.id ? { ...g, user_note: resp.note } : g
        ));
        setSelectedGame(prev => prev ? { ...prev, user_note: resp.note } : null);
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!isUserLoaded || (isLoading && games.length === 0)) {
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
      <header className="sticky top-0 z-40 bg-[#ffffff] border-b border-[#e2dec5]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f2e9] hover:bg-[#eae6df] border border-[#e2dcc8] text-[#0c3122] transition-all active:scale-95 cursor-pointer"
              title={t.back}
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-[#0c3122]">
                <Cards size={24} weight="fill" className="text-[#0c3122] animate-pulse inline-block" />
                {t.archiveTitle}
              </h1>
              <p className="text-[9px] text-emerald-400/80 font-black uppercase tracking-[0.2em] mt-1">{t.archiveSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block w-72">
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#e2dec5] rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-[#fbf9f3] transition-all text-slate-800 placeholder-slate-400"
              />
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>

            {/* Language Switcher Toggle */}
            <div className="flex bg-[#f5f2e9] border border-[#e2dcc8] rounded-xl p-0.5 relative">
              <button
                onClick={() => setLang("tr")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  lang === "tr"
                    ? "bg-[#0c3122] text-white shadow-sm"
                    : "text-[#0c3122] hover:bg-[#eae6df]"
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-[#0c3122] text-white shadow-sm"
                    : "text-[#0c3122] hover:bg-[#eae6df]"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 relative z-10">

        {/* Mobile Search */}
        <div className="relative md:hidden w-full">
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
                  {cat.id === "favorites" ? (
                    <span className="flex items-center gap-1">
                      <Heart size={14} weight="fill" className={selectedCategory === cat.id ? "text-amber-400" : "text-red-600"} />
                      {cat.label}
                    </span>
                  ) : cat.id === "known" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} weight="fill" className={selectedCategory === cat.id ? "text-emerald-300" : "text-emerald-600"} />
                      {cat.label}
                    </span>
                  ) : cat.label}
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
                          onClick={() => handleOpenDetail(game)}
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

      {/* Rules Details & Notes Modal */}
      <AnimatePresence>
        {selectedGame && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGame(null)}
              className="fixed inset-0 bg-[#0c3122] z-50 cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[95%] md:max-w-5xl max-h-[90vh] bg-[#fdfcf7] border border-[#e2dec5] rounded-3xl shadow-2xl z-50 overflow-y-auto text-[#1a2d22] scrollbar-thin scrollbar-track-[#f4f1ea] scrollbar-thumb-[#e2dec5]"
            >
              <div className="p-6 md:p-8 space-y-6">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start border-b border-[#e2dec5] pb-4">
                  <div>
                    <span className="text-[10px] font-black text-white bg-[#0c3122] px-3 py-1 rounded-full tracking-widest">
                      {(lang === "tr" ? selectedGame.category_tr : selectedGame.category_en).toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
                    </span>
                    <h2 className="text-2xl font-black text-[#0c3122] tracking-tight mt-2 flex items-center gap-3">
                      {(lang === "tr" ? selectedGame.name_tr : selectedGame.name_en).toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
                      {selectedGame.original_name && selectedGame.original_name.toLowerCase() !== (lang === "tr" ? selectedGame.name_tr : selectedGame.name_en).toLowerCase() && (
                        <span className="text-sm font-semibold text-slate-400 normal-case font-sans">
                          ({selectedGame.original_name})
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleToggleKnown(selectedGame.id, e)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title={t.known}
                        >
                          <CheckCircle size={20} weight={selectedGame.is_known ? "fill" : "bold"} className={selectedGame.is_known ? "text-emerald-600" : ""} />
                        </button>
                        <button
                          onClick={(e) => handleToggleFavorite(selectedGame.id, e)}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={t.favorite}
                        >
                          <Heart size={20} weight={selectedGame.is_favorite ? "fill" : "bold"} className={selectedGame.is_favorite ? "text-red-500" : ""} />
                        </button>
                      </div>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedGame(null)} 
                    className="w-10 h-10 flex items-center justify-center bg-[#f5f2e9] hover:bg-[#eae6df] border border-[#e2dcc8] rounded-xl text-[#0c3122] transition-all cursor-pointer active:scale-95"
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>

                 {/* Tabular Layout / Scrollable Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Rules Column */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xs font-black uppercase text-[#0c3122] tracking-[0.2em]">
                      {t.rulesHeader}
                    </h3>
                    
                    <div className="bg-[#ffffff] border border-[#e2dec5] rounded-3xl p-6 max-h-[580px] overflow-y-auto space-y-4 font-sans text-base text-slate-700 leading-relaxed shadow-sm scrollbar-thin scrollbar-thumb-[#e2dec5]">
                      {(lang === "tr" ? selectedGame.rules_tr : selectedGame.rules_en).length > 0 ? (
                        <ol className="space-y-4 list-decimal list-inside">
                          {(lang === "tr" ? selectedGame.rules_tr : selectedGame.rules_en).map((rule, idx) => (
                            <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-2 border-b border-[#f4f1ea] last:border-0 pl-1">
                              <span className="inline-block md:inline leading-loose text-slate-700">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="text-center text-slate-400 py-8 flex flex-col items-center gap-2">
                          <XCircle size={32} className="opacity-55" />
                          <span>{t.noRules}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Tags & Notes Column (Right) */}
                  <div className="md:col-span-1 space-y-6 flex flex-col pt-8">
                    
                    {/* Game Quick Info Tags */}
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.playerCapacity}</span>
                        <span className="text-xs font-bold text-[#0c3122] flex items-center gap-2">
                          <Users size={14} className="text-[#0c3122]/70" />
                          {selectedGame.min_players === selectedGame.max_players 
                            ? `${selectedGame.min_players} ${t.players}` 
                            : `${selectedGame.min_players}-${selectedGame.max_players} ${t.players}`}
                        </span>
                      </div>
                      <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.deckRequirement}</span>
                        <span className="text-xs font-bold text-[#0c3122] flex items-center gap-2">
                          <Cards size={14} className="text-[#0c3122]/70" />
                          {lang === "tr" ? selectedGame.deck_count_tr : selectedGame.deck_count_en}
                        </span>
                      </div>
                      <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.gameType}</span>
                        <span className="text-xs font-bold text-[#0c3122] flex items-center gap-2">
                          <Tag size={14} className="text-[#0c3122]/70" />
                          {lang === "tr" ? selectedGame.category_tr : selectedGame.category_en}
                        </span>
                      </div>
                    </div>

                    {/* Notes Area */}
                    <div className="space-y-3 flex-1 flex flex-col">
                      <h3 className="text-xs font-black uppercase text-[#0c3122] tracking-[0.2em] flex items-center gap-2">
                        <Note size={18} />
                        {t.personalNotes}
                      </h3>
                      
                      <div className="bg-[#ffffff] border border-[#e2dec5] rounded-3xl p-5 flex flex-col gap-4 flex-1 shadow-sm">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={t.notesPlaceholder}
                          className="w-full bg-[#fdfcf7] border border-[#e2dec5] rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-none min-h-[160px] flex-1"
                        />
                        
                        <button
                          onClick={handleSaveNote}
                          disabled={isSavingNote}
                          className="w-full bg-[#0c3122] hover:bg-[#12422f] text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50"
                        >
                          <FloppyDisk size={16} />
                          <span>{isSavingNote ? t.saving : t.save}</span>
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
