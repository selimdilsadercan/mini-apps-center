"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  Star, 
  TrendUp, 
  CaretRight, 
  Monitor, 
  FilmStrip, 
  Ghost, 
  BookOpen, 
  GameController, 
  Flask, 
  MusicNotes, 
  Smiley, 
  Cpu,
  Microphone
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import SeriesCard from "./components/SeriesCard";
import { CATEGORY_LABELS, type Category, type Series } from "./lib/types";
import { fetchSeries } from "./lib/api";

const categoryIcons: Record<Category, React.ReactNode> = {
  "talk-show": <Microphone weight="fill" className="w-6 h-6" />,
  macera: <FilmStrip weight="fill" className="w-6 h-6" />,
  korku: <Ghost weight="fill" className="w-6 h-6" />,
  egitim: <BookOpen weight="fill" className="w-6 h-6" />,
  eglence: <Monitor weight="fill" className="w-6 h-6" />,
  oyun: <GameController weight="fill" className="w-6 h-6" />,
  bilim: <Flask weight="fill" className="w-6 h-6" />,
  muzik: <MusicNotes weight="fill" className="w-6 h-6" />,
  komedi: <Smiley weight="fill" className="w-6 h-6" />,
  teknoloji: <Cpu weight="fill" className="w-6 h-6" />,
};

const categoryGradients: Record<Category, string> = {
  "talk-show": "from-purple-600 to-pink-500",
  macera: "from-red-600 to-orange-500",
  korku: "from-slate-800 to-purple-900",
  egitim: "from-yellow-500 to-orange-500",
  eglence: "from-green-500 to-teal-400",
  oyun: "from-red-500 to-purple-600",
  bilim: "from-cyan-500 to-blue-600",
  muzik: "from-amber-500 to-red-500",
  komedi: "from-orange-500 to-yellow-400",
  teknoloji: "from-emerald-500 to-cyan-500",
};

export default function YouTubeDiscoverPage() {
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSeries();
      setAllSeries(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
    </div>
  );

  const featured = allSeries[0];
  const trending = [...allSeries].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 6);
  const ongoing = allSeries.filter(s => s.status === "devam-ediyor");

  return (
    <div className="flex flex-col gap-12 pb-32 overflow-x-hidden">
      {/* --- HERO SECTION --- */}
      {featured && (
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-end">
          {/* Background Image/Gradient */}
          <div className="absolute inset-0 z-0">
             <div className={`absolute inset-0 bg-gradient-to-br ${featured.gradient || 'from-zinc-900 to-black'} opacity-80`} />
             <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
             <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-950/90 to-transparent" />
             
             {/* Simple Glass effect */}
             <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-2 text-red-500 font-black tracking-[0.2em] text-xs uppercase mb-4 drop-shadow-lg">
                <TrendUp size={20} weight="bold" />
                <span>Haftanın En Çok İzleneni</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6 drop-shadow-2xl">
                {featured.title}
              </h1>
              
              <p className="text-lg text-slate-300 leading-relaxed mb-8 line-clamp-3 font-medium opacity-90">
                {featured.description}
              </p>

              <div className="flex items-center gap-8 mb-10 text-slate-400 font-bold text-sm tracking-wide">
                <div className="flex items-center gap-1.5">
                  <Star weight="fill" className="text-amber-400 w-5 h-5" />
                  <span className="text-white">{featured.avgRating.toFixed(1)}</span>
                </div>
                <span>{featured.episodeCount} Bölüm</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-white text-[10px] tracking-[0.1em] uppercase border border-white/10">
                  {featured.year}
                </span>
                <span className="text-red-500">{featured.creator}</span>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href={`/apps/youtube-discover/seri/${featured.id}`}
                  className="flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-900/40 active:scale-95 group"
                >
                  <Play size={22} weight="fill" />
                  IZLEMEYE BAŞLA
                </Link>
                <Link
                  href="/apps/youtube-discover/kesfet"
                  className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-sm border border-white/10 backdrop-blur-md transition-all active:scale-95"
                >
                  DETAYLAR
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* --- TRENDING ROWS --- */}
      <section className="px-6 lg:px-8 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          
          {/* Trending Now */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Popüler Seriler</h2>
              <Link href="/apps/youtube-discover/kesfet" className="text-xs font-black tracking-widest text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 uppercase">
                TÜMÜ <CaretRight weight="bold" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x hide-scrollbar">
              {trending.map((s) => (
                <div key={s.id} className="w-[320px] shrink-0 snap-start">
                  <SeriesCard series={s} />
                </div>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="space-y-8 py-10">
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Türlere Göre Göz At</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/apps/youtube-discover/kesfet?category=${key}`}
                  className="group relative h-32 rounded-3xl overflow-hidden border border-white/5 transition-all hover:border-white/20 hover:-translate-y-1 shadow-2xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${categoryGradients[key as Category]} opacity-40 group-hover:opacity-80 transition-opacity`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                      {categoryIcons[key as Category]}
                    </div>
                    <span className="font-black text-[10px] tracking-[0.2em] uppercase text-white drop-shadow-md">
                      {label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Ongoing Series */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Yayınlanmaya Devam Edenler</h2>
              <Link href="/apps/youtube-discover/kesfet?status=ongoing" className="text-xs font-black tracking-widest text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1 uppercase">
                TÜMÜ <CaretRight weight="bold" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x hide-scrollbar">
              {ongoing.map((s) => (
                <div key={s.id} className="w-[320px] shrink-0 snap-start">
                  <SeriesCard series={s} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
