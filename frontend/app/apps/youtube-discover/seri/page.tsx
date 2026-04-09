"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Star, 
  BookmarkSimple, 
  CheckCircle, 
  Clock, 
  CaretLeft, 
  Calendar, 
  Circle,
  Play, 
  X, 
  YoutubeLogo,
  ListPlus,
  ArrowArcLeft
} from "@phosphor-icons/react";
import { fetchSeriesById } from "../lib/api";
import { Series, CATEGORY_LABELS } from "../lib/types";
import StarRating from "../components/StarRating";
import { getSeriesData, toggleWatchlist, setRating, toggleEpisodeWatched, getWatchProgress } from "../lib/store";
import { motion, AnimatePresence } from "framer-motion";

function SeriesDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [series, setSeries] = useState<Series | any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userData, setUserData] = useState({
    watchedEpisodes: [] as string[],
    rating: null as number | null,
    inWatchlist: false,
  });
  const [progress, setProgress] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<any>(null);

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
    setProgress(getWatchProgress(id, series.episodes?.length || 0));
  }, [id, series]);

  useEffect(() => {
    if (id) {
      loadSeries();
    } else {
      setLoading(false);
      setError(true);
    }
  }, [id, loadSeries]);

  useEffect(() => {
    if (series) {
      refreshUserData();
    }
  }, [series, refreshUserData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Seri Hazırlanıyor...</p>
      </div>
    );
  }

  if (error || !series || !id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 text-center">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
          <X size={40} className="text-slate-500" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Seri Bulunamadı</h1>
        <Link
          href="/apps/youtube-discover"
          className="flex items-center gap-2 text-red-500 font-bold hover:underline"
        >
          <ArrowArcLeft weight="bold" />
          ANA SAYFAYA DÖN
        </Link>
      </div>
    );
  }

  const handleToggleWatchlist = () => {
    if (id) {
        toggleWatchlist(id);
        refreshUserData();
    }
  };

  const handleRate = (value: number) => {
    if (id) {
        setRating(id, value);
        refreshUserData();
    }
  };

  const handleToggleEpisode = (episodeId: string) => {
    if (id) {
        toggleEpisodeWatched(id, episodeId);
        refreshUserData();
    }
  };

  const watchedCount = userData.watchedEpisodes.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative pb-32">
      {/* Hero Banner with Cinematic Background */}
      <div className="relative w-full h-[60vh] min-h-[500px] overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${series.gradient || 'from-zinc-900 to-black'} opacity-60`} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-r from-slate-950 via-slate-950/20 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto h-full px-6 flex flex-col justify-end pb-12">
          <Link
            href="/apps/youtube-discover"
            className="group mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black tracking-widest uppercase"
          >
            <CaretLeft weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            GERI DÖN
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  series.status === "devam-ediyor" 
                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                }`}>
                  {series.status === "devam-ediyor" ? "YAYINDA" : "TAMAMLANDI"}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                  {CATEGORY_LABELS[series.category as keyof typeof CATEGORY_LABELS]}
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl flex items-center gap-4">
                <span className="opacity-80 scale-90">{series.emoji}</span>
                {series.title}
              </h1>

              <div className="flex items-center gap-6 mb-6 text-slate-400 text-sm font-bold">
                 <span className="text-red-500">{series.creator}</span>
                 <div className="flex items-center gap-1.5">
                    <Calendar size={18} weight="fill" className="opacity-50" />
                    {series.year}
                 </div>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed line-clamp-3 font-medium opacity-90 max-w-2xl drop-shadow-md">
                {series.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[240px]">
              <button
                onClick={handleToggleWatchlist}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-widest transition-all ${
                  userData.inWatchlist
                    ? "bg-white text-black hover:bg-slate-200"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md"
                }`}
              >
                {userData.inWatchlist ? (
                  <>
                    <CheckCircle weight="fill" size={20} />
                    LISTEMDE
                  </>
                ) : (
                  <>
                    <ListPlus weight="bold" size={20} />
                    LISTE EKLE
                  </>
                )}
              </button>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Puanın Tanımla</span>
                  {userData.rating && <span className="text-xs font-black text-amber-400">{userData.rating}/5</span>}
                </div>
                <StarRating
                  value={userData.rating}
                  onChange={handleRate}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Episode Guide */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase underline decoration-red-500 decoration-4 underline-offset-8">Bölüm Rehberi</h2>
            <div className="flex items-center gap-4 text-xs font-black tracking-widest text-slate-500">
               <span>{watchedCount} / {series.episodes?.length} İZLENDI</span>
            </div>
          </div>

          <div className="space-y-4">
            {series.episodes?.map((ep: any) => {
              const isWatched = userData.watchedEpisodes.includes(ep.id);
              return (
                <motion.div
                  key={ep.id}
                  whileHover={{ scale: 1.01, x: 5 }}
                  onClick={() => setPlayingVideo(ep)}
                  className={`group relative flex items-center gap-6 p-5 rounded-[2rem] border transition-all cursor-pointer ${
                    isWatched 
                      ? "bg-green-500/5 border-green-500/20 hover:border-green-500/40" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:bg-red-500 transition-colors">
                      <Play size={24} weight="fill" className={`${isWatched ? 'text-green-500 group-hover:text-white' : 'text-slate-700 group-hover:text-white'}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-red-500 tracking-[0.2em] bg-red-500/10 px-2 py-0.5 rounded-md">BÖLÜM {ep.episodeNumber}</span>
                      {isWatched && <CheckCircle size={16} weight="fill" className="text-green-500" />}
                    </div>
                    <h3 className={`text-lg font-black tracking-tight truncate ${isWatched ? 'text-slate-500 italic' : 'text-white'}`}>
                      {ep.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                     <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs uppercase tracking-widest">
                        <Clock size={16} />
                        {ep.duration}
                     </div>
                     <button
                        onClick={(e) => { e.stopPropagation(); handleToggleEpisode(ep.id); }}
                        className={`p-3 rounded-xl transition-all ${isWatched ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-slate-700 hover:text-white hover:bg-white/10'}`}
                      >
                         <CheckCircle size={20} weight={isWatched ? "fill" : "bold"} />
                      </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:w-80 shrink-0">
          <div className="sticky top-24 space-y-12">
            
            {/* Watch Progress Card */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-red-600 to-orange-600 shadow-2xl shadow-red-900/40 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
               <div className="relative z-10 text-white">
                  <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-1 opacity-70">İzleme Durumu</h3>
                  <div className="text-4xl font-black mb-6 italic tracking-tighter">%{progress}</div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-4 border border-white/10">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-white transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
                     />
                  </div>
                  <p className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
                    SIKICI {series.episodeCount - watchedCount} BÖLÜM KALDI
                  </p>
               </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
               <h3 className="text-xs font-black tracking-[0.3em] text-slate-500 uppercase px-1">ETİKETLER</h3>
               <div className="flex flex-wrap gap-2">
                  {series.tags?.map((tag: string) => (
                    <span key={tag} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-default">
                      #{tag}
                    </span>
                  ))}
               </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-slate-500 text-[10px] font-black tracking-widest uppercase mb-2">Beğeni</div>
                  <div className="text-white text-xl font-black italic tracking-tighter">{Number(series.avgRating).toFixed(1)}</div>
               </div>
               <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-slate-500 text-[10px] font-black tracking-widest uppercase mb-2">Oy</div>
                  <div className="text-white text-xl font-black italic tracking-tighter">{Number(series.ratingCount).toLocaleString()}</div>
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* Video Player Overlay */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/90" 
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div 
               initial={{ scale: 0.9, y: 50 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 50 }}
               className="relative w-full max-w-6xl" 
               onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-16 left-0 right-0 flex justify-between items-center text-white">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600 rounded-2xl">
                       <YoutubeLogo size={24} weight="fill" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black tracking-tighter uppercase italic">{playingVideo.title}</h3>
                       <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">{series.title.toUpperCase()}</p>
                    </div>
                 </div>
                 <button
                    onClick={() => setPlayingVideo(null)}
                    className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} weight="bold" />
                  </button>
              </div>

              <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      handleToggleEpisode(playingVideo.id);
                    }}
                    className={`flex items-center gap-4 px-10 py-5 rounded-[2rem] font-black text-sm tracking-[0.2em] transition-all shadow-2xl ${
                      userData.watchedEpisodes.includes(playingVideo.id)
                        ? "bg-green-600 text-white shadow-green-900/40"
                        : "bg-white text-black hover:bg-slate-100 shadow-white/10"
                    }`}
                  >
                    {userData.watchedEpisodes.includes(playingVideo.id) ? (
                      <CheckCircle weight="fill" size={24} />
                    ) : (
                      <Circle weight="bold" size={24} />
                    )}
                    {userData.watchedEpisodes.includes(playingVideo.id) ? "İZLENDİ OLARAK İŞARETLENDİ" : "İZLENDİ OLARAK İŞARETLE"}
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SeriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    }>
      <SeriesDetailContent />
    </Suspense>
  );
}
