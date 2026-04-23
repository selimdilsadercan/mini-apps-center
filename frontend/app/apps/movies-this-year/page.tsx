"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Star, 
  Info,
  ArrowLeft,
  FilmStrip,
  CaretRight
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "framer-motion";
import Client, { movies_this_year, Local } from "@/lib/client";

// Initialize client
const client = new Client(Local);

// Types for grouping
interface DateGroup {
  date: string;
  movies: movies_this_year.Movie[];
}

export default function MoviesThisYear() {
  const [movies, setMovies] = useState<movies_this_year.Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  // Sayfa yüklendiğinde ve filmler geldiğinde bugüne kaydır
  useEffect(() => {
    if (!loading && movies.length > 0) {
      // Çok kısa bir gecikme DOM'un tam yerleşmesi için iyi olur
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [loading, movies]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await client.movies_this_year.getMoviesThisYear();
      
      // Filter out low-popularity Jan 1st placeholders
      const filteredMovies = response.movies.filter(m => {
        const isJan1st = m.release_date === '2026-01-01';
        // 1 Ocak olanlardan popülaritesi 5'ten küçük olanları placeholder say ve gizle
        if (isJan1st && m.popularity < 5) return false;
        return true;
      });

      setMovies(filteredMovies);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Takvim yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Group movies by date
  const groupedMovies: DateGroup[] = movies.reduce((acc: DateGroup[], movie) => {
    const existingGroup = acc.find(g => g.date === movie.release_date);
    if (existingGroup) {
      existingGroup.movies.push(movie);
    } else {
      acc.push({ date: movie.release_date, movies: [movie] });
    }
    return acc;
  }, []);

  // Bugünün tarihini bul veya bugünden sonraki en yakın tarihi bul
  const getTodayOrNextDate = () => {
    const now = new Date('2026-04-23'); // Sistem tarihini baz alıyoruz
    const dates = groupedMovies.map(g => new Date(g.date));
    const futureDates = dates.filter(d => d >= now);
    if (futureDates.length === 0) return null;
    const closest = new Date(Math.min(...futureDates.map(d => d.getTime())));
    return closest.toISOString().split('T')[0];
  };

  const targetDate = getTodayOrNextDate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  const isBlockbuster = (movie: movies_this_year.Movie) => {
    // Popülerlik veya puana göre blockbuster belirle
    return movie.popularity > 50 || movie.vote_average >= 7.5;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-red-600/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-zinc-500 font-bold tracking-[0.3em] uppercase animate-pulse">2026 Takvimi Yükleniyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-red-600 selection:text-white">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-red-600/5 blur-[150px] rounded-full"></div>
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-zinc-800/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-32">
        {/* Header */}
        <header className="mb-24 flex flex-col items-center text-center">
          <Link 
            href="/discover"
            className="mb-8 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-2 group"
          >
            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Keşfet'e Dön
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4">
            RELEASES <span className="text-red-600">2026</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-xs">Full Global Cinema Schedule</p>
        </header>

        {error ? (
          <div className="bg-red-900/10 border border-red-900/30 p-12 rounded-[3rem] text-center backdrop-blur-xl text-white">
             <Info className="w-16 h-16 text-red-600 mx-auto mb-6" />
             <h2 className="text-2xl font-black uppercase mb-2">Veri Alınamadı</h2>
             <p className="text-zinc-500 mb-8">{error}</p>
             <button onClick={fetchMovies} className="px-10 py-4 bg-red-600 rounded-2xl font-black uppercase tracking-tighter italic hover:bg-red-700 transition-all">Tekrar Dene</button>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Vertical Line */}
            <div className="absolute left-0 md:left-[200px] top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent hidden md:block"></div>

            <div className="space-y-32">
              {groupedMovies.map((group) => (
                <div 
                  key={group.date} 
                  ref={group.date === targetDate ? todayRef : null}
                  className="relative grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12 scroll-mt-12"
                >
                  {/* Date Sidebar */}
                  <div className="md:sticky md:top-12 h-fit pr-8 text-right hidden md:block">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                        {new Date(group.date).getFullYear()}
                      </span>
                      <h3 className="text-2xl font-black leading-none uppercase italic tracking-tighter text-white">
                        {new Date(group.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-600 uppercase">
                        {new Date(group.date).toLocaleDateString('tr-TR', { weekday: 'long' })}
                      </span>
                    </div>
                    {/* Timeline Dot */}
                    <div className="absolute -right-[4.5px] top-2 w-2 h-2 rounded-full bg-red-600 ring-4 ring-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.5)]"></div>
                  </div>

                  {/* Mobile Date Header */}
                  <div className="md:hidden flex items-center gap-4 mb-4 border-b border-white/5 pb-4">
                     <div className="w-2 h-2 rounded-full bg-red-600"></div>
                     <h3 className="text-xl font-black uppercase italic tracking-tighter">
                        {formatDate(group.date)}
                     </h3>
                  </div>

                  {/* Movies for this date */}
                  <div className="space-y-12">
                    {group.movies.map((movie, movieIndex) => {
                      const big = isBlockbuster(movie);
                      return (
                        <div
                          key={movie.id}
                          className="group"
                        >
                          {big ? (
                            /* Blockbuster Style */
                            <div className="relative group/card cursor-pointer">
                              <div className="absolute -inset-4 bg-gradient-to-r from-red-600/10 to-transparent rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 blur-xl"></div>
                              <div className="relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md hover:border-white/10 transition-all duration-500 shadow-2xl">
                                <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] items-center">
                                  <div className="aspect-[2/3] lg:aspect-square overflow-hidden">
                                    <img 
                                      src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`} 
                                      alt={movie.title}
                                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-1000"
                                    />
                                  </div>
                                  <div className="p-8 lg:p-12">
                                    <div className="flex items-center gap-3 mb-6">
                                      <span className="px-4 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full italic">Blockbuster</span>
                                      <div className="flex items-center gap-1.5 text-yellow-500 font-black text-sm">
                                        <Star weight="fill" />
                                        {movie.vote_average.toFixed(1)}
                                      </div>
                                    </div>
                                    <h2 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-none mb-6 group-hover/card:text-red-600 transition-colors">
                                      {movie.title}
                                    </h2>
                                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 mb-8 font-medium">
                                      {movie.overview || "Bu büyük yapım için henüz bir detay paylaşılmadı."}
                                    </p>
                                    <div className="flex gap-4">
                                      <button className="flex-1 py-4 bg-white text-black font-black uppercase italic tracking-tighter rounded-2xl hover:bg-zinc-200 transition-all active:scale-95">İncele</button>
                                      <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><FilmStrip weight="bold" size={24} /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Regular Movie Style */
                            <div className="flex gap-6 items-center group/item cursor-pointer p-4 rounded-3xl hover:bg-white/5 transition-all">
                               <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-white/5">
                                 <img 
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                                  />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-lg font-bold text-zinc-200 truncate group-hover/item:text-white transition-colors">{movie.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-zinc-500">
                                       <Star weight="fill" className="text-yellow-600" />
                                       {movie.vote_average.toFixed(1)}
                                    </div>
                                 </div>
                                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Release: {new Date(movie.release_date).toLocaleDateString('tr-TR')}</p>
                                 <p className="text-xs text-zinc-500 line-clamp-1 font-medium italic group-hover/item:text-zinc-400 transition-colors">{movie.overview || "Yakında sinemalarda..."}</p>
                               </div>
                               <button className="p-3 bg-zinc-800 text-zinc-400 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all hover:text-white">
                                  <CaretRight weight="bold" />
                               </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
