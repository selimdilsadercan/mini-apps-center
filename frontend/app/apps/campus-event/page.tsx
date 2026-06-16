"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  Plus,
  X,
  Spinner,
  Buildings,
  Calendar,
  MapPin,
  Clock,
  MagnifyingGlass,
  Trash,
  Users,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { campus_event } from "@/lib/client";
import { getAppRootUrl } from "@/lib/apps";
import { Drawer } from "vaul";

const client = createBrowserClient();

const CATEGORIES: campus_event.EventCategory[] = [
  "Konser",
  "Workshop",
  "Turnuva",
  "Sosyal",
  "Kariyer",
  "Spor",
  "Diğer",
];

const CATEGORY_COLORS: Record<string, string> = {
  Konser: "bg-purple-100 text-purple-700 border-purple-200",
  Workshop: "bg-blue-100 text-blue-700 border-blue-200",
  Turnuva: "bg-amber-100 text-amber-700 border-amber-200",
  Sosyal: "bg-pink-100 text-pink-700 border-pink-200",
  Kariyer: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Spor: "bg-orange-100 text-orange-700 border-orange-200",
  Diğer: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isUpcoming(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
}

function CampusEventContent() {
  const { user, isLoaded } = useUser();

  const [events, setEvents] = useState<campus_event.CampusEvent[]>([]);
  const [universities, setUniversities] = useState<campus_event.UniversityInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<campus_event.CampusEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [description, setDescription] = useState("");
  const [clubName, setClubName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<campus_event.EventCategory>("Diğer");
  const [imageUrl, setImageUrl] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let eventsRes: campus_event.GetEventsResponse = { events: [] };
      let uniRes: campus_event.GetUniversitiesResponse = { universities: [] };

      try {
        eventsRes = await client.campus_event.getEvents({
          university: selectedUniversity || undefined,
          category: selectedCategory || undefined,
        });
      } catch (err) {
        console.error("getEvents error:", err);
      }

      try {
        uniRes = await client.campus_event.getUniversities();
      } catch (err) {
        console.error("getUniversities error:", err);
      }

      setEvents(eventsRes.events);

      const derivedUniversities =
        uniRes.universities.length > 0
          ? uniRes.universities
          : Array.from(
              eventsRes.events.reduce((map, event) => {
                const count = map.get(event.university) ?? 0;
                map.set(event.university, count + 1);
                return map;
              }, new Map<string, number>())
            ).map(([university, eventCount]) => ({ university, eventCount }));

      setUniversities(derivedUniversities);

      if (!selectedUniversity && derivedUniversities.length > 0) {
        setSelectedUniversity(derivedUniversities[0].university);
      }

      if (eventsRes.events.length === 0 && derivedUniversities.length === 0) {
        showToast("Etkinlikler yüklenemedi. Backend veya veritabanı ayarlarını kontrol et.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Etkinlikler yüklenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) fetchData();
  }, [isLoaded, selectedUniversity, selectedCategory]);

  useEffect(() => {
    if (isLoaded && user) {
      client.users.checkAdmin(user.id).then((res) => setIsAdmin(res.isAdmin));
    }
  }, [isLoaded, user]);

  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.clubName?.toLowerCase().includes(q) ?? false) ||
      (e.location?.toLowerCase().includes(q) ?? false)
    );
  });

  const upcomingEvents = filteredEvents.filter((e) => isUpcoming(e.eventDate));
  const pastEvents = filteredEvents.filter((e) => !isUpcoming(e.eventDate));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !university.trim() || !eventDate) {
      showToast("Başlık, üniversite ve tarih gerekli.", "error");
      return;
    }
    try {
      setCreateLoading(true);
      await client.campus_event.addEvent({
        userId: user.id,
        title: title.trim(),
        university: university.trim(),
        eventDate,
        description: description.trim() || undefined,
        clubName: clubName.trim() || undefined,
        location: location.trim() || undefined,
        category,
        eventTime: eventTime.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      showToast("Etkinlik eklendi!", "success");
      setShowCreate(false);
      setTitle(""); setUniversity(""); setEventDate(""); setEventTime("");
      setDescription(""); setClubName(""); setLocation("");
      setCategory("Diğer"); setImageUrl("");
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast("Etkinlik eklenemedi.", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!user) return;
    if (!confirm("Bu etkinliği silmek istediğine emin misin?")) return;
    try {
      await client.campus_event.deleteEvent({ userId: user.id, eventId });
      showToast("Etkinlik silindi.", "success");
      setSelectedEvent(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast("Etkinlik silinemedi.", "error");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-teal-50">
        <Spinner size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-teal-50 text-gray-900 pb-24">
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-teal-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 blur-[120px] rounded-full" />
      </div>

      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="p-2 -ml-2 rounded-full hover:bg-teal-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={24} color="#0D9488" />
            </button>
            <div>
              <h1 className="text-2xl font-[900] tracking-tight leading-none text-gray-900">
                Campus <span className="text-teal-600">Event</span>
              </h1>
              <p className="text-xs text-teal-600/70 font-medium mt-0.5">Üniversite etkinlikleri</p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-xs shadow-md shadow-teal-200 transition-all active:scale-95"
            >
              <Plus size={16} weight="bold" />
              Etkinlik Ekle
            </button>
          )}
        </header>

        {/* University tabs */}
        {universities.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest mb-2 block px-1">
              Üniversite
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedUniversity("")}
                className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold border transition-all ${
                  !selectedUniversity
                    ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                    : "bg-white border-teal-200 text-teal-700 hover:border-teal-400"
                }`}
              >
                Tümü
              </button>
              {universities.map((u) => (
                <button
                  key={u.university}
                  onClick={() => setSelectedUniversity(u.university)}
                  className={`shrink-0 text-xs px-3.5 py-2 rounded-xl font-bold border transition-all ${
                    selectedUniversity === u.university
                      ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                      : "bg-white border-teal-200 text-teal-700 hover:border-teal-400"
                  }`}
                >
                  {u.university}
                  <span className="ml-1 opacity-70">({u.eventCount})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("")}
            className={`shrink-0 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider border transition-all ${
              !selectedCategory ? "bg-gray-800 border-gray-800 text-white" : "bg-white border-gray-200 text-gray-500"
            }`}
          >
            Tümü
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}
              className={`shrink-0 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-wider border transition-all ${
                selectedCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : "bg-white border-gray-200 text-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etkinlik, kulüp veya mekan ara..."
            className="w-full bg-white border border-teal-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors font-medium placeholder:text-teal-300"
          />
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="animate-spin text-teal-600" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-20 h-20 bg-teal-100 rounded-[2rem] flex items-center justify-center mb-6">
              <Buildings size={36} weight="duotone" className="text-teal-500" />
            </div>
            <h2 className="font-extrabold text-lg text-gray-800 mb-2">Henüz Etkinlik Yok</h2>
            <p className="text-teal-600/70 text-xs leading-relaxed max-w-[260px]">
              {isAdmin
                ? "İlk etkinliği eklemek için yukarıdaki butonu kullan."
                : "Yakında bu üniversitede etkinlikler paylaşılacak!"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingEvents.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-1">
                  Yaklaşan Etkinlikler
                </h2>
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onOpen={setSelectedEvent} />
                ))}
              </section>
            )}
            {pastEvents.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Geçmiş Etkinlikler
                </h2>
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} onOpen={setSelectedEvent} past />
                ))}
              </section>
            )}
          </div>
        )}
      </main>

      {/* CREATE DRAWER (admin only) */}
      <Drawer.Root open={showCreate} onOpenChange={setShowCreate}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-teal-100 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-teal-200 mb-5" />
              <header className="flex justify-between items-center mb-6 shrink-0">
                <Drawer.Title className="font-black text-xl text-gray-900">Etkinlik Ekle</Drawer.Title>
                <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X size={20} weight="bold" />
                </button>
              </header>

              <form onSubmit={handleCreate} className="space-y-4 flex-1 overflow-y-auto pr-0.5">
                <Field label="Etkinlik Adı *">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Yazılım Kulübü Hackathon" className={inputCls} />
                </Field>
                <Field label="Üniversite *">
                  <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Örn: İTÜ, Boğaziçi, ODTÜ..." className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tarih *">
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Saat">
                    <input value={eventTime} onChange={(e) => setEventTime(e.target.value)} placeholder="19:00" className={inputCls} />
                  </Field>
                </div>
                <Field label="Kulüp Adı">
                  <input value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="Örn: IEEE, GDSC, Yazılım Kulübü" className={inputCls} />
                </Field>
                <Field label="Mekan">
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn: Süleyman Demirel Kültür Merkezi" className={inputCls} />
                </Field>
                <Field label="Kategori">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all ${
                          category === cat ? CATEGORY_COLORS[cat] : "bg-gray-50 border-gray-200 text-gray-500"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Açıklama">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Etkinlik hakkında kısa bilgi..." className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Görsel URL">
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                </Field>
                <div className="pt-2 pb-4">
                  <button
                    type="submit"
                    disabled={createLoading || !title.trim() || !university.trim() || !eventDate}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-teal-200"
                  >
                    {createLoading ? <Spinner size={18} className="animate-spin" /> : "Etkinliği Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* DETAIL DRAWER */}
      <Drawer.Root open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-teal-100 shadow-2xl flex flex-col">
            {selectedEvent && (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-teal-200" />

                {selectedEvent.imageUrl && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden -mt-2">
                    <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-black text-xl text-gray-900 leading-tight">{selectedEvent.title}</h2>
                    <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${CATEGORY_COLORS[selectedEvent.category]}`}>
                      {selectedEvent.category}
                    </span>
                  </div>

                  {selectedEvent.clubName && (
                    <div className="flex items-center gap-2 text-sm text-teal-700 font-bold">
                      <Users size={16} className="text-teal-500" />
                      {selectedEvent.clubName}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2">
                    <InfoRow icon={<Calendar size={16} />} label="Tarih" value={formatDate(selectedEvent.eventDate)} />
                    {selectedEvent.eventTime && (
                      <InfoRow icon={<Clock size={16} />} label="Saat" value={selectedEvent.eventTime} />
                    )}
                    <InfoRow icon={<Buildings size={16} />} label="Üniversite" value={selectedEvent.university} />
                    {selectedEvent.location && (
                      <InfoRow icon={<MapPin size={16} />} label="Mekan" value={selectedEvent.location} />
                    )}
                  </div>

                  {selectedEvent.description && (
                    <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedEvent.description}</p>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(selectedEvent.id)}
                    className="w-full py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-2xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Trash size={14} weight="bold" />
                    Etkinliği Sil
                  </button>
                )}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg text-center ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors font-medium";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <span className="text-teal-500 shrink-0">{icon}</span>
      <div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-bold text-gray-800">{value}</span>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: campus_event.CampusEvent;
  onOpen: (event: campus_event.CampusEvent) => void;
  past?: boolean;
}

function EventCard({ event, onOpen, past }: EventCardProps) {
  return (
    <button
      onClick={() => onOpen(event)}
      className={`w-full text-left bg-white border rounded-[1.75rem] p-4 transition-all active:scale-[0.98] shadow-sm hover:shadow-md ${
        past ? "border-gray-100 opacity-70" : "border-teal-100 hover:border-teal-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-gray-900 truncate">{event.title}</p>
          {event.clubName && (
            <p className="text-[11px] text-teal-600 font-bold mt-0.5 truncate">{event.clubName}</p>
          )}
        </div>
        <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${CATEGORY_COLORS[event.category]}`}>
          {event.category}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-semibold flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar size={12} className="text-teal-500" />
          {formatDate(event.eventDate)}
        </span>
        {event.eventTime && (
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-teal-500" />
            {event.eventTime}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1 truncate">
            <MapPin size={12} className="text-teal-500 shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        )}
      </div>

      {event.description && (
        <p className="text-xs text-gray-400 font-medium mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
      )}
    </button>
  );
}

export default function CampusEventPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-teal-50">
        <Spinner size={32} className="animate-spin text-teal-600" />
      </div>
    }>
      <CampusEventContent />
    </Suspense>
  );
}
