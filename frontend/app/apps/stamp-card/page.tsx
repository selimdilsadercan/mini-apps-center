"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Cards,
  Plus,
  CaretLeft,
  QrCode,
  Sparkle,
  Ticket,
  Clock,
  Star,
  Barcode,
  SquaresFour,
  Coins,
  Storefront,
  ArrowRight,
  Gift
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { stamp_card } from "@/lib/client";

const client = createBrowserClient();

// Play a satisfying synthesized stamp ink sound using Web Audio API
const playStampSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First part: low thud (heavy stamp contact)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(120, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
    
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.15);

    // Second part: high click (ink squish / mechanical sound)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(800, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.error("Audio error:", err);
  }
};

// Metallic card themes generator
const getCardTheme = (name: string, themeId?: string) => {
  const themes = [
    { 
      id: "silver",
      bg: "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300", 
      text: "text-slate-900", 
      accent: "bg-slate-900/10",
      border: "border-slate-300/50",
      glow: "shadow-slate-200/50"
    },
    { 
      id: "titanium",
      bg: "bg-gradient-to-br from-zinc-300 via-slate-200 to-zinc-400", 
      text: "text-zinc-900", 
      accent: "bg-zinc-900/10",
      border: "border-zinc-400/50",
      glow: "shadow-zinc-300/50"
    },
    { 
      id: "white",
      bg: "bg-gradient-to-br from-white via-slate-50 to-slate-100", 
      text: "text-slate-900", 
      accent: "bg-slate-900/5",
      border: "border-slate-200",
      glow: "shadow-slate-100/50"
    },
    { 
      id: "gold",
      bg: "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-400", 
      text: "text-amber-950", 
      accent: "bg-amber-950/10",
      border: "border-amber-300/50",
      glow: "shadow-amber-200/50"
    },
    { 
      id: "copper",
      bg: "bg-gradient-to-br from-orange-300 via-orange-100 to-orange-400", 
      text: "text-orange-950", 
      accent: "bg-orange-950/10",
      border: "border-orange-300/50",
      glow: "shadow-orange-200/50"
    },
    { 
      id: "rose",
      bg: "bg-gradient-to-br from-rose-200 via-rose-100 to-rose-300", 
      text: "text-rose-950", 
      accent: "bg-rose-950/10",
      border: "border-rose-300/50",
      glow: "shadow-rose-200/50"
    },
    { 
      id: "midnight",
      bg: "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black", 
      text: "text-zinc-100", 
      accent: "bg-white/10",
      border: "border-zinc-700/50",
      glow: "shadow-black/50"
    },
    { 
      id: "carbon",
      bg: "bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900", 
      text: "text-neutral-100", 
      accent: "bg-white/10",
      border: "border-neutral-600/50",
      glow: "shadow-neutral-900/50"
    },
    { 
      id: "emerald",
      bg: "bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950", 
      text: "text-emerald-50", 
      accent: "bg-white/10",
      border: "border-emerald-700/50",
      glow: "shadow-emerald-900/50"
    },
    { 
      id: "ocean",
      bg: "bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950", 
      text: "text-blue-50", 
      accent: "bg-white/10",
      border: "border-blue-700/50",
      glow: "shadow-blue-900/50"
    },
    { 
      id: "amethyst",
      bg: "bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900", 
      text: "text-purple-50", 
      accent: "bg-white/10",
      border: "border-purple-600/50",
      glow: "shadow-purple-900/50"
    },
    { 
      id: "sunset",
      bg: "bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500", 
      text: "text-white", 
      accent: "bg-white/20",
      border: "border-white/30",
      glow: "shadow-orange-500/50"
    }
  ];

  if (themeId) {
    const found = themes.find(t => t.id === themeId);
    if (found) return found;
  }

  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return themes[sum % themes.length];
};

// Helper to get category-based emoji for stamps
const getBusinessEmoji = (name: string, isReward = false) => {
  if (isReward) return "🎁";
  const lower = name.toLowerCase();
  if (lower.includes("bakery") || lower.includes("fırın") || lower.includes("pasta") || lower.includes("tatlı") || lower.includes("sweet") || lower.includes("bread") || lower.includes("pasta")) return "🥐";
  if (lower.includes("berber") || lower.includes("hair") || lower.includes("barber") || lower.includes("sakal")) return "💈";
  if (lower.includes("pizza") || lower.includes("yemek") || lower.includes("burger") || lower.includes("restaurant") || lower.includes("döner") || lower.includes("kebap")) return "🍕";
  return "☕"; // Default stamp is Cafe/Coffee cup
};

