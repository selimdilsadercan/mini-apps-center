"use client";

import { getRootHomeUrl } from "@/lib/apps";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Compass,
  FilmReel,
  Television,
  GameController,
  MapPin,
  PaperPlaneTilt,
  Plus,
  Bookmark,
  CheckCircle,
  XCircle,
  BookmarkSimple,
  Globe,
  Star,
  Users,
  Tray,
  ChatCircle,
  Eye
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import Client, { suggest, friendship } from "@/lib/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Initialize client
const client = createBrowserClient();

type TabType = "inbox" | "saved" | "sent";

export default function SuggestPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Yükleniyor...</div>}>
      <SuggestPageContent />
    </Suspense>
  );
}

function SuggestPageContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [inboxList, setInboxList] = useState<suggest.InboxSuggestion[]>([]);
  const [sentList, setSentList] = useState<suggest.SentSuggestion[]>([]);
  const [friendsList, setFriendsList] = useState<friendship.FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: "movie" as suggest.SuggestionCategory,
    title: "",
    shortNote: "",
    rating: 5,
    externalLink: "",
    imageUrl: "",
  });
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Suggestion for Detail view
  const [detailSuggestion, setDetailSuggestion] = useState<suggest.InboxSuggestion | null>(null);

  // Wizard and Place Search States
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<any[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Click Outside logic to clear place results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setPlaceResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Place Search (runs only when category is place and selectedPlace is not locked)
  useEffect(() => {
    if (formData.category !== "place" || !placeQuery.trim() || selectedPlace) {
      setPlaceResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setSearchingPlaces(true);
        const res = await client.workplaces.searchPlace({ query: placeQuery });
        setPlaceResults(res.results || []);
      } catch (err) {
        console.error("Error searching places:", err);
      } finally {
        setSearchingPlaces(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [placeQuery, formData.category, selectedPlace]);

  const closeCreateDrawer = () => {
    setIsCreateOpen(false);
    setCreateStep(1);
    setFormData({
      category: "movie",
      title: "",
      shortNote: "",
      rating: 5,
      externalLink: "",
      imageUrl: "",
    });
    setSelectedFriends([]);
    setPlaceQuery("");
    setPlaceResults([]);
    setSelectedPlace(null);
  };

  const handleSelectCategory = (category: suggest.SuggestionCategory) => {
    setFormData({ ...formData, category });
    setCreateStep(2);
  };

  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    setFormData({
      ...formData,
      title: place.name,
      externalLink: place.url || "",
      imageUrl: place.image_url || "",
    });
    setPlaceQuery("");
    setPlaceResults([]);
  };

  const handleClearPlace = () => {
    setSelectedPlace(null);
    setFormData({
      ...formData,
      title: "",
      externalLink: "",
      imageUrl: "",
    });
  };

  // Parse query parameters to pre-populate Mekan suggestion
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const suggestPlaceName = searchParams.get("suggestPlaceName");
    const suggestPlaceUrl = searchParams.get("suggestPlaceUrl");
    const suggestPlaceImage = searchParams.get("suggestPlaceImage");
    const suggestPlaceAddress = searchParams.get("suggestPlaceAddress");
    const suggestPlaceId = searchParams.get("suggestPlaceId");

    if (categoryParam === "place" && suggestPlaceName) {
      setFormData({
        category: "place",
        title: suggestPlaceName,
        shortNote: "",
        rating: 5,
        externalLink: suggestPlaceUrl || "",
        imageUrl: suggestPlaceImage || "",
      });
      setSelectedPlace({
        name: suggestPlaceName,
        address: suggestPlaceAddress || "",
        url: suggestPlaceUrl || "",
        image_url: suggestPlaceImage || "",
        google_place_id: suggestPlaceId || "",
      });
      setCreateStep(2);
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
      if (user) {
        // Fetch friends list once so it's always ready for the suggestions drawer
        client.friendship.getFriends(user.id).then(res => {
          setFriendsList(res.friends || []);
        }).catch(err => console.error("Error fetching friends:", err));
      }
    }
  }, [isUserLoaded, user, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user) {
        if (activeTab === "inbox" || activeTab === "saved") {
          const inboxRes = await client.suggest.getInbox(user.id);
          setInboxList(inboxRes.suggestions);
        } else if (activeTab === "sent") {
          const sentRes = await client.suggest.getSent(user.id);
          setSentList(sentRes.suggestions);
        }
      }
    } catch (error) {
      console.error("fetchData error:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (suggestionId: string, status: suggest.RecipientStatus) => {
    if (!user) return;
    try {
      await client.suggest.updateStatus({
        recipientClerkId: user.id,
        suggestionId,
        status,
      });
      toast.success(
        status === "saved" ? "Öneri kaydedildi" : 
        status === "completed" ? "Tamamlandı olarak işaretlendi" : 
        "Öneri yok sayıldı"
      );
      // Refresh list
      fetchData();
      if (detailSuggestion?.suggestion_id === suggestionId) {
        setDetailSuggestion(null);
      }
    } catch (error) {
      toast.error("Durum güncellenemedi");
    }
  };



  const handleCreateSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedFriends.length === 0) {
      toast.error("Lütfen en az bir arkadaş seçin");
      return;
    }

    try {
      setIsSubmitting(true);
      await client.suggest.createSuggestion({
        senderClerkId: user.id,
        category: formData.category,
        title: formData.title,
        shortNote: formData.shortNote || undefined,
        rating: formData.rating,
        externalLink: formData.externalLink || undefined,
        imageUrl: formData.imageUrl || undefined,
        recipientClerkIds: selectedFriends,
      });

      toast.success("Öneriniz başarıyla gönderildi!");
      
      // Reset form
      setFormData({
        category: "movie",
        title: "",
        shortNote: "",
        rating: 5,
        externalLink: "",
        imageUrl: "",
      });
      setSelectedFriends([]);
      setCreateStep(1);
      setSelectedPlace(null);
      setPlaceQuery("");
      setPlaceResults([]);
      setIsCreateOpen(false);
      if (activeTab === "sent") {
        fetchData();
      } else {
        setActiveTab("sent");
      }
    } catch (error) {
      toast.error("Öneri gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string, size = 20) => {
    switch (category) {
      case "movie": return <FilmReel size={size} weight="fill" className="text-red-500" />;
      case "tv": return <Television size={size} weight="fill" className="text-violet-500" />;
      case "game": return <GameController size={size} weight="fill" className="text-emerald-500" />;
      case "place": return <MapPin size={size} weight="fill" className="text-amber-500" />;
      default: return <Compass size={size} weight="fill" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "movie": return "🎬 Film";
      case "tv": return "📺 Dizi";
      case "game": return "🎮 Oyun";
      case "place": return "📍 Mekan";
      default: return "💡 Öneri";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-600 border border-blue-200">Gelen</span>;
      case "saved":
        return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-amber-50 text-amber-600 border border-amber-200">Kaydedildi</span>;
      case "completed":
        return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-green-50 text-green-600 border border-green-200">Tamamlandı</span>;
      case "ignored":
        return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-500">Yok Sayıldı</span>;
      default:
        return null;
    }
  };

  const toggleFriendSelection = (clerkId: string) => {
    if (selectedFriends.includes(clerkId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== clerkId));
    } else {
      setSelectedFriends([...selectedFriends, clerkId]);
    }
  };

  const filteredInbox = inboxList.filter((item) => {
    if (activeTab === "saved") return item.status === "saved";
    return true; // "inbox" tab shows all
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-28 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Decorative BG Gradients */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent pointer-events-none -z-10" />

      <main className="flex-1 px-4 py-8 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation Bar / Return */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = getRootHomeUrl())}
              className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95"
            >
              <CaretLeft size={24} color="#374151" />
            </button>
            <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none">
              Tavsiye <span className="text-indigo-600">Kutusu</span>
            </h1>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>Öner</span>
          </button>
        </div>

        {/* Tabs Menu */}
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 mb-8 shadow-inner">
          {[
            { id: "inbox", label: "Gelenler", icon: Tray },
            { id: "saved", label: "Kaydedilenler", icon: Bookmark },
            { id: "sent", label: "Gönderdiklerim", icon: PaperPlaneTilt },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon size={16} weight={activeTab === tab.id ? "fill" : "bold"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Lists */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Tavsiyeler Getiriliyor...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* INBOX / SAVED TAB */}
            {(activeTab === "inbox" || activeTab === "saved") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {filteredInbox.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-6 flex flex-col items-center">
                    <Tray size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      {activeTab === "saved" ? "Henüz kayıtlı öneri yok" : "Gelen kutunuz boş"}
                    </p>
                  </div>
                ) : (
                  filteredInbox.map((item) => (
                    <motion.div
                      layoutId={item.id}
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col gap-4"
                    >
                      {/* Top Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Content Row */}
                      <div className="flex gap-4 items-start">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-16 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-black tracking-tight text-gray-900 leading-snug">
                            {item.title}
                          </h3>
                          {item.short_note && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {item.short_note}
                            </p>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-2 text-amber-500">
                              <Star size={12} weight="fill" />
                              <span className="text-[10px] font-black">{item.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sender Info & Footer Buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.sender_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                            alt={item.sender_username || "Friend"}
                            className="w-6 h-6 rounded-full object-cover border border-gray-100"
                          />
                          <span className="text-[10px] font-black text-gray-600">
                            {item.sender_username || "Bir Arkadaş"}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => setDetailSuggestion(item)}
                            className="p-2 hover:bg-gray-50 rounded-xl text-gray-500 border border-gray-100 active:scale-95 transition-all"
                            title="Detaylar"
                          >
                            <Eye size={16} />
                          </button>
                          {item.status !== "saved" && item.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(item.suggestion_id, "saved")}
                              className="p-2 hover:bg-amber-50 hover:text-amber-600 rounded-xl text-gray-500 border border-gray-100 active:scale-95 transition-all"
                              title="Kaydet"
                            >
                              <BookmarkSimple size={16} />
                            </button>
                          )}
                          {item.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(item.suggestion_id, "completed")}
                              className="p-2 hover:bg-green-50 hover:text-green-600 rounded-xl text-gray-500 border border-gray-100 active:scale-95 transition-all"
                              title="Tamamladım"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {item.status !== "ignored" && (
                            <button
                              onClick={() => handleUpdateStatus(item.suggestion_id, "ignored")}
                              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl text-gray-400 hover:border-red-100 active:scale-95 transition-all"
                              title="Yok Say"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* SENT TAB */}
            {activeTab === "sent" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {sentList.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-6 flex flex-col items-center">
                    <PaperPlaneTilt size={48} className="text-gray-300 mb-4" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      Henüz kimseye öneri göndermediniz
                    </p>
                  </div>
                ) : (
                  sentList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {new Date(item.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      <div className="flex gap-4 items-start">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-14 h-18 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-black text-gray-900 tracking-tight leading-snug">
                            {item.title}
                          </h3>
                          {item.short_note && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {item.short_note}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Recipient Tracking */}
                      <div className="pt-3 border-t border-gray-50 space-y-2">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">
                          Alıcı Durumları:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.recipients.map((rec) => (
                            <div
                              key={rec.recipient_clerk_id}
                              className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-1.5 pr-2.5 py-1"
                            >
                              <img
                                src={rec.recipient_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                alt={rec.recipient_username || "Friend"}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="text-[9px] font-bold text-gray-600">
                                {rec.recipient_username || "Arkadaş"}
                              </span>
                              <div className="w-1.5 h-1.5 rounded-full ml-1" style={{
                                backgroundColor: rec.status === 'completed' ? '#10b981' : 
                                                 rec.status === 'saved' ? '#f59e0b' : 
                                                 rec.status === 'ignored' ? '#ef4444' : '#3b82f6'
                              }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}


          </AnimatePresence>
        )}
      </main>

      {/* Create Suggestion Drawer */}
      <Drawer.Root open={isCreateOpen} onOpenChange={(open) => {
        if (!open) closeCreateDrawer();
      }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[94dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 bg-gray-200 rounded-full mb-6" />
              
              <header className="flex justify-between items-center mb-6 shrink-0">
                <Drawer.Title className="font-black text-xl text-gray-900 flex items-center gap-2">
                  {createStep === 2 && (
                    <button
                      onClick={() => setCreateStep(1)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-1"
                    >
                      <CaretLeft size={20} weight="bold" />
                    </button>
                  )}
                  <span>{createStep === 1 ? "Ne Öneriyorsun?" : "Detaylar"}</span>
                </Drawer.Title>
                <button
                  onClick={closeCreateDrawer}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </header>

              <AnimatePresence mode="wait">
                {createStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 flex-1 flex flex-col justify-center py-6"
                  >
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { id: "movie", label: "Film", emoji: "🎬", color: "bg-red-50 text-red-600 hover:bg-red-100/50" },
                        { id: "tv", label: "Dizi", emoji: "📺", color: "bg-violet-50 text-violet-600 hover:bg-violet-100/50" },
                        { id: "game", label: "Oyun", emoji: "🎮", color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50" },
                        { id: "place", label: "Mekan", emoji: "📍", color: "bg-amber-50 text-amber-600 hover:bg-amber-100/50" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id as suggest.SuggestionCategory)}
                          className={`py-4 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 transform active:scale-95 cursor-pointer shadow-sm ${cat.color}`}
                        >
                          <span className="text-2xl">{cat.emoji}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col"
                  >
                    <form onSubmit={handleCreateSuggestion} className="space-y-6 pb-6 flex-1">
                      
                      {/* Place-specific autocomplete search block */}
                      {formData.category === "place" ? (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            Mekan Ara (Google Haritalar)
                          </label>
                          
                          {selectedPlace ? (
                            <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-black text-indigo-900 block truncate">{selectedPlace.name}</span>
                                <span className="text-[10px] text-indigo-700/70 block truncate">{selectedPlace.address}</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleClearPlace}
                                className="ml-3 text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider"
                              >
                                Temizle
                              </button>
                            </div>
                          ) : (
                            <div className="relative" ref={searchContainerRef}>
                              <input
                                required
                                type="text"
                                placeholder="Kafe, restoran veya mekan adı girin..."
                                value={placeQuery}
                                onChange={(e) => setPlaceQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                              />
                              {searchingPlaces && (
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                </div>
                              )}
                              
                              {placeResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-gray-100">
                                  {placeResults.map((place, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSelectPlace(place)}
                                      className="w-full text-left p-3 hover:bg-indigo-50/30 transition-all active:bg-indigo-50 flex flex-col gap-0.5"
                                    >
                                      <span className="text-xs font-bold text-gray-900 block truncate">{place.name}</span>
                                      <span className="text-[10px] text-gray-400 block truncate">{place.address}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Title input for other types */
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            Başlık
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Film, dizi veya oyun adı..."
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                          />
                        </div>
                      )}

                      {/* Conditionally show remaining fields for place type only after a place is chosen */}
                      {(formData.category !== "place" || !!selectedPlace) && (
                        <>
                          {/* Short Note */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                              Neden Tavsiye Ediyorsun?
                            </label>
                            <textarea
                              placeholder="Arkadaşın neden bunu denemeli?"
                              rows={3}
                              value={formData.shortNote}
                              onChange={(e) => setFormData({ ...formData, shortNote: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300 resize-none"
                            />
                          </div>

                          {/* Score & Rating */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Puanın
                              </label>
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {formData.rating} / 5
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={5}
                              step={0.5}
                              value={formData.rating}
                              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        </>
                      )}

                      {/* Non-Mekan Links */}
                      {formData.category !== "place" && (
                        <>
                          {/* External Link */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                              Dış Link (IMDb, YouTube vb.)
                            </label>
                            <input
                              type="url"
                              placeholder="https://example.com"
                              value={formData.externalLink}
                              onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                            />
                          </div>

                          {/* Image Url */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                              Görsel Linki (Opsiyonel)
                            </label>
                            <input
                              type="url"
                              placeholder="Görsel adresi..."
                              value={formData.imageUrl}
                              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                            />
                          </div>
                        </>
                      )}

                      {/* Friend Multi-Select */}
                      {(formData.category !== "place" || !!selectedPlace) && (
                        <div className="space-y-2 pt-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            Gönderilecek Arkadaşlar ({selectedFriends.length})
                          </label>
                          {friendsList.length === 0 ? (
                            <div className="py-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Arkadaş listeniz boş. Önce arkadaş ekleyin!
                              </p>
                            </div>
                          ) : (
                            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-1 bg-gray-50">
                              {friendsList.map((friend) => {
                                const isSelected = selectedFriends.includes(friend.id);
                                return (
                                  <button
                                    key={friend.id}
                                    type="button"
                                    onClick={() => toggleFriendSelection(friend.id)}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                                      isSelected ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={friend.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                        alt={friend.username || "Friend"}
                                        className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                      />
                                      <span className="text-xs font-bold">{friend.username || "Arkadaş"}</span>
                                    </div>
                                    {isSelected && <CheckCircle size={16} weight="fill" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        disabled={isSubmitting || !formData.title.trim() || selectedFriends.length === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <PaperPlaneTilt size={16} weight="fill" />
                            <span>Öneriyi Gönder</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Suggestion Detail Drawer */}
      <Drawer.Root open={!!detailSuggestion} onOpenChange={(open) => !open && setDetailSuggestion(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#FAF9F7] flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
            {detailSuggestion && (
              <div className="p-6 overflow-y-auto">
                <div className="mx-auto w-12 h-1 bg-gray-200 rounded-full mb-6" />
                
                {/* Category & Status */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(detailSuggestion.category, 24)}
                    <span className="text-xs font-black uppercase text-gray-500 tracking-wider">
                      {getCategoryLabel(detailSuggestion.category)}
                    </span>
                  </div>
                  {getStatusBadge(detailSuggestion.status)}
                </div>

                {/* Cover & Title */}
                <div className="space-y-4 mb-6">
                  {detailSuggestion.image_url && (
                    <img
                      src={detailSuggestion.image_url}
                      alt={detailSuggestion.title}
                      className="w-full h-48 rounded-2xl object-cover border border-gray-100 shadow-sm"
                    />
                  )}
                  <h2 className="text-2xl font-black text-gray-900 leading-snug tracking-tight">
                    {detailSuggestion.title}
                  </h2>
                  
                  {detailSuggestion.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={16} weight="fill" />
                      <span className="text-sm font-black">{detailSuggestion.rating}/5</span>
                    </div>
                  )}
                </div>

                {/* Sender note section */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 mb-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <img
                      src={detailSuggestion.sender_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={detailSuggestion.sender_username || "Sender"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-black text-gray-700">
                      {detailSuggestion.sender_username} tavsiyesi:
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed italic">
                    "{detailSuggestion.short_note || "Herhangi bir not eklenmemiş."}"
                  </p>
                </div>

                {/* External Link */}
                {detailSuggestion.external_link && (
                  <a
                    href={detailSuggestion.external_link}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between bg-white border border-gray-100 hover:bg-gray-50 p-4 rounded-2xl mb-8 active:scale-98 transition-all font-bold text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Globe size={18} />
                      <span>{detailSuggestion.category === "place" ? "Haritada / Adreste Aç" : "Dış Platformda Göster"}</span>
                    </div>
                    <PaperPlaneTilt size={16} className="text-gray-400" />
                  </a>
                )}

                {/* Actions inside drawer */}
                <div className="flex gap-2">
                  {detailSuggestion.status !== "saved" && detailSuggestion.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.suggestion_id, "saved")}
                      className="flex-1 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-200 text-gray-700 hover:text-amber-600 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <BookmarkSimple size={16} />
                      <span>Kaydet</span>
                    </button>
                  )}
                  {detailSuggestion.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.suggestion_id, "completed")}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                    >
                      <CheckCircle size={16} />
                      <span>Tamamladım</span>
                    </button>
                  )}
                  {detailSuggestion.status !== "ignored" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.suggestion_id, "ignored")}
                      className="flex-1 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <XCircle size={16} />
                      <span>Yok Say</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}
