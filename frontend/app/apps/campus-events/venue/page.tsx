"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CaretLeft, 
  MapPin, 
  Calendar, 
  Megaphone, 
  InstagramLogo,
  Globe,
  Phone,
  Info
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { campus_events, business } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import toast, { Toaster } from "react-hot-toast";

const client = createBrowserClient();

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function VenueDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const venueId = searchParams.get("id");
  
  const [venue, setVenue] = useState<business.Business | null>(null);
  const [events, setEvents] = useState<campus_events.CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) {
      toast.error("Mekan ID'si bulunamadı.");
      router.push("/apps/campus-events");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [venueRes, eventsRes] = await Promise.all([
          client.business.getBusiness(venueId),
          client.campus_events.getEvents({ businessId: venueId })
        ]);

        setVenue(venueRes.business);
        setEvents(eventsRes.events);
      } catch (err) {
        console.error("Error fetching venue data:", err);
        toast.error("Mekan bilgileri yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [venueId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Info size={48} className="text-slate-200 mb-4" />
        <h1 className="text-xl font-black text-slate-800 mb-2">Mekan Bulunamadı</h1>
        <p className="text-slate-500 mb-6">Aradığınız mekan sistemde kayıtlı olmayabilir.</p>
        <button 
          onClick={() => router.push("/apps/campus-events")}
          className="bg-[#00aeef] text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all"
        >
          Etkinliklere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800 font-sans antialiased">
      <Toaster position="top-center" />

      {/* Header / Cover Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        {venue.header_url ? (
          <img 
            src={venue.header_url} 
            alt={venue.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Megaphone size={64} className="text-slate-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/20"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        {/* Venue Info Overlay */}
        <div className="absolute bottom-8 left-6 right-6">
          <div className="flex items-end gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl md:rounded-3xl bg-white p-1 shadow-2xl overflow-hidden shrink-0">
              {venue.logo_url ? (
                <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-cover rounded-[inherit]" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[inherit]">
                  <span className="text-2xl font-black text-slate-200">{venue.name[0]}</span>
                </div>
              )}
            </div>
            <div className="mb-1 md:mb-2">
              <h1 className="text-2xl md:text-4xl font-[900] text-white leading-tight drop-shadow-md">
                {venue.name}
              </h1>
              <div className="flex items-center gap-2 text-white/90 text-sm md:text-base font-bold mt-1">
                <MapPin size={16} weight="fill" className="text-[#00aeef]" />
                <span className="drop-shadow-sm">Kampüs İçi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Events */}
          <div className="lg:col-span-2">
            <h2 className="text-xl md:text-2xl font-[900] text-slate-800 mb-8 flex items-center gap-3">
              <Calendar size={24} weight="bold" className="text-[#00aeef]" />
              Mekandaki Etkinlikler
            </h2>

            {events.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center flex flex-col items-center">
                <Megaphone size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">Bu mekanda şu an planlanmış bir etkinlik bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={event.id}
                    className="group flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl mb-4 shadow-sm">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                          <Megaphone size={48} className="text-slate-200" />
                        </div>
                      )}
                    </div>
                    <div className="px-1">
                      <h3 className="text-lg font-[900] text-slate-800 leading-tight mb-2 group-hover:text-[#00aeef] transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="text-slate-400 text-xs font-bold">
                        {formatDate(event.event_date)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: About & Contact */}
          <div className="space-y-8">
            <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
              <h3 className="text-lg font-[900] text-slate-800 mb-4 flex items-center gap-2">
                <Info size={20} weight="bold" className="text-[#00aeef]" />
                Hakkında
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {venue.description || "Bu mekan hakkında henüz bir açıklama girilmemiş."}
              </p>
            </section>

            <section className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
              <h3 className="text-lg font-[900] text-slate-800 mb-6 flex items-center gap-2">
                <Phone size={20} weight="bold" className="text-[#00aeef]" />
                İletişim
              </h3>
              <div className="space-y-4">
                {venue.contact_info?.instagram && (
                  <a 
                    href={`https://instagram.com/${venue.contact_info.instagram}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-[#00aeef] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-[#00aeef]/20">
                      <InstagramLogo size={20} weight="bold" />
                    </div>
                    <span className="text-sm font-bold">@{venue.contact_info.instagram}</span>
                  </a>
                )}
                {venue.contact_info?.website && (
                  <a 
                    href={venue.contact_info.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-600 hover:text-[#00aeef] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-[#00aeef]/20">
                      <Globe size={20} weight="bold" />
                    </div>
                    <span className="text-sm font-bold">Web Sitesi</span>
                  </a>
                )}
                {!venue.contact_info?.instagram && !venue.contact_info?.website && (
                  <p className="text-slate-400 text-xs font-bold italic">İletişim bilgisi bulunmuyor.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VenueDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    }>
      <VenueDetailContent />
    </Suspense>
  );
}
