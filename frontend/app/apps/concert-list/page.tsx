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
  ArrowSquareIn,
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
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
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

      // Fetch internal user ID if not already fetched
      if (!internalUserId) {
        const userRes = await client.users.getUserByClerkId(user.id);
        if (userRes.user) {
          setInternalUserId(userRes.user.id);
        }
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
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text relative overflow-hidden selection:bg-[#FF1493]/20">
      <Toaster position="top-center" />

      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-10 bg-[#FF1493]" />
      </div>

      {/* Mandatory Header Pattern */}
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 py-3 max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => window.location.href = getAppRootUrl()}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-[#FF1493]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <MusicNotes size={18} weight="fill" className="text-[#FF1493] shrink-0" />
              <span className="truncate">
                My <span className="text-[#FF1493]">Concert List</span>
              </span>
            </h1>
          </div>

          {user && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowImportDrawer(true)}
                className="bg-app-surface hover:bg-app-surface-muted text-app-text text-[10px] font-black px-2.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 border border-app-border shadow-sm cursor-pointer"
              >
                <ArrowSquareIn size={12} weight="bold" />
                <span>İçe Aktar</span>
              </button>
              <button
                onClick={() => {
                  setSelectedConcertForEdit(null);
                  setShowAddDrawer(true);
                }}
                className="bg-[#FF1493] hover:opacity-90 text-white text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus size={12} weight="bold" />
                <span>Yeni</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-32 max-w-xl mx-auto w-full relative z-10">
        {/* Filter Controls */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sanatçı, mekan veya yıl ara..."
            className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-muted focus:border-[#FF1493]/50 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Timelines / Lists */}
        {loading ? (
          <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            Zaman tüneli yükleniyor...
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
            <MusicNotes size={40} className="text-app-muted mb-4" />
            <p className="text-sm font-bold text-app-muted">Konser listeni görebilmek ve yeni konserler eklemek için giriş yapmalısın.</p>
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
            <MusicNotes size={40} className="text-app-muted mb-4" />
            <p className="text-sm font-bold text-app-muted mb-6">Henüz kayıtlı bir konser yok.</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => {
                  setSelectedConcertForEdit(null);
                  setShowAddDrawer(true);
                }}
                className="w-full bg-[#FF1493] hover:opacity-90 text-white font-black py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-98 text-sm uppercase tracking-widest cursor-pointer"
              >
                İlk Konserini Ekle
              </button>
            </div>
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="text-center py-16 text-app-muted text-xs font-bold uppercase tracking-widest">
            Aradığınız kriterlere uygun konser bulunamadı.
          </div>
        ) : (
          <div className="relative border-l-2 border-[#FF1493]/20 pl-6 ml-3 space-y-12">
            {sortedYears.map((year) => (
              <div key={year} className="relative">
                {/* Year Marker */}
                <div className="absolute left-[-37px] top-0 bg-app-surface px-2.5 py-1 rounded-lg text-[#FF1493] font-black text-xs tracking-wider border border-[#FF1493]/30 shadow-sm">
                  {year}
                </div>

                <div className="space-y-6 pt-8">
                  {groupedByYear[year].map((concert) => {
                    const companions: { id: string; username: string | null; avatar: string | null }[] = [];
                    const isMe = concert.userId === internalUserId;
                    if (!isMe) {
                      companions.push({
                        id: concert.userId,
                        username: concert.creatorUsername || "Arkadaş",
                        avatar: concert.creatorAvatar || null
                      });
                    }
                    if (concert.friends) {
                      concert.friends.forEach((f: any) => {
                        if (f.id !== internalUserId) {
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
                        className="bg-app-surface rounded-2xl p-5 border border-app-border relative group hover:border-[#FF1493]/30 hover:bg-app-surface-muted active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                        onClick={() => {
                          setSelectedConcertForEdit(concert);
                          setShowAddDrawer(true);
                        }}
                      >
                        {/* Timeline node dot */}
                        <div className="absolute left-[-33px] top-6 w-3 h-3 rounded-full bg-[#FF1493] ring-4 ring-[#FF1493]/20" />

                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-3">
                            <ArtistAvatar artistName={concert.artist} customImageUrl={concert.imageUrl} />
                            <div>
                              <h3 className="text-base font-black text-app-text leading-tight group-hover:text-[#FF1493] transition-colors">
                                {concert.artist}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-app-muted mt-2">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} className="text-[#FF1493]" />
                                  {formatDate(concert.date)}
                                </span>
                                {concert.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-app-muted" />
                                    {concert.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {concert.notes && (
                          <div className="mt-4 pt-3 border-t border-app-border flex items-start gap-2 text-xs text-app-muted leading-relaxed italic">
                            <Notebook size={14} className="shrink-0 text-[#FF1493]/70 mt-0.5" />
                            <p>{concert.notes}</p>
                          </div>
                        )}

                        {companions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-app-border flex items-center gap-2">
                            <span className="text-[10px] text-app-muted font-black uppercase tracking-wider shrink-0">Beraber:</span>
                            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                              {companions.map((companion) => (
                                <div
                                  key={companion.id}
                                  title={companion.username || "Arkadaş"}
                                  className="w-5.5 h-5.5 rounded-full bg-app-surface-muted border border-app-border flex items-center justify-center text-[9px] font-black uppercase text-app-muted overflow-hidden shrink-0"
                                >
                                  {companion.avatar ? (
                                    <img src={companion.avatar} alt={companion.username || ""} className="w-full h-full object-cover" />
                                  ) : (
                                    companion.username?.charAt(0) || "👤"
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-app-muted font-bold truncate">
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
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-app-bg text-app-text flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-app-border shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-app-border mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight text-app-text">
                {selectedConcertForEdit ? "Konseri Düzenle" : "Yeni Konser Ekle"}
              </Drawer.Title>
              <Drawer.Description className="text-xs text-app-muted mb-6">
                {selectedConcertForEdit
                  ? (selectedConcertForEdit.userId === internalUserId
                    ? "Konser detaylarını ve katılan arkadaşlarını güncelleyebilirsiniz."
                    : "Bu konser arkadaşınız tarafından eklenmiştir, detaylar salt okunurdur.")
                  : "En son katıldığın canlı müzik deneyimini kaydet."}
              </Drawer.Description>
              <AddConcertForm
                friends={friends}
                initialConcert={selectedConcertForEdit}
                internalUserId={internalUserId}
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

      {/* 2. Bulk Import Drawer */}
      <Drawer.Root
        open={showImportDrawer}
        onOpenChange={setShowImportDrawer}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-app-bg text-app-text flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-app-border shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-app-border mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight text-app-text">
                Metinden Konser Aktar
              </Drawer.Title>
              <Drawer.Description className="text-xs text-app-muted mb-6">
                Her satıra bir konser gelecek şekilde listenizi yapıştırın.
              </Drawer.Description>
              <BulkImportForm
                onComplete={() => {
                  fetchConcerts();
                  setShowImportDrawer(false);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xs bg-app-surface border border-app-border rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <Trash size={20} weight="fill" />
                </div>
                <h3 className="text-base font-black text-app-text">Konseri Sil</h3>
                <p className="text-xs text-app-muted leading-relaxed font-medium">
                  Bu konser anısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 h-10 bg-app-surface-muted hover:bg-app-border text-app-text text-xs font-bold rounded-xl transition-all border border-app-border cursor-pointer"
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
                  className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
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
  internalUserId,
  onComplete,
  onDelete
}: {
  friends: friendship.FriendUser[];
  initialConcert?: concert_list.Concert | null;
  internalUserId: string | null;
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
  const [selectedImageUrl, setSelectedImageUrl] = useState(initialConcert?.imageUrl || "");
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

  const isCreator = !initialConcert || initialConcert.userId === internalUserId;

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
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Sanatçı / Grup</label>
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
            className="flex-1 bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:border-[#FF1493]/50 outline-none text-app-text placeholder:text-app-muted disabled:opacity-50"
          />
          {formData.artist.trim() && (
            <button
              type="button"
              disabled={!isCreator}
              onClick={fetchImageOptions}
              className="relative rounded-xl overflow-hidden hover:scale-105 active:scale-95 transition-all focus:outline-none shrink-0 group border border-app-border"
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
          <div className="mt-3 p-3 bg-app-surface border border-app-border rounded-xl">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block mb-2">Alternatif Görsel Seç:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {imageOptions.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageUrl(url)}
                  className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all hover:scale-102 cursor-pointer ${
                    selectedImageUrl === url ? "border-[#FF1493] scale-102 shadow-md" : "border-app-border hover:border-app-muted"
                  }`}
                >
                  <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
        {loadingImages && (
          <div className="mt-2 text-[10px] text-[#FF1493] font-semibold animate-pulse">
            Görsel seçenekleri aranıyor...
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Tarih</label>
        <input
          required
          disabled={!isCreator}
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:border-[#FF1493]/50 outline-none text-app-text disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Mekan / Şehir (Opsiyonel)</label>
        <input
          disabled={!isCreator}
          type="text"
          value={formData.venue}
          onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
          placeholder="Örn: KüçükÇiftlik Park, VW Arena..."
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:border-[#FF1493]/50 outline-none text-app-text placeholder:text-app-muted disabled:opacity-50"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Notlar (Opsiyonel)</label>
        <textarea
          disabled={!isCreator}
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Konserle ilgili notların, şarkı listesi vb..."
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:border-[#FF1493]/50 outline-none text-app-text placeholder:text-app-muted disabled:opacity-50"
        />
      </div>

      {friends.length > 0 && (
        <div>
          <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Arkadaşlar</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  disabled={!isCreator}
                  type="button"
                  onClick={() => toggleFriendSelection(friend.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? "bg-[#FF1493]/10 border-[#FF1493]/40 text-[#FF1493]"
                      : "bg-app-surface border-app-border hover:bg-app-surface-muted text-app-text"
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-app-surface-muted border border-app-border overflow-hidden flex items-center justify-center shrink-0 text-[10px] text-app-muted">
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
          className="w-full h-12 bg-[#FF1493] hover:opacity-90 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow-md cursor-pointer"
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
          className="w-full h-12 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm border border-red-500/20 mt-2 cursor-pointer"
        >
          {initialConcert.userId === internalUserId ? "Konseri Sil" : "Konserden Ayrıl"}
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
        className={`${dimensions} rounded-xl object-cover border border-app-border shadow-sm shrink-0`}
        onError={() => setImageUrl(null)}
      />
    );
  }

  return (
    <div className={`${dimensions} rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center text-app-muted shrink-0 font-black text-sm uppercase`}>
      {loading ? (
        <span className="animate-pulse">...</span>
      ) : (
        artistName.trim() ? artistName.trim().charAt(0) : <MusicNotes size={iconSize} />
      )}
    </div>
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
    const lineRegex = /^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})['"]?\s+(.+)$/;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith("Created At") || trimmed.startsWith("File Path") || trimmed.startsWith("Completed At")) {
        return;
      }

      const match = trimmed.match(lineRegex);
      if (match) {
        const day = match[1].padStart(2, "0");
        const month = match[2].padStart(2, "0");
        let year = match[3];
        const artist = match[4].trim();

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
          rating: 5,
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
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Konser Listesi Metni</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Örnek Format:\n10.05.26 Pinhani\n09.05.26 Fatma Turgut\n19.05.25' Redd`}
          rows={8}
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-muted focus:border-[#FF1493]/50 outline-none font-mono"
        />
      </div>

      {parsed.length > 0 && (
        <div className="bg-app-surface-muted border border-app-border rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
          <div className="text-xs font-bold text-[#FF1493] mb-2">Çözümlenen Konserler ({parsed.length}):</div>
          {parsed.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs text-app-text">
              <span className="font-bold">{item.artist}</span>
              <span className="text-app-muted">{item.date}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || parsed.length === 0}
        className="w-full h-12 bg-[#FF1493] hover:opacity-90 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-40 text-sm gap-2 cursor-pointer"
      >
        {loading ? "Aktarılıyor..." : `İçeri Aktar (${parsed.length} Konser)`}
      </button>
    </div>
  );
}
