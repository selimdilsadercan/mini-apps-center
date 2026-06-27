"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  Plus, 
  Microphone, 
  Calendar, 
  MapPin, 
  Ticket, 
  YoutubeLogo, 
  InstagramLogo,
  Trash,
  Pencil,
  CaretLeft,
  X,
  MagnifyingGlass,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { standups } from "@/lib/client";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const client = createBrowserClient();

function StandupsDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id") || "";

  const [comedians, setComedians] = useState<standups.Comedian[]>([]);
  const [shows, setShows] = useState<standups.Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showComedianModal, setShowComedianModal] = useState(false);
  const [editingComedian, setEditingComedian] = useState<standups.Comedian | null>(null);
  const [comedianForm, setComedianForm] = useState({
    name: "",
    bio: "",
    image_url: "",
    youtube_channel_id: "",
    instagram_username: ""
  });

  const [showShowModal, setShowShowModal] = useState(false);
  const [editingShow, setEditingShow] = useState<standups.Show | null>(null);
  const [showForm, setShowForm] = useState({
    comedian_id: "",
    title: "",
    description: "",
    show_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    venue_name: "",
    ticket_url: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [comediansRes, showsRes] = await Promise.all([
        client.standups.listComedians(),
        client.standups.listUpcomingShows()
      ]);
      setComedians(comediansRes.comedians);
      setShows(showsRes.shows);
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveComedian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.standups.upsertComedian({
        id: editingComedian?.id,
        business_id: businessId,
        ...comedianForm
      });
      toast.success(editingComedian ? "Komedyen güncellendi." : "Komedyen eklendi.");
      setShowComedianModal(false);
      setEditingComedian(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.");
    }
  };

  const handleSaveShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.standups.upsertShow({
        id: editingShow?.id,
        venue_business_id: businessId,
        ...showForm,
        show_date: new Date(showForm.show_date).toISOString()
      });
      toast.success(editingShow ? "Gösteri güncellendi." : "Gösteri eklendi.");
      setShowShowModal(false);
      setEditingShow(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-8 py-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-stone-50 rounded-xl transition-all"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Microphone size={24} weight="fill" className="text-yellow-500" />
              Standups Yönetimi
            </h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Gösteri ve Komedyen Paneli</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingComedian(null);
              setComedianForm({ name: "", bio: "", image_url: "", youtube_channel_id: "", instagram_username: "" });
              setShowComedianModal(true);
            }}
            className="bg-white border border-stone-200 text-stone-900 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl hover:bg-stone-50 transition-all flex items-center gap-2"
          >
            <Plus size={14} weight="bold" />
            KOMEDYEN EKLE
          </button>
          <button
            onClick={() => {
              setEditingShow(null);
              setShowForm({ comedian_id: "", title: "", description: "", show_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16), venue_name: "", ticket_url: "" });
              setShowShowModal(true);
            }}
            className="bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-lg shadow-stone-900/20 hover:bg-stone-800 transition-all flex items-center gap-2"
          >
            <Plus size={14} weight="bold" />
            GÖSTERİ EKLE
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Comedians List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Komedyenler</h2>
            <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{comedians.length}</span>
          </div>
          <div className="space-y-3">
            {comedians.map(comedian => (
              <div key={comedian.id} className="bg-white border border-stone-200 rounded-3xl p-4 flex items-center gap-4 group hover:border-yellow-400 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 overflow-hidden shrink-0">
                  {comedian.image_url ? (
                    <img src={comedian.image_url} alt={comedian.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-stone-400">{comedian.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-stone-900 truncate">{comedian.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {comedian.instagram_username && <InstagramLogo size={14} weight="fill" className="text-stone-300" />}
                    {comedian.youtube_channel_id && <YoutubeLogo size={14} weight="fill" className="text-stone-300" />}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditingComedian(comedian);
                    setComedianForm({
                      name: comedian.name,
                      bio: comedian.bio || "",
                      image_url: comedian.image_url || "",
                      youtube_channel_id: comedian.youtube_channel_id || "",
                      instagram_username: comedian.instagram_username || ""
                    });
                    setShowComedianModal(true);
                  }}
                  className="p-2 text-stone-300 hover:text-stone-900 transition-colors"
                >
                  <Pencil size={18} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shows List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Yaklaşan Gösteriler</h2>
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input 
                placeholder="Gösteri ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-stone-200 rounded-full pl-9 pr-4 py-1.5 text-[11px] font-bold outline-none focus:border-stone-900 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shows.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(show => (
              <div key={show.id} className="bg-white border border-stone-200 rounded-[2rem] p-6 flex flex-col justify-between hover:shadow-md transition-all group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-yellow-50 text-yellow-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      {(show as any).comedian_name}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingShow(show);
                          setShowForm({
                            comedian_id: show.comedian_id,
                            title: show.title,
                            description: show.description || "",
                            show_date: new Date(show.show_date).toISOString().slice(0, 16),
                            venue_name: show.venue_name || "",
                            ticket_url: show.ticket_url || ""
                          });
                          setShowShowModal(true);
                        }}
                        className="p-2 text-stone-300 hover:text-stone-900 transition-colors"
                      >
                        <Pencil size={18} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-stone-900 leading-tight mb-4">{show.title}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Calendar size={16} />
                      <span className="text-xs font-bold">{format(new Date(show.show_date), "d MMMM yyyy, HH:mm", { locale: tr })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-500">
                      <MapPin size={16} />
                      <span className="text-xs font-bold">{show.venue_name || "Mekan Belirtilmedi"}</span>
                    </div>
                  </div>
                </div>

                {show.ticket_url && (
                  <div className="mt-6 pt-6 border-t border-stone-50 flex items-center justify-between">
                    <a 
                      href={show.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      <ArrowSquareOut size={20} weight="bold" />
                    </a>
                    <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Biletli Gösteri</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comedian Modal */}
      <AnimatePresence>
        {showComedianModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowComedianModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    {editingComedian ? "KOMEDYENİ DÜZENLE" : "YENİ KOMEDYEN"}
                  </h2>
                  <button onClick={() => setShowComedianModal(false)} className="p-2 hover:bg-stone-50 rounded-full transition-all">
                    <X size={24} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSaveComedian} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">İsim Soyisim</label>
                    <input 
                      required
                      value={comedianForm.name}
                      onChange={e => setComedianForm({ ...comedianForm, name: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-yellow-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Biyografi</label>
                    <textarea 
                      value={comedianForm.bio}
                      onChange={e => setComedianForm({ ...comedianForm, bio: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-yellow-500 outline-none transition-all h-24 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Instagram</label>
                      <input 
                        placeholder="@username"
                        value={comedianForm.instagram_username}
                        onChange={e => setComedianForm({ ...comedianForm, instagram_username: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-yellow-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">YouTube ID</label>
                      <input 
                        placeholder="Channel ID"
                        value={comedianForm.youtube_channel_id}
                        onChange={e => setComedianForm({ ...comedianForm, youtube_channel_id: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-yellow-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Profil Fotoğrafı URL</label>
                    <input 
                      value={comedianForm.image_url}
                      onChange={e => setComedianForm({ ...comedianForm, image_url: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-yellow-500 outline-none transition-all"
                    />
                  </div>
                  <button type="submit" className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-stone-900/10 transition-all active:scale-95">
                    KAYDET
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Show Modal */}
      <AnimatePresence>
        {showShowModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowShowModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    {editingShow ? "GÖSTERİYİ DÜZENLE" : "YENİ GÖSTERİ"}
                  </h2>
                  <button onClick={() => setShowShowModal(false)} className="p-2 hover:bg-stone-50 rounded-full transition-all">
                    <X size={24} weight="bold" />
                  </button>
                </div>

                <form onSubmit={handleSaveShow} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Komedyen Seçin</label>
                    <select 
                      required
                      value={showForm.comedian_id}
                      onChange={e => setShowForm({ ...showForm, comedian_id: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-stone-900 outline-none transition-all appearance-none"
                    >
                      <option value="">Seçiniz...</option>
                      {comedians.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Gösteri Başlığı</label>
                    <input 
                      required
                      value={showForm.title}
                      onChange={e => setShowForm({ ...showForm, title: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-stone-900 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Tarih & Saat</label>
                      <input 
                        type="datetime-local"
                        required
                        value={showForm.show_date}
                        onChange={e => setShowForm({ ...showForm, show_date: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-stone-900 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Mekan Adı</label>
                      <input 
                        value={showForm.venue_name}
                        onChange={e => setShowForm({ ...showForm, venue_name: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-stone-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Bilet Linki (Opsiyonel)</label>
                    <input 
                      type="url"
                      value={showForm.ticket_url}
                      onChange={e => setShowForm({ ...showForm, ticket_url: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-stone-900 outline-none transition-all"
                    />
                  </div>
                  <button type="submit" className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-stone-900/10 transition-all active:scale-95">
                    KAYDET
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StandupsDashboard() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <StandupsDashboardContent />
    </Suspense>
  );
}
