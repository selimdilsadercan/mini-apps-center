"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft,
  CaretLeft,
  Compass,
  FilmReel,
  Television,
  MusicNotes,
  YoutubeLogo,
  BookOpen,
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
  Eye,
  WhatsappLogo,
  Copy,
  Clock,
  Flame,
  Heart,
  SmileySad,
  Check,
  ShareNetwork,
  Sparkle,
  ArrowRight
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
    category: "song" as suggest.SuggestionCategory,
    title: "",
    shortNote: "",
    rating: 5,
    externalLink: "",
    imageUrl: "",
    previewUrl: "",
  });
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDailyPick = true;

  const [copiedLink, setCopiedLink] = useState(false);

  // Selected Suggestion for Detail view
  const [detailSuggestion, setDetailSuggestion] = useState<suggest.InboxSuggestion | null>(null);
  const [detailSentSuggestion, setDetailSentSuggestion] = useState<suggest.SentSuggestion | null>(null);

  // Wizard and Search States
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Friends Search State
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // Focus search input when step 2 opens
  useEffect(() => {
    if (isCreateOpen && createStep === 2 && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isCreateOpen, createStep]);

  // Click Outside logic to clear search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search
  useEffect(() => {
    if (!formData.title.trim() || selectedItem) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        if (formData.category === "song") {
          const res = await client.suggest.searchSong({ query: formData.title });
          setSearchResults(res.results || []);
        } else if (formData.category === "place") {
          const res = await client.workplaces.searchPlace({ query: formData.title });
          setSearchResults(res.results || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.title, formData.category, selectedItem]);

  const closeCreateDrawer = () => {
    setIsCreateOpen(false);
    setCreateStep(1);
    setFormData({
      category: "song",
      title: "",
      shortNote: "",
      rating: 5,
      externalLink: "",
      imageUrl: "",
      previewUrl: "",
    });
    setSelectedFriends([]);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedItem(null);

  };

  const handleSelectCategory = (category: suggest.SuggestionCategory) => {
    setFormData({ ...formData, category });
    setCreateStep(2);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedItem(null);
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    if (formData.category === "song") {
      setFormData({
        ...formData,
        title: `${item.trackName} - ${item.artistName}`,
        externalLink: item.trackViewUrl || "",
        imageUrl: item.artworkUrl100?.replace('100x100bb', '600x600bb') || "",
        previewUrl: item.previewUrl || "",
      });
    } else if (formData.category === "place") {
      setFormData({
        ...formData,
        title: item.name,
        externalLink: item.url || "",
        imageUrl: item.image_url || "",
      });
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClearItem = () => {
    setSelectedItem(null);
    setFormData({
      ...formData,
      title: "",
      externalLink: "",
      imageUrl: "",
      previewUrl: "",
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
        previewUrl: "",
      });
      setSelectedItem({
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


        // Fetch friends list
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

    try {
      setIsSubmitting(true);
      const res = await client.suggest.createSuggestion({
        senderClerkId: user.id,
        category: formData.category,
        title: formData.title,
        shortNote: formData.shortNote || undefined,
        rating: formData.rating,
        externalLink: formData.externalLink || undefined,
        imageUrl: formData.imageUrl || undefined,
        previewUrl: formData.previewUrl || undefined,
        recipientClerkIds: selectedFriends.length > 0 ? selectedFriends : undefined,
        isDailyPick: true,
      });

      if (res.shareId) {
        if (selectedFriends.length === 0) {
          const link = getShareLink(res.shareId);
          const categoryEmojis: Record<string, string> = { song: "şarkı 🎵", movie: "film 🎬", tv: "dizi 📺", video: "video 📹", place: "mekan 📍", book: "kitap 📚" };
          const categoryText = categoryEmojis[formData.category] || "öneri";
          const message = `Sana bir ${categoryText} bıraktım:\n👉 ${link}`;
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
          const newWindow = window.open(whatsappUrl, "_blank");
          if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            window.location.href = whatsappUrl;
          }
          toast.success("Öneriniz oluşturuldu ve WhatsApp'a yönlendiriliyorsunuz!");
        } else {
          toast.success("Öneriniz başarıyla gönderildi!");
        }
      } else {
        toast.success("Öneriniz başarıyla gönderildi!");
      }
      
      // Reset form
      setFormData({
        category: "song",
        title: "",
        shortNote: "",
        rating: 5,
        externalLink: "",
        imageUrl: "",
        previewUrl: "",
      });
      setSelectedFriends([]);
      setCreateStep(1);
      setSelectedItem(null);
      setSearchQuery("");
      setSearchResults([]);
      setIsCreateOpen(false);

      
      // Refresh status and list
      fetchData();

    } catch (error: any) {
      toast.error(error.message || "Öneri gönderilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string, size = 20) => {
    switch (category) {
      case "song": return <MusicNotes size={size} weight="fill" className="text-pink-500" />;
      case "movie": return <FilmReel size={size} weight="fill" className="text-red-500" />;
      case "tv": return <Television size={size} weight="fill" className="text-violet-500" />;
      case "video": return <YoutubeLogo size={size} weight="fill" className="text-red-600" />;
      case "place": return <MapPin size={size} weight="fill" className="text-amber-500" />;
      case "book": return <BookOpen size={size} weight="fill" className="text-emerald-600" />;
      default: return <Compass size={size} weight="fill" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "song": return "🎵 Şarkı";
      case "movie": return "🎬 Film";
      case "tv": return "📺 Dizi";
      case "video": return "📹 Video";
      case "place": return "📍 Mekan";
      case "book": return "📚 Kitap";
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

  const getSentStatusBadge = (item: suggest.SentSuggestion) => {
    // Check if expired
    const isExpired = item.expires_at ? new Date() > new Date(item.expires_at) : false;

    if (item.reaction) {
      const emojiMap: Record<string, string> = { loved: "🔥", skull: "💀", saved: "❤️", mid: "😐", perfect: "🎯" };
      const labelMap: Record<string, string> = { loved: "Çok İyi", skull: "Bu Ne?", saved: "Kaydettim", mid: "Orta", perfect: "Nokta Atışı" };
      return (
        <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
          <span>{emojiMap[item.reaction]}</span>
          <span>{labelMap[item.reaction]}</span>
        </span>
      );
    }

    if (isExpired) {
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-gray-150 text-gray-500 border border-gray-200">Süresi Doldu</span>;
    }

    if (item.opened_at) {
      return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Açıldı</span>;
    }

    return <span className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-600 border border-blue-200">Görülmedi</span>;
  };

  const getShareLink = (id: string) => {
    if (typeof window === "undefined") return "";
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    if (hostname.includes("localhost")) {
      return `http://suggest.localhost${port}/s/${id}`;
    }
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    return `https://suggest.${ROOT_DOMAIN}/s/${id}`;
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Bağlantı kopyalandı!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatTimeLeft = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} saat ${minutes} dakika`;
  };

  const toggleFriendSelection = (clerkId: string) => {
    if (selectedFriends.includes(clerkId)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== clerkId));
    } else {
      setSelectedFriends([...selectedFriends, clerkId]);
    }
  };

  const handleSelectAllFriends = () => {
    if (selectedFriends.length === friendsList.length) {
      setSelectedFriends([]);
    } else {
      setSelectedFriends(friendsList.map(f => f.id));
    }
  };

  const filteredInbox = inboxList.filter((item) => {
    if (activeTab === "saved") return item.status === "saved";
    return true;
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
              onClick={() => (window.location.href = getAppRootUrl())}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              <ArrowLeft size={20} weight="bold" className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none">
              Suggest
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
                  <div className="grid grid-cols-2 gap-4">
                    {filteredInbox.map((item, idx) => (
                      <motion.div
                        layoutId={item.id}
                        key={item.id}
                        onClick={() => setDetailSuggestion(item)}
                        style={{ rotate: idx % 2 === 0 ? "-2deg" : "2deg" }}
                        className="aspect-square bg-white rounded-2xl border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all relative overflow-hidden group cursor-pointer active:scale-95 hover:scale-[1.02] z-10 hover:z-20"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-indigo-50 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                              {getCategoryIcon(item.category, 32)}
                            </div>
                            <span className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest line-clamp-2">
                              {item.title}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center border border-gray-100 -rotate-3">
                          {getCategoryIcon(item.category, 14)}
                        </div>

                        <div className="absolute top-2 right-2 rotate-3">
                          {item.status === "saved" && (
                            <div className="w-7 h-7 rounded-lg bg-amber-400 text-white flex items-center justify-center shadow-md border border-white">
                              <BookmarkSimple size={14} weight="fill" />
                            </div>
                          )}
                          {item.status === "completed" && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md border border-white">
                              <CheckCircle size={14} weight="fill" />
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white p-1 rounded-lg shadow-lg border border-gray-100 rotate-2 z-20">
                          <img
                            src={item.sender_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                            alt={item.sender_username || "Friend"}
                            className="w-5 h-5 rounded-md object-cover"
                          />
                          <span className="text-[8px] font-black text-gray-900 truncate max-w-[50px]">
                            {item.sender_username?.split(' ')[0] || "Arkadaş"}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-2 right-20 z-10">
                          {item.is_daily_pick && (
                            <span className="text-[7px] font-black bg-amber-400 text-white px-1 py-0.5 rounded uppercase tracking-wider block w-max mb-1 italic">Daily Pick</span>
                          )}
                          <h3 className="text-[10px] font-black text-white leading-tight line-clamp-1 drop-shadow-md italic uppercase tracking-tighter">
                            {item.title}
                          </h3>
                        </div>
                      </motion.div>
                    ))}
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    {sentList.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setDetailSentSuggestion(item)}
                        style={{ transform: `rotate(${idx % 2 === 0 ? "-2deg" : "2deg"})` }}
                        className="aspect-square bg-white rounded-2xl border-4 border-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all relative overflow-hidden group active:scale-95 hover:scale-[1.02] z-10 hover:z-20 cursor-pointer"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-indigo-50 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                              {getCategoryIcon(item.category, 32)}
                            </div>
                            <span className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest line-clamp-2">
                              {item.title}
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-white shadow-md flex items-center justify-center border border-gray-100 -rotate-3">
                          {getCategoryIcon(item.category, 14)}
                        </div>

                        {/* Custom status indicator for shareable links */}
                        <div className="absolute top-2 right-2 rotate-3 z-20">
                          {getSentStatusBadge(item)}
                        </div>

                        <div className="absolute bottom-2 left-2 right-20 z-10">
                          {item.is_daily_pick && (
                            <span className="text-[7px] font-black bg-amber-400 text-white px-1 py-0.5 rounded uppercase tracking-wider block w-max mb-1 italic">Daily Pick</span>
                          )}
                          <h3 className="text-[10px] font-black text-white leading-tight line-clamp-1 drop-shadow-md italic uppercase tracking-tighter">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
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
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
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
              </header>

              <AnimatePresence mode="wait">
                {createStep === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6 flex-1 flex flex-col justify-center pb-6"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "song", label: "Şarkı", icon: MusicNotes, color: "text-pink-500", bg: "bg-pink-100/80" },
                        { id: "movie", label: "Film", icon: FilmReel, color: "text-red-500", bg: "bg-red-100/80" },
                        { id: "tv", label: "Dizi", icon: Television, color: "text-violet-500", bg: "bg-violet-100/80" },
                        { id: "video", label: "Video", icon: YoutubeLogo, color: "text-red-600", bg: "bg-red-100/80" },
                        { id: "place", label: "Mekan", icon: MapPin, color: "text-amber-500", bg: "bg-amber-100/80" },
                        { id: "book", label: "Kitap", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100/80" },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategory(cat.id as suggest.SuggestionCategory)}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 cursor-pointer bg-white border border-gray-100/50 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] group`}
                          >
                            <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                              <Icon size={24} weight="fill" className={cat.color} />
                            </div>
                            <span className="text-[10px] font-black tracking-tight text-gray-900">{cat.label}</span>
                          </button>
                        );
                      })}
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
                      
                      {/* Simple Title Input */}
                      {!selectedItem && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest pl-1">Öneri Adı</label>
                          <div className="relative" ref={searchContainerRef}>
                            <div className="flex gap-2">
                              <input
                                required
                                type="text"
                                placeholder={`${getCategoryLabel(formData.category)} adını yazın...`}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const isSearchCategory = formData.category === "song" || formData.category === "place";
                                    if (!isSearchCategory && formData.title.trim()) {
                                      setSelectedItem({ name: formData.title });
                                    }
                                  }
                                }}
                                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                              />
                              {(formData.category !== "song" && formData.category !== "place") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (formData.title.trim()) {
                                      setSelectedItem({ name: formData.title });
                                    }
                                  }}
                                  disabled={!formData.title.trim()}
                                  className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-2xl transition-all"
                                >
                                  Seç
                                </button>
                              )}
                            </div>

                            {isSearching && (
                              <div className="absolute right-20 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                              </div>
                            )}

                            {searchResults.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 max-h-[250px] overflow-y-auto divide-y divide-gray-100">
                                {searchResults.map((item, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectItem(item)}
                                    className="w-full text-left p-4 hover:bg-indigo-50/30 transition-all active:bg-indigo-50 flex items-center gap-4"
                                  >
                                    {formData.category === "song" && (
                                      <img src={item.artworkUrl100} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                    )}
                                    <div className="flex flex-col gap-1 min-w-0">
                                      <span className="text-sm font-bold text-gray-900 block truncate">
                                        {formData.category === "song" ? item.trackName : item.name}
                                      </span>
                                      <span className="text-xs text-gray-400 block truncate">
                                        {formData.category === "song" ? item.artistName : item.address}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dynamic Card Teaser Preview */}
                      {selectedItem && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 tracking-widest pl-1">Öneri Önizlemesi</label>
                          <div className="aspect-square w-1/2 mx-auto bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-[2rem] p-4 shadow-md relative flex flex-col items-center justify-center text-center overflow-hidden rotate-[-1deg]">
                            {/* Close/Clear Button (Çarpı) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(null);
                              }}
                              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all z-20 cursor-pointer"
                            >
                              <XCircle size={18} weight="bold" />
                            </button>

                            {/* Expire / One-time Badge */}
                            <div className="absolute top-3 left-3 flex items-center gap-0.5 bg-amber-400 text-white px-1.5 py-0.5 rounded-md shadow-sm border border-white rotate-[-2deg] z-10">
                              <Clock size={8} weight="fill" />
                              <span className="text-[6px] font-black uppercase tracking-wider">24s</span>
                            </div>

                            {/* Large Image or Icon */}
                            <div className="mb-2.5 mt-2">
                              {formData.imageUrl ? (
                                <img src={formData.imageUrl} className="w-20 h-20 rounded-2xl object-cover border border-white shadow-md" />
                              ) : (
                                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                  {getCategoryIcon(formData.category, 36)}
                                </div>
                              )}
                            </div>

                            {/* Text details */}
                            <div className="w-full px-1">
                              <span className="text-[9px] font-black text-gray-400 block uppercase tracking-widest mb-0.5">{getCategoryLabel(formData.category)}</span>
                              <span className="text-xs font-[1000] text-gray-900 block truncate leading-tight uppercase italic tracking-tight">{formData.title}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sharing Methods & In-App Friends list */}
                      {selectedItem && (
                        <div className="space-y-6">
                          {/* Sharing Methods */}
                          <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 tracking-widest pl-1">WhatsApp ile Gönder</label>
                              <button
                                type="button"
                                onClick={handleCreateSuggestion}
                                disabled={!formData.title.trim()}
                                className="w-full flex items-center justify-between p-4 bg-green-50/50 hover:bg-green-50 border border-green-200 text-green-700 rounded-2xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shadow-sm">
                                    <WhatsappLogo size={20} weight="fill" />
                                  </div>
                                  <div className="text-left">
                                    <span className="text-xs font-black block">WhatsApp / DM ile Paylaş</span>
                                    <span className="text-[9px] text-green-600/80 font-bold block">İstediğin kişiye göndermek için link oluşturur</span>
                                  </div>
                                </div>
                                <ArrowRight size={16} weight="bold" />
                              </button>
                            </div>

                            {/* Friends list selection */}
                            <div className="pt-2">
                              <div className="flex items-center justify-between pl-1 mb-2">
                                <label className="text-[10px] font-black text-gray-400 tracking-widest">
                                  Veya Uygulama İçi Arkadaşına Gönder ({selectedFriends.length})
                                </label>
                                {friendsList.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={handleSelectAllFriends}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                  >
                                    {selectedFriends.length === friendsList.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                                  </button>
                                )}
                              </div>

                              {friendsList.length > 0 && (
                                <input
                                  type="text"
                                  placeholder="Arkadaş ara..."
                                  value={friendSearchQuery}
                                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.preventDefault();
                                  }}
                                  className="w-full bg-gray-50 border border-gray-105 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300 mb-2"
                                />
                              )}

                              {friendsList.length === 0 ? (
                                <div className="py-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4">
                                  <p className="text-[9px] text-gray-400 font-bold tracking-wider">
                                    Arkadaş listeniz boş. Sadece üstteki WhatsApp seçeneğini kullanabilirsiniz.
                                  </p>
                                </div>
                              ) : (
                                <div className="overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-1 bg-gray-50 max-h-[160px]">
                                  {friendsList
                                    .filter(f => f.username?.toLowerCase().includes(friendSearchQuery.toLowerCase()))
                                    .map((friend) => {
                                      const isSelected = selectedFriends.includes(friend.id);
                                      return (
                                        <button
                                          key={friend.id}
                                          type="button"
                                          onClick={() => toggleFriendSelection(friend.id)}
                                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                                            isSelected 
                                              ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm" 
                                              : "hover:bg-gray-100 bg-white border-gray-50 text-gray-700"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <img
                                              src={friend.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                                              alt={friend.username || "Friend"}
                                              className={`w-7 h-7 rounded-lg object-cover border transition-all ${isSelected ? "border-indigo-200 shadow-sm" : "border-gray-200"}`}
                                            />
                                            <span className={`text-[11px] font-bold transition-colors ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                                              {friend.username || "Arkadaş"}
                                            </span>
                                          </div>
                                          <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                                            isSelected 
                                              ? "bg-indigo-600 border-indigo-600 text-white" 
                                              : "bg-white border-gray-200 text-transparent"
                                          }`}>
                                            <CheckCircle size={12} weight="fill" />
                                          </div>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </div>

                            {/* App Friends Send Button */}
                            {selectedFriends.length > 0 && (
                              <div className="pt-2">
                                <button
                                  type="submit"
                                  disabled={isSubmitting || !formData.title.trim()}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <>
                                      <PaperPlaneTilt size={16} weight="fill" />
                                      <span>Öneriyi Arkadaşlarına Gönder</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>



      {/* Suggestion Detail Drawer (Inbox view) */}
      <Drawer.Root open={!!detailSuggestion} onOpenChange={(open) => !open && setDetailSuggestion(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#FAF9F7] flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
            {detailSuggestion && (
              <div className="p-6 overflow-y-auto">
                <Drawer.Title className="sr-only">Öneri Detayı</Drawer.Title>
                <div className="mx-auto w-12 h-1 bg-gray-200 rounded-full mb-6" />
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(detailSuggestion.category, 24)}
                    <span className="text-xs font-black text-gray-500 tracking-wider">
                      {getCategoryLabel(detailSuggestion.category)}
                    </span>
                  </div>
                  {getStatusBadge(detailSuggestion.status)}
                </div>

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

                <div className="flex gap-2">
                  {detailSuggestion.status !== "saved" && detailSuggestion.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.share_id, "saved")}
                      className="flex-1 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-200 text-gray-700 hover:text-amber-600 py-3.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <BookmarkSimple size={16} />
                      <span>Kaydet</span>
                    </button>
                  )}
                  {detailSuggestion.status !== "completed" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.share_id, "completed")}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                    >
                      <CheckCircle size={16} />
                      <span>Tamamladım</span>
                    </button>
                  )}
                  {detailSuggestion.status !== "ignored" && (
                    <button
                      onClick={() => handleUpdateStatus(detailSuggestion.share_id, "ignored")}
                      className="flex-1 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-600 py-3.5 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
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

      {/* Suggestion Sent Detail Drawer */}
      <Drawer.Root open={!!detailSentSuggestion} onOpenChange={(open) => !open && setDetailSentSuggestion(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#FAF9F7] flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
            {detailSentSuggestion && (() => {
              const link = getShareLink(detailSentSuggestion.share_id);
              const isExpired = detailSentSuggestion.expires_at ? new Date() > new Date(detailSentSuggestion.expires_at) : false;
              return (
                <div className="p-6 overflow-y-auto">
                  <Drawer.Title className="sr-only">Gönderilen Öneri Detayı</Drawer.Title>
                  <div className="mx-auto w-12 h-1 bg-gray-200 rounded-full mb-6" />
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(detailSentSuggestion.category, 24)}
                      <span className="text-xs font-black text-gray-500 tracking-wider">
                        {getCategoryLabel(detailSentSuggestion.category)}
                      </span>
                    </div>
                    {getSentStatusBadge(detailSentSuggestion)}
                  </div>

                  <div className="space-y-4 mb-6">
                    {detailSentSuggestion.image_url && (
                      <img
                        src={detailSentSuggestion.image_url}
                        alt={detailSentSuggestion.title}
                        className="w-full h-48 rounded-2xl object-cover border border-gray-100 shadow-sm"
                      />
                    )}
                    <h2 className="text-2xl font-black text-gray-900 leading-snug tracking-tight">
                      {detailSentSuggestion.title}
                    </h2>
                    
                    {detailSentSuggestion.rating && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={16} weight="fill" />
                        <span className="text-sm font-black">{detailSentSuggestion.rating}/5</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 mb-6 shadow-sm">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Senin Notun</span>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "{detailSentSuggestion.short_note || "Herhangi bir not eklenmemiş."}"
                    </p>
                  </div>

                  {/* Share link controls inside sent details */}
                  <div className="space-y-3 mb-8">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">Paylaşım Bağlantısı</span>
                    <div className="w-full bg-white border border-gray-150 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                      <span className="text-xs font-bold text-gray-600 truncate mr-3 select-all">{link}</span>
                      <button
                        onClick={() => copyToClipboard(link)}
                        disabled={isExpired}
                        className="px-3 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-[10px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {copiedLink ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                        <span>{copiedLink ? "Kopyalandı" : "Kopyala"}</span>
                      </button>
                    </div>
                    {isExpired && (
                      <p className="text-[9px] text-red-500 font-bold pl-0.5">⚠️ Bu önerinin süresi dolduğu için bağlantı artık aktif değildir.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setDetailSentSuggestion(null)}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl text-[10px] font-black tracking-wider transition-all"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              );
            })()}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
