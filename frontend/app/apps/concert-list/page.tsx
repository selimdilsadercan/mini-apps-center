"use client";
import { getAppRootUrl } from "@/lib/apps";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  MusicNotes,
  Plus,
  Trash,
  Calendar,
  Star,
  CaretLeft,
  Notebook,
  PencilSimple,
  ArrowSquareIn,
  Compass,
  BookmarkSimple,
  Check,
  ListBullets,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { concert_list, friendship } from "@/lib/client";
import { useRouter } from "next/navigation";

import { PlacePicker, ConcertVenueLink, ConcertInfoLink, type SelectedPlace } from "./components/PlacePicker";

const client = createBrowserClient();
const ACCENT = "#FF1493";

const tabClass = (active: boolean) =>
  `inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] outline-none whitespace-nowrap ${
    active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
  }`;

type TabId = "discover" | "list";

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

  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [upcomingConcerts, setUpcomingConcerts] = useState<concert_list.UpcomingConcert[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  // Load concerts when user is loaded
  useEffect(() => {
    if (isUserLoaded) {
      fetchConcerts();
      fetchFriends();
    }
  }, [isUserLoaded, user]);

  useEffect(() => {
    fetchUpcomingConcerts();
  }, []);

  const getPlannedForUpcoming = (upcomingId: string) =>
    concerts.find(
      (c) =>
        c.status === "planned" &&
        c.upcomingConcertId === upcomingId &&
        c.userId === internalUserId,
    );

  const getAttendedForUpcoming = (upcomingId: string) =>
    concerts.find(
      (c) =>
        c.status !== "planned" &&
        c.upcomingConcertId === upcomingId &&
        c.userId === internalUserId,
    );

  const isPlannedUpcoming = (upcomingId: string) => !!getPlannedForUpcoming(upcomingId);
  const isAttendedUpcoming = (upcomingId: string) => !!getAttendedForUpcoming(upcomingId);

  const handleWantToGo = async (upcoming: concert_list.UpcomingConcert) => {
    if (!user) {
      toast.error("Gitmek istediğin konserleri kaydetmek için giriş yap.");
      return;
    }
    if (isAttendedUpcoming(upcoming.id)) {
      toast("Zaten gittiklerinde.");
      return;
    }
    if (isPlannedUpcoming(upcoming.id)) {
      toast("Zaten gitmek istediklerinde.");
      return;
    }
    try {
      await client.concert_list.addConcert({
        userId: user.id,
        artist: upcoming.artist,
        date: upcoming.date,
        placeId: upcoming.placeId,
        venue: upcoming.venue,
        infoUrl: upcoming.infoUrl,
        imageUrl: upcoming.imageUrl || undefined,
        status: "planned",
        upcomingConcertId: upcoming.id,
      });
      await fetchConcerts();
      toast.success("Gitmek istediklerine eklendi!");
    } catch {
      toast.error("Kaydedilemedi.");
    }
  };

  const handleRemovePlanned = async (concertId: string) => {
    if (!user) return;
    try {
      await client.concert_list.deleteConcert(concertId, user.id);
      setConcerts(concerts.filter((c) => c.id !== concertId));
      toast.success("Listeden çıkarıldı.");
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const handleQuickWent = async (upcoming: concert_list.UpcomingConcert) => {
    if (!user) {
      toast.error("Konser kaydetmek için giriş yap.");
      return;
    }
    if (isAttendedUpcoming(upcoming.id)) {
      toast("Zaten gittiklerinde.");
      return;
    }
    try {
      const existing = getPlannedForUpcoming(upcoming.id);
      if (existing) {
        await client.concert_list.editConcert({
          id: existing.id,
          userId: user.id,
          artist: existing.artist,
          date: existing.date,
          venue: existing.venue,
          placeId: existing.placeId,
          notes: existing.notes,
          rating: 5,
          infoUrl: existing.infoUrl,
          imageUrl: existing.imageUrl || undefined,
          status: "attended",
        });
      } else {
        await client.concert_list.addConcert({
          userId: user.id,
          artist: upcoming.artist,
          date: upcoming.date,
          placeId: upcoming.placeId,
          venue: upcoming.venue,
          infoUrl: upcoming.infoUrl,
          imageUrl: upcoming.imageUrl || undefined,
          rating: 5,
          status: "attended",
          upcomingConcertId: upcoming.id,
        });
      }
      await fetchConcerts();
      toast.success("Listene eklendi!");
    } catch {
      toast.error("Kaydedilemedi.");
    }
  };

  const handleMarkAttended = async (concert: concert_list.Concert) => {
    if (!user) return;
    try {
      await client.concert_list.editConcert({
        id: concert.id,
        userId: user.id,
        artist: concert.artist,
        date: concert.date,
        venue: concert.venue,
        placeId: concert.placeId,
        notes: concert.notes,
        rating: concert.rating ?? 5,
        infoUrl: concert.infoUrl,
        imageUrl: concert.imageUrl || undefined,
        status: "attended",
      });
      await fetchConcerts();
      toast.success("Gittiklerine eklendi!");
    } catch {
      toast.error("Kaydedilemedi.");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  const matchesUpcomingSearch = (c: concert_list.UpcomingConcert) =>
    c.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.venue && c.venue.toLowerCase().includes(searchQuery.toLowerCase()));

  const todayStr = new Date().toLocaleDateString("en-CA");
  const filteredUpcomingList = upcomingConcerts.filter(matchesUpcomingSearch);
  const futureUpcomingConcerts = filteredUpcomingList
    .filter((c) => c.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastUpcomingConcerts = filteredUpcomingList
    .filter((c) => c.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const renderUpcomingCard = (upcoming: concert_list.UpcomingConcert) => {
    const planned = isPlannedUpcoming(upcoming.id);
    const attended = isAttendedUpcoming(upcoming.id);

    return (
      <div
        key={upcoming.id}
        className="bg-app-surface rounded-2xl border border-app-border p-4 shadow-sm"
      >
        <div className="flex gap-4 items-center min-w-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
            {upcoming.imageUrl ? (
              <img src={upcoming.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#FF1493]/20 to-purple-500/20 flex items-center justify-center">
                <MusicNotes size={24} className="text-[#FF1493]/60" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-[#FF1493] font-black uppercase tracking-wider block mb-0.5">
              {formatDate(upcoming.date)}
            </span>
            <h3 className="text-sm font-black text-app-text truncate">{upcoming.artist}</h3>
            <p className="text-[11px] text-app-muted font-bold truncate mt-0.5">
              <ConcertVenueLink
                venue={upcoming.venue || "Şehir Etkinliği"}
                placeId={upcoming.placeId}
                className="text-[11px] text-app-muted font-bold"
              />
            </p>
            {upcoming.description && (
              <p className="text-[10px] text-app-muted truncate mt-1">{upcoming.description}</p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {upcoming.infoUrl ? (
            <a
              href={upcoming.infoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-app-muted hover:text-app-text transition-colors"
            >
              Detayları Gör
            </a>
          ) : (
            <span />
          )}
          {user && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => handleWantToGo(upcoming)}
                disabled={planned}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer border ${
                  planned
                    ? "border-[#FF1493]/30 text-[#FF1493] bg-[#FF1493]/10 cursor-default"
                    : "border-app-border bg-app-surface-muted hover:bg-app-surface text-app-muted hover:text-[#FF1493]"
                }`}
                title={planned ? "Listede" : "Gitmek İstiyorum"}
                aria-label={planned ? "Listede" : "Gitmek İstiyorum"}
              >
                <BookmarkSimple size={16} weight={planned ? "fill" : "bold"} />
              </button>
              <button
                type="button"
                onClick={() => handleQuickWent(upcoming)}
                disabled={attended}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer border ${
                  attended
                    ? "border-[#FF1493]/30 text-[#FF1493] bg-[#FF1493]/10 cursor-default"
                    : "border-app-border bg-app-surface-muted hover:bg-app-surface text-app-muted hover:text-[#FF1493]"
                }`}
                title={attended ? "Gittin" : "Gittim"}
                aria-label={attended ? "Gittin" : "Gittim"}
              >
                <Check size={16} weight={attended ? "bold" : "bold"} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPlannedCard = (concert: concert_list.Concert) => (
    <div
      key={concert.id}
      className="bg-app-surface rounded-2xl border border-app-border p-4 shadow-sm"
    >
      <div className="flex gap-4 items-center min-w-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
          {concert.imageUrl ? (
            <img src={concert.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#FF1493]/20 to-purple-500/20 flex items-center justify-center">
              <MusicNotes size={24} className="text-[#FF1493]/60" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[9px] text-[#FF1493] font-black uppercase tracking-wider block mb-0.5">
            {formatDate(concert.date)}
          </span>
          <h3 className="text-sm font-black text-app-text truncate">{concert.artist}</h3>
          {concert.venue && (
            <p className="text-[11px] text-app-muted font-bold truncate mt-0.5">
              <ConcertVenueLink
                venue={concert.venue}
                placeId={concert.placeId}
                className="text-[11px] text-app-muted font-bold"
              />
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {concert.infoUrl ? (
          <a
            href={concert.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-app-muted hover:text-app-text transition-colors"
          >
            Detayları Gör
          </a>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => handleRemovePlanned(concert.id)}
            className="w-9 h-9 rounded-xl border border-app-border bg-app-surface-muted hover:bg-red-500/10 hover:text-red-500 text-app-muted flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Kaldır"
            aria-label="Kaldır"
          >
            <Trash size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => handleMarkAttended(concert)}
            className="w-9 h-9 rounded-xl bg-[#FF1493] hover:opacity-90 text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Gittim"
            aria-label="Gittim"
          >
            <Check size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );

  const fetchUpcomingConcerts = async () => {
    try {
      setUpcomingLoading(true);
      const res = await client.concert_list.getUpcomingConcerts();
      setUpcomingConcerts(res.concerts || []);
    } catch (error) {
      console.error("fetchUpcomingConcerts error:", error);
    } finally {
      setUpcomingLoading(false);
    }
  };

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

  const matchesConcertSearch = (c: concert_list.Concert) =>
    c.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.venue && c.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.date.includes(searchQuery);

  const plannedConcerts = concerts
    .filter((c) => c.status === "planned" && c.userId === internalUserId)
    .filter(matchesConcertSearch)
    .sort((a, b) => a.date.localeCompare(b.date));

  const filteredAttendedConcerts = concerts
    .filter((c) => c.status !== "planned")
    .filter((c) => {
      const matchesSearch = matchesConcertSearch(c);
      const matchesRating = selectedRating === "all" ? true : c.rating === selectedRating;
      return matchesSearch && matchesRating;
    });

  const groupedByYear = filteredAttendedConcerts.reduce((groups: Record<string, concert_list.Concert[]>, concert) => {
    const year = new Date(concert.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(concert);
    return groups;
  }, {});

  // Sort years descending
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text relative overflow-hidden selection:bg-pink-100 dark:selection:bg-pink-950/40">
      <Toaster position="top-center" />

      {/* Mandatory Header Pattern */}
      <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => window.location.href = getAppRootUrl()}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
              >
                <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
              </button>

              <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
                <MusicNotes size={18} weight="fill" className="shrink-0" style={{ color: ACCENT }} />
                <span className="truncate">
                  My <span style={{ color: ACCENT }}>Concert List</span>
                </span>
              </h1>
            </div>

            {user && activeTab === "list" && (
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

          <div className="flex overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track mt-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("discover")}
                className={tabClass(activeTab === "discover")}
              >
                <Compass
                  size={13}
                  weight={activeTab === "discover" ? "fill" : "bold"}
                  className={activeTab === "discover" ? "text-[#FF1493]" : "text-app-muted"}
                />
                <span className="normal-case">Keşfet</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={tabClass(activeTab === "list")}
              >
                <ListBullets
                  size={13}
                  weight={activeTab === "list" ? "fill" : "bold"}
                  className={activeTab === "list" ? "text-[#FF1493]" : "text-app-muted"}
                />
                <span className="normal-case">Listem</span>
              </button>
            </div>
          </div>
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
        {activeTab === "discover" ? (
          upcomingLoading ? (
            <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
              Konserler yükleniyor...
            </div>
          ) : upcomingConcerts.length === 0 ? (
            <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
              <MusicNotes size={40} className="text-app-muted mb-4" />
              <p className="text-sm font-bold text-app-muted">Yaklaşan konser bulunamadı 🎭</p>
            </div>
          ) : filteredUpcomingList.length === 0 ? (
            <div className="text-center py-16 text-app-muted text-xs font-bold uppercase tracking-widest">
              Aradığınız kriterlere uygun konser bulunamadı.
            </div>
          ) : (
            <div className="space-y-8">
              {futureUpcomingConcerts.length > 0 && (
                <div className="space-y-4">
                  {futureUpcomingConcerts.map((upcoming) => renderUpcomingCard(upcoming))}
                </div>
              )}
              {pastUpcomingConcerts.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-app-muted mb-4">
                    Geçmiş Konserler
                  </h2>
                  <div className="space-y-4">
                    {pastUpcomingConcerts.map((upcoming) => renderUpcomingCard(upcoming))}
                  </div>
                </section>
              )}
            </div>
          )
        ) : loading ? (
          <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            Zaman tüneli yükleniyor...
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
            <MusicNotes size={40} className="text-app-muted mb-4" />
            <p className="text-sm font-bold text-app-muted">Konser listeni görebilmek ve yeni konserler eklemek için giriş yapmalısın.</p>
          </div>
        ) : plannedConcerts.length === 0 && filteredAttendedConcerts.length === 0 ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
            <MusicNotes size={40} className="text-app-muted mb-4" />
            <p className="text-sm font-bold text-app-muted mb-6">Henüz kayıtlı bir konser yok.</p>
            <button
              type="button"
              onClick={() => setActiveTab("discover")}
              className="text-[11px] font-black text-[#FF1493] hover:opacity-80 cursor-pointer"
            >
              Keşfet sekmesine git →
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {plannedConcerts.length > 0 && (
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-app-muted mb-4 flex items-center gap-1.5">
                  <BookmarkSimple size={14} weight="fill" className="text-[#FF1493]" />
                  Gitmek İstediğim
                </h2>
                <div className="space-y-4">
                  {plannedConcerts.map((concert) => renderPlannedCard(concert))}
                </div>
              </section>
            )}

            {filteredAttendedConcerts.length > 0 ? (
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-app-muted mb-4 flex items-center gap-1.5">
                  <Check size={14} weight="bold" className="text-[#FF1493]" />
                  Gittiklerim
                </h2>
                <div className="relative border-l-2 border-[#FF1493]/20 pl-6 ml-3 space-y-12">
                  {sortedYears.map((year) => (
                    <div key={year} className="relative">
                      <div className="absolute left-[-37px] top-0 bg-app-surface px-2.5 py-1 rounded-lg text-[#FF1493] font-black text-xs tracking-wider border border-[#FF1493]/30 shadow-sm">
                        {year}
                      </div>

                      <div className="space-y-6 pt-8">
                        {groupedByYear[year].map((concert) => {
                          return (
                            <motion.div
                              key={concert.id}
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-app-surface rounded-3xl border border-app-border p-5 relative shadow-sm transition-all group"
                            >
                              {concert.rating && (
                                <div className="absolute top-5 right-5 flex items-center gap-1 bg-[#FF1493]/10 text-[#FF1493] px-2 py-0.5 rounded-full text-[10px] font-black">
                                  <Star size={10} weight="fill" />
                                  <span>{concert.rating}/5</span>
                                </div>
                              )}

                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                                  {concert.imageUrl ? (
                                    <img src={concert.imageUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-[#FF1493]/20 to-purple-500/20 flex items-center justify-center">
                                      <MusicNotes size={24} className="text-[#FF1493]/60" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 pr-12">
                                  <h3 className="text-base font-black text-app-text truncate group-hover:text-[#FF1493] transition-colors">
                                    {concert.artist}
                                  </h3>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-app-muted font-bold">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {formatDate(concert.date)}
                                    </span>
                                    {concert.venue && (
                                      <ConcertVenueLink
                                        venue={concert.venue}
                                        placeId={concert.placeId}
                                        className="text-xs text-app-muted font-bold"
                                      />
                                    )}
                                    {concert.infoUrl && (
                                      <ConcertInfoLink
                                        infoUrl={concert.infoUrl}
                                        className="text-xs font-bold text-[#FF1493]"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {concert.userId === internalUserId && (
                                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedConcertForEdit(concert);
                                      setShowAddDrawer(true);
                                    }}
                                    className="w-7 h-7 rounded-lg bg-app-bg hover:bg-app-surface-muted text-app-muted hover:text-app-text border border-app-border flex items-center justify-center transition-colors cursor-pointer"
                                    title="Düzenle"
                                  >
                                    <PencilSimple size={13} weight="bold" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTargetId(concert.id)}
                                    className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 flex items-center justify-center transition-colors cursor-pointer"
                                    title="Sil"
                                  >
                                    <Trash size={13} weight="bold" />
                                  </button>
                                </div>
                              )}

                              {concert.userId !== internalUserId && (
                                <div className="absolute bottom-5 right-5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-app-muted bg-app-surface-muted px-2 py-1 rounded-md border border-app-border">
                                  <span>Arkadaştan</span>
                                </div>
                              )}

                              {concert.notes && (
                                <div className="mt-4 pt-3 border-t border-app-border flex items-start gap-2 text-xs text-app-muted leading-relaxed italic">
                                  <Notebook size={14} className="shrink-0 text-[#FF1493]/70 mt-0.5" />
                                  <p>{concert.notes}</p>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : plannedConcerts.length > 0 ? (
              <p className="text-center text-app-muted text-xs font-bold uppercase tracking-widest py-8">
                Aradığınız kriterlere uygun gittiğin konser bulunamadı.
              </p>
            ) : null}
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
                onComplete={() => {
                  fetchConcerts();
                  setShowAddDrawer(false);
                  setSelectedConcertForEdit(null);
                }}
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
    notes: initialConcert?.notes || "",
    rating: initialConcert?.rating || 5,
    infoUrl: initialConcert?.infoUrl || "",
  });
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    initialConcert?.placeId && initialConcert.venue
      ? { placeId: initialConcert.placeId, name: initialConcert.venue }
      : null,
  );
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
          placeId: selectedPlace?.placeId,
          venue: selectedPlace?.name,
          notes: formData.notes || undefined,
          rating: formData.rating,
          friendIds: selectedFriendIds,
          imageUrl: selectedImageUrl || undefined,
          infoUrl: formData.infoUrl.trim() || undefined,
        });
        toast.success("Konser güncellendi!");
      } else {
        await client.concert_list.addConcert({
          userId: user.id,
          artist: formData.artist,
          date: formData.date,
          placeId: selectedPlace?.placeId,
          venue: selectedPlace?.name,
          notes: formData.notes || undefined,
          rating: formData.rating,
          friendIds: selectedFriendIds,
          imageUrl: selectedImageUrl || undefined,
          infoUrl: formData.infoUrl.trim() || undefined,
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
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Mekan (Opsiyonel)</label>
        <PlacePicker
          value={selectedPlace}
          onChange={setSelectedPlace}
          disabled={!isCreator}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2 block">Detay Linki (Opsiyonel)</label>
        <input
          disabled={!isCreator}
          type="url"
          value={formData.infoUrl}
          onChange={(e) => setFormData({ ...formData, infoUrl: e.target.value })}
          placeholder="https://..."
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
