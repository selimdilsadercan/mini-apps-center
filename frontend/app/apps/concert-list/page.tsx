"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  MusicNotes,
  Plus,
  Trash,
  Calendar,
  MapPin,
  Star,
  CaretLeft,
  FileArrowUp,
  Sliders,
  Notebook,
  TrendUp,
  FramerLogo,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import Client, { concert_list, Local } from "@/lib/client";
import { useRouter } from "next/navigation";

const client = new Client(Local);

export default function ConcertListPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [concerts, setConcerts] = useState<concert_list.Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const router = useRouter();

  // Load concerts when user is loaded
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchConcerts();
    }
  }, [isUserLoaded, user]);

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const res = await client.concert_list.getConcerts(user.id);
      setConcerts(res.concerts || []);
    } catch (error) {
      console.error("fetchConcerts error:", error);
      toast.error("Konserler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await client.concert_list.deleteConcert(id, user.id);
      setConcerts(concerts.filter((c) => c.id !== id));
      toast.success("Konser anısı silindi.");
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  // Filter concerts
  const filteredConcerts = concerts.filter((c) => {
    const matchesSearch =
      c.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.venue && c.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.date.includes(searchQuery);
    const matchesRating = selectedRating === "all" ? true : c.rating === selectedRating;
    return matchesSearch && matchesRating;
  });

  // Basic stats
  const totalConcerts = concerts.length;
  const uniqueArtists = new Set(concerts.map((c) => c.artist.trim().toLowerCase())).size;
  const averageRating =
    concerts.filter((c) => c.rating).reduce((acc, c) => acc + (c.rating || 0), 0) /
      concerts.filter((c) => c.rating).length || 0;

  // Group concerts by year
  const groupedByYear = filteredConcerts.reduce((groups: Record<string, concert_list.Concert[]>, concert) => {
    const year = new Date(concert.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(concert);
    return groups;
  }, {});

  // Sort years descending
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  // Format date helper (Turkish locale)
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0b061b] text-gray-100 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Decorative Glowing Lights (Concert Atmosphere) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-pink-500/5 blur-[100px]" />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay bg-repeat bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/home")}
            className="group flex items-center gap-2 text-gray-400 text-xs font-semibold hover:text-white transition-all bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 active:scale-95"
          >
            <CaretLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Katalog</span>
          </button>

          <div className="flex items-center gap-2 bg-pink-500/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-pink-500/20 text-xs text-pink-400 font-bold uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            Live Records Active
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-gradient-to-tr from-pink-500 to-violet-600 p-5 rounded-[2rem] shadow-[0_0_40px_rgba(236,72,153,0.3)] mb-4 border border-pink-400/20"
          >
            <MusicNotes size={48} weight="fill" className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight uppercase leading-none mb-2 bg-gradient-to-r from-white via-pink-200 to-violet-300 bg-clip-text text-transparent">
            My Concert <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">List</span>
          </h1>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">Konser Günlüğü & Zaman Tüneli</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Konserler</div>
            <div className="text-2xl font-black text-white">{totalConcerts}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Sanatçılar</div>
            <div className="text-2xl font-black text-pink-400">{uniqueArtists}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Ort. Puan</div>
            <div className="text-2xl font-black text-violet-400 flex items-center justify-center gap-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "-"}
              {averageRating > 0 && <Star size={14} weight="fill" className="text-yellow-400" />}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-3 mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sanatçı, mekan veya yıl ara..."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none transition-all placeholder:text-gray-500"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 shrink-0">Puan:</span>
            {["all", 5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRating(r as any)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  selectedRating === r
                    ? "bg-pink-500/20 border-pink-500 text-pink-300"
                    : "bg-black/30 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {r === "all" ? "Hepsi" : `${r} Yıldız`}
              </button>
            ))}
          </div>
        </div>

        {/* Timelines / Lists */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-semibold uppercase tracking-widest animate-pulse">
            Zaman tüneli yükleniyor...
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6">
            <MusicNotes size={40} className="text-gray-600 mb-4" />
            <p className="text-sm font-semibold text-gray-400 mb-6">Henüz kayıtlı bir konser yok.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setShowAddDrawer(true)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-98 text-sm"
              >
                İlk Konserini Ekle
              </button>
              <button
                onClick={() => setShowImportDrawer(true)}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3.5 px-6 rounded-xl border border-white/10 transition-all text-sm flex items-center justify-center gap-2"
              >
                <FileArrowUp size={16} />
                concerts.txt'den Aktar
              </button>
            </div>
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs font-semibold">Aradığınız kriterlere uygun konser bulunamadı.</div>
        ) : (
          <div className="relative border-l-2 border-pink-500/10 pl-6 ml-3 space-y-12">
            {sortedYears.map((year) => (
              <div key={year} className="relative">
                {/* Year Marker */}
                <div className="absolute left-[-37px] top-0 bg-[#0b061b] px-2 py-1 rounded-md text-pink-500 font-black text-sm tracking-wider border border-pink-500/20 shadow-md">
                  {year}
                </div>

                <div className="space-y-6 pt-8">
                  {groupedByYear[year].map((concert) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={concert.id}
                      className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/5 relative group hover:border-pink-500/20 transition-all"
                    >
                      {/* Timeline node dot */}
                      <div className="absolute left-[-33px] top-6 w-3 h-3 rounded-full bg-pink-500 ring-4 ring-pink-500/20" />

                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-black text-white leading-tight group-hover:text-pink-300 transition-colors">
                            {concert.artist}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-pink-500" />
                              {formatDate(concert.date)}
                            </span>
                            {concert.venue && (
                              <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-violet-400" />
                                {concert.venue}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating Display */}
                        {concert.rating && (
                          <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg shrink-0">
                            <span className="text-xs font-black text-yellow-400 leading-none">{concert.rating}</span>
                            <Star size={12} weight="fill" className="text-yellow-400" />
                          </div>
                        )}
                      </div>

                      {concert.notes && (
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-gray-400 leading-relaxed italic">
                          <Notebook size={14} className="shrink-0 text-violet-400/70 mt-0.5" />
                          <p>{concert.notes}</p>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(concert.id)}
                        className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-500 transition-all p-1.5 bg-black/40 rounded-lg"
                      >
                        <Trash size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 inset-x-4 flex justify-center gap-3 z-[40] max-w-xl mx-auto pointer-events-none">
        <button
          onClick={() => setShowImportDrawer(true)}
          className="pointer-events-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 rounded-2xl flex items-center justify-center font-bold shadow-2xl active:scale-95 transition-all text-xs gap-2"
        >
          <FileArrowUp size={18} />
          <span>Metinden Aktar</span>
        </button>

        <button
          onClick={() => setShowAddDrawer(true)}
          className="pointer-events-auto flex-1 bg-gradient-to-r from-pink-500 to-violet-600 text-white h-14 rounded-2xl flex items-center justify-center font-bold shadow-[0_15px_30px_-5px_rgba(236,72,153,0.3)] active:scale-95 transition-all text-sm gap-2"
        >
          <Plus size={18} />
          <span>Yeni Konser</span>
        </button>
      </div>

      {/* 1. Add Concert Drawer */}
      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#0b061b] text-white flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-white/10">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-gray-600 mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight">Yeni Konser Ekle</Drawer.Title>
              <Drawer.Description className="text-xs text-gray-400 mb-6">En son katıldığın canlı müzik deneyimini kaydet.</Drawer.Description>
              <AddConcertForm onComplete={() => { fetchConcerts(); setShowAddDrawer(false); }} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 2. Bulk Import Drawer */}
      <Drawer.Root open={showImportDrawer} onOpenChange={setShowImportDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#0b061b] text-white flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-white/10">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-gray-600 mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight">Metinden Konser Aktar</Drawer.Title>
              <Drawer.Description className="text-xs text-gray-400 mb-6">
                `concerts.txt` içeriğini buraya yapıştırıp tüm konserlerini saniyeler içinde aktarabilirsin.
              </Drawer.Description>
              <BulkImportForm onComplete={() => { fetchConcerts(); setShowImportDrawer(false); }} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

// Single Add Form
function AddConcertForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    artist: "",
    date: new Date().toISOString().split("T")[0],
    venue: "",
    notes: "",
    rating: 5,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await client.concert_list.addConcert({
        userId: user.id,
        artist: formData.artist,
        date: formData.date,
        venue: formData.venue || undefined,
        notes: formData.notes || undefined,
        rating: formData.rating,
      });
      toast.success("Konser kaydedildi!");
      onComplete();
    } catch (err) {
      toast.error("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sanatçı / Grup</label>
        <input
          required
          type="text"
          value={formData.artist}
          onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
          placeholder="Sanatçı veya Grup adı"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tarih</label>
          <input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Puan (1-5)</label>
          <select
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none text-white"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n} className="bg-[#0b061b]">
                {n} Yıldız
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Mekan (İsteğe Bağlı)</label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          placeholder="Örn: Zorlu PSM, KüçükÇiftlik Park"
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Konser Notları & Anılar</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Bu konserde neler hissettin? En sevdiğin şarkı hangisiydi?"
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}

// Bulk Import Form
function BulkImportForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ artist: string; date: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Client side parser for 'DD.MM.YY Artist Name'
  useEffect(() => {
    if (!text.trim()) {
      setParsed([]);
      return;
    }

    const lines = text.split("\n");
    const results: { artist: string; date: string }[] = [];

    // Pattern matching: DD.MM.YY or DD.MM.YYYY, optionally trailing quotes, then artist name
    // e.g. "10.05.26 Arem Arman"
    // e.g. "19.05.25' Redd"
    const lineRegex = /^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})['"]?\s+(.+)$/;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Skip lines indicating metadata/headers
      if (trimmed.startsWith("Created At") || trimmed.startsWith("File Path") || trimmed.startsWith("Completed At")) {
        return;
      }

      const match = trimmed.match(lineRegex);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        let year = match[3];
        const artist = match[4].trim();

        // Convert 2 digit year to 4 digit
        if (year.length === 2) {
          const numYear = Number(year);
          year = numYear < 50 ? `20${year}` : `19${year}`;
        }

        const isoDate = `${year}-${month}-${day}`;
        results.push({ artist, date: isoDate });
      }
    });

    setParsed(results);
  }, [text]);

  const handleImport = async () => {
    if (!user || parsed.length === 0) return;
    try {
      setLoading(true);
      const res = await client.concert_list.bulkImportConcerts({
        userId: user.id,
        concerts: parsed.map((item) => ({
          artist: item.artist,
          date: item.date,
          rating: 5, // Default rating for imports
        })),
      });

      toast.success(`${res.importedCount} yeni konser başarıyla aktarıldı!`);
      onComplete();
    } catch (err) {
      toast.error("Aktarma sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Konser Listesi Metni</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Örnek Format:\n10.05.26 Pinhani\n09.05.26 Fatma Turgut\n19.05.25' Redd`}
          rows={8}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none font-mono"
        />
      </div>

      {parsed.length > 0 && (
        <div className="bg-white/5 border border-white/5 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
          <div className="text-xs font-bold text-pink-400 mb-2">Çözümlenen Konserler ({parsed.length}):</div>
          {parsed.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs text-gray-300">
              <span className="font-bold">{item.artist}</span>
              <span className="text-gray-500">{item.date}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || parsed.length === 0}
        className="w-full h-12 bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-40 text-sm gap-2"
      >
        {loading ? "Aktarılıyor..." : `İçeri Aktar (${parsed.length} Konser)`}
      </button>
    </div>
  );
}
