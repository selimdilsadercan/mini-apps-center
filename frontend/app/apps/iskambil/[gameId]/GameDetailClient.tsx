"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { GameData } from "../games-registry";

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
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

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
        setNoteText(found.user_note || "");
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

  const handleSaveNote = async () => {
    if (!user?.id) return;
    try {
      setIsSavingNote(true);
      const resp = await client.iskambil.saveNote({
        gameId: initialGame.id,
        userId: user.id,
        note: noteText
      });
      if (resp.success) {
        setUserState(prev => ({ ...prev, user_note: resp.note }));
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const gameName = lang === "tr" ? initialGame.name_tr : initialGame.name_en;
  const gameCategory = lang === "tr" ? initialGame.category_tr : initialGame.category_en;
  const gameRules = lang === "tr" ? initialGame.rules_tr : initialGame.rules_en;
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
              {initialGame.originalName && initialGame.originalName.toLowerCase() !== gameName.toLowerCase() && (
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  ({initialGame.originalName})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleKnown}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                userState.is_known 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                  : "bg-[#f5f2e9] border-[#e2dcc8] text-slate-500 hover:text-emerald-600 hover:bg-[#eae6df]"
              }`}
              title={t.known}
            >
              <CheckCircle size={20} weight={userState.is_known ? "fill" : "bold"} />
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
                userState.is_favorite 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-[#f5f2e9] border-[#e2dcc8] text-slate-500 hover:text-red-500 hover:bg-[#eae6df]"
              }`}
              title={t.favorite}
            >
              <Heart size={20} weight={userState.is_favorite ? "fill" : "bold"} />
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
              {quickRules ? (
                <div className="space-y-6">
                  
                  {/* Quick Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                      {lang === "tr" ? "Hızlı Özet" : "Quick Summary"}
                    </h4>
                    <ol className="space-y-2 list-decimal list-inside pl-1">
                      {quickRules.map((rule, idx) => (
                        <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                          <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Setup */}
                  {setup && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Kurulum" : "Setup"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {setup.map((step, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Objective */}
                  {objective && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Amaç" : "Objective"}
                      </h4>
                      <div className="p-4 bg-[#fbf9f3] border border-[#e2dec5] rounded-xl text-slate-700 text-sm leading-relaxed">
                        {objective}
                      </div>
                    </div>
                  )}

                  {/* Gameplay */}
                  {gameplay && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Oynanış" : "Gameplay"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {gameplay.map((step, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Scoring */}
                  {scoring && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Puanlama" : "Scoring"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {scoring.map((rule, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
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
                  {ending && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Oyun Sonu" : "Ending"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {ending.map((rule, idx) => (
                          <li key={idx} className="marker:text-[#0c3122] marker:font-black pb-1 last:pb-0">
                            <span className="inline-block md:inline text-slate-700 text-sm leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Notes */}
                  {notes && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-[#0c3122] tracking-wider border-b border-[#f4f1ea] pb-1">
                        {lang === "tr" ? "Özel Notlar" : "Notes"}
                      </h4>
                      <ol className="space-y-2 list-decimal list-inside pl-1">
                        {notes.map((note, idx) => (
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
                  {initialGame.minPlayers === initialGame.maxPlayers 
                    ? `${initialGame.minPlayers} ${lang === "tr" ? "Oyuncu" : "Players"}` 
                    : `${initialGame.minPlayers}-${initialGame.maxPlayers} ${lang === "tr" ? "Oyuncu" : "Players"}`}
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
            {user?.id && (
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
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
