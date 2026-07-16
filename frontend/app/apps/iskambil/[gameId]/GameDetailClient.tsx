"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Users,
  Cards,
  CheckCircle,
  SquaresFour
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { GameData } from "../games-registry";
import { getAppRootUrl } from "@/lib/apps";

const client = createBrowserClient();

interface GameState {
  is_favorite: boolean;
  is_known: boolean;
  user_note: string | null;
}

interface GameSection {
  title_tr: string;
  title_en: string;
  content_tr: string[];
  content_en: string[];
}

const translations = {
  tr: {
    loading: "Yükleniyor...",
    noRules: "Bu oyun için henüz bir kural girişi bulunmuyor.",
    playerCapacity: "Oyuncu Kapasitesi",
    deckRequirement: "Deste Gereksinimi",
    gameType: "Oyun Türü",
    personalNotes: "KİŞİSEL NOTLAR & EV KURALLARI",
    notesPlaceholder: "Evde oynadığınız özel varyasyonları veya hatırlamak istediğiniz notları yazın...",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    known: "Biliyorum",
    favorite: "Favori",
    back: "Geri Dön",
    rulesHeader: "Oynanış ve Kurallar",
    gameNotFound: "Oyun bulunamadı."
  },
  en: {
    loading: "Loading...",
    noRules: "No rules entries found for this game yet.",
    playerCapacity: "Player Capacity",
    deckRequirement: "Deck Requirement",
    gameType: "Game Type",
    personalNotes: "PERSONAL NOTES & HOUSE RULES",
    notesPlaceholder: "Write down special house rules or notes you want to remember...",
    save: "Save",
    saving: "Saving...",
    known: "I Know It",
    favorite: "Favorite",
    back: "Go Back",
    rulesHeader: "How to Play & Rules",
    gameNotFound: "Game not found."
  }
};

