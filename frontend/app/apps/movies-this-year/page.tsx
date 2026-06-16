"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Star, 
  ArrowLeft,
  CaretLeft,
  CaretRight
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { movies_this_year } from "@/lib/client";
import { useUser } from "@clerk/clerk-react";

const client = createBrowserClient();

// Month names in Turkish
const MONTHS = [
  "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
  "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK"
];

const DAYS = ["PZT", "SALI", "ÇRS", "PRS", "CUMA", "CMT", "PAZ"];

export default function MoviesThisYear() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [movies, setMovies] = useState<movies_this_year.Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date('2026-05-01').getMonth()); // Default to May for visual similarity
  const [currentYear] = useState(2026);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchMovies();
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [isUserLoaded, user]);

  const fetchMovies = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const response = await client.movies_this_year.getMoviesThisYear(user.id);
      setMovies(response.movies);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError("Takvim yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0: Sunday, 1: Monday... -> Convert to 0: Monday
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Group movies by day for the current month
  const getMoviesForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return movies.filter(m => m.releaseDate === dateStr);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-8 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-red-600 font-black tracking-widest uppercase">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] relative overflow-hidden font-sans">
      {/* Background Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        {/* Navigation & Header */}
        <div className="flex flex-col items-center mb-8">
          <Link 
            href="/discover"
            className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft weight="bold" />
            KEŞFET'E DÖN
          </Link>

          <div className="flex items-center justify-between w-full mb-4">
            <button 
              onClick={() => setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1))}
              className="p-2 hover:bg-red-600/10 rounded-full transition-colors group"
            >
              <CaretLeft size={48} weight="fill" className="text-red-600 group-hover:scale-110 transition-transform" />
            </button>
            
            <h1 className="text-7xl md:text-9xl font-black text-red-600 tracking-tighter leading-none select-none drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">
              {MONTHS[currentMonth]}
            </h1>

            <button 
              onClick={() => setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1))}
              className="p-2 hover:bg-red-600/10 rounded-full transition-colors group"
            >
              <CaretRight size={48} weight="fill" className="text-red-600 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="text-xl font-black text-red-600 tracking-[0.5em] mb-12">
            {currentYear}
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="relative border-[6px] border-red-600 rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-sm shadow-[20px_20px_0px_rgba(220,38,38,0.1)]">
          
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b-[4px] border-red-600 bg-red-600">
            {DAYS.map(day => (
              <div key={day} className="py-3 text-center text-white font-black text-sm md:text-lg tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square border-r-[2px] border-b-[2px] border-red-600/20 last:border-r-0"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayMovies = getMoviesForDay(dayNum);
              const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth;

              // Mode Selection: If < 7 movies in month, use "Preview Mode"
              const monthMoviesRaw = movies.filter(m => new Date(m.releaseDate).getMonth() === currentMonth);
              const isPreviewMode = monthMoviesRaw.length < 7;
              
              let monthMovies: movies_this_year.Movie[] = [];
              if (isPreviewMode) {
                // In preview mode, all movies get a sticker
                monthMovies = monthMoviesRaw;
              } else {
                // Standard mode: No automatic stickers, only text list
                monthMovies = [];
              }
              
              const isHeroMovie = isPreviewMode && dayMovies.some(m => monthMovies.find(hero => hero.id === m.id));

              return (
                <div 
                  key={dayNum} 
                  className={`relative aspect-square border-r-[2px] border-b-[2px] border-red-600/20 last:border-r-0 flex flex-col p-2 group transition-all hover:bg-red-600/5 ${isToday ? 'bg-red-600/20' : ''}`}
                >
                  <span className={`text-lg md:text-2xl font-black z-20 ${dayMovies.length > 0 ? 'text-red-600' : 'text-red-600/40'}`}>
                    {String(dayNum).padStart(2, '0')}
                  </span>

                  <div className="flex-1 overflow-hidden mt-1 flex flex-col gap-2 z-10">
                    {dayMovies.map(movie => (
                      <div key={movie.id} className="relative group/movie flex items-start gap-1">
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-600 mt-1 flex-shrink-0 shadow-sm"></div>
                        <div className="text-[7px] md:text-[9px] font-black leading-tight text-red-900 uppercase line-clamp-2">
                          {movie.title}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hover Popup (Sticker Explosion for any day) - Wide Scatter (Only on Hover) */}
                  <div className="absolute inset-0 z-[100] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
                    <AnimatePresence>
                      {dayMovies.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                        {dayMovies.slice(0, 4).map((movie, idx) => {
                          // Aggressive scatter directions
                          const variants = [
                            { x: -110, y: -130, r: -8 }, // North West
                            { x: 110, y: -130, r: 8 },   // North East
                            { x: -110, y: 130, r: -12 }, // South West
                            { x: 110, y: 130, r: 12 }    // South East
                          ];
                          const pos = variants[idx % variants.length];

                          return (
                            <motion.div 
                              key={movie.id}
                              initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 }}
                              whileHover={{ scale: 1.1, zIndex: 50 }}
                              animate={{ 
                                opacity: 1, 
                                scale: 1, 
                                x: pos.x, 
                                y: pos.y, 
                                rotate: pos.r,
                                transition: { type: "spring", stiffness: 300, damping: 20, delay: idx * 0.05 }
                              }}
                              exit={{ opacity: 0, scale: 0.5, x: 0, y: 0, transition: { duration: 0.2 } }}
                              className="absolute bg-white border-[4px] border-red-600 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 w-[140px] md:w-[170px] pointer-events-auto"
                            >
                            <img 
                              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} 
                              alt={movie.title}
                              className="w-full h-auto aspect-[2/3] object-cover"
                            />
                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-black rotate-12 border-[3px] border-white shadow-xl">
                              {movie.voteAverage.toFixed(1)}
                            </div>
                              <div className="bg-red-600 text-white text-[8px] md:text-[10px] font-black uppercase p-2 mt-1 leading-tight border-t-2 border-white min-h-[30px] flex items-center justify-center text-center">
                                <span className="line-clamp-2">{movie.title}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AnimatePresence>
                  </div>

                  {/* Cutout Sticker Effect (Mode Dependent) */}
                  {isHeroMovie && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                      {dayMovies.filter(m => monthMovies.some(h => h.id === m.id)).map((movie) => (
                        <motion.div 
                          key={`hero-${movie.id}`}
                          initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                          animate={{ scale: 1, opacity: 1, rotate: dayNum % 2 === 0 ? 3 : -3 }}
                          className={`relative drop-shadow-[0_15px_25px_rgba(0,0,0,0.4)] ${isPreviewMode ? 'w-[140%] h-[140%] -m-[20%]' : 'w-[100%]'}`}
                        >
                          <div className={`bg-white border-white rounded shadow-2xl overflow-hidden ring-red-600/40 ${isPreviewMode ? 'border-[8px] ring-[4px]' : 'border-[6px] ring-[2px]'}`}>
                            <img 
                              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                              alt={movie.title}
                              className="w-full aspect-[2/3] object-cover grayscale-[0.2] contrast-[1.1]"
                            />
                          </div>
                          {/* Label with Movie Title */}
                          <div className={`absolute -bottom-2 right-0 left-0 bg-red-600 text-white border-2 border-white shadow-xl rotate-1 flex items-center justify-center px-1 py-1 mx-1 ${isPreviewMode ? 'min-h-[32px] -bottom-4' : 'min-h-[28px]'}`}>
                            <span className={`font-black uppercase text-center line-clamp-2 ${isPreviewMode ? 'text-[9px] md:text-[10px] leading-tight' : 'text-[7px] md:text-[8px] leading-[0.8rem]'}`}>
                              {movie.title}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Poster Footnote */}
        <div className="mt-12 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-4xl font-black text-red-600/20 italic select-none">ARAKAT</span>
            <span className="text-[10px] font-bold text-red-800/40 tracking-[0.5em] uppercase">Cinema Database 2026</span>
          </div>
          <div className="text-right">
             <div className="text-[8px] font-black text-red-800/60 uppercase tracking-tighter max-w-[150px]">
               Tüm tarihler global vizyon takvimine göre düzenlenmiştir. Yerel değişiklikler olabilir.
             </div>
          </div>
        </div>

      </div>

      {/* Decorative Crumpled Effect (SVG Filter) */}
      <svg className="hidden">
        <filter id="grainy">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
        
        body {
          background-color: #f4f1ea;
          font-family: 'Inter', sans-serif;
        }

        .calendar-cell-active {
          box-shadow: inset 0 0 40px rgba(220,38,38,0.05);
        }

        /* Paper texture overlay */
        .paper-overlay {
          background-image: url("https://www.transparenttextures.com/patterns/handmade-paper.png");
        }
      `}</style>
    </div>
  );
}
