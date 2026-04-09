"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookmarkSimple, 
  Television, 
  CircleNotch, 
  Trash,
  Play,
  CheckCircle,
  HourglassSimple,
  ArrowArcLeft
} from "@phosphor-icons/react";
import SeriesCard from "../components/SeriesCard";
import { fetchSeries } from "../lib/api";
import { getUserStore, getWatchProgress, toggleWatchlist } from "../lib/store";
import type { Series } from "../lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function ListemPage() {
  const [store, setStore] = useState<any>({});
  const [allSeriesData, setAllSeriesData] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchSeries();
        setAllSeriesData(data || []);
        setStore(getUserStore());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refresh = () => setStore(getUserStore());

  const watchlistIds = Object.keys(store).filter((id) => store[id]?.inWatchlist);
  const watchlistSeries = allSeriesData.filter((s) => watchlistIds.includes(s.id));

  const inProgressSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    if (!data) return false;
    const watched = data.watchedEpisodes.length;
    return watched > 0 && watched < (s.episodes?.length || s.episodeCount || 0);
  });

  const notStartedSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    return !data || data.watchedEpisodes.length === 0;
  });

  const completedSeries = watchlistSeries.filter((s) => {
    const data = store[s.id];
    if (!data) return false;
    return data.watchedEpisodes.length >= (s.episodes?.length || s.episodeCount || 0);
  });

  const handleRemove = (seriesId: string) => {
    toggleWatchlist(seriesId);
    refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-950 gap-6">
        <CircleNotch size={48} className="animate-spin text-red-600" />
        <span className="text-xs font-black tracking-[0.4em] uppercase text-slate-500">Listeniz Hazırlanıyor</span>
      </div>
    );
  }

  if (watchlistSeries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center mb-8">
          <BookmarkSimple size={48} className="text-slate-700 font-bold" />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Listeniz Boş</h1>
        <p className="text-slate-500 font-medium max-w-sm mb-8">
          Henüz takip ettiğiniz bir seri yok. Keşfet sayfasından favorilerinizi eklemeye başlayın!
        </p>
        <Link
          href="/apps/youtube-discover/kesfet"
          className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-red-900/40 uppercase"
        >
          İçeri̇kleri̇ Keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
       {/* Background Glow */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
       </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 lg:py-20">
        
        <header className="mb-16">
            <div className="flex items-center gap-3 mb-4">
               <Television size={24} weight="fill" className="text-blue-500" />
               <span className="text-xs font-black tracking-[0.3em] uppercase text-slate-500">KİŞİSEL REHBER</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">Listem</h1>
            <p className="text-slate-500 text-lg font-medium tracking-tight">
               {watchlistSeries.length} seriyi yakından takip ediyorsun.
            </p>
        </header>

        <div className="space-y-20">
          {inProgressSeries.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Play size={14} weight="fill" className="text-yellow-500" />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-widest italic">İzlemeye Devam Et</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {inProgressSeries.map((s) => (
                  <div key={s.id} className="relative group">
                    <SeriesCard series={s} />
                    <div className="mt-4 px-2">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İLERLEME</span>
                         <span className="text-[10px] font-black text-white">%{getWatchProgress(s.id, s.episodes?.length || s.episodeCount || 0)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5 border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${getWatchProgress(s.id, s.episodes?.length || s.episodeCount || 0)}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="absolute -right-3 -top-3 p-3 bg-slate-900 border border-white/10 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110 shadow-2xl z-20"
                    >
                      <Trash weight="bold" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {notStartedSeries.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <HourglassSimple size={14} weight="fill" className="text-blue-500" />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Sırada Bekleyenler</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {notStartedSeries.map((s) => (
                  <div key={s.id} className="relative group">
                    <SeriesCard series={s} />
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="absolute -right-3 -top-3 p-3 bg-slate-900 border border-white/10 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110 shadow-2xl z-20"
                    >
                      <Trash weight="bold" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {completedSeries.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle size={14} weight="fill" className="text-green-500" />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Tamamlananlar</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {completedSeries.map((s) => (
                  <div key={s.id} className="relative group opacity-60 hover:opacity-100 transition-opacity">
                    <SeriesCard series={s} />
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="absolute -right-3 -top-3 p-3 bg-slate-900 border border-white/10 rounded-full text-slate-500 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500 hover:scale-110 shadow-2xl z-20"
                    >
                      <Trash weight="bold" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
        
        <div className="mt-20 pt-12 border-t border-white/5 text-center">
             <Link href="/apps/youtube-discover/kesfet" className="text-slate-500 hover:text-white font-black text-[10px] tracking-[0.3em] uppercase transition-colors flex items-center justify-center gap-2">
                <ArrowArcLeft weight="bold" />
                Daha Fazla Seri Keşfet
             </Link>
        </div>
      </div>
    </div>
  );
}