export default function StampCardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [businesses, setBusinesses] = useState<stamp_card.Business[]>([]);
  const [userCards, setUserCards] = useState<(stamp_card.UserCard & { type?: string, tokens?: number, theme?: string, market_items?: any[] })[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<stamp_card.RedeemedReward[]>([]);

  // Selected card details
  const [selectedCard, setSelectedCard] = useState<(stamp_card.UserCard & { type?: string, tokens?: number, theme?: string, market_items?: any[] }) | null>(null);
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(false);
  const [isAddCardDrawerOpen, setIsAddCardDrawerOpen] = useState(false);
  
  // Stamp execution state
  const [stamping, setStamping] = useState(false);
  const [newlyStampedIndex, setNewlyStampedIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bizRes = await client.stamp_card.getBusinesses(); 
      setBusinesses(bizRes.businesses || []);

      if (!user) {
        setUserCards([]);
        setRedeemedRewards([]);
        return;
      }

      const dataRes = await client.stamp_card.getUserData(user.id);
      setUserCards(dataRes.cards || []);
      setRedeemedRewards(dataRes.rewards || []);
    } catch (error) {
      console.error("fetchData error:", error);
      toast.error("Veriler yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (businessId: string) => {
    if (!user) {
      toast.error("Lütfen önce giriş yapın.");
      return;
    }
    if (userCards.some(c => c.business_id === businessId)) {
      toast.error("Bu kart zaten cüzdanınızda ekli.");
      return;
    }

    const biz = businesses.find(b => b.id === businessId);
    if (!biz) return;

    try {
      const res = await client.stamp_card.joinCampaign({
        userId: user.id,
        businessId: biz.id
      });

      if (!res.success) {
        toast.error("Kart eklenirken bir hata oluştu.");
        return;
      }

      const mockCard: stamp_card.UserCard = {
        id: "temp-" + Date.now(),
        business_id: biz.id,
        stamps_count: 0,
        completed_count: 0,
        updated_at: new Date().toISOString(),
        business_name: biz.name,
        business_logo: biz.logo_url,
        business_header: biz.header_url,
        business_reward: biz.reward_title,
        stamp_limit: biz.stamp_limit,
        theme: biz.theme || "silver",
        type: biz.type || "stamp",
        market_items: biz.market_items || []
      } as any;

      setUserCards(prev => [...prev, mockCard]);
      setSelectedCard(mockCard);
      setIsAddCardDrawerOpen(false);
      setIsStampDrawerOpen(true);
      toast.success("Kart cüzdanınıza eklendi! Şifre girerek ilk kaşenizi alın.");
    } catch (err) {
      console.error(err);
      toast.error("Kart eklenemedi.");
    }
  };

  const handleApplyStamp = async (bypassPin = false) => {
    if (!user || !selectedCard) return;
    setStamping(true);

    try {
      // PIN removed, using default or bypass
      const pinToSubmit = "1234";

      const res = await client.stamp_card.addStamp({
        userId: user.id,
        businessId: selectedCard.business_id,
        pin: pinToSubmit
      });

      if (!res.success) {
        toast.error(res.error || "Şifre doğrulanamadı.");
        setStamping(false);
        return;
      }

      playStampSound();
      setNewlyStampedIndex((res.stamps_count ?? 1) - 1);

      if (res.reward_created) {
        setShowConfetti(true);
        toast.success("Tebrikler! Kartınızı tamamladınız ve ödül kazandınız! 🎁", { duration: 5000 });
        setTimeout(() => setShowConfetti(false), 4000);
      } else {
        toast.success("Kaşe başarıyla basıldı! ☕");
      }

      await fetchData();

      const updatedCard = userCards.find(c => c.business_id === selectedCard.business_id);
      if (updatedCard) {
        setSelectedCard({
          ...updatedCard,
          stamps_count: res.stamps_count ?? 0,
          completed_count: res.completed_count ?? 0
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Kaşe işlemi sırasında hata oluştu.");
    } finally {
      setStamping(false);
      setTimeout(() => setNewlyStampedIndex(null), 1200);
    }
  };

  const handleUseReward = async (rewardId: string) => {
    if (!user) return;
    const confirmUse = window.confirm("Bu ödülü kullanmak istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (!confirmUse) return;

    try {
      const res = await client.stamp_card.useReward({
        userId: user.id,
        rewardId
      });
      if (res.success) {
        toast.success("Ödül başarıyla kullanıldı!");
        fetchData();
      }
    } catch (err) {
      toast.error("Kupon kullanılamadı.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-slate-800 relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      <Toaster position="top-center" />

      {/* Confetti Animation Elements */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex justify-center items-center overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"][i % 5],
                top: "40%",
                left: "50%",
              }}
              animate={{
                x: (Math.random() - 0.5) * window.innerWidth * 0.8,
                y: (Math.random() - 0.2) * window.innerHeight * 0.8,
                scale: [1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2.5,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 py-3 max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => (window.location.href = getAppRootUrl())}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-amber-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <Cards size={18} weight="fill" className="text-amber-500 shrink-0" />
              <span className="truncate">Müdavim Kartı</span>
            </h1>
          </div>

          <button
            onClick={() => setIsAddCardDrawerOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-200"
          >
            <Plus size={12} weight="bold" />
            <span>KART EKLE</span>
          </button>
        </div>
      </header>

      {/* Decorative top header glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-gradient-to-b from-amber-100/40 via-orange-50/20 to-transparent blur-3xl pointer-events-none" />

      <main className="flex-1 px-4 py-6 pb-32 max-w-xl mx-auto w-full relative z-10">

        <div className="space-y-10">
          
          {/* Active Stamp Cards */}
          <div>
            <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                AKTİF KARTLARIM
              </h2>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                Kartlar okunuyor...
              </div>
            ) : userCards.length === 0 ? (
              <div className="py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                  <Cards size={24} />
                </div>
                <p className="text-slate-900 text-sm font-extrabold uppercase tracking-tight mb-1.5">Cüzdan Boş</p>
                <p className="text-slate-400 text-xs font-medium max-w-[220px] leading-relaxed mb-6 text-center">
                  Müşteri kartı eklemek ve hediye kazanmak için ilk dükkanını seç.
                </p>
                <button
                  onClick={() => setIsAddCardDrawerOpen(true)}
                  className="bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-sm shadow-amber-100 active:scale-95 transition-all"
                >
                  Kart Ekle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userCards.map((card) => {
                  const theme = getCardTheme(card.business_name, card.theme);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={card.id}
                      onClick={() => {
                        setSelectedCard(card);
                        setIsStampDrawerOpen(true);
                      }}
                      className={`relative aspect-[1.6/1] w-full rounded-[2rem] overflow-hidden border ${theme.border} shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group active:scale-98 ${theme.bg}`}
                    >
                      {/* Metallic Gloss Effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none" />

                      {/* Content */}
                      <div className={`relative h-full p-5 flex flex-col justify-between ${theme.text}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${theme.accent + ' ' + theme.border} backdrop-blur-md border flex items-center justify-center overflow-hidden shrink-0`}>
                            {card.business_logo ? (
                              <img src={card.business_logo} alt={card.business_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-xs">{card.business_name.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-sm tracking-tight truncate leading-tight">
                              {card.business_name}
                            </h3>
                            <p className={`text-[10px] opacity-70 font-bold uppercase tracking-wider truncate`}>
                              {card.type === 'token' ? 'Jeton Cüzdanı' : card.business_reward}
                            </p>
                          </div>
                        </div>

                        {card.type === 'token' ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300">
                                <Coins size={20} weight="fill" className="text-amber-900" />
                              </div>
                              <div className="flex flex-col -space-y-1">
                                <span className="text-2xl font-black tracking-tighter">{card.tokens || 0}</span>
                                <span className="text-[8px] font-bold opacity-50 uppercase tracking-[0.2em]">JETON</span>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center">
                              <Storefront size={16} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-end justify-between gap-4">
                            <div className="grid grid-cols-4 gap-2">
                              {Array.from({ length: card.stamp_limit }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                    idx < card.stamps_count
                                      ? "bg-[#C4FF00] border-[#C4FF00] shadow-sm"
                                      : "bg-black/5 border-black/10"
                                  }`}
                                >
                                  {idx < card.stamps_count && (
                                    <span className="text-[8px] sm:text-[10px] filter brightness-0 opacity-70">{getBusinessEmoji(card.business_name)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className={`text-[10px] font-black opacity-50 uppercase tracking-widest shrink-0`}>
                              {card.stamps_count}/{card.stamp_limit}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* DRAWERS & DIALOGS */}

      {/* 1. Add Card Drawer */}
      <Drawer.Root open={isAddCardDrawerOpen} onOpenChange={setIsAddCardDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[60]" />
          <Drawer.Content className="bg-white text-slate-800 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-slate-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-slate-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-slate-900">
                KAMPANYA <span className="text-amber-600">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-xs text-slate-400 mb-6 font-medium">
                Kaşe toplamak istediğin işletmenin kartını cüzdanına yerleştir
              </Drawer.Description>

              {businesses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Kayıtlı kampanya bulunamadı.
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                  {businesses.map((biz) => {
                    const alreadyHas = userCards.some(c => c.business_id === biz.id);
                    return (
                      <div
                        key={biz.id}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 font-black text-xs overflow-hidden shrink-0">
                            {biz.header_url || biz.logo_url ? (
                              <img src={(biz.header_url || biz.logo_url) as string} alt={biz.name} className="w-full h-full object-cover" />
                            ) : (
                              biz.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight truncate">{biz.name}</h3>
                          </div>
                        </div>

                        <button
                          disabled={alreadyHas}
                          onClick={() => handleAddCard(biz.id)}
                          className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                            alreadyHas
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-amber-600 text-white shadow-sm shadow-amber-100 active:scale-95"
                          }`}
                        >
                          {alreadyHas ? "Eklendi" : "Ekle"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root 
        open={isStampDrawerOpen} 
        onOpenChange={(open) => {
          setIsStampDrawerOpen(open);
          if (!open) setIsFlipped(false);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-[#F2F4F7] text-slate-800 flex flex-col fixed inset-0 outline-none z-[70] max-w-lg mx-auto shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-white shrink-0">
              <button 
                onClick={() => setIsStampDrawerOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={24} className="rotate-45" />
              </button>
              <span className="font-bold text-sm text-slate-900">{selectedCard?.business_name}</span>
              <div className="w-10" /> {/* Spacer */}
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 scrollbar-none">
              <Drawer.Title className="sr-only">Kart Detayı</Drawer.Title>
              <Drawer.Description className="sr-only">Kaşe biriktirme kartı detayları</Drawer.Description>
              
              {selectedCard && (() => {
                const theme = getCardTheme(selectedCard.business_name, selectedCard.theme);
                const isTokenCard = selectedCard.type === 'token';
                
                return (
                <div className="space-y-8">
                  {/* Card Perspective Container */}
                  <div className="relative w-full max-w-[320px] mx-auto" style={{ perspective: "1000px" }}>
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="relative aspect-[1/1.4] w-full"
                    >
                      {/* FRONT FACE */}
                      <div 
                        className={`absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl border ${theme.border} ${theme.bg}`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        {/* Metallic Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/20 pointer-events-none" />

                        {/* Card Content */}
                        <div className={`relative h-full p-6 flex flex-col items-center text-center ${theme.text}`}>
                          {/* Logo and Name */}
                          <div className="flex flex-col items-center gap-2 mb-6">
                            <div className={`w-14 h-14 rounded-full ${theme.accent + ' ' + theme.border} backdrop-blur-md border p-1`}>
                              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                                {selectedCard.business_logo ? (
                                  <img src={selectedCard.business_logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-slate-900 font-black">{selectedCard.business_name[0]}</span>
                                )}
                              </div>
                            </div>
                            <span className={`font-bold text-xs tracking-wide opacity-70`}>{selectedCard.business_name}</span>
                          </div>

                          {isTokenCard ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                              <div className="relative mb-6">
                                <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 animate-pulse" />
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-2xl border-4 border-amber-200/50">
                                  <Coins size={40} weight="fill" className="text-amber-900 drop-shadow-sm" />
                                </div>
                              </div>
                              
                              <div className="text-center mb-8">
                                <div className="flex flex-col items-center">
                                  <span className="text-5xl font-black tracking-tighter leading-none">{selectedCard.tokens || 0}</span>
                                  <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mt-2">JETON</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                              {/* Reward Title */}
                              <h2 className="text-lg font-black uppercase tracking-tight mb-6 max-w-[200px] leading-tight">
                                {selectedCard.business_reward}
                              </h2>

                              {/* Stamp Grid */}
                              <div className="grid grid-cols-3 gap-3 mb-6">
                                {Array.from({ length: selectedCard.stamp_limit }).map((_, idx) => {
                                  const isStamped = idx < selectedCard.stamps_count;
                                  const isNewStamp = idx === newlyStampedIndex;
                                  const isLast = idx === selectedCard.stamp_limit - 1;

                                  return (
                                    <div key={idx} className="flex flex-col items-center">
                                      <motion.div
                                        initial={isNewStamp ? { scale: 2.5, rotate: 25 } : false}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 15 }}
                                        className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                                          isStamped ? "border-[#C4FF00]" : theme.border
                                        }`}
                                      >
                                        <div className={`absolute inset-0 rounded-full transition-all ${
                                          isStamped ? "bg-[#C4FF00] scale-100" : theme.accent + " scale-100"
                                        }`} />
                                        <div className="relative z-10">
                                          {isLast ? (
                                            <Ticket size={18} className={isStamped ? "text-slate-900" : "opacity-20"} />
                                          ) : (
                                            isStamped ? (
                                              <span className="text-base filter brightness-0 opacity-70">{getBusinessEmoji(selectedCard.business_name)}</span>
                                            ) : null
                                          )}
                                        </div>
                                      </motion.div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mb-2" />
                            </div>
                          )}

                          {/* QR CODE BUTTON INSIDE CARD */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsFlipped(true);
                            }}
                            className={`mt-auto w-full py-4 rounded-2xl flex items-center justify-center gap-2 border backdrop-blur-md transition-all active:scale-95 ${
                              theme.id === 'midnight' || theme.id === 'emerald' || theme.id === 'ocean'
                                ? "bg-white/10 border-white/10 text-white"
                                : "bg-black/5 border-black/5 text-current"
                            }`}
                          >
                            <QrCode size={18} weight="bold" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">QR KODU GÖSTER</span>
                          </button>
                        </div>
                      </div>

                      {/* BACK FACE (QR CODE) */}
                      <div 
                        className={`absolute inset-0 rounded-[2.5rem] overflow-hidden shadow-2xl border ${theme.border} ${theme.bg} flex flex-col items-center p-8`}
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        {/* Metallic Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/20 pointer-events-none" />

                        <div className={`relative w-full aspect-square ${theme.accent} backdrop-blur-md rounded-3xl border ${theme.border} flex items-center justify-center p-6 mb-6 mt-4`}>
                          <QrCode size={180} weight="thin" className={theme.text} />
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                          }}
                          className={`relative mt-auto w-full py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all border backdrop-blur-md ${theme.accent} ${theme.border} ${theme.text}`}
                        >
                          <ArrowRight size={18} weight="bold" className="rotate-180" />
                          KARTA GERİ DÖN
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    {isTokenCard ? (
                      <>
                        <button
                          onClick={() => {
                            if (selectedCard) {
                              setSelectedCard({
                                ...selectedCard,
                                tokens: (selectedCard.tokens || 0) + 1
                              });
                              toast.success("+1 Jeton Kazanıldı! 🪙");
                              playStampSound();
                            }
                          }}
                          className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-amber-600 transition-colors py-2"
                        >
                          Demo: Jeton Ekle
                        </button>

                        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 mt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-sm tracking-tight flex items-center gap-2">
                              <Storefront size={18} weight="bold" className="text-slate-400" />
                              Jeton Market
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              ÖDÜLÜNÜ SEÇ
                            </span>
                          </div>
                          <div className="space-y-2">
                            {(selectedCard.market_items || []).map((item: any) => (
                              <button
                                key={item.id}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 active:scale-[0.98] transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm">
                                    {item.icon}
                                  </div>
                                  <div className="text-left">
                                    <div className="font-bold text-sm text-slate-800">{item.name}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hemen Al</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
                                  <span className="font-black text-sm text-amber-700">{item.price}</span>
                                  <Coins size={14} weight="fill" className="text-amber-500" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        disabled={stamping}
                        onClick={() => handleApplyStamp(true)}
                        className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-amber-600 transition-colors py-2"
                      >
                        Demo: Kaşe Ekle
                      </button>
                    )}
                  </div>
                </div>
              )})()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
