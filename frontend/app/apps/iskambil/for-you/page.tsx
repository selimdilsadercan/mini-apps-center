"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  Sparkle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import IskambilShell from "../components/IskambilShell";
import GameListItem from "../components/GameListItem";
import { ForYouPageSkeleton } from "../components/GameListSkeleton";

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
    favoritesTitle: "Favorilerim",
    knownTitle: "Bildiğim Oyunlar",
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
    favoritesTitle: "Favorites",
    knownTitle: "Known Games",
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
    return games.filter(g => g.is_favorite && g.category_tr !== "Casino / Bahis" && g.category_en !== "Casino / Betting");
  }, [games]);

  const knownGames = useMemo(() => {
    return games.filter(g => g.is_known && g.category_tr !== "Casino / Bahis" && g.category_en !== "Casino / Betting");
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
      <IskambilShell activeTab="foryou">
        <ForYouPageSkeleton />
      </IskambilShell>
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
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
  };

  return (
    <IskambilShell activeTab="foryou">
      <AnimatePresence mode="wait">
        {!hasAnyData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16 px-6 bg-app-surface border border-app-border rounded-2xl shadow-sm flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-app-surface-muted border border-app-border flex items-center justify-center text-[#e03131] mb-5">
              <Sparkle size={28} weight="fill" />
            </div>
            <h2 className="text-base font-black text-app-text tracking-tight uppercase mb-2">
              {t.emptyState}
            </h2>
            <p className="text-xs text-app-muted max-w-sm mb-6 leading-relaxed font-medium">
              {t.emptySubtitle}
            </p>
            <button
              type="button"
              onClick={() => router.push("/apps/iskambil")}
              className="flex items-center gap-2 bg-app-surface hover:bg-app-surface-muted text-app-text px-4 py-2.5 rounded-xl border border-app-border font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer active:scale-95"
            >
              <span>{t.discoverButton}</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {favoriteGames.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-[10px] font-black text-app-muted uppercase tracking-wider px-1">
                  {t.favoritesTitle}
                  <span className="ml-1 opacity-50">({favoriteGames.length})</span>
                </h2>
                <div className="space-y-1.5">
                  <AnimatePresence>{favoriteGames.map(renderGameCard)}</AnimatePresence>
                </div>
              </div>
            )}

            {knownGames.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-[10px] font-black text-app-muted uppercase tracking-wider px-1">
                  {t.knownTitle}
                  <span className="ml-1 opacity-50">({knownGames.length})</span>
                </h2>
                <div className="space-y-1.5">
                  <AnimatePresence>{knownGames.map(renderGameCard)}</AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </IskambilShell>
  );
}
