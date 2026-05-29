"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Heart,
  Users,
  Cards,
  Note,
  CheckCircle,
  Play,
  ArrowRight,
  Sparkle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react"; 
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import IskambilAppBar from "../components/IskambilAppBar";

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
    noRules: "Bu oyun için henüz bir kural girişi bulunmuyor.",
    favoritesTitle: "Favori Oyunlarım",
    favoritesSubtitle: "En çok sevdiğin, elinden düşürmediğin kart oyunları",
    knownTitle: "Bildiğim Oyunlar",
    knownSubtitle: "Kurallarına hakim olduğun ve oynayabildiğin oyunlar",
    emptyState: "Burası Henüz Boş!",
    emptySubtitle: "Henüz hiçbir oyunu favorilerine eklemedin veya bildiğini işaretlemedin. Keşfet sekmesinden oyun aramaya başla!",
    discoverButton: "Oyunları Keşfet",
    players: "Oyuncu",
    known: "Biliyorum",
    favorite: "Favori",
    noted: "Notlu"
  },
  en: {
    loading: "Loading...",
    noRules: "No rules entries found for this game yet.",
    favoritesTitle: "My Favorites",
    favoritesSubtitle: "Your most loved and frequently played card games",
    knownTitle: "Known Games",
    knownSubtitle: "Card games whose rules you have fully mastered",
    emptyState: "Nothing Here Yet!",
    emptySubtitle: "You haven't favorited or marked any card games as known yet. Start exploring the collection!",
    discoverButton: "Explore Games",
    players: "Players",
    known: "I Know It",
    favorite: "Favorite",
    noted: "Has Note"
  }
};

export default function ForYouPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = translations[lang];

  const fetchGames = async (userId: string) => {
    try {
      setIsLoading(true);
      const resp = await client.iskambil.getGames(userId);
      setGames(resp.games || []);
    } catch (err) {
      console.error("Failed to load games for For You page:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded) return;
    const userId = user?.id ?? "guest";
    fetchGames(userId);
  }, [isUserLoaded, user?.id]);

  const favoriteGames = useMemo(() => {
    return games.filter(g => g.is_favorite);
  }, [games]);

  const knownGames = useMemo(() => {
    return games.filter(g => g.is_known);
  }, [games]);

  const hasAnyData = favoriteGames.length > 0 || knownGames.length > 0;

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

  const renderGameCard = (game: Game) => {
    const gameName = lang === "tr" ? game.name_tr : game.name_en;
    const gameCategory = lang === "tr" ? game.category_tr : game.category_en;
    const gameRules = lang === "tr" ? game.rules_tr : game.rules_en;
    const deckCount = lang === "tr" ? game.deck_count_tr : game.deck_count_en;

    return (
      <motion.div
        key={game.id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={() => router.push(`/apps/iskambil/game?gameId=${game.id}`)}
        className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-6 relative flex flex-col min-h-[220px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden text-[#1a2d22]"
      >
        <div className="absolute -bottom-10 -right-10 text-[10rem] font-serif opacity-[0.03] pointer-events-none select-none text-[#0c3122]">
          {game.category_tr === "Tek Kişilik" && "♠"}
          {game.category_tr === "Kozlu / Löf" && "♣"}
          {game.category_tr === "Casino / Bahis" && "♦"}
          {game.category_tr === "Rumi / Okey" && "♥"}
          {!["Tek Kişilik", "Kozlu / Löf", "Casino / Bahis", "Rumi / Okey"].includes(game.category_tr) && "♠"}
        </div>

        <div className="flex justify-between items-start mb-4">
          <span className="text-[10px] font-black text-white bg-[#0c3122] px-3 py-1 rounded-full tracking-widest uppercase">
            {gameCategory}
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

        <h3 className="text-lg font-black text-[#0c3122] tracking-tight uppercase">
          {gameName}
        </h3>

        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
          {gameRules.length > 0 ? gameRules[0] : t.noRules}
        </p>

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
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea] text-[#1a2d22] font-sans selection:bg-[#0c3122] selection:text-white overflow-x-hidden">
      
      {/* Shared AppBar */}
      <IskambilAppBar activeTab="foryou" />

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-28 pb-8 flex flex-col gap-10 relative z-10">
        
        <AnimatePresence mode="wait">
          {!hasAnyData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20 px-6 bg-white border border-[#e2dec5] rounded-3xl shadow-sm flex flex-col items-center max-w-2xl mx-auto mt-8"
            >
              <div className="w-16 h-16 rounded-full bg-[#fdfcf7] border border-[#e2dec5] flex items-center justify-center text-[#0c3122] mb-6 shadow-inner">
                <Sparkle size={32} weight="fill" className="animate-pulse text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-[#0c3122] tracking-tight uppercase mb-2">
                {t.emptyState}
              </h2>
              <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed font-semibold">
                {t.emptySubtitle}
              </p>
              <button
                onClick={() => router.push("/apps/iskambil")}
                className="flex items-center gap-2 bg-[#0c3122] hover:bg-[#12422f] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all cursor-pointer shadow-sm hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t.discoverButton}</span>
                <ArrowRight size={14} weight="bold" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Favorites Section */}
              {favoriteGames.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-red-500 rounded-full" />
                      <h2 className="text-sm font-black text-[#0c3122] tracking-[0.2em] uppercase">
                        {t.favoritesTitle}
                      </h2>
                      <span className="text-[10px] font-bold text-slate-500">
                        ({favoriteGames.length})
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                      {t.favoritesSubtitle}
                    </p>
                  </div>

                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <AnimatePresence>
                      {favoriteGames.map(renderGameCard)}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {/* Known Games Section */}
              {knownGames.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h2 className="text-sm font-black text-[#0c3122] tracking-[0.2em] uppercase">
                        {t.knownTitle}
                      </h2>
                      <span className="text-[10px] font-bold text-slate-500">
                        ({knownGames.length})
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                      {t.knownSubtitle}
                    </p>
                  </div>

                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <AnimatePresence>
                      {knownGames.map(renderGameCard)}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
}
