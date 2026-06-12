"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import { useUser, useClerk } from "@clerk/clerk-react";
import { suggest } from "@/lib/client";
import {
  MusicNotes,
  FilmReel,
  Television,
  YoutubeLogo,
  MapPin,
  BookOpen,
  Compass,
  Star,
  Globe,
  HourglassHigh,
  PaperPlaneTilt,
  Heart,
  Flame,
  ArrowRight,
  Sparkle,
  Play,
  Pause,
  UserPlus,
  UserCheck,
  SpotifyLogo,
  PlayCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { AuthModal } from "@/components/auth/AuthModal";

const client = createBrowserClient();

export default function SuggestRecipientPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [suggestion, setSuggestion] = useState<suggest.Suggestion | null>(null);
  const [senderName, setSenderName] = useState<string | null>(null);
  const [senderAvatar, setSenderAvatar] = useState<string | null>(null);
  const [senderClerkId, setSenderClerkId] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionSubmitting, setReactionSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (!suggestion?.expires_at) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(suggestion.expires_at!).getTime();
      const difference = expires - now;

      if (difference <= 0) {
        setTimeLeft("Süre Doldu");
        setIsExpired(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeLeft(`Kalan Süre: ${hours}sa ${minutes}dk`);
      } else {
        setTimeLeft(`Kalan Süre: ${minutes}dk`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [suggestion?.expires_at]);

  // Friendship state
  const { user } = useUser();
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending_sent" | "pending_received" | "friends" | "self">("none");
  const [friendshipLoading, setFriendshipLoading] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!suggestion?.preview_url) return;

    if (isPlaying) {
      audio?.pause();
      setIsPlaying(false);
    } else {
      if (audio) {
        audio.play().catch(err => console.error("Error playing audio:", err));
        setIsPlaying(true);
      } else {
        const newAudio = new Audio(suggestion.preview_url);
        newAudio.loop = true;
        newAudio.play().catch(err => console.error("Error playing audio:", err));
        
        // Handle when audio finishes playing or pauses externally
        newAudio.onended = () => setIsPlaying(false);
        
        setAudio(newAudio);
        setIsPlaying(true);
      }
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  useEffect(() => {
    if (id) {
      fetchSuggestion();
    }
  }, [id]);

  const checkFriendshipStatus = async (currentUserId: string, targetId: string) => {
    if (currentUserId === targetId) {
      setFriendshipStatus("self");
      return;
    }

    try {
      setFriendshipLoading(true);
      const [friendsRes, sentRes, pendingRes] = await Promise.all([
        client.friendship.getFriends(currentUserId),
        client.friendship.getSentRequests(currentUserId),
        client.friendship.getPendingRequests(currentUserId)
      ]);

      if (friendsRes.friends.some(f => f.id === targetId)) {
        setFriendshipStatus("friends");
      } else if (sentRes.requests.some(r => r.id === targetId)) {
        setFriendshipStatus("pending_sent");
      } else if (pendingRes.requests.some(r => r.id === targetId)) {
        setFriendshipStatus("pending_received");
      } else {
        setFriendshipStatus("none");
      }
    } catch (err) {
      console.error("Error checking friendship status:", err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && senderClerkId) {
      checkFriendshipStatus(user.id, senderClerkId);
    }
  }, [user?.id, senderClerkId]);

  const handleAddFriend = async () => {
    if (!user?.id || !senderClerkId || friendshipLoading) return;

    try {
      setFriendshipLoading(true);
      if (friendshipStatus === "none") {
        await client.friendship.sendRequest({ senderId: user.id, receiverId: senderClerkId });
        setFriendshipStatus("pending_sent");
        toast.success("Arkadaşlık isteği gönderildi!");
      } else if (friendshipStatus === "pending_received") {
        await client.friendship.acceptRequest({ userId: user.id, friendId: senderClerkId });
        setFriendshipStatus("friends");
        toast.success("Arkadaşlık isteği kabul edildi!");
      }
    } catch (err) {
      console.error("Error handling friend request:", err);
      toast.error("İstek işlenirken bir hata oluştu.");
    } finally {
      setFriendshipLoading(false);
    }
  };

  const fetchSuggestion = async () => {
    try {
      setLoading(true);
      const res = await client.suggest.getPublicSuggestion(id);
      
      if (res.isExpired) {
        setIsExpired(true);
      } else if (res.suggestion) {
        setSuggestion(res.suggestion);
        setSenderName(res.sender_username);
        setSenderAvatar(res.sender_avatar);
        setSenderClerkId(res.sender_clerk_id);
        setSelectedReaction(user ? res.suggestion.reaction : null);
      } else {
        toast.error("Öneri bulunamadı.");
      }
    } catch (err) {
      console.error("Error fetching public suggestion:", err);
      toast.error("Tavsiye yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suggestion) {
      setSelectedReaction(user ? suggestion.reaction : null);
    }
  }, [user, suggestion]);

  const handleReaction = async (reaction: "loved" | "skull" | "saved" | "mid" | "perfect") => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (!id || reactionSubmitting) return;

    const isRemoving = selectedReaction === reaction;
    const nextReaction = isRemoving ? null : reaction;

    try {
      setReactionSubmitting(true);
      await client.suggest.submitReaction({ suggestionId: id, reaction: nextReaction });
      setSelectedReaction(nextReaction);
      if (isRemoving) {
        toast.success("Tepki geri alındı!");
      } else {
        toast.success("Tepkiniz gönderildi!");
      }
    } catch (err) {
      toast.error(isRemoving ? "Tepki geri alınamadı." : "Tepki gönderilemedi.");
    } finally {
      setReactionSubmitting(false);
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
      case "song": return "Şarkı";
      case "movie": return "Film";
      case "tv": return "Dizi";
      case "video": return "Video";
      case "place": return "Mekan";
      case "book": return "Kitap";
      default: return "Öneri";
    }
  };

  const getExternalLinkButtonLabel = (category: string) => {
    switch (category) {
      case "song": return "Hemen Dinle";
      case "place": return "Haritada Aç";
      case "movie":
      case "tv":
      case "video":
        return "Hemen İzle";
      case "book": return "Hemen Oku";
      default: return "Hemen İncele";
    }
  };

  const getExternalLinkButtonIcon = (category: string, size = 18) => {
    switch (category) {
      case "song": return <MusicNotes size={size} weight="bold" />;
      case "place": return <MapPin size={size} weight="bold" />;
      case "movie":
      case "tv":
        return <FilmReel size={size} weight="bold" />;
      case "video":
        return <YoutubeLogo size={size} weight="bold" />;
      case "book": return <BookOpen size={size} weight="bold" />;
      default: return <Globe size={size} weight="bold" />;
    }
  };

  const reactions = [
    { id: "loved", emoji: "🔥", label: "Çok İyi", color: "hover:bg-orange-50 hover:text-orange-500 border-orange-100 text-orange-500 bg-orange-50/50" },
    { id: "skull", emoji: "💀", label: "Bu Ne?", color: "hover:bg-red-50 hover:text-red-500 border-red-100 text-red-500 bg-red-50/50" },
    { id: "saved", emoji: "❤️", label: "Kaydettim", color: "hover:bg-rose-50 hover:text-rose-500 border-rose-100 text-rose-500 bg-rose-50/50" },
    { id: "mid", emoji: "😐", label: "Orta", color: "hover:bg-gray-50 hover:text-gray-500 border-gray-200 text-gray-500 bg-gray-50/50" },
    { id: "perfect", emoji: "🎯", label: "Nokta Atışı", color: "hover:bg-amber-50 hover:text-amber-500 border-amber-100 text-amber-500 bg-amber-50/50" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Öneri Getiriliyor...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center p-4 text-gray-900">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-gray-150 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500">
            <HourglassHigh size={32} weight="bold" />
          </div>
          <h1 className="text-xl font-black tracking-tight mb-3">Bu Öneri Zaman Aşımına Uğradı</h1>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            Suggest önerileri gönderildikten 24 saat sonra güvenlik ve tazelik nedeniyle otomatik olarak kapanır.
            Gönderen kişiden sana tekrar atmasını isteyebilirsin!
          </p>
          <a
            href="https://suggest.allminiapps.com"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <span>Sen de bir öneri gönder</span>
            <ArrowRight size={16} weight="bold" />
          </a>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center p-4 text-gray-900">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-gray-150 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h1 className="text-lg font-black mb-3">Öneri Bulunamadı</h1>
          <p className="text-xs text-gray-500 mb-6">Tıkladığın bağlantı geçersiz veya silinmiş olabilir.</p>
          <a href="https://suggest.allminiapps.com" className="text-xs font-bold text-indigo-600 hover:underline">
            Suggest Ana Sayfasına Git
          </a>
        </div>
      </div>
    );
  }

  const handleReveal = () => {
    setIsRevealed(true);
    if (suggestion?.category === "song" && suggestion.preview_url) {
      const newAudio = new Audio(suggestion.preview_url);
      newAudio.loop = true;
      newAudio.play().catch(err => console.error("Autoplay blocked:", err));
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 pb-4 sm:pb-8 relative overflow-hidden flex flex-col justify-center">
      <Toaster position="top-center" />
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent pointer-events-none" />

      <main className="max-w-md mx-auto w-full px-4 py-3 sm:py-6 relative z-10 flex flex-col items-center justify-center min-h-screen">
        {/* Sender Header */}
        <div className="flex flex-col items-center gap-2 mb-4 sm:mb-6 text-center">
          <img
            src={senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
            alt={senderName || "Sender"}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl object-cover border-4 border-white shadow-md rotate-1 transition-transform duration-500"
          />
          <div className="text-center flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">
              ARKADAŞINDAN BİR SUGGEST GELDİ
            </span>
            <h1 className="text-sm sm:text-lg font-black text-gray-900 leading-tight">
              {senderName || "Bir arkadaşın"} sana bir öneri bıraktı
            </h1>
            {senderClerkId && (!user || user.id !== senderClerkId) && (
              <button
                onClick={user ? handleAddFriend : () => setIsAuthOpen(true)}
                disabled={user ? (friendshipLoading || friendshipStatus === "pending_sent" || friendshipStatus === "friends") : false}
                className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border ${
                  friendshipStatus === "friends"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : friendshipStatus === "pending_sent"
                      ? "bg-gray-50 text-gray-400 border-gray-150"
                      : friendshipStatus === "pending_received"
                        ? "bg-indigo-600 text-white border-transparent hover:bg-indigo-700 active:scale-95 shadow-sm"
                        : "bg-white text-indigo-600 border-indigo-150 hover:bg-indigo-50/50 active:scale-95 shadow-sm"
                }`}
              >
                {friendshipStatus === "friends" && (
                  <>
                    <UserCheck size={10} weight="bold" />
                    <span>Arkadaşsınız</span>
                  </>
                )}
                {friendshipStatus === "pending_sent" && (
                  <>
                    <UserCheck size={10} weight="bold" />
                    <span>İstek Gönderildi</span>
                  </>
                )}
                {friendshipStatus === "pending_received" && (
                  <>
                    <UserPlus size={10} weight="bold" />
                    <span>İsteği Kabul Et</span>
                  </>
                )}
                {friendshipStatus === "none" && (
                  <>
                    <UserPlus size={10} weight="bold" />
                    <span>Arkadaş Ekle</span>
                  </>
                )}
              </button>
            )}
            {timeLeft && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 rounded-full mt-1.5 flex items-center gap-1 select-none">
                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                <span>24 SAAT GEÇERLİ • {timeLeft.toUpperCase()}</span>
              </span>
            )}
          </div>
        </div>

        {/* Suggestion Card Wrapper */}
        <div 
          className="w-full aspect-square bg-gray-900 rounded-[2.25rem] border-[3px] sm:border-4 border-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden relative mb-4 rotate-[-0.5deg]"
        >
          {suggestion.image_url ? (
            <img src={suggestion.image_url} alt={suggestion.title} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
          )}
          {/* Dark Overlay to make text legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />

          {/* Card Content Overlay */}
          <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-20 text-white">
            {/* Top Row: Category Badge and Play/Pause Button */}
            <div className="flex items-center justify-between">
              {suggestion.category !== "song" ? (
                <div className="bg-white/10 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1 shadow border border-white/10 rotate-2">
                  {getCategoryIcon(suggestion.category, 12)}
                  <span className="text-[8px] font-black text-white uppercase tracking-wider">
                    {getCategoryLabel(suggestion.category)}
                  </span>
                </div>
              ) : (
                <div />
              )}

              {suggestion.category === "song" && suggestion.preview_url && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-white text-pink-600 flex items-center justify-center shadow-md active:scale-95 hover:scale-105 transition-all cursor-pointer relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isPlaying ? (
                        <Pause size={14} weight="fill" />
                      ) : (
                        <Play size={14} weight="fill" className="translate-x-[1px]" />
                      )}
                    </div>
                    {isPlaying && (
                      <span className="absolute -inset-1 rounded-full border border-pink-500/40 animate-ping pointer-events-none" />
                    )}
                  </button>
                  <span className="bg-black/40 backdrop-blur text-white text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 select-none">
                    {isPlaying ? "ÇALIYOR" : "ÖNİZLEME"}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Row: Details and 2x2 Platform Grid */}
            <div className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black leading-snug tracking-tight text-white">
                  {suggestion.title}
                </h2>
                {suggestion.short_note && (
                  <p className="text-[10px] sm:text-xs text-gray-200/90 leading-relaxed italic line-clamp-2">
                    "{suggestion.short_note}"
                  </p>
                )}
              </div>

              {suggestion.external_link && (
                <div>
                  {suggestion.category === "song" ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Spotify */}
                      <a
                        href={`https://open.spotify.com/search/${encodeURIComponent(suggestion.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-bold text-[10px] text-white"
                      >
                        <div className="flex items-center gap-1">
                          <SpotifyLogo size={14} weight="fill" className="text-white/80" />
                          <span>Spotify</span>
                        </div>
                        <ArrowRight size={10} weight="bold" className="text-white/60" />
                      </a>

                      {/* Apple Music */}
                      <a
                        href={suggestion.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-bold text-[10px] text-white"
                      >
                        <div className="flex items-center gap-1">
                          <MusicNotes size={14} weight="fill" className="text-white/80" />
                          <span>Apple Music</span>
                        </div>
                        <ArrowRight size={10} weight="bold" className="text-white/60" />
                      </a>

                      {/* YouTube */}
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-bold text-[10px] text-white"
                      >
                        <div className="flex items-center gap-1">
                          <YoutubeLogo size={14} weight="fill" className="text-white/80" />
                          <span>YouTube</span>
                        </div>
                        <ArrowRight size={10} weight="bold" className="text-white/60" />
                      </a>

                      {/* YouTube Music */}
                      <a
                        href={`https://music.youtube.com/search?q=${encodeURIComponent(suggestion.title)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 rounded-xl transition-all font-bold text-[10px] text-white"
                      >
                        <div className="flex items-center gap-1">
                          <PlayCircle size={14} weight="fill" className="text-white/80" />
                          <span>YT Music</span>
                        </div>
                        <ArrowRight size={10} weight="bold" className="text-white/60" />
                      </a>
                    </div>
                  ) : (
                    <a
                      href={suggestion.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 border border-white/10 p-3 rounded-xl transition-all font-bold text-xs text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        {getExternalLinkButtonIcon(suggestion.category, 16)}
                        <span>
                          {getExternalLinkButtonLabel(suggestion.category)}
                        </span>
                      </div>
                      <ArrowRight size={14} weight="bold" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reaction Section */}
        <div className="w-full bg-white rounded-3xl border border-gray-150 p-3 text-center shadow-sm mb-4">
          <div className="flex justify-between gap-1">
            {reactions.map((react) => {
              const isSelected = selectedReaction === react.id;
              
              return (
                <button 
                  key={react.id}
                  disabled={reactionSubmitting}
                  onClick={() => handleReaction(react.id as any)}
                  className={`flex-1 py-2 px-0.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    isSelected 
                      ? react.color + " border-transparent scale-105 shadow-md shadow-indigo-100"
                      : selectedReaction 
                        ? "opacity-45 grayscale border-gray-150 bg-white"
                        : "bg-white border-gray-150 hover:scale-[1.03] active:scale-95"
                  }`}
                >
                  <span className="text-lg leading-none">{react.emoji}</span>
                  <span className="text-[7.5px] font-black uppercase tracking-tight text-gray-500 whitespace-nowrap">
                    {react.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reply / Create Suggestion CTA */}
        <a
          href="https://suggest.allminiapps.com"
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
        >
          <PaperPlaneTilt size={16} weight="fill" />
          <span>Sen de bir öneri gönder</span>
        </a>
      </main>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        title="Suggest'e Katıl" 
        subtitle="Önerilere tepki vermek ve arkadaş eklemek için giriş yapın." 
      />
    </div>
  );
}
