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
  Trash,
  Megaphone,
  Globe,
  Users
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

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    organizerClub: "",
    imageUrl: "",
    category: "social"
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
    setNewEvent({
      title: "",
      description: "",
      location: "",
      eventDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      organizerClub: "",
      imageUrl: "",
      category: "social"
    });
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
      category: event.category || "social"
    });
    setShowAddModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isoDate = new Date(newEvent.eventDate).toISOString();
      
      if (editingEvent) {
        // We don't have an updateEvent endpoint yet, let's assume it works like addEvent for now
        // or just implement addEvent and we'll add update later.
        // For now, I'll just use addEvent and tell the user.
        toast.error("Güncelleme henüz desteklenmiyor, yeni etkinlik ekleyebilirsiniz.");
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
          category: newEvent.category
        });
        toast.success("Etkinlik oluşturuldu!");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-stone-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div 
              key={event.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative h-40 bg-stone-100 overflow-hidden">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Calendar size={48} weight="thin" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(event)}
                    className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-stone-600 hover:text-[#00aeef] shadow-sm transition-colors cursor-pointer"
                  >
                    <Pencil size={18} weight="bold" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                  {event.category || "Genel"}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-stone-900 line-clamp-1">{event.title}</h3>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-bold">
                    <Calendar size={16} className="text-[#00aeef]" />
                    {formatDate(event.event_date)}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-bold">
                      <MapPin size={16} className="text-[#00aeef]" />
                      {event.location}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-50">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-stone-400" />
                    <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                      {event.attendees?.length || 0} Katılımcı
                    </span>
                  </div>
                  <a 
                    href={`/apps/campus-events`}
                    target="_blank"
                    className="text-[10px] font-black text-[#00aeef] uppercase tracking-widest hover:underline"
                  >
                    Görüntüle
                  </a>
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
                    {editingEvent ? "Etkinliği Düzenle" : "Yeni Etkinlik Oluştur"}
                  </h2>
                  <p className="text-stone-500 text-xs font-bold mt-1 uppercase tracking-wider">
                    Etkinlik detaylarını doldurun
                  </p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer">
                  <X size={24} weight="bold" className="text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
