"use client";

import { useEffect, useMemo, useState } from "react";
import { Ticket, MapPin } from "@phosphor-icons/react";
import Client, { film_graph } from "@/lib/client";
import { ACCENT } from "../film-data";
import { getEncoreApiBase } from "@/lib/api";

interface SessionsTabProps {
  onFilmClick?: (tmdbId: string) => void;
}

const client = new Client(getEncoreApiBase());

export default function SessionsTab({ onFilmClick }: SessionsTabProps) {
  const [cineverseMovies, setCineverseMovies] = useState<film_graph.CineverseMovie[]>([]);
  const [cineverseSessions, setCineverseSessions] = useState<film_graph.CineverseSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCineverseData(selectedDate);
  }, [selectedDate]);

  const fetchCineverseData = async (dateStr: string) => {
    try {
      setLoading(true);
      const moviesRes = await client.film_graph.getCineverseMovies();
      setCineverseMovies(moviesRes.movies || []);
      
      const sessionsRes = await client.film_graph.getCineverseSessions({ date: dateStr, theaterSlug: "piazza-kahramanmaras" });
      setCineverseSessions(sessionsRes.sessions || []);
    } catch (e) {
      console.error("Fetch Cineverse error:", e);
    } finally {
      setLoading(false);
    }
  };

  const next7Days = useMemo(() => {
    const dates = [];
    const daysOfWeek = ["PAZ", "PZT", "SALI", "ÇRS", "PRS", "CUMA", "CMT"];
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      // Use local timezone values to build YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
      const dayOfWeekLabel = daysOfWeek[d.getDay()];
      dates.push({ dateString, dayLabel, dayOfWeekLabel });
    }
    return dates;
  }, []);

  const groupedSessions = useMemo(() => {
    return cineverseSessions.reduce((acc: Record<string, typeof cineverseSessions>, s) => {
      if (!acc[s.movie_title]) acc[s.movie_title] = [];
      acc[s.movie_title].push(s);
      return acc;
    }, {});
  }, [cineverseSessions]);

  const sortedGroupedSessions = useMemo(() => {
    const entries = Object.entries(groupedSessions);
    // Sort descending by number of sessions
    entries.sort((a, b) => b[1].length - a[1].length);
    return entries;
  }, [groupedSessions]);

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="text-center py-2 bg-app-surface-muted/40 rounded-xl border border-app-border/40">
        <p className="text-[10px] font-black tracking-widest text-app-muted uppercase flex items-center justify-center gap-1.5">
          <MapPin size={12} weight="fill" style={{ color: ACCENT }} />
          <span>Piazza Kahramanmaraş Paribu Cineverse</span>
        </p>
      </div>

      {/* Horizontal Date Picker */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
        {next7Days.map((d) => {
          const isSelected = selectedDate === d.dateString;
          return (
            <button
              key={d.dateString}
              type="button"
              onClick={() => setSelectedDate(d.dateString)}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-app-tab-active border-app-border text-app-text shadow-sm"
                  : "bg-app-surface/60 border-app-border/50 text-app-muted hover:text-app-text hover:bg-app-surface"
              }`}
            >
              <span className="text-[8px] font-black tracking-widest opacity-60">{d.dayOfWeekLabel}</span>
              <span className="text-xs font-black mt-0.5">{d.dayLabel.split(' ')[0]}</span>
              <span className="text-[7px] font-black uppercase mt-0.5">{d.dayLabel.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Sessions Content */}
      {loading ? (
        <div className="text-center py-20 text-app-muted text-[10px] font-black uppercase tracking-widest animate-pulse">
          Seanslar yükleniyor...
        </div>
      ) : cineverseSessions.length === 0 ? (
        <div className="text-center py-16 bg-app-surface/40 border border-dashed border-app-border rounded-2xl p-6 shadow-xs">
          <Ticket size={32} className="text-app-muted mx-auto mb-3" />
          <p className="text-xs font-black text-app-text uppercase tracking-wider">Bugün için seans bulunamadı.</p>
          <p className="text-[10px] text-app-muted mt-1">İleriki günleri seçebilir veya daha sonra tekrar kontrol edebilirsiniz.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedGroupedSessions.map(([movieTitle, sessions]) => {
            const movieInfo = cineverseMovies.find(m => m.title === movieTitle);
            return (
              <div 
                key={movieTitle}
                className="bg-app-surface border border-app-border rounded-2xl p-4 flex gap-4 shadow-xs relative overflow-hidden"
              >
                {/* Left: Poster */}
                <div 
                  className={`w-[80px] sm:w-[90px] aspect-[2/3] border border-app-border rounded-lg bg-app-surface-muted/30 overflow-hidden flex-shrink-0 flex items-center justify-center ${movieInfo?.tmdb_id && onFilmClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                  onClick={() => {
                    if (movieInfo?.tmdb_id && onFilmClick) {
                      onFilmClick(String(movieInfo.tmdb_id));
                    }
                  }}
                >
                  {movieInfo?.image_url ? (
                    <img 
                      src={movieInfo.image_url} 
                      alt={movieTitle} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Ticket size={24} className="text-app-muted" />
                  )}
                </div>

                {/* Right: Info & Sessions */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h2 
                      className={`text-xs sm:text-sm font-black text-app-text uppercase tracking-tight leading-tight mb-1 truncate ${movieInfo?.tmdb_id && onFilmClick ? 'cursor-pointer hover:underline decoration-amber-500' : ''}`}
                      onClick={() => {
                        if (movieInfo?.tmdb_id && onFilmClick) {
                          onFilmClick(String(movieInfo.tmdb_id));
                        }
                      }}
                    >
                      {movieTitle}
                    </h2>
                    <div className="flex items-center text-[8px] font-black text-app-muted uppercase tracking-wider mb-2">
                      {movieInfo?.genre && <span>{movieInfo.genre}</span>}
                      {movieInfo?.genre && movieInfo?.duration && <span className="mx-1">•</span>}
                      {movieInfo?.duration && <span>{movieInfo.duration}</span>}
                    </div>
                    {movieInfo?.description && (
                      <p className="text-[10px] font-medium text-app-muted leading-relaxed line-clamp-2 mb-3">
                        {movieInfo.description}
                      </p>
                    )}
                  </div>

                  {/* Sessions Grid */}
                  <div>
                    <div className="flex flex-wrap gap-1.5">
                      {sessions.map((s, sIdx) => {
                        const isPast = !s.booking_url;
                        return isPast ? (
                          <span 
                            key={sIdx}
                            className="px-2 py-1 border border-app-border/40 text-app-muted/30 font-black text-[9px] tracking-wider line-through bg-app-surface-muted/20 rounded cursor-not-allowed"
                            title="Geçmiş Seans"
                          >
                            {s.time}
                          </span>
                        ) : (
                          <a 
                            key={sIdx}
                            href={s.booking_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-app-surface-muted text-app-text border border-app-border hover:bg-app-surface font-black text-[9px] tracking-wider transition-colors rounded shadow-xs"
                          >
                            {s.time}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
