"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { 
  CaretLeft, 
  MapPin, 
  Calendar, 
  Megaphone, 
  InstagramLogo,
  Globe,
  Phone,
  Info,
  Users,
  ShareNetwork,
  Clock
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { campus_events } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

const client = createBrowserClient();

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(date);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function EventDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const eventId = searchParams.get("id");
  
  const [event, setEvent] = useState<campus_events.CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) {
      toast.error("Etkinlik ID'si bulunamadı.");
      router.push("/apps/campus-events");
      return;
    }

    if (isUserLoaded) {
      fetchEvent();
    }
  }, [eventId, isUserLoaded, user?.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await client.campus_events.getEvent(eventId!, { userId: user?.id });
      setEvent(res.event);
    } catch (err) {
      console.error("Error fetching event data:", err);
      toast.error("Etkinlik bilgileri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (status: string) => {
    if (!isUserLoaded || !user) {
      toast.error("Katılım işaretlemek için giriş yapmalısınız.");
      return;
    }

    try {
      setSubmitting(true);
      await client.campus_events.setAttendance({
        userId: user.id,
        eventId: event!.id,
        status: event!.user_status === status ? "none" : status
      });
      fetchEvent();
      toast.success(event!.user_status === status ? "Katılım iptal edildi." : "Katılım durumunuz güncellendi.");
    } catch (e) {
      console.error(e);
      toast.error("Katılım güncellenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Info size={48} className="text-slate-200 mb-4" />
        <h1 className="text-xl font-black text-slate-800 mb-2">Etkinlik Bulunamadı</h1>
        <p className="text-slate-500 mb-6">Aradığınız etkinlik sistemde kayıtlı olmayabilir veya kaldırılmış olabilir.</p>
        <button 
          onClick={() => router.push("/apps/campus-events")}
          className="bg-[#00aeef] text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all"
        >
          Etkinliklere Dön
        </button>
      </div>
    );
  }

  const isGoing = event.user_status === "going";
  const isInterested = event.user_status === "interested";

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800 font-sans antialiased">
      <Toaster position="top-center" />

      {/* Header / Cover Image */}
      <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <Megaphone size={80} className="text-slate-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/20 z-10"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link kopyalandı!");
          }}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/20 z-10"
        >
          <ShareNetwork size={20} weight="bold" />
        </button>

        {/* Event Title Overlay */}
        <div className="absolute bottom-10 left-6 right-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {event.organizer_club && (
              <div className="mb-4">
                {event.businessId ? (
                  <Link 
                    href={`/apps/campus-events/venue?id=${event.businessId}`}
                    className="bg-[#00aeef] text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase shadow-lg inline-flex items-center gap-2 hover:bg-[#009bcf] transition-colors"
                  >
                    {event.organizer_club}
                  </Link>
                ) : (
                  <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border border-white/20">
                    {event.organizer_club}
                  </span>
                )}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-[950] text-white leading-tight drop-shadow-2xl mb-4">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90 text-sm md:text-lg font-bold">
              <div className="flex items-center gap-2">
                <Calendar size={20} weight="fill" className="text-[#00aeef]" />
                <span className="drop-shadow-md">{formatDate(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} weight="fill" className="text-[#00aeef]" />
                <span className="drop-shadow-md">{formatTime(event.event_date)}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={20} weight="fill" className="text-[#00aeef]" />
                  <span className="drop-shadow-md">{event.location}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-[900] text-slate-800 mb-6 flex items-center gap-3">
              <Info size={28} weight="bold" className="text-[#00aeef]" />
              Etkinlik Hakkında
            </h2>
            <div className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {event.description || "Bu etkinlik için bir açıklama girilmemiş."}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#00aeef] rounded-full animate-spin" />
        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Yükleniyor...</span>
      </div>
    }>
      <EventDetailContent />
    </Suspense>
  );
}
