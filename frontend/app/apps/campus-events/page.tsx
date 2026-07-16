"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import Link from "next/link";
import {
  Megaphone,
  Calendar,
  MapPin,
  MagnifyingGlass,
  InstagramLogo,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { campus_events } from "@/lib/client";
import EventsShell, { type EventsTab } from "./components/EventsShell";

const client = createBrowserClient();
const ACCENT = "#00aeef";

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: TR_MONTHS[d.getMonth()],
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    full: d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export default function CampusEventsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [events, setEvents] = useState<campus_events.CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<EventsTab>("upcoming");

  // Load events
  useEffect(() => {
    if (isUserLoaded) {
      fetchEvents();
    }
  }, [isUserLoaded, user?.id]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await client.campus_events.getEvents({
        userId: user?.id || undefined
      });
      setEvents(res.events || []);
    } catch (error) {
      console.error("fetchEvents error:", error);
      toast.error("Etkinlikler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const query = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(query) ||
      (e.description && e.description.toLowerCase().includes(query)) ||
      (e.location && e.location.toLowerCase().includes(query)) ||
      (e.organizer_club && e.organizer_club.toLowerCase().includes(query))
    );
  });

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((e) => new Date(e.event_date) < new Date());
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

  const handleAdd = () => {
    if (!user) {
      toast.error("Etkinlik eklemek için giriş yapmalısınız.");
      return;
    }
    setShowAddDrawer(true);
  };

  const EventCard = ({ event }: { event: campus_events.CampusEvent }) => {
    const { day, month, time } = formatEventDate(event.event_date);
    const isPast = new Date(event.event_date) < new Date();

    return (
      <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={event.id}>
        <Link
          href={`/apps/campus-events/event?id=${event.id}`}
          className="flex gap-3 bg-app-surface border border-app-border rounded-xl p-3 shadow-sm active:scale-[0.99] transition-all hover:border-sky-200"
        >
          <div className="relative shrink-0 w-[72px]">
            <div className="w-[72px] aspect-square rounded-xl overflow-hidden bg-app-surface-muted border border-app-border">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Megaphone size={24} className="text-app-muted" />
                </div>
              )}
            </div>
            <div
              className={`absolute -top-1 -left-1 w-10 rounded-lg flex flex-col items-center justify-center py-0.5 shadow-sm border ${
                isPast ? "bg-app-tab-track border-app-border text-app-muted" : "bg-app-surface border-app-border"
              }`}
            >
              <span className="text-xs font-black leading-none">{day}</span>
              <span className="text-[8px] font-bold uppercase leading-none text-app-muted">{month}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 py-0.5">
            <h3 className="text-sm font-black text-app-text leading-snug line-clamp-2">{event.title}</h3>
            {event.organizer_club && (
              <p className="text-[10px] font-bold mt-0.5 truncate" style={{ color: ACCENT }}>
                {event.organizer_club}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-app-muted mt-2 text-[10px] font-medium">
              <Calendar size={12} weight="bold" className="shrink-0" />
              <span>{time}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-app-muted mt-0.5 text-[10px] font-medium">
                <MapPin size={12} weight="bold" className="shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <>
    <EventsShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onAdd={handleAdd}
      searchBar={
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etkinlik, topluluk veya mekan ara…"
            className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-sky-400 outline-none transition-all placeholder:text-app-muted text-app-text shadow-sm"
          />
        </div>
      }
    >
      <Toaster position="top-center" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-7 h-7 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-app-muted text-xs font-medium">Yükleniyor…</span>
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="text-center py-14 bg-app-surface border border-app-border rounded-2xl flex flex-col items-center p-6 shadow-sm">
          <Megaphone size={36} className="text-app-muted mb-3" />
          <p className="text-sm font-bold text-app-muted">
            {activeTab === "upcoming" ? "Yaklaşan etkinlik yok." : "Geçmiş etkinlik yok."}
          </p>
          {activeTab === "upcoming" && (
            <button
              type="button"
              onClick={handleAdd}
              className="mt-4 text-xs font-bold px-4 py-2 rounded-xl text-white active:scale-95 transition-all"
              style={{ backgroundColor: ACCENT }}
            >
              Etkinlik Paylaş
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </EventsShell>

      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-app-surface text-app-text flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-50 max-w-xl mx-auto border-t border-app-border">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-app-tab-track mb-6" />
              <Drawer.Title className="text-xl font-black mb-1">Etkinlik Ekle</Drawer.Title>
              <Drawer.Description className="text-xs text-app-muted mb-6">
                Topluluğun adına veya genel bir etkinliği buraya gir.
              </Drawer.Description>
              <SuggestEventForm
                onComplete={() => {
                  fetchEvents();
                  setShowAddDrawer(false);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

// Event Suggestion Form Component
function SuggestEventForm({
  onComplete
}: {
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // tomorrow local datetime-local formatted
    organizerClub: "",
    imageUrl: ""
  });
  const [instagramUrl, setInstagramUrl] = useState("");
  const [fetchingInstagram, setFetchingInstagram] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFetchInstagram = async () => {
    if (!instagramUrl) {
      toast.error("Lütfen bir Instagram linki girin.");
      return;
    }

    try {
      setFetchingInstagram(true);
      const res = await client.scrape.scrapeInstagramReel({ url: instagramUrl });
      
      if (res.success) {
        setFormData(prev => ({
          ...prev,
          description: res.caption || prev.description,
          imageUrl: res.thumbnail || prev.imageUrl,
          organizerClub: res.username || prev.organizerClub
        }));
        toast.success("Bilgiler Instagram'dan çekildi!");
      } else {
        toast.error(res.error || "Bilgiler çekilemedi.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bir hata oluştu.");
    } finally {
      setFetchingInstagram(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Giriş yapmalısınız.");
      return;
    }

    try {
      setSubmitting(true);
      // Convert datetime-local to ISO string
      const isoDate = new Date(formData.eventDate).toISOString();
      await client.campus_events.addEvent({
        userId: user.id,
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        eventDate: isoDate,
        organizerClub: formData.organizerClub || undefined,
        imageUrl: formData.imageUrl || undefined
      });
      toast.success("Etkinlik başarıyla paylaşıldı!");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Etkinlik eklenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8 font-semibold text-slate-700">
      {/* Instagram Import */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100 mb-2">
        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 block flex items-center gap-1.5">
          <InstagramLogo size={14} weight="bold" />
          Instagram'dan Bilgileri Çek
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="Post veya Reel linki yapıştır..."
            className="flex-1 bg-app-surface border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-purple-400 focus:ring-4 focus:ring-purple-400/5 outline-none text-app-text font-semibold"
          />
          <button
            type="button"
            onClick={handleFetchInstagram}
            disabled={fetchingInstagram}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center min-w-[44px]"
          >
            {fetchingInstagram ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={18} weight="bold" />
            )}
          </button>
        </div>
        <p className="text-[9px] text-purple-400 mt-2 font-bold">
          * Açıklama, görsel ve hesap adını otomatik doldurur.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Etkinlik Başlığı</label>
        <input
          required
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Örn: Python Giriş Workshop'ı"
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold"
        />
      </div>

      {/* Organizer Club */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Düzenleyen Topluluk</label>
        <input
          type="text"
          value={formData.organizerClub}
          onChange={(e) => setFormData({ ...formData, organizerClub: e.target.value })}
          placeholder="Örn: Şehir Koşu Grubu"
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold"
        />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Tarih & Saat</label>
        <input
          required
          type="datetime-local"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold"
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Konum / Mekan</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Örn: Beşiktaş Sahil"
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Afiş / Görsel Linki (Opsiyonel)</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="Örn: https://example.com/banner.png"
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Açıklama / Detaylar</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Etkinlik içeriği ve katılım şartları hakkında bilgi girin..."
          className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-app-text font-semibold resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 font-black rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm text-white active:scale-[0.98]"
        style={{ backgroundColor: ACCENT }}
      >
        {submitting ? "Ekleniyor..." : "Etkinlik Paylaş"}
      </button>
    </form>
  );
}
