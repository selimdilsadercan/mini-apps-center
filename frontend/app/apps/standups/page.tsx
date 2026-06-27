"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import { standups } from "@/lib/client";
import { 
  Microphone, 
  Calendar, 
  MapPin, 
  Ticket, 
  YoutubeLogo, 
  InstagramLogo,
  CaretRight,
  Play,
  Plus
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";

const client = createBrowserClient();

// Standups public page implementation
export default function StandupsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<standups.Show[]>([]);
  const [comedians, setComedians] = useState<standups.Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComedian, setSelectedComedian] = useState<standups.Comedian | null>(null);
  const [comedianDetails, setComedianDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [showsRes, comediansRes] = await Promise.all([
          client.standups.listUpcomingShows(),
          client.standups.listComedians()
        ]);
        setShows(showsRes.shows);
        setComedians(comediansRes.comedians);
      } catch (err) {
        console.error("Failed to fetch standup data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleComedianClick = async (comedian: standups.Comedian) => {
    setSelectedComedian(comedian);
    try {
      const details = await client.standups.getComedianDetails(comedian.id);
      setComedianDetails(details);
    } catch (err) {
      console.error("Failed to fetch comedian details:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-yellow-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 font-sans pb-20 selection:bg-yellow-100">
      {/* Subtle Premium Background Blur (Light) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-10 bg-yellow-200" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[100px] opacity-10 bg-orange-100" />
      </div>

      {/* Header */}
      <header className="px-6 pt-12 pb-8 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all bg-white px-3.5 py-2 rounded-xl border border-gray-200/60 h-9 shadow-sm"
          >
            <Microphone size={16} weight="fill" className="text-yellow-500 shrink-0" />
            <span className="text-xs font-bold">Geri Dön</span>
          </button>
        </div>
        
        <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
          <Microphone size={24} weight="fill" className="text-stone-950" />
        </div>
      </header>

      <div className="px-6 mb-10 relative z-10">
        <h1 className="text-4xl font-black tracking-tighter mb-2 text-gray-900 uppercase">Standups</h1>
        <p className="text-gray-500 text-sm font-medium">Şehrindeki en iyi gösterileri keşfet.</p>
      </div>

      {/* Featured Comedians Horizontal Scroll */}
      <section className="mb-10 relative z-10">
        <div className="px-6 mb-4 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Komedyenler</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar">
          {comedians.map((comedian) => (
            <motion.button
              key={comedian.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleComedianClick(comedian)}
              className="flex flex-col items-center gap-2 shrink-0 group"
            >
              <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 overflow-hidden relative shadow-sm group-hover:border-yellow-400 transition-colors">
                {comedian.image_url ? (
                  <img src={comedian.image_url} alt={comedian.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-gray-200">
                    {comedian.name.charAt(0)}
                  </div>
                )}
                <div className="absolute inset-0 bg-yellow-400/0 group-hover:bg-yellow-400/5 transition-colors" />
              </div>
              <span className="text-[11px] font-bold text-gray-500 max-w-[80px] text-center truncate">{comedian.name}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Upcoming Shows */}
      <section className="px-6 relative z-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Yaklaşan Gösteriler</h2>
        <div className="space-y-4">
          {shows.map((show) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200/50 rounded-[2rem] p-5 flex gap-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-20 h-24 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                {(show as any).comedian_image ? (
                  <img src={(show as any).comedian_image} alt={(show as any).comedian_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Microphone size={32} className="text-gray-200" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-lg font-black leading-tight mb-1 truncate text-gray-900">{show.title}</h3>
                  <p className="text-yellow-600 text-xs font-black uppercase tracking-wider">{(show as any).comedian_name}</p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={14} />
                    <span className="text-[11px] font-bold">
                      {format(new Date(show.show_date), "d MMMM EEEE, HH:mm", { locale: tr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={14} />
                    <span className="text-[11px] font-bold truncate">{show.venue_name || "Mekan Belirtilmedi"}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                {show.ticket_url && (
                  <a 
                    href={show.ticket_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-stone-950 shadow-lg shadow-yellow-400/20 active:scale-90 transition-transform"
                  >
                    <Ticket size={24} weight="fill" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comedian Detail Drawer (Modal) */}
      <AnimatePresence>
        {selectedComedian && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComedian(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#FAF9F7] rounded-t-[3rem] z-[60] max-h-[90vh] overflow-y-auto no-scrollbar outline-none border-t border-gray-200 shadow-2xl"
            >
              <div className="p-8">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-3xl bg-white border border-gray-200 overflow-hidden shrink-0 shadow-lg">
                    {selectedComedian.image_url ? (
                      <img src={selectedComedian.image_url} alt={selectedComedian.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-200">
                        {selectedComedian.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2 text-gray-900">{selectedComedian.name}</h2>
                    <div className="flex gap-3">
                      {selectedComedian.instagram_username && (
                        <a 
                          href={`https://instagram.com/${selectedComedian.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-pink-500 transition-colors"
                        >
                          <InstagramLogo size={18} weight="fill" />
                          <span>@{selectedComedian.instagram_username}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {selectedComedian.bio && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 font-medium italic">
                    "{selectedComedian.bio}"
                  </p>
                )}

                {/* Comedian Videos */}
                {comedianDetails?.videos?.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                      <YoutubeLogo size={18} weight="fill" className="text-red-500" />
                      Öne Çıkan İçerikler
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {comedianDetails.videos.map((video: any) => (
                        <a 
                          key={video.id}
                          href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group"
                        >
                          <div className="aspect-video rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden relative mb-2">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play size={32} weight="fill" className="text-gray-200" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center">
                                <Play size={20} weight="fill" className="text-white" />
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] font-bold text-gray-600 line-clamp-2 leading-snug">{video.title}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comedian Shows */}
                {comedianDetails?.shows?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Tüm Gösteriler</h3>
                    <div className="space-y-3">
                      {comedianDetails.shows.map((show: any) => (
                        <div 
                          key={show.id}
                          className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-black mb-1 text-gray-900">{show.title}</p>
                            <p className="text-[10px] font-bold text-gray-400">
                              {format(new Date(show.show_date), "d MMMM yyyy", { locale: tr })} • {show.venue_name}
                            </p>
                          </div>
                          {show.ticket_url && (
                            <a 
                              href={show.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                            >
                              BİLET AL
                              <CaretRight size={12} weight="bold" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => setSelectedComedian(null)}
                  className="w-full mt-12 py-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl transition-colors shadow-sm"
                >
                  KAPAT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Dashboard */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push("/dashboard/standups")}
        className="fixed bottom-8 right-6 w-14 h-14 bg-yellow-400 rounded-2xl shadow-2xl shadow-yellow-400/20 flex items-center justify-center text-stone-950 z-40 border-2 border-white/20"
      >
        <Plus size={28} weight="bold" />
      </motion.button>
    </div>
  );
}
