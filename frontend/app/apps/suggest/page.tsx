"use client";

import { getRootHomeUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
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
  Eye,
  Gear,
  UserCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import Client, { suggest, friendship } from "@/lib/client";

// Initialize client
const client = createBrowserClient();

type TabType = "inbox" | "saved" | "sent" | "create";

export default function SuggestPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [inboxList, setInboxList] = useState<suggest.InboxSuggestion[]>([]);
  const [sentList, setSentList] = useState<suggest.SentSuggestion[]>([]);
  const [friendsList, setFriendsList] = useState<friendship.FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Profile Settings Modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Prepopulate state when Clerk user loads
  useEffect(() => {
    if (user) {
      // Query database user record to get configured username rather than relying on clerk
      client.users.getUserByClerkId(user.id).then(res => {
        if (res.user?.username) {
          setProfileUsername(res.user.username);
        }
      }).catch(err => console.error("Error fetching db user info:", err));
    }
  }, [user]);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchData();
    }
  }, [isUserLoaded, user, activeTab]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (activeTab === "inbox" || activeTab === "saved") {
        const inboxRes = await client.suggest.getInbox(user.id);
        setInboxList(inboxRes.suggestions);
      } else if (activeTab === "sent") {
        const sentRes = await client.suggest.getSent(user.id);
        setSentList(sentRes.suggestions);
      } else if (activeTab === "create") {
        const friendsRes = await client.friendship.getFriends(user.id);
        setFriendsList(friendsRes.friends || []);
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    const cleanUsername = profileUsername.trim().toLowerCase();
    
    if (!cleanUsername) {
      toast.error("Kullanıcı adı boş olamaz");
      return;
    }
    
    if (cleanUsername.length > 26) {
      toast.error("Kullanıcı adı en fazla 26 karakter olmalıdır");
      return;
    }

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      toast.error("Kullanıcı adı yalnızca küçük harfler, sayılar ve alt çizgi/nokta/tire içerebilir");
      return;
    }

    try {
      setIsUpdatingProfile(true);

      // Synchronize changes to public.users using getOrCreateUser backend API
      await client.users.getOrCreateUser({
        clerkId: user.id,
        username: cleanUsername,
        fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
        avatarUrl: user.imageUrl,
      });

      toast.success("Kullanıcı adınız başarıyla güncellendi");
      setIsProfileOpen(false);
      
      // Refresh active data tabs to show updated values
      fetchData();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Profil güncellenirken bir hata oluştu");
    } finally {
      setIsUpdatingProfile(false);
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
      setActiveTab("sent");
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
          <button
            onClick={() => (window.location.href = getRootHomeUrl())}
            className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all bg-white px-3.5 py-2 rounded-2xl border border-gray-100 shadow-sm active:scale-95 text-xs font-bold"
          >
            <CaretLeft size={16} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Katalog</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-1 bg-white border border-gray-100 hover:bg-gray-50 px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-600 shadow-sm active:scale-95 transition-all"
              title="Profili Düzenle"
            >
              <Gear size={16} />
              <span>Profil</span>
            </button>
            <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100/50 px-3.5 py-2 rounded-2xl font-black text-[10px] text-indigo-600 uppercase tracking-wider">
              <Compass size={14} weight="fill" className="animate-spin-slow" />
              Suggest Center
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-white p-4 rounded-3xl shadow-md border border-gray-50 mb-3 text-indigo-600">
            <Compass size={32} weight="fill" />
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            Tavsiye <span className="text-indigo-600">Kutusu</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            "Arkadaş tavsiyeleri kaybolmasın"
          </p>
        </div>

        {/* Tabs Menu */}
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 mb-8 shadow-inner">
          {[
            { id: "inbox", label: "Gelenler", icon: Tray },
            { id: "saved", label: "Kaydedilenler", icon: Bookmark },
            { id: "sent", label: "Gönderdiklerim", icon: PaperPlaneTilt },
            { id: "create", label: "Öner", icon: Plus },
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
        {loading && activeTab !== "create" ? (
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

            {/* CREATE TAB */}
            {activeTab === "create" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm"
              >
                <form onSubmit={handleCreateSuggestion} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Öneri Kategorisi
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "movie", label: "Film", emoji: "🎬" },
                        { id: "tv", label: "Dizi", emoji: "📺" },
                        { id: "game", label: "Oyun", emoji: "🎮" },
                        { id: "place", label: "Mekan", emoji: "📍" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id as suggest.SuggestionCategory })}
                          className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${
                            formData.category === cat.id
                              ? "bg-indigo-50/50 border-indigo-600 text-indigo-600 font-bold"
                              : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-[9px] uppercase tracking-wider">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Başlık
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Film, mekan veya oyun adı..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                    />
                  </div>

                  {/* Short Note */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Kısa Not / Neden Öneriyorsun?
                    </label>
                    <textarea
                      placeholder="Neden tavsiye ediyorsun? Harika detaylar ekle..."
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

                  {/* External Link */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                      Dış Link (IMDb, Google Maps vb.)
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

                  {/* Friend Multi-Select */}
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

                  {/* Submit Button */}
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:bg-indigo-400"
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
        )}
      </main>

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

      {/* Profile Settings Drawer */}
      <Drawer.Root open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#FAF9F7] flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-white shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-gray-200 rounded-full mb-6" />
              
              <div className="flex items-center gap-2 mb-6">
                <UserCircle size={24} className="text-indigo-600" />
                <h2 className="text-xl font-black uppercase tracking-tight">Profili Düzenle</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {/* Username Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Kullanıcı Adı
                    </label>
                    <span className="text-[9px] text-gray-400 font-bold">
                      {profileUsername.length}/26 Karakter (Küçük Harf)
                    </span>
                  </div>
                  <input
                    required
                    type="text"
                    maxLength={26}
                    placeholder="kullanici_adi"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all placeholder:text-gray-300"
                  />
                  <p className="text-[9px] text-gray-400 pl-1">
                    * Yalnızca küçük harf, rakam, nokta (.), tire (-) ve alt çizgi (_) kullanılabilir. Boşluk bırakılamaz.
                  </p>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 disabled:bg-indigo-400"
                  >
                    {isUpdatingProfile ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Değişiklikleri Kaydet"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
