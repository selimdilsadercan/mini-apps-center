"use client";
import { getAppRootUrl } from "@/lib/apps";

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
  Sliders,
  Notebook,
  TrendUp,
  FramerLogo,
  PencilSimple,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { concert_list, friendship } from "@/lib/client";
import { useRouter } from "next/navigation";

const client = createBrowserClient();

export default function ConcertListPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [concerts, setConcerts] = useState<concert_list.Concert[]>([]);
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedConcertForEdit, setSelectedConcertForEdit] = useState<concert_list.Concert | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const router = useRouter();

  // Load concerts when user is loaded
  useEffect(() => {
    if (isUserLoaded) {
      fetchConcerts();
      fetchFriends();
    }
  }, [isUserLoaded, user]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await client.friendship.getFriends(user.id);
      setFriends(res.friends || []);
    } catch (error) {
      console.error("fetchFriends error:", error);
    }
  };

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      if (!user) {
        setConcerts([]);
        return;
      }
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
    <div className="flex min-h-screen flex-col bg-[#09090b] text-gray-100 relative overflow-hidden">
      <Toaster position="top-center" />

      <main className="flex-1 px-4 py-8 pb-32 max-w-xl mx-auto w-full relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="group flex items-center gap-2 text-zinc-400 text-xs font-semibold hover:text-white transition-all bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800 active:scale-95"
          >
            <CaretLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => {
              setSelectedConcertForEdit(null);
              setShowAddDrawer(true);
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-md shadow-pink-900/10"
          >
            <Plus size={14} weight="bold" />
            <span>Yeni Konser</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-6 mt-2">
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2">
            <MusicNotes size={26} weight="fill" className="text-pink-500" />
            My Concert <span className="text-pink-500">List</span>
          </h1>
        </div>


        {/* Filter Controls */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sanatçı, mekan veya yıl ara..."
            className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none transition-all placeholder:text-zinc-500 text-white"
          />
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
                onClick={() => {
                  setSelectedConcertForEdit(null);
                  setShowAddDrawer(true);
                }}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-98 text-sm"
              >
                İlk Konserini Ekle
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
                <div className="absolute left-[-37px] top-0 bg-[#09090b] px-2 py-1 rounded-md text-pink-500 font-black text-sm tracking-wider border border-pink-500/20 shadow-md">
                  {year}
                </div>

                <div className="space-y-6 pt-8">
                  {groupedByYear[year].map((concert) => {
                    const companions: { id: string; username: string | null; avatar: string | null }[] = [];
                    if (concert.user_clerk_id !== user?.id) {
                      companions.push({
                        id: concert.user_clerk_id,
                        username: concert.creator_username || "Arkadaş",
                        avatar: concert.creator_avatar || null
                      });
                    }
                    if (concert.friends) {
                      concert.friends.forEach((f: any) => {
                        if (f.id !== user?.id) {
                          companions.push(f);
                        }
                      });
                    }

                    return (
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
                          <div className="flex items-center gap-3">
                            <ArtistAvatar artistName={concert.artist} customImageUrl={concert.image_url} />
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
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setSelectedConcertForEdit(concert);
                                setShowAddDrawer(true);
                              }}
                              className="text-zinc-500 hover:text-pink-400 p-1.5 rounded-lg transition-colors hover:bg-zinc-800/50"
                              aria-label="Düzenle"
                            >
                              <Sliders size={14} />
                            </button>
                          </div>
                        </div>

                        {concert.notes && (
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-xs text-gray-400 leading-relaxed italic">
                            <Notebook size={14} className="shrink-0 text-violet-400/70 mt-0.5" />
                            <p>{concert.notes}</p>
                          </div>
                        )}

                        {companions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider shrink-0">Beraber:</span>
                            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                              {companions.map((companion) => (
                                <div
                                  key={companion.id}
                                  title={companion.username || "Arkadaş"}
                                  className="w-5.5 h-5.5 rounded-full bg-zinc-800 border border-[#09090b] flex items-center justify-center text-[9px] font-black uppercase text-zinc-400 overflow-hidden shrink-0"
                                >
                                  {companion.avatar ? (
                                    <img src={companion.avatar} alt={companion.username || ""} className="w-full h-full object-cover" />
                                  ) : (
                                    companion.username?.charAt(0) || "👤"
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium truncate">
                              {companions.map((c) => c.username || "Arkadaş").join(", ")}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>


      {/* 1. Add/Edit Concert Drawer */}
      <Drawer.Root
        open={showAddDrawer}
        onOpenChange={(open) => {
          setShowAddDrawer(open);
          if (!open) setSelectedConcertForEdit(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#09090b] text-white flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-zinc-800">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-zinc-800 mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight">
                {selectedConcertForEdit ? "Konseri Düzenle" : "Yeni Konser Ekle"}
              </Drawer.Title>
              <Drawer.Description className="text-xs text-zinc-400 mb-6">
                {selectedConcertForEdit
                  ? (selectedConcertForEdit.user_clerk_id === user?.id
                    ? "Konser detaylarını ve katılan arkadaşlarını güncelleyebilirsiniz."
                    : "Bu konser arkadaşınız tarafından eklenmiştir, detaylar salt okunurdur.")
                  : "En son katıldığın canlı müzik deneyimini kaydet."}
              </Drawer.Description>
              <AddConcertForm
                friends={friends}
                initialConcert={selectedConcertForEdit}
                onComplete={() => { fetchConcerts(); setShowAddDrawer(false); setSelectedConcertForEdit(null); }}
                onDelete={(id) => {
                  setDeleteTargetId(id);
                  setShowAddDrawer(false);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xs bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Trash size={20} weight="fill" />
                </div>
                <h3 className="text-base font-bold text-white">Konseri Sil</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bu konser anısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    if (deleteTargetId) {
                      handleDelete(deleteTargetId);
                      setDeleteTargetId(null);
                    }
                  }}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Single Add Form
function AddConcertForm({
  friends,
  initialConcert,
  onComplete,
  onDelete
}: {
  friends: friendship.FriendUser[];
  initialConcert?: concert_list.Concert | null;
  onComplete: () => void;
  onDelete?: (id: string) => void;
}) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    artist: initialConcert?.artist || "",
    date: initialConcert?.date || new Date().toISOString().split("T")[0],
    venue: initialConcert?.venue || "",
    notes: initialConcert?.notes || "",
    rating: initialConcert?.rating || 5,
  });
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    initialConcert?.friends?.map(f => f.id) || []
  );
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialConcert?.image_url || "");
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchImageOptions = async () => {
    if (!formData.artist.trim()) return;
    try {
      setLoadingImages(true);
      const res = await client.concert_list.getArtistImages({ artist: formData.artist });
      setImageOptions(res.imageUrls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingImages(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const isCreator = !initialConcert || initialConcert.user_clerk_id === user?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      if (initialConcert) {
        if (!isCreator) {
          toast.error("Bu konseri sadece oluşturan kişi düzenleyebilir.");
          return;
        }
        await client.concert_list.editConcert({
          id: initialConcert.id,
          userId: user.id,
          artist: formData.artist,
          date: formData.date,
          venue: formData.venue || undefined,
          notes: formData.notes || undefined,
          rating: formData.rating,
          friendIds: selectedFriendIds,
          imageUrl: selectedImageUrl || undefined,
        });
        toast.success("Konser güncellendi!");
      } else {
        await client.concert_list.addConcert({
          userId: user.id,
          artist: formData.artist,
          date: formData.date,
          venue: formData.venue || undefined,
          notes: formData.notes || undefined,
          rating: formData.rating,
          friendIds: selectedFriendIds,
          imageUrl: selectedImageUrl || undefined,
        });
        toast.success("Konser kaydedildi!");
      }
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
        <div className="flex gap-3 items-center">
          <input
            required
            disabled={!isCreator}
            type="text"
            value={formData.artist}
            onChange={(e) => {
              setFormData({ ...formData, artist: e.target.value });
              setImageOptions([]);
              setSelectedImageUrl("");
            }}
            placeholder="Sanatçı veya Grup adı"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none text-white disabled:opacity-50"
          />
          {formData.artist.trim() && (
            <button
              type="button"
              disabled={!isCreator}
              onClick={fetchImageOptions}
              className="relative rounded-xl overflow-hidden hover:scale-105 active:scale-95 transition-all focus:outline-none shrink-0 group border border-zinc-800"
              title="Görsel seçeneklerini yükle"
            >
              <ArtistAvatar artistName={formData.artist} customImageUrl={selectedImageUrl} size="md" />
              {isCreator && (
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                  <PencilSimple size={16} weight="bold" />
                </div>
              )}
            </button>
          )}
        </div>

        {/* Alternative image options */}
        {imageOptions.length > 0 && (
          <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Alternatif Görsel Seç:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {imageOptions.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageUrl(url)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all hover:scale-102 ${selectedImageUrl === url ? "border-pink-500 scale-102 shadow-lg shadow-pink-500/20" : "border-white/5 hover:border-zinc-700/50"
                    }`}
                >
                  <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        {loadingImages && (
          <div className="mt-2 text-[10px] text-pink-400 font-semibold animate-pulse">
            Görsel seçenekleri aranıyor...
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tarih</label>
        <input
          required
          disabled={!isCreator}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/40 outline-none text-white disabled:opacity-50"
        />
      </div>



      {friends.length > 0 && (
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Arkadaşlar</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  disabled={!isCreator}
                  type="button"
                  onClick={() => toggleFriendSelection(friend.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer disabled:opacity-50 ${isSelected
                      ? "bg-pink-500/10 border-pink-500/40 text-pink-300"
                      : "bg-white/5 border-white/5 hover:bg-white/10 text-zinc-300"
                    }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 text-[10px]">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : "👤"}
                  </div>
                  <span className="truncate flex-1 pr-1 text-ellipsis overflow-hidden whitespace-nowrap">
                    {friend.username || "Anonim"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isCreator && (
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow-lg shadow-pink-900/10"
        >
          {loading ? "Kaydediliyor..." : initialConcert ? "Güncelle" : "Kaydet"}
        </button>
      )}

      {initialConcert && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (onDelete) {
              onDelete(initialConcert.id);
            }
          }}
          className="w-full h-12 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm border border-red-500/20 mt-2"
        >
          {initialConcert.user_clerk_id === user?.id ? "Konseri Sil" : "Konserden Ayrıl"}
        </button>
      )}
    </form>
  );
}

// Global in-memory cache for artist images to avoid redundant API calls
const artistImageCache: Record<string, string> = {};

function ArtistAvatar({ artistName, customImageUrl, size = "sm" }: { artistName: string; customImageUrl?: string | null; size?: "sm" | "md" }) {
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

    // Check sessionStorage if available
    try {
      const cached = sessionStorage.getItem(`artist_img_v8_${artistKey}`);
      if (cached) {
        artistImageCache[artistKey] = cached;
        setImageUrl(cached);
        return;
      }
    } catch (e) { }

    let active = true;
    const fetchImage = async () => {
      setLoading(true);
      try {
        const res = await client.concert_list.getArtistImage({ artist: artistName.trim() });
        if (res.imageUrl && active) {
          artistImageCache[artistKey] = res.imageUrl;
          try {
            sessionStorage.setItem(`artist_img_v8_${artistKey}`, res.imageUrl);
          } catch (e) { }
          setImageUrl(res.imageUrl);
        }
      } catch (err) {
        console.error("Error fetching artist image from backend:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Debounce the API call slightly if typing in the form (especially for size === 'md')
    const timer = setTimeout(
      () => {
        fetchImage();
      },
      size === "md" ? 500 : 0
    );

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [artistName, customImageUrl, size]);

  const dimensions = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const iconSize = size === "sm" ? 16 : 20;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={artistName}
        className={`${dimensions} rounded-xl object-cover border border-zinc-800 shadow-md shrink-0`}
        onError={() => setImageUrl(null)}
      />
    );
  }

  return (
    <div className={`${dimensions} rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 font-black text-sm uppercase`}>
      {loading ? (
        <span className="animate-pulse">...</span>
      ) : (
        artistName.trim() ? artistName.trim().charAt(0) : <MusicNotes size={iconSize} />
      )}
    </div>
  );
}
