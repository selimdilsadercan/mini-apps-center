"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Heart,
  Users,
  Cards,
  Note,
  Tag,
  FloppyDisk,
  XCircle,
  CheckCircle,
  ArrowLeft
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react"; 
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

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
  custom_sections: GameSection[] | null;
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

function GameDetailContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale: lang } = useLanguage();
  
  const gameId = searchParams.get("gameId");
  const t = translations[lang];

  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchGameDetails = async (userId: string) => {
    if (!gameId) return;
    try {
      setIsLoading(true);
      const resp = await client.iskambil.getGames(userId);
      const found = (resp.games || []).find((g: Game) => g.id === gameId);
      if (found) {
        setGame(found);
        setNoteText(found.user_note || "");
      }
    } catch (err) {
      console.error("Failed to load game details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isUserLoaded || !gameId) return;
    const userId = user?.id ?? "guest";
    fetchGameDetails(userId);
  }, [isUserLoaded, user?.id, gameId]);

  const handleToggleFavorite = async () => {
    if (!user?.id || !game) return;
    try {
      const resp = await client.iskambil.toggleFavorite({
        gameId: game.id,
        userId: user.id
      });
      if (resp.success) {
        setGame(prev => prev ? { ...prev, is_favorite: resp.isFavorite } : null);
      }
    } catch (err) {
      console.error("Favorite error:", err);
    }
  };

  const handleToggleKnown = async () => {
    if (!user?.id || !game) return;
    try {
      const resp = await client.iskambil.toggleKnown({
        gameId: game.id,
        userId: user.id
      });
      if (resp.success) {
        setGame(prev => prev ? { ...prev, is_known: resp.isKnown } : null);
      }
    } catch (err) {
      console.error("Known toggle error:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!user?.id || !game) return;
    try {
      setIsSavingNote(true);
      const resp = await client.iskambil.saveNote({
        gameId: game.id,
        userId: user.id,
        note: noteText
      });
      if (resp.success) {
        setGame(prev => prev ? { ...prev, user_note: resp.note } : null);
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
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

  if (!game) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f1ea] text-[#0c3122] p-6 text-center">
        <XCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black mb-4">{t.gameNotFound}</h2>
        <button
          onClick={() => router.push("/apps/iskambil")}
          className="flex items-center gap-2 bg-[#0c3122] hover:bg-[#12422f] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft size={16} weight="bold" />
          {t.back}
        </button>
      </div>
    );
  }

  const gameName = lang === "tr" ? game.name_tr : game.name_en;
  const gameCategory = lang === "tr" ? game.category_tr : game.category_en;
  const gameRules = lang === "tr" ? game.rules_tr : game.rules_en;
  const deckCount = lang === "tr" ? game.deck_count_tr : game.deck_count_en;

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ea] text-[#1a2d22] font-sans selection:bg-[#0c3122] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#ffffff] border-b border-[#e2dec5]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f2e9] border border-[#e2dcc8] text-[#0c3122] hover:bg-[#eae6df] transition-all cursor-pointer"
              title={t.back}
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 uppercase leading-none text-[#0c3122]">
                {gameName.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US")}
              </h1>
              {game.original_name && game.original_name.toLowerCase() !== gameName.toLowerCase() && (
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  ({game.original_name})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleKnown}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                game.is_known 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                  : "bg-[#f5f2e9] border-[#e2dcc8] text-slate-500 hover:text-emerald-600 hover:bg-[#eae6df]"
              }`}
              title={t.known}
            >
              <CheckCircle size={20} weight={game.is_known ? "fill" : "bold"} />
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                game.is_favorite 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-[#f5f2e9] border-[#e2dcc8] text-slate-500 hover:text-red-500 hover:bg-[#eae6df]"
              }`}
              title={t.favorite}
            >
              <Heart size={20} weight={game.is_favorite ? "fill" : "bold"} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-28 pb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Rules Column */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="bg-[#ffffff] border border-[#e2dec5] rounded-3xl p-6 md:p-8 space-y-6 font-sans text-base text-slate-700 leading-relaxed shadow-sm">
              {/* Check if we have the new detailed layout */}
              {(lang === "tr" ? game.quick_rules_tr : game.quick_rules_en) ? (
                <div className="space-y-6">
                  
                  {/* Quick Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                      {lang === "tr" ? "Hızlı Özet" : "Quick Summary"}
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside pl-1">
                      {(lang === "tr" ? game.quick_rules_tr : game.quick_rules_en)?.map((rule, idx) => (
                        <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                          <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Setup */}
                  {(lang === "tr" ? game.setup_tr : game.setup_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Kurulum" : "Setup"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {(lang === "tr" ? game.setup_tr : game.setup_en)?.map((step, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objective */}
                  {(lang === "tr" ? game.objective_tr : game.objective_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Amaç" : "Objective"}
                      </h4>
                      <div className="p-4 bg-[#fbf9f3] border border-[#e2dec5] rounded-xl text-slate-700 text-sm leading-relaxed">
                        {lang === "tr" ? game.objective_tr : game.objective_en}
                      </div>
                    </div>
                  )}

                  {/* Gameplay */}
                  {(lang === "tr" ? game.gameplay_tr : game.gameplay_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Oynanış" : "Gameplay"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {(lang === "tr" ? game.gameplay_tr : game.gameplay_en)?.map((step, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Scoring */}
                  {(lang === "tr" ? game.scoring_tr : game.scoring_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Puanlama" : "Scoring"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {(lang === "tr" ? game.scoring_tr : game.scoring_en)?.map((rule, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Custom Sections */}
                  {game.custom_sections?.map((section, sIdx) => {
                    const title = lang === "tr" ? section.title_tr : section.title_en;
                    const content = lang === "tr" ? section.content_tr : section.content_en;
                    if (!title || !content || content.length === 0) return null;
                    return (
                      <div key={sIdx} className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                          {title}
                        </h4>
                        <ol className="space-y-2 list-decimal list-inside pl-1">
                          {content.map((rule, idx) => (
                            <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                              <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}

                  {/* Ending */}
                  {(lang === "tr" ? game.ending_tr : game.ending_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Oyun Sonu" : "Ending"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {(lang === "tr" ? game.ending_tr : game.ending_en)?.map((rule, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Notes */}
                  {(lang === "tr" ? game.notes_tr : game.notes_en) && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Özel Notlar" : "Notes"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {(lang === "tr" ? game.notes_tr : game.notes_en)?.map((note, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{note}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                </div>
              ) : (
                /* Legacy Layout */
                gameRules.length > 0 ? (
                  <ol className="space-y-4 list-decimal list-inside">
                    {gameRules.map((rule, idx) => (
                      <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-4 border-b border-[#f4f1ea] last:border-0 last:pb-0 pl-1">
                        <span className="inline-block md:inline leading-loose text-slate-700">{rule}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-2">
                    <XCircle size={48} className="opacity-55" />
                    <span>{t.noRules}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Quick Info & Notes Column */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
            {/* Quick Info Tags */}
            <div className="flex flex-col gap-3">
              <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.playerCapacity}</span>
                <span className="text-sm font-bold text-[#0c3122] flex items-center gap-2">
                  <Users size={18} className="text-[#0c3122]/70" />
                  {game.min_players === game.max_players 
                    ? `${game.min_players} ${lang === "tr" ? "Oyuncu" : "Players"}` 
                    : `${game.min_players}-${game.max_players} ${lang === "tr" ? "Oyuncu" : "Players"}`}
                </span>
              </div>
              
              <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.deckRequirement}</span>
                <span className="text-sm font-bold text-[#0c3122] flex items-center gap-2">
                  <Cards size={18} className="text-[#0c3122]/70" />
                  {deckCount}
                </span>
              </div>

              <div className="bg-[#ffffff] border border-[#e2dec5] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.gameType}</span>
                <span className="text-sm font-bold text-[#0c3122] flex items-center gap-2">
                  <Tag size={18} className="text-[#0c3122]/70" />
                  {gameCategory}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-[#0c3122] tracking-[0.2em] flex items-center gap-2">
                <Note size={18} />
                {t.personalNotes}
              </h3>
              
              <div className="bg-[#ffffff] border border-[#e2dec5] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  className="w-full bg-[#fdfcf7] border border-[#e2dec5] rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400 resize-none min-h-[160px]"
                />
                
                <button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="w-full bg-[#0c3122] hover:bg-[#12422f] text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <FloppyDisk size={16} />
                  <span>{isSavingNote ? t.saving : t.save}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function GameDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] text-[#0c3122]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-[#0c3122] rounded-full animate-spin" />
        </div>
      </div>
    }>
      <GameDetailContent />
    </Suspense>
  );
}
