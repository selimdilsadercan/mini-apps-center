"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Circle,
  X,
  YoutubeLogo,
  ListPlus,
  Star,
} from "@phosphor-icons/react";
import YTDBShell from "../components/YTDBShell";
import EpisodeListRow from "../components/EpisodeListRow";
import { fetchSeriesById } from "../lib/api";
import { Series, CATEGORY_LABELS } from "../lib/types";
import StarRating from "../components/StarRating";
import {
  getSeriesData,
  toggleWatchlist,
  setRating,
  toggleEpisodeWatched,
} from "../lib/store";
import { sortEpisodesByDate } from "../lib/format";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#EF4444";

function SeriesDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userData, setUserData] = useState({
    watchedEpisodes: [] as string[],
    rating: null as number | null,
    inWatchlist: false,
  });
  const [playingVideo, setPlayingVideo] = useState<{
    id: string;
    title: string;
    youtubeId: string;
  } | null>(null);

  const loadSeries = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchSeriesById(id);
      if (data) setSeries(data);
      else setError(true);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refreshUserData = useCallback(() => {
    if (!series || !id) return;
    const data = getSeriesData(id);
    setUserData(data);
  }, [id, series]);

  useEffect(() => {
    if (id) loadSeries();
    else {
      setLoading(false);
      setError(true);
    }
  }, [id, loadSeries]);

  useEffect(() => {
    if (series) refreshUserData();
  }, [series, refreshUserData]);

  if (loading) {
    return (
      <YTDBShell detailTitle="Yükleniyor...">
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </YTDBShell>
    );
  }

  if (error || !series || !id) {
    return (
      <YTDBShell detailTitle="Bulunamadı">
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border shadow-sm">
          <p className="text-sm font-black text-app-text">Seri bulunamadı</p>
        </div>
      </YTDBShell>
    );
  }

  const handleToggleWatchlist = () => {
    toggleWatchlist(id);
    refreshUserData();
  };

  const handleRate = (value: number) => {
    setRating(id, value);
    refreshUserData();
  };

  const handleToggleEpisode = (episodeId: string) => {
    toggleEpisodeWatched(id, episodeId);
    refreshUserData();
  };

  const sortedEpisodes = sortEpisodesByDate(series.episodes || []);
  const thumbnailUrl = series.youtubeId
    ? `https://img.youtube.com/vi/${series.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <YTDBShell detailTitle={series.title} detailBackHref="/apps/youtube-discover/kesfet">
      <div className="space-y-5">
        {/* Hero card */}
        <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden">
          {thumbnailUrl && (
            <div className="aspect-video bg-app-surface-muted">
              <img
                src={thumbnailUrl}
                alt={series.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  series.status === "devam-ediyor"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
              >
                {series.status === "devam-ediyor" ? "Yayında" : "Tamamlandı"}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-app-surface-muted text-app-muted border border-app-border">
                {CATEGORY_LABELS[series.category]}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: ACCENT }}>
                {series.creator}
              </p>
              <h2 className="text-lg font-black text-app-text leading-tight mt-0.5">
                {series.title}
              </h2>
            </div>

            <p className="text-[13px] font-medium text-app-muted leading-relaxed">
              {series.description}
            </p>

            <div className="flex items-center gap-4 text-[11px] font-bold text-app-muted">
              <span className="flex items-center gap-1">
                <Star size={13} weight="fill" className="text-amber-400" />
                {series.avgRating.toFixed(1)}
              </span>
              <span>{series.episodeCount} bölüm</span>
              <span>{series.year}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToggleWatchlist}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-[0.98] ${
                  userData.inWatchlist
                    ? "bg-app-surface-muted text-app-text border border-app-border"
                    : "text-white"
                }`}
                style={userData.inWatchlist ? undefined : { backgroundColor: ACCENT }}
              >
                {userData.inWatchlist ? (
                  <>
                    <CheckCircle weight="fill" size={16} />
                    Takiptesin
                  </>
                ) : (
                  <>
                    <ListPlus weight="bold" size={16} />
                    Takip Et
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl border border-app-border bg-app-surface">
              <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
                Puanın
              </p>
              <StarRating value={userData.rating} onChange={handleRate} size="md" />
            </div>
          </div>
        </div>

        {/* Episodes */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
            Bölümler
          </h3>
          <div className="space-y-2">
            {sortedEpisodes.map((ep, index) => (
              <EpisodeListRow
                key={ep.id}
                episode={ep}
                displayNumber={index + 1}
                isWatched={userData.watchedEpisodes.includes(ep.id)}
                onPlay={() => setPlayingVideo(ep)}
                onToggleWatched={() => handleToggleEpisode(ep.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Video player overlay */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col bg-app-bg/95 backdrop-blur-md p-4"
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="max-w-xl mx-auto w-full flex flex-col flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <YoutubeLogo size={16} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-app-text truncate">
                      {playingVideo.title}
                    </p>
                    <p className="text-[10px] font-bold text-app-muted truncate">
                      {series.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-muted active:scale-95"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-app-border shadow-lg">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <button
                type="button"
                onClick={() => handleToggleEpisode(playingVideo.id)}
                className={`mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-[0.98] ${
                  userData.watchedEpisodes.includes(playingVideo.id)
                    ? "bg-emerald-500 text-white"
                    : "bg-app-surface text-app-text border border-app-border"
                }`}
              >
                {userData.watchedEpisodes.includes(playingVideo.id) ? (
                  <CheckCircle weight="fill" size={18} />
                ) : (
                  <Circle weight="bold" size={18} />
                )}
                {userData.watchedEpisodes.includes(playingVideo.id)
                  ? "İzlendi"
                  : "İzlendi Olarak İşaretle"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </YTDBShell>
  );
}

export default function SeriesPage() {
  return (
    <Suspense
      fallback={
        <YTDBShell detailTitle="Yükleniyor...">
          <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        </YTDBShell>
      }
    >
      <SeriesDetailContent />
    </Suspense>
  );
}
