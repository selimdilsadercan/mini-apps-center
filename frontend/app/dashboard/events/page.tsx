"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  MagnifyingGlass, 
  Calendar, 
  X, 
  MapPin, 
  Clock, 
  Pencil, 
  Megaphone,
  Globe,
  Users,
  User,
  InstagramLogo,
  ArrowRight,
  ListChecks,
  Trash,
  CheckCircle,
  CaretLeft
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvents } from "./context";
import { campus_events } from "@/lib/client";
import { createBrowserClient } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";

const client = createBrowserClient();

export default function EventsPage() {
  const { events, loading, refreshEvents, businessId } = useEvents();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<campus_events.CampusEvent | null>(null);
  const [modalMode, setModalMode] = useState<"manual" | "json">("manual");
  const [jsonInput, setJsonInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [fetchingInstagram, setFetchingInstagram] = useState(false);
  const [viewingSubmissions, setViewingSubmissions] = useState<campus_events.CampusEvent | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    organizerClub: "",
    imageUrl: "",
    category: "social",
    hasForm: false,
    formQuestions: [] as { label: string; type: string; required: boolean }[]
  });

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [events, searchQuery]);

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingEvent(null);
    setModalMode("manual");
    setJsonInput("");
    setInstagramUrl("");
    setNewEvent({
      title: "",
      description: "",
      location: "",
      eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      organizerClub: "",
      imageUrl: "",
      category: "social",
      hasForm: false,
      formQuestions: []
    });
  };

  const handleFetchInstagram = async () => {
    if (!instagramUrl) {
      toast.error("Lütfen bir Instagram linki girin.");
      return;
    }

    try {
      setFetchingInstagram(true);
      const res = await client.scrape.scrapeInstagramReel({ url: instagramUrl });
      
      if (res.success) {
        setNewEvent(prev => ({
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

  const handleEditClick = (event: campus_events.CampusEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      eventDate: new Date(event.event_date).toISOString().slice(0, 16),
      organizerClub: event.organizer_club || "",
      imageUrl: event.image_url || "",
      category: event.category || "social",
      hasForm: event.has_form || false,
      formQuestions: event.form_questions || []
    });
    setShowAddModal(true);
  };

  const handleViewSubmissions = async (event: campus_events.CampusEvent) => {
    try {
      setViewingSubmissions(event);
      setLoadingSubmissions(true);
      const res = await client.campus_events.getSubmissions(event.id);
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      toast.error("Başvurular yüklenemedi");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === "json") {
        let eventsToUpload;
        try {
          eventsToUpload = JSON.parse(jsonInput);
          if (!Array.isArray(eventsToUpload)) {
            eventsToUpload = [eventsToUpload];
          }
        } catch (err) {
          toast.error("Geçersiz JSON formatı");
          return;
        }

        await client.campus_events.bulkAddEvents({
          userId: user?.id || "",
          businessId: businessId || "",
          events: eventsToUpload.map((ev: any) => ({
            title: ev.title,
            description: ev.description,
            location: ev.location,
            eventDate: ev.eventDate || ev.date || new Date().toISOString(),
            organizerClub: ev.organizerClub || ev.organizer,
            imageUrl: ev.imageUrl || ev.image,
            category: ev.category || "social"
          }))
        });
        toast.success("Etkinlikler başarıyla eklendi!");
      } else {
        const isoDate = new Date(newEvent.eventDate).toISOString();
        
        if (editingEvent) {
          await client.campus_events.updateEvent({
            eventId: editingEvent.id,
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            eventDate: isoDate,
            organizerClub: newEvent.organizerClub,
            imageUrl: newEvent.imageUrl,
            category: newEvent.category,
            hasForm: newEvent.hasForm,
            formQuestions: newEvent.formQuestions
          });
          toast.success("Etkinlik güncellendi!");
        } else {
          await client.campus_events.addEvent({
            userId: user?.id || "",
            title: newEvent.title,
            description: newEvent.description,
            location: newEvent.location,
            eventDate: isoDate,
            organizerClub: newEvent.organizerClub,
            imageUrl: newEvent.imageUrl,
            businessId: businessId,
            category: newEvent.category,
            hasForm: newEvent.hasForm,
            formQuestions: newEvent.formQuestions
          });
          toast.success("Etkinlik oluşturuldu!");
        }
      }
      handleCloseModal();
      refreshEvents();
    } catch (err) {
      console.error("Failed to save event:", err);
      toast.error("İşlem başarısız oldu");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Events</h2>
          <p className="text-stone-500 text-sm font-bold mt-1">İşletmenize ait etkinlikleri buradan yönetebilirsiniz.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#00aeef] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#00aeef]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus size={20} weight="bold" />
          Yeni Etkinlik Oluştur
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} weight="bold" />
        <input
          type="text"
          placeholder="Etkinlik adı veya konuma göre ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#00aeef]/5 focus:border-[#00aeef] transition-all text-sm font-bold shadow-sm"
        />
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
          {filteredEvents.map((event) => (
            <div 
              key={event.id}
              className="group flex flex-col relative"
            >
              {/* Image Section */}
              <div className="relative w-full aspect-square overflow-hidden rounded-xl md:rounded-2xl mb-3 md:mb-5">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-contain bg-stone-50"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-200">
                    <Calendar size={48} weight="thin" />
                  </div>
                )}
                
                {/* Edit & Submissions Buttons Overlay */}
                <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {event.has_form && (
                    <button
                      onClick={() => handleViewSubmissions(event)}
                      className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-stone-600 hover:text-[#00aeef] shadow-sm transition-colors cursor-pointer"
                      title="Başvuruları Gör"
                    >
                      <Users size={18} weight="bold" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditClick(event)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-stone-600 hover:text-[#00aeef] shadow-sm transition-colors cursor-pointer"
                    title="Düzenle"
                  >
                    <Pencil size={18} weight="bold" />
                  </button>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 px-2 py-0.5 md:px-3 md:py-1 bg-black/50 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black rounded-full uppercase tracking-wider">
                  {event.category || "Genel"}
                </div>
              </div>

              {/* Content Section */}
              <div className="flex flex-col flex-1 px-1">
                <h3 className="text-sm md:text-lg font-[900] text-stone-800 leading-tight mb-1 md:mb-1.5 line-clamp-2">
                  {event.title}
                </h3>

                {/* Event Details List */}
                <div className="space-y-1 md:space-y-1.5 mt-2">
                  {event.location && (
                    <div className="flex items-center gap-2 text-stone-500">
                      <MapPin size={12} weight="bold" className="text-stone-300 shrink-0" />
                      <span className="text-[10px] md:text-xs font-bold truncate">
                        {event.location}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-stone-500">
                    <Calendar size={12} weight="bold" className="text-stone-300 shrink-0" />
                    <span className="text-[10px] md:text-xs font-bold">
                      {formatDate(event.event_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
          <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone size={40} className="text-stone-300" weight="bold" />
          </div>
          <h3 className="text-xl font-black text-stone-900">Etkinlik Bulunamadı</h3>
          <p className="text-stone-500 mt-2 font-bold">Henüz bir etkinlik oluşturmadınız.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-8 px-8 py-3 bg-stone-900 text-white rounded-2xl font-black text-sm hover:scale-[1.02] transition-all cursor-pointer"
          >
            İlk Etkinliğinizi Oluşturun
          </button>
        </div>
      )}

      {/* Submissions Modal */}
      <AnimatePresence>
        {viewingSubmissions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingSubmissions(null)}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setViewingSubmissions(null)}
                    className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <CaretLeft size={20} weight="bold" className="text-stone-600" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-stone-900 tracking-tight">
                      Başvurular: <span className="text-[#00aeef]">{viewingSubmissions.title}</span>
                    </h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">
                      Toplam {submissions.length} başvuru alındı
                    </p>
                  </div>
                </div>
                <button onClick={() => setViewingSubmissions(null)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
                  <X size={24} weight="bold" className="text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-8 h-8 border-2 border-stone-200 border-t-[#00aeef] rounded-full animate-spin" />
                    <span className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Yükleniyor...</span>
                  </div>
                ) : submissions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kullanıcı</th>
                          {viewingSubmissions.form_questions?.map((q: any, i: number) => (
                            <th key={i} className="px-4 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">{q.label}</th>
                          ))}
                          <th className="px-4 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="group">
                            <td className="px-4 py-4 bg-stone-50 rounded-l-2xl border-y border-l border-stone-100 group-hover:bg-stone-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden shrink-0 border border-stone-100">
                                  {sub.avatar_url ? (
                                    <img src={sub.avatar_url} alt={sub.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <User size={16} weight="bold" className="text-stone-400 m-auto mt-2" />
                                  )}
                                </div>
                                <span className="text-xs font-bold text-stone-800">{sub.username || "Anonim"}</span>
                              </div>
                            </td>
                            {viewingSubmissions.form_questions?.map((q: any, i: number) => (
                              <td key={i} className="px-4 py-4 bg-stone-50 border-y border-stone-100 group-hover:bg-stone-100 transition-colors">
                                <span className="text-xs font-medium text-stone-600">
                                  {sub.answers[q.label] || "-"}
                                </span>
                              </td>
                            ))}
                            <td className="px-4 py-4 bg-stone-50 rounded-r-2xl border-y border-r border-stone-100 group-hover:bg-stone-100 transition-colors">
                              <span className="text-[10px] font-bold text-stone-400">
                                {new Date(sub.created_at).toLocaleDateString("tr-TR")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ListChecks size={32} className="text-stone-200" weight="bold" />
                    </div>
                    <p className="text-stone-500 font-bold">Henüz başvuru yapılmamış.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8"
            >
              <div className="px-8 py-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">
                    {editingEvent ? "Etkinliği Düzenle" : (modalMode === "json" ? "JSON ile Toplu Ekle" : "Yeni Etkinlik Oluştur")}
                  </h2>
                  <div className="flex gap-4 mt-2">
                    <button 
                      type="button"
                      onClick={() => setModalMode("manual")}
                      className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${modalMode === "manual" ? "text-[#00aeef] border-[#00aeef]" : "text-stone-400 border-transparent"}`}
                    >
                      Manuel Giriş
                    </button>
                    {!editingEvent && (
                      <button 
                        type="button"
                        onClick={() => setModalMode("json")}
                        className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${modalMode === "json" ? "text-[#00aeef] border-[#00aeef]" : "text-stone-400 border-transparent"}`}
                      >
                        JSON ile Yükle
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
                  <X size={24} weight="bold" className="text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {modalMode === "json" ? (
                  <div className="space-y-4">
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Örnek Format</p>
                      <pre className="text-[10px] text-stone-500 font-mono overflow-x-auto">
{`[
  {
    "title": "Etkinlik Adı",
    "description": "Açıklama",
    "date": "2026-06-24T13:00:00Z",
    "location": "Mekan",
    "image": "https://..."
  }
]`}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">JSON Verisi</label>
                      <textarea
                        required
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all h-64 resize-none text-xs font-mono"
                        placeholder="[{ ... }]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Instagram Import */}
                    {!editingEvent && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-[2rem] border border-purple-100/50 mb-2">
                        <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-3 block flex items-center gap-1.5">
                          <InstagramLogo size={16} weight="bold" />
                          Instagram'dan Bilgileri Çek
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="Post veya Reel linki yapıştır..."
                            className="flex-1 bg-white border border-purple-200 rounded-2xl px-4 py-3 text-sm focus:border-purple-400 focus:ring-4 focus:ring-purple-400/5 outline-none text-slate-800 font-bold"
                          />
                          <button
                            type="button"
                            onClick={handleFetchInstagram}
                            disabled={fetchingInstagram}
                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 rounded-2xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center min-w-[56px] active:scale-95"
                          >
                            {fetchingInstagram ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <ArrowRight size={20} weight="bold" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-purple-400 mt-3 font-bold">
                          * Açıklama, görsel ve hesap adını otomatik doldurur.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Etkinlik Başlığı</label>
                        <input
                          required
                          type="text"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all text-sm font-bold"
                          placeholder="Örn: Hafta Sonu Turnuvası"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Kategori</label>
                        <select
                          value={newEvent.category}
                          onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                        >
                          <option value="social">Sosyal</option>
                          <option value="tournament">Turnuva</option>
                          <option value="workshop">Workshop</option>
                          <option value="meetup">Buluşma</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Tarih & Saat</label>
                        <input
                          required
                          type="datetime-local"
                          value={newEvent.eventDate}
                          onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Konum</label>
                        <input
                          type="text"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all text-sm font-bold"
                          placeholder="Örn: Ana Salon"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Açıklama</label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all h-24 resize-none text-sm font-bold"
                        placeholder="Etkinlik hakkında bilgi..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Görsel URL (Opsiyonel)</label>
                      <input
                        type="url"
                        value={newEvent.imageUrl}
                        onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-100 border-transparent focus:bg-white focus:border-[#00aeef] rounded-2xl outline-none transition-all text-sm font-bold"
                        placeholder="https://..."
                      />
                    </div>

                    {/* Form Builder Section */}
                    <div className="pt-6 border-t border-stone-100 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ListChecks size={20} weight="bold" className="text-[#00aeef]" />
                          <h3 className="text-sm font-black text-stone-900 tracking-tight">Başvuru Formu</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, hasForm: !prev.hasForm }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${newEvent.hasForm ? 'bg-[#00aeef]' : 'bg-stone-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newEvent.hasForm ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {newEvent.hasForm && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-3">
                            {newEvent.formQuestions.map((q, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100 group">
                                <div className="flex-1 space-y-3">
                                  <div className="flex gap-3">
                                    <input
                                      required
                                      type="text"
                                      value={q.label}
                                      onChange={(e) => {
                                        const newQs = [...newEvent.formQuestions];
                                        newQs[idx].label = e.target.value;
                                        setNewEvent({ ...newEvent, formQuestions: newQs });
                                      }}
                                      placeholder="Soru metni (örn: Bölümünüz?)"
                                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#00aeef]"
                                    />
                                    <select
                                      value={q.type}
                                      onChange={(e) => {
                                        const newQs = [...newEvent.formQuestions];
                                        newQs[idx].type = e.target.value;
                                        setNewEvent({ ...newEvent, formQuestions: newQs });
                                      }}
                                      className="bg-white border border-stone-200 rounded-xl px-2 py-2 text-[10px] font-black uppercase outline-none focus:border-[#00aeef]"
                                    >
                                      <option value="text">Kısa Metin</option>
                                      <option value="textarea">Uzun Metin</option>
                                      <option value="number">Sayı</option>
                                    </select>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={q.required}
                                      onChange={(e) => {
                                        const newQs = [...newEvent.formQuestions];
                                        newQs[idx].required = e.target.checked;
                                        setNewEvent({ ...newEvent, formQuestions: newQs });
                                      }}
                                      className="w-3 h-3 rounded text-[#00aeef] focus:ring-[#00aeef]"
                                    />
                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Zorunlu Soru</span>
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQs = newEvent.formQuestions.filter((_, i) => i !== idx);
                                    setNewEvent({ ...newEvent, formQuestions: newQs });
                                  }}
                                  className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash size={18} weight="bold" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewEvent(prev => ({
                              ...prev,
                              formQuestions: [...prev.formQuestions, { label: "", type: "text", required: true }]
                            }))}
                            className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:text-[#00aeef] hover:border-[#00aeef] hover:bg-[#00aeef]/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Plus size={14} weight="bold" />
                            Yeni Soru Ekle
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-8 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-4 bg-stone-100 text-stone-600 font-black rounded-2xl hover:bg-stone-200 transition-all text-sm cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-4 bg-[#00aeef] text-white font-black rounded-2xl transition-all shadow-lg shadow-[#00aeef]/20 hover:scale-[1.02] cursor-pointer"
                  >
                    {editingEvent ? "Güncelle" : "Kaydet"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
