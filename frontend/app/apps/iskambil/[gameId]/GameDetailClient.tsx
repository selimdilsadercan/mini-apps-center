"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Users,
  Cards,
  CheckCircle,
  SquaresFour,
  CaretLeft
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
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text font-sans selection:bg-[#e03131]/20 selection:text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-app-surface/95 backdrop-blur-md border-b border-app-border/60 shadow-sm w-full">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.back()}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-text/70 hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
              title={t.back}
            >
              <CaretLeft size={14} weight="bold" className="text-[#e03131] shrink-0" />
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 uppercase leading-none text-app-text truncate">
                <Cards size={16} weight="fill" className="text-[#e03131] shrink-0" />
                <span className="truncate">{gameName}</span>
              </h1>
              {initialGame.originalName && initialGame.originalName.toLowerCase() !== gameName.toLowerCase() && (
                <p className="text-[9px] text-app-muted font-bold mt-0.5 uppercase tracking-wider pl-[22px] truncate">
                  ({initialGame.originalName})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleKnown}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-sm ${userState.is_known
                  ? "bg-[#e03131]/10 border-[#e03131]/20 text-[#e03131]"
                  : "bg-app-surface border-app-border text-app-muted hover:text-app-text hover:bg-app-surface-muted"
                }`}
              title={t.known}
            >
              <CheckCircle size={16} weight={userState.is_known ? "fill" : "bold"} />
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer shadow-sm ${userState.is_favorite
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                  : "bg-app-surface border-app-border text-app-muted hover:text-rose-500 hover:bg-rose-500/10"
                }`}
              title={t.favorite}
            >
              <Heart size={16} weight={userState.is_favorite ? "fill" : "bold"} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-app-surface border border-app-border rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-sm text-center justify-between min-w-0">
              <Users size={18} className="text-app-muted/70 shrink-0 mt-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black text-app-muted uppercase tracking-wider leading-tight min-h-[22px] flex items-center justify-center">{t.playerCapacity}</span>
              <span className="line-clamp-2 leading-tight text-[10px] sm:text-xs font-bold text-app-text">
                {initialGame.minPlayers === initialGame.maxPlayers
                  ? `${initialGame.minPlayers} P`
                  : `${initialGame.minPlayers}-${initialGame.maxPlayers} P`}
              </span>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-sm text-center justify-between min-w-0">
              <Cards size={18} className="text-app-muted/70 shrink-0 mt-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black text-app-muted uppercase tracking-wider leading-tight min-h-[22px] flex items-center justify-center">{t.deckRequirement}</span>
              <span className="line-clamp-2 leading-tight text-[10px] sm:text-xs font-bold text-app-text">{deckCount}</span>
            </div>

            <div className="bg-app-surface border border-app-border rounded-2xl p-2.5 flex flex-col items-center gap-1 shadow-sm text-center justify-between min-w-0">
              <SquaresFour size={18} className="text-app-muted/70 shrink-0 mt-0.5" />
              <span className="text-[8px] sm:text-[9px] font-black text-app-muted uppercase tracking-wider leading-tight min-h-[22px] flex items-center justify-center">{t.gameType}</span>
              <span className="line-clamp-2 leading-tight text-[10px] sm:text-xs font-bold text-app-text uppercase tracking-tight">{gameCategory}</span>
            </div>
          </div>

          {/* Rules Section (no card wrapper to save space) */}
          <div className="space-y-8 py-2 px-1">
            {quickRules ? (
              <div className="space-y-8">
                {/* Quick Summary */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    {lang === "tr" ? "Hızlı Özet" : "Quick Summary"}
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {quickRules.map((rule, idx) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Rules Details Card */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-5 md:p-6 space-y-8 shadow-sm">
                  {/* Setup */}
                  {setup && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Kurulum" : "Setup"}
                      </h4>
                      <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                        {setup.map((step, idx) => (
                          <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                            <span className="inline text-app-text/80">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objective */}
                  {objective && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Amaç" : "Objective"}
                      </h4>
                      <p className="text-app-text/80 text-sm leading-relaxed pl-1 font-medium">
                        {objective}
                      </p>
                    </div>
                  )}

                  {/* Gameplay */}
                  {gameplay && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Oynanış" : "Gameplay"}
                      </h4>
                      <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                        {gameplay.map((step, idx) => (
                          <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                            <span className="inline text-app-text/80">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Scoring */}
                  {scoring && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Puanlama" : "Scoring"}
                      </h4>
                      <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                        {scoring.map((rule, idx) => (
                          <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                            <span className="inline text-app-text/80">{rule}</span>
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
                        <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                          {title}
                        </h4>
                        <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                          {content.map((rule, idx) => (
                            <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                              <span className="inline text-app-text/80">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}

                  {/* Ending */}
                  {ending && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Oyun Sonu" : "Ending"}
                      </h4>
                      <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                        {ending.map((rule, idx) => (
                          <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                            <span className="inline text-app-text/80">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                        {lang === "tr" ? "Özel Notlar" : "Notes"}
                      </h4>
                      <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                        {notes.map((note, idx) => (
                          <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                            <span className="inline text-app-text/80">{note}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-app-muted py-12 flex flex-col items-center gap-2 bg-app-surface border border-app-border rounded-2xl shadow-sm">
                <Cards size={48} className="opacity-20" />
                <span className="font-bold">{t.noRules}</span>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
