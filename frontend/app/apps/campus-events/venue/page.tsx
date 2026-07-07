"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CaretLeft,
  MapPin,
  Calendar,
  Megaphone,
  InstagramLogo,
  Globe,
  Phone,
  Info,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { campus_events, business } from "@/lib/client";
import toast, { Toaster } from "react-hot-toast";

const client = createBrowserClient();
const ACCENT = "#00aeef";

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: TR_MONTHS[d.getMonth()],
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
}

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
          client.campus_events.getEvents({ businessId: venueId }),
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#FAF9F7]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#FAF9F7]">
        <Info size={40} className="text-gray-200 mb-4" />
        <h1 className="text-lg font-black text-gray-900 mb-2">Mekan Bulunamadı</h1>
        <p className="text-gray-500 text-sm mb-6">Aradığınız mekan sistemde kayıtlı olmayabilir.</p>
        <button
          onClick={() => router.push("/apps/campus-events")}
          className="text-white px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all"
          style={{ backgroundColor: ACCENT }}
        >
          Etkinliklere Dön
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 font-sans antialiased">
      <Toaster position="top-center" />

      <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-gray-200/40">
        <div className="flex items-center gap-2 px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all"
          >
            <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
          </button>
          <h1 className="flex-1 min-w-0 text-sm font-black uppercase tracking-tight truncate">Mekan</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-8 max-w-xl mx-auto w-full space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
              {venue.logo_url ? (
                <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xl font-black text-gray-200">{venue.name[0]}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black text-gray-900 leading-snug">{venue.name}</h1>
              <div className="flex items-center gap-1.5 text-gray-400 mt-1 text-[10px] font-medium">
                <MapPin size={12} weight="bold" className="shrink-0" style={{ color: ACCENT }} />
                <span>Kampüs İçi</span>
              </div>
            </div>
          </div>
        </motion.div>

        <section>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5 px-0.5">
            <Calendar size={14} weight="bold" style={{ color: ACCENT }} />
            Etkinlikler
          </h2>

          {events.length === 0 ? (
            <div className="bg-white border border-gray-200/60 rounded-xl p-8 text-center">
              <Megaphone size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">Bu mekanda planlanmış etkinlik yok.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const { day, month, time } = formatEventDate(event.event_date);
                const isPast = new Date(event.event_date) < new Date();

                return (
                  <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={event.id}>
                    <Link
                      href={`/apps/campus-events/event?id=${event.id}`}
                      className="flex gap-3 bg-white border border-gray-200/60 rounded-xl p-3 shadow-sm active:scale-[0.99] transition-all hover:border-sky-200"
                    >
                      <div className="relative shrink-0 w-[72px]">
                        <div className="w-[72px] aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Megaphone size={24} className="text-gray-200" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`absolute -top-1 -left-1 w-10 rounded-lg flex flex-col items-center justify-center py-0.5 shadow-sm border ${
                            isPast ? "bg-gray-100 border-gray-200 text-gray-500" : "bg-white border-gray-200"
                          }`}
                        >
                          <span className="text-xs font-black leading-none">{day}</span>
                          <span className="text-[8px] font-bold uppercase leading-none text-gray-500">{month}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2">{event.title}</h3>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-2 text-[10px] font-medium">
                          <Calendar size={12} weight="bold" className="shrink-0" />
                          <span>{time}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-2 flex items-center gap-1.5">
            <Info size={16} weight="bold" style={{ color: ACCENT }} />
            Hakkında
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed font-medium">
            {venue.description || "Bu mekan hakkında henüz bir açıklama girilmemiş."}
          </p>
        </section>

        <section className="bg-white border border-gray-200/60 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-1.5">
            <Phone size={16} weight="bold" style={{ color: ACCENT }} />
            İletişim
          </h3>
          <div className="space-y-2">
            {venue.contact_info?.instagram && (
              <a
                href={`https://instagram.com/${venue.contact_info.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-gray-600 hover:text-[#00aeef] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <InstagramLogo size={16} weight="bold" />
                </div>
                <span className="text-xs font-bold">@{venue.contact_info.instagram}</span>
              </a>
            )}
            {venue.contact_info?.website && (
              <a
                href={venue.contact_info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-gray-600 hover:text-[#00aeef] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Globe size={16} weight="bold" />
                </div>
                <span className="text-xs font-bold">Web Sitesi</span>
              </a>
            )}
            {!venue.contact_info?.instagram && !venue.contact_info?.website && (
              <p className="text-gray-400 text-xs font-medium">İletişim bilgisi bulunmuyor.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VenueDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#FAF9F7]">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#00aeef] rounded-full animate-spin" />
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
        </div>
      }
    >
      <VenueDetailContent />
    </Suspense>
  );
}
