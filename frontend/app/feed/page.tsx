"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Spinner,
  Newspaper,
  Calendar,
  MapPin,
  Clock,
  Check,
  Question,
  X,
  Users,
  Compass,
  Trophy,
  Coffee,
  Heart
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { feed, kim_gelir } from "@/lib/client";
import AppBar, { ActivePage } from "@/components/AppBar";

const client = createBrowserClient();

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Şimdi";
  if (diffMins < 60) return `${diffMins} dk önce`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function FeedPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<feed.FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchFeed = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await client.feed.getFeed(user.id);
      setEvents(res.events || []);
    } catch (err) {
      console.error("Error fetching feed:", err);
      showToastMsg("Akış yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchFeed();
    }
  }, [isLoaded, user]);

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRespondToActivity = async (activityId: string, status: string, eventId: string) => {
    if (!user) return;
    try {
      setActionLoading(eventId);
      await client.kim_gelir.respondToActivity({
        activityId,
        userId: user.id,
        status,
        selectedOptions: [],
      });
      showToastMsg("Cevabınız iletildi!", "success");
      // Refresh feed events
      const res = await client.feed.getFeed(user.id);
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
      showToastMsg("Cevap iletilemedi.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-blue-600 animate-spin" />
        </main>
        <AppBar activePage={ActivePage.FEED} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-32">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none">
              Sosyal Akış
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-1.5">Arkadaşlarının Son Hareketleri</p>
          </div>
        </header>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
              <Compass size={36} weight="duotone" />
            </div>
            <h2 className="font-extrabold text-lg text-gray-800 mb-2">Henüz Hareket Yok</h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mb-8">
              Arkadaşların bir aktivite oluşturduğunda, mekan önerdiğinde veya turnuva düzenlediğinde burada göreceksin!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isCreator = event.userId === user?.id;
              return (
                <div 
                  key={event.id}
                  className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-5 shadow-lg shadow-blue-100/10 hover:shadow-xl transition-all duration-300"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-150 flex items-center justify-center overflow-hidden shrink-0 text-base">
                        {event.userAvatar ? (
                          <img src={event.userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : "👤"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-900 font-extrabold text-sm truncate">
                          {isCreator ? "Ben" : event.username || "Arkadaşın"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {formatRelativeTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                    {/* Badge mapping for app source */}
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {event.appId === "kim-gelir" ? "Ne Yapsak?" : event.appId === "workplaces" ? "Mekanlar" : event.appId === "tournament" ? "Turnuva" : event.appId}
                    </span>
                  </div>

                  {/* Render Custom Event Types */}
                  {event.appId === "kim-gelir" && event.eventType === "create_activity" && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                        <h3 className="font-black text-sm text-gray-950 leading-tight">
                          📢 Hızlı Aktivite Daveti Açtı
                        </h3>
                        <p className="text-xs font-bold text-gray-700">
                          {event.payload.title}
                        </p>
                        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-200/50">
                          {event.payload.timeOption && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                              <Clock size={14} className="text-blue-500" />
                              <span>{event.payload.timeOption}{event.payload.customTime ? ` (${event.payload.customTime})` : ""}</span>
                            </div>
                          )}
                          {event.payload.location && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                              <MapPin size={14} className="text-blue-500" />
                              <span className="truncate">{event.payload.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response Actions */}
                      {!isCreator && event.payload.activityId && (
                        <div className="grid grid-cols-3 gap-2.5">
                          <button
                            onClick={() => handleRespondToActivity(event.payload.activityId, 'gelirim', event.id)}
                            disabled={actionLoading !== null}
                            className="py-2.5 rounded-xl border border-gray-150 text-xs font-black bg-white hover:bg-gray-50 text-emerald-600 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            {actionLoading === event.id ? (
                              <Spinner size={12} className="animate-spin text-emerald-600" />
                            ) : (
                              <Check size={12} weight="bold" />
                            )}
                            Gelirim
                          </button>
                          <button
                            onClick={() => handleRespondToActivity(event.payload.activityId, 'belki', event.id)}
                            disabled={actionLoading !== null}
                            className="py-2.5 rounded-xl border border-gray-150 text-xs font-black bg-white hover:bg-gray-50 text-amber-600 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            <Question size={12} weight="bold" />
                            Belki
                          </button>
                          <button
                            onClick={() => handleRespondToActivity(event.payload.activityId, 'gelemem', event.id)}
                            disabled={actionLoading !== null}
                            className="py-2.5 rounded-xl border border-gray-150 text-xs font-black bg-white hover:bg-gray-50 text-red-600 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            <X size={12} weight="bold" />
                            Gelemem
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {event.appId === "workplaces" && event.eventType === "add_place" && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                      <h3 className="font-black text-sm text-gray-950 leading-tight flex items-center gap-1.5">
                        <Coffee size={16} className="text-amber-700" />
                        Yeni Çalışma Mekanı Önerdi
                      </h3>
                      <p className="text-xs font-black text-gray-800 mt-1">
                        {event.payload.name}
                      </p>
                      {event.payload.district && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-450 font-bold">
                          <MapPin size={12} />
                          <span>{event.payload.district}</span>
                        </div>
                      )}
                      {event.payload.note && (
                        <p className="text-xs text-gray-500 font-semibold italic mt-1 pl-2 border-l-2 border-amber-500">
                          &quot;{event.payload.note}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {event.appId === "workplaces" && event.eventType === "toggle_favorite" && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                        <Heart size={16} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-650 font-semibold">
                          Bir mekanı favorilerine ekledi
                        </p>
                        <p className="text-xs font-black text-gray-900 truncate">
                          {event.payload.placeName}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.appId === "tournament" && event.eventType === "create_tournament" && (
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                      <h3 className="font-black text-sm text-gray-950 leading-tight flex items-center gap-1.5">
                        <Trophy size={16} className="text-amber-500" weight="fill" />
                        Yeni Turnuva Düzenledi!
                      </h3>
                      <p className="text-xs font-black text-gray-800 mt-1">
                        {event.payload.title}
                      </p>
                      {event.payload.gameName && (
                        <p className="text-xs text-gray-500 font-semibold">
                          Oyun: <span className="font-extrabold text-gray-700">{event.payload.gameName}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      <AppBar activePage={ActivePage.FEED} />
    </div>
  );
}