export default function GameDetailClient({ initialGame }: { initialGame: GameData }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang];

  const [userState, setUserState] = useState<GameState>({
    is_favorite: false,
    is_known: false,
    user_note: null
  });
  const [isLoadingState, setIsLoadingState] = useState(true);

  // Fetch only user states from API (known, favorite, note) to merge with static rules
  const fetchUserState = async (userId: string) => {
    try {
      setIsLoadingState(true);
      const resp = await client.iskambil.getGames(userId);
      const found = (resp.games || []).find((g: any) => g.id === initialGame.id);
      if (found) {
        setUserState({
          is_favorite: found.is_favorite,
          is_known: found.is_known,
          user_note: found.user_note || null
        });
      }
    } catch (err) {
      console.error("Failed to load game user state:", err);
    } finally {
      setIsLoadingState(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded) return;
    const userId = user?.id ?? "guest";
    fetchUserState(userId);
  }, [isUserLoaded, user?.id, initialGame.id]);

  const handleToggleFavorite = async () => {
    if (!user?.id) return;
    try {
      const resp = await client.iskambil.toggleFavorite({
        gameId: initialGame.id,
        userId: user.id
      });
      if (resp.success) {
        setUserState(prev => ({ ...prev, is_favorite: resp.isFavorite }));
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handleToggleKnown = async () => {
    if (!user?.id) return;
    try {
      const resp = await client.iskambil.toggleKnown({
        gameId: initialGame.id,
        userId: user.id
      });
      if (resp.success) {
        setUserState(prev => ({ ...prev, is_known: resp.isKnown }));
      }
    } catch (err) {
      console.error("Known toggle error:", err);
    }
  };

  const gameName = lang === "tr" ? initialGame.name_tr : initialGame.name_en;
  const gameCategory = lang === "tr" ? initialGame.category_tr : initialGame.category_en;
  const deckCount = lang === "tr" ? initialGame.deckCount_tr : initialGame.deckCount_en;

  const quickRules = lang === "tr" ? initialGame.quickRules_tr : initialGame.quickRules_en;
  const setup = lang === "tr" ? initialGame.setup_tr : initialGame.setup_en;
  const objective = lang === "tr" ? initialGame.objective_tr : initialGame.objective_en;
  const gameplay = lang === "tr" ? initialGame.gameplay_tr : initialGame.gameplay_en;
  const scoring = lang === "tr" ? initialGame.scoring_tr : initialGame.scoring_en;
  const ending = lang === "tr" ? initialGame.ending_tr : initialGame.ending_en;
  const notes = lang === "tr" ? initialGame.notes_tr : initialGame.notes_en;
  const customSections = initialGame.customSections as GameSection[] | null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text font-sans selection:bg-gray-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 app-chrome-top">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3.5 py-2 bg-app-surface hover:bg-app-surface-muted text-gray-500 hover:text-app-text rounded-xl border border-app-border/60 h-9 shadow-sm transition-all active:scale-95"
              title={t.back}
            >
              <SquaresFour size={16} weight="fill" className="text-zinc-900 shrink-0" />
              <span className="text-xs font-bold">{t.back}</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-app-text">
                {gameName}
              </h1>
              {initialGame.originalName && initialGame.originalName.toLowerCase() !== gameName.toLowerCase() && (
                <p className="text-[10px] text-app-muted font-bold mt-1 uppercase tracking-wider">
                  ({initialGame.originalName})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleKnown}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-sm ${userState.is_known
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : "bg-app-surface border-app-border text-app-muted hover:text-zinc-900 hover:bg-app-surface-muted"
                }`}
              title={t.known}
            >
              <CheckCircle size={18} weight={userState.is_known ? "fill" : "bold"} />
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-sm ${userState.is_favorite
                  ? "bg-rose-50 border-rose-200 text-rose-500"
                  : "bg-app-surface border-app-border text-app-muted hover:text-rose-500 hover:bg-rose-50"
                }`}
              title={t.favorite}
            >
              <Heart size={18} weight={userState.is_favorite ? "fill" : "bold"} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Rules Column */}
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-app-surface border border-app-border rounded-3xl p-6 md:p-8 space-y-8 shadow-sm">
              {quickRules ? (
                <div className="space-y-8">

                  {/* Quick Summary */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                      {lang === "tr" ? "Hızlı Özet" : "Quick Summary"}
                    </h4>
                    <ol className="space-y-3 list-decimal list-inside pl-1">
                      {quickRules.map((rule, idx) => (
                        <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                          <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Setup */}
                  {setup && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Kurulum" : "Setup"}
                      </h4>
                      <ol className="space-y-3 list-decimal list-inside pl-1">
                        {setup.map((step, idx) => (
                          <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objective */}
                  {objective && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Amaç" : "Objective"}
                      </h4>
                      <div className="p-4 bg-app-surface-muted border border-app-border rounded-2xl text-gray-700 text-sm leading-relaxed font-medium">
                        {objective}
                      </div>
                    </div>
                  )}

                  {/* Gameplay */}
                  {gameplay && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Oynanış" : "Gameplay"}
                      </h4>
                      <ol className="space-y-3 list-decimal list-inside pl-1">
                        {gameplay.map((step, idx) => (
                          <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Scoring */}
                  {scoring && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Puanlama" : "Scoring"}
                      </h4>
                      <ol className="space-y-3 list-decimal list-inside pl-1">
                        {scoring.map((rule, idx) => (
                          <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Custom Sections */}
                  {customSections?.map((section, sIdx) => {
                    const title = lang === "tr" ? section.title_tr : section.title_en;
                    const content = lang === "tr" ? section.content_tr : section.content_en;
                    if (!title || !content || content.length === 0) return null;
                    return (
                      <div key={sIdx} className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                          {title}
                        </h4>
                        <ol className="space-y-3 list-decimal list-inside pl-1">
                          {content.map((rule, idx) => (
                            <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                              <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}

                  {/* Ending */}
                  {ending && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Oyun Sonu" : "Ending"}
                      </h4>
                      <ol className="space-y-3 list-decimal list-inside pl-1">
                        {ending.map((rule, idx) => (
                          <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-zinc-900/40 tracking-widest border-b border-gray-50 pb-2">
                        {lang === "tr" ? "Özel Notlar" : "Notes"}
                      </h4>
                      <ol className="space-y-3 list-decimal list-inside pl-1">
                        {notes.map((note, idx) => (
                          <li key={idx} className="marker:text-zinc-900 marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-gray-600 text-sm leading-relaxed font-medium">{note}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center text-app-muted py-12 flex flex-col items-center gap-2">
                  <Cards size={48} className="opacity-20" />
                  <span className="font-bold">{t.noRules}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Notes Column */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
            {/* Quick Info Tags */}
            <div className="flex flex-col gap-3">
              <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-app-muted uppercase tracking-widest">{t.playerCapacity}</span>
                <span className="text-sm font-bold text-app-text flex items-center gap-2">
                  <Users size={18} className="text-zinc-900" />
                  {initialGame.minPlayers === initialGame.maxPlayers
                    ? `${initialGame.minPlayers} ${lang === "tr" ? "Oyuncu" : "Players"}`
                    : `${initialGame.minPlayers}-${initialGame.maxPlayers} ${lang === "tr" ? "Oyuncu" : "Players"}`}
                </span>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-app-muted uppercase tracking-widest">{t.deckRequirement}</span>
                <span className="text-sm font-bold text-app-text flex items-center gap-2">
                  <Cards size={18} className="text-zinc-900" />
                  {deckCount}
                </span>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-app-muted uppercase tracking-widest">{t.gameType}</span>
                <span className="text-sm font-bold text-app-text flex items-center gap-2 uppercase tracking-tight">
                  <SquaresFour size={18} weight="fill" className="text-zinc-900" />
                  {gameCategory}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
