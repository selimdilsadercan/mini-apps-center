"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Calendar,
  MapPin,
  CaretLeft,
  MagnifyingGlass,
  InstagramLogo,
  ArrowRight,
  Star,
  ChatCircleText
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { campus_events } from "@/lib/client";

const client = createBrowserClient();

export default function CampusEventsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [events, setEvents] = useState<campus_events.CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("tr-TR", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit",
      minute: "2-digit"
    });
    return dateFormatted;
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

  const upcomingEvents = filteredEvents.filter((e: campus_events.CampusEvent) => new Date(e.event_date) >= new Date());
  const pastEvents = filteredEvents.filter((e: campus_events.CampusEvent) => new Date(e.event_date) < new Date());

  const EventCard = ({ event }: { event: campus_events.CampusEvent }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      key={event.id}
      className="group flex flex-col relative"
    >
      {/* Image Section */}
      <Link href={`/apps/campus-events/event?id=${event.id}`} className="block">
        <div className="relative w-full aspect-square overflow-hidden rounded-xl md:rounded-2xl mb-3 md:mb-5">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-contain bg-slate-50" 
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <Megaphone size={32} className="text-slate-200 md:hidden" />
              <Megaphone size={48} className="text-slate-200 hidden md:block" />
            </div>
          )}
        </div>
      </Link>

      {/* Content Section */}
      <div className="flex flex-col flex-1 px-1">
        <Link href={`/apps/campus-events/event?id=${event.id}`} className="block group/title">
          <h3 className="text-sm md:text-lg font-[900] text-slate-800 leading-tight mb-1 md:mb-1.5 group-hover/title:text-[#00aeef] transition-colors line-clamp-2">
            {event.title}
          </h3>
        </Link>

        {/* Event Details List */}
        <Link href={`/apps/campus-events/event?id=${event.id}`} className="block">
          <div className="space-y-1 md:space-y-1.5 mt-2">
            {event.location && (
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={12} weight="bold" className="text-slate-300 shrink-0" />
                <span className="text-[10px] md:text-xs font-bold truncate">
                  {event.location}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar size={12} weight="bold" className="text-slate-300 shrink-0" />
              <span className="text-[10px] md:text-xs font-bold">
                {formatDate(event.event_date)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-slate-800 font-sans antialiased selection:bg-[#00aeef]/20 selection:text-[#00aeef]">
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
          }
        }} 
      />

      {/* Brand Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (window.location.href = getAppRootUrl())}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200/60 text-gray-500 hover:text-gray-900 shadow-sm transition-all active:scale-95"
              title="Geri"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
              Events
            </h1>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                if (!user) {
                  toast.error("Etkinlik eklemek için giriş yapmalısınız.");
                  return;
                }
                setShowAddDrawer(true);
              }}
              className="bg-[#00aeef] hover:bg-[#009bcf] text-white text-xs font-black px-5 py-3 rounded-2xl active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-[#00aeef]/20"
            >
              <Plus size={16} weight="bold" />
              <span className="uppercase tracking-widest">Etkinlik Paylaş</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10 pb-32 max-w-6xl mx-auto w-full">
        {/* Search Bar */}
        <div className="relative mb-12 shadow-sm rounded-2xl max-w-2xl mx-auto">
          <MagnifyingGlass size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etkinlik başlığı, topluluk veya salon ara..."
            className="w-full bg-white border border-gray-200 rounded-2xl pl-14 pr-5 py-4.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none transition-all placeholder:text-gray-300 text-gray-900 font-bold"
          />
        </div>

        {/* Events Grid View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#00aeef] rounded-full animate-spin" />
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Yükleniyor...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/60 rounded-[2.5rem] flex flex-col items-center justify-center p-8 shadow-sm">
            <Megaphone size={42} className="text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-500">Eşleşen etkinlik bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1">İlk etkinliği siz paylaşarak topluluğa katkıda bulunabilirsiniz!</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Gelecek Etkinlikler</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Geçmiş Etkinlikler</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Suggest Event Drawer */}
      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[60]" />
          <Drawer.Content className="bg-white text-slate-800 flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-slate-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-200 mb-6" />
              <Drawer.Title className="text-xl font-[800] mb-1 tracking-tight text-slate-900">
                Etkinlik Ekle
              </Drawer.Title>
              <Drawer.Description className="text-xs text-slate-400 mb-6 font-medium">
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
    </div>
  );
}

// Attendance Action Button Component
function AttendanceButton({
  event,
  isUserLoaded,
  user,
  onRefresh
}: {
  event: campus_events.CampusEvent;
  isUserLoaded: boolean;
  user: any;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleToggleAttendance = async (status: string) => {
    if (!isUserLoaded || !user) {
      toast.error("Katılım işaretlemek için giriş yapmalısınız.");
      return;
    }

    try {
      setSubmitting(true);
      await client.campus_events.setAttendance({
        userId: user.id,
        eventId: event.id,
        status: event.user_status === status ? "none" : status
      });
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error("Katılım güncellenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const isGoing = event.user_status === "going";
  const isInterested = event.user_status === "interested";

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleToggleAttendance("interested")}
        disabled={submitting}
        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
          isInterested 
            ? "bg-[#00aeef]/10 text-[#00aeef]"
            : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        }`}
      >
        İlgileniyorum
      </button>
      <button
        onClick={() => handleToggleAttendance("going")}
        disabled={submitting}
        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
          isGoing 
            ? "bg-[#00aeef] text-white shadow-md shadow-[#00aeef]/20"
            : "bg-slate-800 text-white hover:bg-slate-900"
        }`}
      >
        Katılıyorum
      </button>
    </div>
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
            className="flex-1 bg-white border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs focus:border-purple-400 focus:ring-4 focus:ring-purple-400/5 outline-none text-slate-800 font-semibold"
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
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Etkinlik Başlığı</label>
        <input
          required
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Örn: Python Giriş Workshop'ı"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Organizer Club */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Düzenleyen Topluluk</label>
        <input
          type="text"
          value={formData.organizerClub}
          onChange={(e) => setFormData({ ...formData, organizerClub: e.target.value })}
          placeholder="Örn: Şehir Koşu Grubu"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tarih & Saat</label>
        <input
          required
          type="datetime-local"
          value={formData.eventDate}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Konum / Mekan</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Örn: Beşiktaş Sahil"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Afiş / Görsel Linki (Opsiyonel)</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="Örn: https://example.com/banner.png"
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Açıklama / Detaylar</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Etkinlik içeriği ve katılım şartları hakkında bilgi girin..."
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/5 outline-none text-slate-800 font-semibold resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-14 bg-[#00aeef] hover:bg-[#009bcf] text-white font-[900] rounded-[1.5rem] flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow-lg shadow-[#00aeef]/20 active:scale-[0.98]"
      >
        {submitting ? "Ekleniyor..." : "Etkinlik Paylaş"}
      </button>
    </form>
  );
}
