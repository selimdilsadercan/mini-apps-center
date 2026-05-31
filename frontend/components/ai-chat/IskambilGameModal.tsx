"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Users, Cards, X, CheckCircle } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
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
  quick_rules_tr: string[] | null;
  quick_rules_en: string[] | null;
}

export default function IskambilGameModal({
  gameId,
  userId,
  open,
  onClose,
}: {
  gameId: string | null;
  userId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { locale } = useLanguage();
  const lang = locale === "tr" ? "tr" : "en";
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !gameId) {
      setGame(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const resp = await client.iskambil.getGames(userId ?? "guest");
        const found = (resp.games ?? []).find((g) => g.id === gameId) as Game | undefined;
        if (!cancelled) setGame(found ?? null);
      } catch (e) {
        console.error("IskambilGameModal load failed:", e);
        if (!cancelled) setGame(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, gameId, userId]);

  const gameName = game ? (lang === "tr" ? game.name_tr : game.name_en) : "";
  const category = game ? (lang === "tr" ? game.category_tr : game.category_en) : "";
  const deckCount = game ? (lang === "tr" ? game.deck_count_tr : game.deck_count_en) : "";
  const quickRules =
    game && (lang === "tr" ? game.quick_rules_tr : game.quick_rules_en)?.length
      ? lang === "tr"
        ? game.quick_rules_tr
        : game.quick_rules_en
      : null;
  const rules =
    game && !quickRules?.length
      ? lang === "tr"
        ? game.rules_tr
        : game.rules_en
      : null;

  return (
    <AnimatePresence>
      {open && gameId && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            aria-label="Kapat"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            className="fixed left-1/2 top-1/2 z-[90] flex w-[calc(100%-1.5rem)] max-w-lg max-h-[min(88vh,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1.75rem] bg-[#f4f1ea] border border-[#e2dec5] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#e2dec5] bg-white px-5 py-4 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#5c6b62]">
                  Card Game Codex
                </p>
                <h2 className="text-lg font-black text-[#0c3122] truncate">
                  {loading ? "Yükleniyor…" : gameName || "Oyun bulunamadı"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#f5f2e9] text-[#0c3122] shrink-0"
                aria-label="Kapat"
              >
                <X size={22} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-[#0c3122] rounded-full animate-spin" />
                </div>
              )}

              {!loading && !game && (
                <p className="text-center text-sm text-[#5c6b62] py-8">Oyun yüklenemedi.</p>
              )}

              {game && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#e2dec5] px-3 py-2 text-xs font-bold text-[#0c3122]">
                      <Users size={16} />
                      {game.min_players === game.max_players
                        ? `${game.min_players} oyuncu`
                        : `${game.min_players}-${game.max_players} oyuncu`}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#e2dec5] px-3 py-2 text-xs font-bold text-[#0c3122]">
                      <Cards size={16} />
                      {deckCount}
                    </span>
                    {game.is_favorite && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs font-bold text-red-600">
                        <Heart size={14} weight="fill" /> Favori
                      </span>
                    )}
                    {game.is_known && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700">
                        <CheckCircle size={14} weight="fill" /> Bilinen
                      </span>
                    )}
                  </div>

                  {category && (
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#5c6b62]">
                      {category}
                    </p>
                  )}

                  <div className="rounded-2xl bg-white border border-[#e2dec5] p-4 shadow-sm">
                    <h3 className="text-xs font-black uppercase text-[#0c3122] tracking-wider mb-3">
                      {quickRules?.length ? "Hızlı Özet" : "Kurallar"}
                    </h3>
                    {(quickRules ?? rules)?.length ? (
                      <ol className="space-y-2 list-decimal list-inside text-sm text-slate-700 leading-relaxed">
                        {(quickRules ?? rules)!.slice(0, 8).map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-slate-500">Kural metni yok.</p>
                    )}
                  </div>

                  <Link
                    href={`/apps/iskambil/game?gameId=${game.id}`}
                    onClick={onClose}
                    className="block text-center rounded-2xl bg-[#0c3122] text-white py-3 text-sm font-black uppercase tracking-wide hover:bg-[#12422f] transition-colors"
                  >
                    Uygulamada tam detay →
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
