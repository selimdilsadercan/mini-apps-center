"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import { Star, Trophy, X } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { places_ranked } from "@/lib/client";
import { useTranslations } from "@/contexts/LanguageContext";
import { DEFAULT_VENUE_CITY } from "../../lib/venue-types";
import { resolvePlaceImageSrc } from "../../lib/place-image";

interface VenueRankedSectionProps {
  placeId: string;
  city?: string;
}

export default function VenueRankedSection({ placeId, city = DEFAULT_VENUE_CITY }: VenueRankedSectionProps) {
  const { user } = useUser();
  const client = useMemo(() => createBrowserClient(), []);
  const t = useTranslations("workplaces");

  const [stats, setStats] = useState<places_ranked.PlaceRatingStats | null>(null);
  const [allTimeVotes, setAllTimeVotes] = useState(0);
  const [myOverall, setMyOverall] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, myRes] = await Promise.all([
        client.places_ranked.getPlaceStats(placeId, { city }),
        user?.id
          ? client.workplaces.getMyPlaceRating(placeId, { userId: user.id })
          : Promise.resolve({ rating: null }),
      ]);
      setStats(statsRes.stats);
      setAllTimeVotes(statsRes.allTimeVotes ?? 0);
      setMyOverall(myRes.rating?.overall ?? null);
    } catch (err) {
      console.error("VenueRankedSection load error:", err);
    } finally {
      setLoading(false);
    }
  }, [city, client, placeId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRate = async (score: number) => {
    if (!user?.id) {
      toast.error(t("ranked.signIn"));
      return;
    }
    setSubmitting(true);
    try {
      await client.workplaces.ratePlace({
        placeId,
        userId: user.id,
        overall: score,
      });
      setMyOverall(score);
      toast.success(t("ranked.saved"));
      await load();
      setShowRateModal(false);
    } catch (err) {
      console.error("ratePlace error:", err);
      toast.error(t("ranked.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="bg-app-surface rounded-2xl border border-app-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
          <Trophy size={14} weight="fill" className="text-violet-600" />
          {t("ranked.title")}
        </p>
        <Link
          href="/apps/places-ranked"
          className="text-[11px] font-bold text-violet-600 hover:text-violet-700 no-underline"
        >
          {t("ranked.viewLeaderboard")} →
        </Link>
      </div>

      {loading ? (
        <div className="h-16 rounded-xl bg-neutral-100 dark:bg-zinc-800 animate-pulse" />
      ) : (
        <>
          {stats ? (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-3xl font-black text-app-text tabular-nums">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-app-muted font-medium">
                {t("ranked.votes", { count: stats.voteCount })}
              </span>
              {stats.rankInList != null && (
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-md border border-violet-200/60 dark:border-violet-800/50">
                  #{stats.rankInList}
                </span>
              )}
            </div>
          ) : allTimeVotes > 0 ? (
            <p className="text-sm text-app-muted">{t("ranked.notEnoughVotes")}</p>
          ) : (
            <p className="text-sm text-app-muted">{t("ranked.noVotesYet")}</p>
          )}

          <div className="pt-1 border-t border-app-border flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-app-text truncate">
                {myOverall != null ? t("ranked.yourRating", { score: myOverall }) : t("ranked.ratePrompt")}
              </p>
              {!user?.id && (
                <p className="text-[10px] text-app-muted flex items-center gap-1 mt-0.5">
                  {t("ranked.signInHint")}
                </p>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowRateModal(true)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                myOverall != null
                  ? "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/30 dark:border-violet-800/50 dark:text-violet-300"
                  : "bg-violet-600 text-white shadow-sm hover:bg-violet-700"
              }`}
            >
              <Star size={16} weight={myOverall != null ? "fill" : "bold"} />
              {myOverall != null ? t("ranked.updateRateButton") : t("ranked.rateButton")}
            </button>
          </div>

          <AnimatePresence>
            {showRateModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowRateModal(false)}
                  className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-app-surface rounded-3xl shadow-2xl overflow-hidden border border-app-border"
                >
                  <div className="p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center mx-auto mb-2">
                      <Star size={24} weight="fill" className="text-violet-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-app-text">
                        {t("ranked.ratePrompt")}
                      </h3>
                      <p className="text-sm text-app-muted mt-1">
                        {t("ranked.rateModalHint")}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 gap-2 py-2">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                        const active = myOverall === score;
                        return (
                          <button
                            key={score}
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleRate(score)}
                            className={`aspect-square rounded-xl text-sm font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center border ${
                              active
                                ? "bg-violet-600 text-white border-violet-600 shadow-md scale-110"
                                : "bg-app-bg text-app-text border-app-border hover:border-violet-400 hover:text-violet-600"
                            }`}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRateModal(false)}
                      className="w-full py-3 text-sm font-bold text-app-muted hover:text-app-text transition-colors"
                    >
                      {t("modal.cancel")}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowRateModal(false)}
                    className="absolute top-4 right-4 text-app-muted hover:text-app-text transition-colors"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </article>
  );
}

/** Thumbnail helper for ranked leaderboard page */
export function RankedPlaceThumb({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  const src = resolvePlaceImageSrc(imageUrl);
  if (!src) {
    return (
      <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
        <Trophy size={22} className="text-violet-600" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-app-border"
    />
  );
}
