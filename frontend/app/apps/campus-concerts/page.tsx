"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  MusicNotes,
  Plus,
  Calendar,
  MapPin,
  CaretLeft,
  Notebook,
  MagnifyingGlass,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { campus_concerts } from "@/lib/client";

const client = createBrowserClient();

export default function CampusConcertsPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [concerts, setConcerts] = useState<campus_concerts.CampusConcert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Load concerts
  useEffect(() => {
    if (isUserLoaded) {
      fetchConcerts();
    }
  }, [isUserLoaded, user]);

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      const res = await client.campus_concerts.getConcerts({
        userId: user?.id || undefined
      });
      const data = res.concerts || [];
      setConcerts(data);

      // Auto-select first campus if none selected yet
      if (data.length > 0 && !selectedCampus) {
        const uniqueCampuses = Array.from(new Set(data.map((c) => c.campus)));
        if (uniqueCampuses.length > 0) {
          // Default to İTÜ Ayazağa if present, otherwise first available
          const defaultCampus = uniqueCampuses.find((c) => c.includes("İTÜ")) || uniqueCampuses[0];
          setSelectedCampus(defaultCampus);
        }
      }
    } catch (error) {
      console.error("fetchConcerts error:", error);
      toast.error("Konserler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique campuses
  const uniqueCampuses = Array.from(new Set(concerts.map((c) => c.campus))).sort();

  // Filter concerts: must match selected campus and search query
  const filteredConcerts = concerts.filter((c) => {
    const matchesCampus = c.campus === selectedCampus;
    const matchesSearch =
      c.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCampus && matchesSearch;
  });

  // Group concerts by year for structured grid view
  const groupedByYear = filteredConcerts.reduce((groups: Record<string, campus_concerts.CampusConcert[]>, concert) => {
    const year = new Date(concert.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(concert);
    return groups;
  }, {});

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  // Format date helper (Turkish locale)
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 relative overflow-hidden selection:bg-purple-100 selection:text-purple-900">
      <Toaster position="top-center" />

      {/* Decorative top header glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-purple-100/40 via-indigo-50/20 to-transparent blur-3xl pointer-events-none" />

      <main className="flex-1 px-4 py-8 pb-32 max-w-2xl mx-auto w-full relative z-10">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (window.location.href = getAppRootUrl())}
            className="group flex items-center gap-2 text-slate-600 text-xs font-bold hover:text-slate-900 transition-all bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 active:scale-95 shadow-sm shadow-slate-100"
          >
            <CaretLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-slate-500" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => {
              if (!user) {
                toast.error("Konser eklemek için giriş yapmalısınız.");
                return;
              }
              setShowAddDrawer(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-purple-200"
          >
            <Plus size={14} weight="bold" />
            <span>Konser Öner</span>
          </button>
        </div>

        {/* Title / Header */}
        <div className="mb-8 mt-2 text-center sm:text-left">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-purple-50 text-purple-600 mb-3.5">
            <MusicNotes size={28} weight="fill" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
            Campus <span className="text-purple-600">Concerts</span>
          </h1>
        </div>

        {/* Campus Selector Tabs */}
        {uniqueCampuses.length > 0 && (
          <div className="mb-6">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 block px-1 text-center sm:text-left">
              KAMPÜS SEÇİMİ
            </span>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {uniqueCampuses.map((campus) => (
                <button
                  key={campus}
                  onClick={() => setSelectedCampus(campus)}
                  className={`text-xs px-4 py-2.5 rounded-xl font-extrabold border transition-all ${
                    selectedCampus === campus
                      ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-100"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  {campus}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8 shadow-sm rounded-2xl">
          <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${selectedCampus || "Kampüs"} konserlerinde ara...`}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-800 font-semibold"
          />
        </div>

        {/* Concerts Grid View */}
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Konserler yükleniyor...
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-6">
            <MusicNotes size={36} className="text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-400">Bu kampüste eşleşen konser bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedYears.map((year) => (
              <div key={year} className="space-y-4">
                {/* Year Title */}
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{year}</h2>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupedByYear[year].map((concert) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={concert.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 flex flex-col justify-between relative"
                    >
                      <div>
                        {/* Artist and Avatar */}
                        <div className="flex items-start gap-3.5 mb-3">
                          <ArtistAvatar artistName={concert.artist} customImageUrl={concert.image_url} />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-extrabold text-slate-900 leading-snug truncate">
                              {concert.artist}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1">
                              <Calendar size={11} className="text-purple-500" />
                              <span>{formatDate(concert.date)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {concert.description && (
                          <p className="text-xs text-slate-500 leading-relaxed font-medium mb-3 pt-1 border-t border-slate-50">
                            {concert.description}
                          </p>
                        )}
                      </div>

                      {/* Proposer badge */}
                      {concert.creator_username && (
                        <div className="text-[9px] text-slate-400 font-semibold self-start bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          @{concert.creator_username}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Suggest Concert Drawer */}
      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[60]" />
          <Drawer.Content className="bg-white text-slate-800 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-slate-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-slate-900">
                Konser Öner
              </Drawer.Title>
              <Drawer.Description className="text-xs text-slate-400 mb-6 font-medium">
                Seçtiğin kampüste gerçekleşmiş veya gerçekleşecek konser detaylarını gir.
              </Drawer.Description>
              <SuggestConcertForm
                defaultCampus={selectedCampus}
                onComplete={() => {
                  fetchConcerts();
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

// Artist Avatar Rendering with caching
const artistImageCache: Record<string, string> = {};

function ArtistAvatar({
  artistName,
  customImageUrl,
  size = "sm"
}: {
  artistName: string;
  customImageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(customImageUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customImageUrl) {
      setImageUrl(customImageUrl);
      return;
    }

    if (!artistName.trim()) {
      setImageUrl(null);
      return;
    }

    const artistKey = artistName.trim().toLowerCase();
    if (artistImageCache[artistKey]) {
      setImageUrl(artistImageCache[artistKey]);
      return;
    }

    try {
      const cached = sessionStorage.getItem(`campus_artist_img_${artistKey}`);
      if (cached) {
        artistImageCache[artistKey] = cached;
        setImageUrl(cached);
        return;
      }
    } catch (e) {}

    let active = true;
    const fetchImage = async () => {
      setLoading(true);
      try {
        const res = await client.campus_concerts.getArtistImage({ artist: artistName.trim() });
        if (res.imageUrl && active) {
          artistImageCache[artistKey] = res.imageUrl;
          try {
            sessionStorage.setItem(`campus_artist_img_${artistKey}`, res.imageUrl);
          } catch (e) {}
          setImageUrl(res.imageUrl);
        }
      } catch (err) {
        console.error("Error fetching artist image:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchImage();
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [artistName, customImageUrl]);

  const dimensions = size === "sm" ? "w-10 h-10" : "w-14 h-14";
  const iconSize = size === "sm" ? 16 : 20;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={artistName}
        className={`${dimensions} rounded-xl object-cover border border-slate-200 shadow-sm shrink-0`}
        onError={() => setImageUrl(null)}
      />
    );
  }

  return (
    <div className={`${dimensions} rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0 font-extrabold text-xs`}>
      {loading ? (
        <span className="animate-pulse">...</span>
      ) : artistName.trim() ? (
        artistName.trim().substring(0, 2).toUpperCase()
      ) : (
        <MusicNotes size={iconSize} />
      )}
    </div>
  );
}

// Form Component
function SuggestConcertForm({
  defaultCampus,
  onComplete
}: {
  defaultCampus: string;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    artist: "",
    campus: defaultCampus || "İTÜ Ayazağa",
    date: new Date().toISOString().split("T")[0],
    description: ""
  });
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync with selected campus on mount/change
  useEffect(() => {
    if (defaultCampus) {
      setFormData((prev) => ({ ...prev, campus: defaultCampus }));
    }
  }, [defaultCampus]);

  const fetchImages = async () => {
    if (!formData.artist.trim()) return;
    try {
      setLoadingImages(true);
      const res = await client.campus_concerts.getArtistImages({ artist: formData.artist });
      setImageOptions(res.imageUrls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImages(false);
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
      await client.campus_concerts.addConcert({
        userId: user.id,
        artist: formData.artist,
        campus: formData.campus,
        date: formData.date,
        description: formData.description || undefined,
        imageUrl: selectedImageUrl || undefined
      });
      toast.success("Konser başarıyla eklendi!");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Konser eklenirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8 font-semibold text-slate-700">
      {/* Artist Name */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Sanatçı / Grup</label>
        <div className="flex gap-2.5 items-center">
          <input
            required
            type="text"
            value={formData.artist}
            onChange={(e) => {
              setFormData({ ...formData, artist: e.target.value });
              setImageOptions([]);
              setSelectedImageUrl("");
            }}
            placeholder="Sanatçı veya Grup adı"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500/60 outline-none text-slate-800 font-semibold"
          />
          {formData.artist.trim() && (
            <button
              type="button"
              onClick={fetchImages}
              className="bg-slate-100 border border-slate-200 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all shrink-0"
            >
              Görsel Bul
            </button>
          )}
        </div>

        {/* Selected / Options */}
        {imageOptions.length > 0 && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-150 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Görsel Seç:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {imageOptions.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageUrl(url)}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all hover:scale-102 ${
                    selectedImageUrl === url
                      ? "border-purple-500 scale-102 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        {loadingImages && (
          <div className="mt-2 text-[10px] text-purple-600 font-semibold animate-pulse">
            Görseller aranıyor...
          </div>
        )}
      </div>

      {/* Campus selection */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kampüs</label>
        <select
          value={formData.campus}
          onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500/60 outline-none text-slate-800 font-semibold appearance-none cursor-pointer"
        >
          <option value="İTÜ Ayazağa">İTÜ Ayazağa</option>
          <option value="Boğaziçi Güney Kampüs">Boğaziçi Güney Kampüs</option>
          <option value="Boğaziçi Kuzey Kampüs">Boğaziçi Kuzey Kampüs</option>
          <option value="YTÜ Davutpaşa">YTÜ Davutpaşa</option>
          <option value="ODTÜ Kampüsü">ODTÜ Kampüsü</option>
          <option value="Bilkent Merkez Kampüs">Bilkent Merkez Kampüs</option>
          <option value="Koç Rumelifeneri">Koç Rumelifeneri</option>
          <option value="Sabancı Tuzla Kampüsü">Sabancı Tuzla Kampüsü</option>
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Tarih</label>
        <input
          required
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500/60 outline-none text-slate-800 font-semibold"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Açıklama / Detaylar</label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Konser veya şenlik hakkında eklemek istediklerin..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-purple-500/60 outline-none text-slate-800 font-semibold resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow-sm"
      >
        {submitting ? "Ekleniyor..." : "Konser Öner"}
      </button>
    </form>
  );
}
