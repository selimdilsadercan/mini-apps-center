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
  Barcode
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

// Brand theme generator to make every business look unique (Wallet look)
const getCardStyle = (name: string) => {
  const themes = [
    { from: "from-rose-500 to-rose-700", text: "text-rose-100", stampBg: "bg-rose-950/20", border: "border-rose-400/30", color: "#f43f5e", shadow: "shadow-rose-500/20" },
    { from: "from-amber-500 to-amber-700", text: "text-amber-100", stampBg: "bg-amber-950/20", border: "border-amber-400/30", color: "#f59e0b", shadow: "shadow-amber-500/20" },
    { from: "from-emerald-500 to-emerald-700", text: "text-emerald-100", stampBg: "bg-emerald-950/20", border: "border-emerald-400/30", color: "#10b981", shadow: "shadow-emerald-500/20" },
    { from: "from-blue-500 to-indigo-700", text: "text-blue-100", stampBg: "bg-blue-950/20", border: "border-blue-400/30", color: "#3b82f6", shadow: "shadow-blue-500/20" },
    { from: "from-purple-600 to-violet-800", text: "text-purple-100", stampBg: "bg-purple-950/20", border: "border-purple-400/30", color: "#a855f7", shadow: "shadow-purple-500/20" },
    { from: "from-cyan-500 to-teal-700", text: "text-cyan-100", stampBg: "bg-cyan-950/20", border: "border-cyan-400/30", color: "#06b6d4", shadow: "shadow-cyan-500/20" },
    { from: "from-zinc-700 to-zinc-900", text: "text-zinc-300", stampBg: "bg-zinc-950/40", border: "border-zinc-600/30", color: "#3f3f46", shadow: "shadow-zinc-700/20" }
  ];
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
  const [userCards, setUserCards] = useState<stamp_card.UserCard[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<stamp_card.RedeemedReward[]>([]);

  // Selected card details
  const [selectedCard, setSelectedCard] = useState<stamp_card.UserCard | null>(null);
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(false);
  const [isAddCardDrawerOpen, setIsAddCardDrawerOpen] = useState(false);
  
  // Stamp execution state
  const [pinCode, setPinCode] = useState("");
  const [stamping, setStamping] = useState(false);
  const [newlyStampedIndex, setNewlyStampedIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

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

    const mockCard: stamp_card.UserCard = {
      id: "temp-" + Date.now(),
      business_id: biz.id,
      stamps_count: 0,
      completed_count: 0,
      updated_at: new Date().toISOString(),
      business_name: biz.name,
      business_logo: biz.logo_url,
      business_reward: biz.reward_title,
      stamp_limit: biz.stamp_limit
    };

    setUserCards(prev => [...prev, mockCard]);
    setSelectedCard(mockCard);
    setIsAddCardDrawerOpen(false);
    setIsStampDrawerOpen(true);
    toast.success("Kart cüzdanınıza eklendi! Şifre girerek ilk kaşenizi alın.");
  };

  const handleApplyStamp = async (bypassPin = false) => {
    if (!user || !selectedCard) return;
    setStamping(true);

    try {
      // In bypass mode, use a default PIN or fallback PIN
      const pinToSubmit = bypassPin ? "1234" : pinCode;

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

      setPinCode("");
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
    <div className="flex min-h-screen flex-col bg-[#FDFBF7] text-stone-900 overflow-hidden relative">
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

      {/* Decorative blurred backgrounds for futuristic premium look */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-30%] w-[100vw] h-[100vw] rounded-full bg-amber-500/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] rounded-full bg-violet-600/5 blur-[150px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (window.location.href = getAppRootUrl())}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <CaretLeft size={14} weight="bold" />
            <span>Katalog</span>
          </button>
        </div>

        {/* Hero Banner */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block bg-gradient-to-tr from-amber-500 to-orange-600 p-5 rounded-[2.5rem] shadow-[0_20px_40px_rgba(245,158,11,0.15)] mb-4"
          >
            <Cards size={36} weight="fill" className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-stone-900">
            Stamp <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Wallet</span>
          </h1>
          <p className="text-stone-400 text-[9px] font-black tracking-[0.3em] uppercase mt-2">
            Loyalty Pass Core v2.0
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Active Stamp Cards */}
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <Cards size={16} className="text-amber-500" />
                Aktif Kartlarım
              </h2>
              <button
                onClick={() => setIsAddCardDrawerOpen(true)}
                className="bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1 shadow-md"
              >
                <Plus size={12} weight="bold" />
                KART EKLE
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-stone-400 text-xs font-semibold animate-pulse uppercase tracking-widest">
                Kartlar okunuyor...
              </div>
            ) : userCards.length === 0 ? (
              <div className="py-14 text-center bg-white rounded-[2.5rem] border border-dashed border-stone-200/80 flex flex-col items-center justify-center p-8 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 mb-4 border border-stone-200/60">
                  <Cards size={22} />
                </div>
                <p className="text-stone-850 text-xs font-black uppercase tracking-wider mb-1">Cüzdan Boş</p>
                <p className="text-stone-550 text-[10px] max-w-[220px] leading-relaxed mb-6">
                  Müşteri kartı eklemek ve hediye kazanmak için ilk dükkanını seç.
                </p>
                <button
                  onClick={() => setIsAddCardDrawerOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  Kart Ekle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userCards.map((card) => {
                  const style = getCardStyle(card.business_name);
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setSelectedCard(card);
                        setIsStampDrawerOpen(true);
                      }}
                      className={`bg-gradient-to-br ${style.from} p-5.5 rounded-[2.5rem] border ${style.border} shadow-xl hover:${style.shadow} transition-all duration-300 cursor-pointer relative overflow-hidden group hover:-translate-y-0.5 active:scale-98`}
                    >
                      {/* Card gloss overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-black/10 pointer-events-none" />
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-6 -translate-y-6 blur-lg group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-black/10 border border-white/10 flex items-center justify-center text-white font-black text-xs overflow-hidden shadow-inner">
                            {card.business_logo ? (
                              <img src={card.business_logo} alt={card.business_name} className="w-full h-full object-cover" />
                            ) : (
                              card.business_name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-black text-white text-sm tracking-tight leading-none mb-1.5">{card.business_name}</h3>
                            <span className="inline-flex items-center bg-white/15 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                              {card.business_reward}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black tracking-tighter text-white">{card.stamps_count}</span>
                          <span className="text-[10px] font-black text-white/50">/{card.stamp_limit}</span>
                        </div>
                      </div>

                      {/* Micro progress dot display on card base */}
                      <div className="mt-5 flex gap-1.5 relative z-10 max-w-[200px] justify-start items-center">
                        {Array.from({ length: card.stamp_limit }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full border transition-all ${
                              idx < card.stamps_count
                                ? "bg-white border-white/20 scale-110 shadow-sm"
                                : "bg-black/15 border-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Redeemed / Earned Coupons list */}
          <div>
            <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-5 flex items-center gap-2 px-1">
              <Ticket size={16} className="text-amber-500" />
              Kazanılan Ödüllerim ({redeemedRewards.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs font-semibold animate-pulse uppercase tracking-widest">
                Ödüller okunuyor...
              </div>
            ) : redeemedRewards.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-3xl border border-stone-200/60 p-6 shadow-sm">
                <Ticket size={24} className="text-stone-300 mx-auto mb-2" />
                <p className="text-stone-455 text-[10px] uppercase font-black tracking-wider leading-relaxed">
                  Henüz ödül kuponunuz bulunmuyor. <br /> Kaşelerinizi tamamlayıp kupon kazanın!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {redeemedRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`bg-white rounded-3xl border border-stone-200/80 shadow-sm flex items-stretch overflow-hidden ${
                      reward.is_used ? "opacity-50" : ""
                    }`}
                  >
                    <div className="p-4 flex-1 flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-150 flex items-center justify-center text-amber-600 font-bold text-xs overflow-hidden shrink-0">
                        {reward.business_logo ? (
                          <img src={reward.business_logo} alt={reward.business_name} className="w-full h-full object-cover" />
                        ) : (
                          reward.business_name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-stone-850 truncate">{reward.business_name}</h3>
                        <p className="text-[10px] text-amber-600 font-extrabold mt-1 uppercase tracking-wider truncate">
                          {reward.reward_title}
                        </p>
                      </div>
                    </div>

                    <div className="w-24 bg-stone-50 flex flex-col items-center justify-center p-3">
                      <button
                        onClick={() => handleUseReward(reward.id)}
                        className="bg-gradient-to-b from-amber-500 to-orange-500 hover:from-amber-650 hover:to-orange-650 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest py-3 px-1 rounded-2xl w-full text-center shadow-md shadow-orange-500/10"
                      >
                        KULLAN
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      {/* DRAWERS & DIALOGS */}

      {/* 1. Add Card Drawer */}
      <Drawer.Root open={isAddCardDrawerOpen} onOpenChange={setIsAddCardDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[90vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                KAMPANYA <span className="text-amber-500">EKLE</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                Kaşe toplamak istediğin işletmenin kartını cüzdanına yerleştir
              </Drawer.Description>

              {businesses.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs font-bold uppercase tracking-wider">
                  Kayıtlı kampanya bulunamadı.
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {businesses.map((biz) => {
                    const alreadyHas = userCards.some(c => c.business_id === biz.id);
                    return (
                      <div
                        key={biz.id}
                        className="bg-stone-50 p-4 rounded-2xl border border-stone-150 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-amber-600 font-black text-xs overflow-hidden">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                            ) : (
                              biz.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-stone-800">{biz.name}</h3>
                            <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mt-1">
                              Ödül: {biz.reward_title} ({biz.stamp_limit} Kaşe)
                            </p>
                          </div>
                        </div>

                        <button
                          disabled={alreadyHas}
                          onClick={() => handleAddCard(biz.id)}
                          className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${
                            alreadyHas
                              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md active:scale-95"
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

      {/* 2. Interactive Stamp Drawer */}
      <Drawer.Root open={isStampDrawerOpen} onOpenChange={setIsStampDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[95vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto relative">
              <Drawer.Title className="sr-only">Kart Detayı</Drawer.Title>
              <Drawer.Description className="sr-only">Kaşe biriktirme kartı detayları</Drawer.Description>
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              
              {selectedCard && (
                <div className="space-y-6">
                  {/* Brand themed loyalty card in detail view */}
                  {(() => {
                    const style = getCardStyle(selectedCard.business_name);
                    return (
                      <div className={`bg-gradient-to-br ${style.from} p-6 rounded-[2.5rem] border ${style.border} shadow-2xl relative overflow-hidden flex flex-col text-white`}>
                        {/* Card gloss overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                        <div className="flex items-start justify-between relative z-10 mb-2">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white font-black text-sm overflow-hidden shadow-inner">
                              {selectedCard.business_logo ? (
                                <img src={selectedCard.business_logo} alt={selectedCard.business_name} className="w-full h-full object-cover" />
                              ) : (
                                selectedCard.business_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-white text-sm tracking-tight leading-none mb-1.5">{selectedCard.business_name}</h3>
                              <span className="inline-flex items-center bg-white/10 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                {selectedCard.business_reward}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black tracking-tighter text-white">{selectedCard.stamps_count}</span>
                            <span className="text-[10px] font-black text-white/50">/{selectedCard.stamp_limit}</span>
                          </div>
                        </div>

                        {/* Perforated divider line inside the card */}
                        <div className="w-full h-[1px] bg-white/10 my-4 relative z-10" />

                        {/* Dark background panel to hold stamps for clean alignment */}
                        <div className="bg-black/15 rounded-[2rem] p-5 border border-white/5 relative z-10">
                          
                          {/* Stamp Grid */}
                          <div className="grid grid-cols-4 gap-4 py-2 relative z-10 justify-items-center max-w-[260px] mx-auto">
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
                                    className={`w-13 h-13 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative ${
                                      isStamped
                                        ? "bg-white text-stone-900 border border-white/20 shadow-md shadow-white/5"
                                        : isLast
                                        ? "bg-white/10 border border-dashed border-white/30 text-white/70 animate-pulse"
                                        : "bg-black/15 border border-white/5 text-white/20"
                                    }`}
                                  >
                                    {isStamped ? (
                                      <span className="text-xl">{getBusinessEmoji(selectedCard.business_name)}</span>
                                    ) : isLast ? (
                                      <span className="text-sm filter opacity-70">🎁</span>
                                    ) : (
                                      <span className="text-xl filter grayscale opacity-20 pointer-events-none select-none">
                                        {getBusinessEmoji(selectedCard.business_name)}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                              );
                            })}
                          </div>

                        </div>

                        <div className="text-center mt-4 relative z-10">
                          <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">
                            TOPLANAN KAŞE: {selectedCard.stamps_count}/{selectedCard.stamp_limit}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stamp Input & Actions */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider pl-1">
                        Kaşe Onay Şifresi
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="PIN girin..."
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-5 text-center font-mono text-xl tracking-[1em] focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none shadow-sm text-amber-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        disabled={stamping || pinCode.length !== 4}
                        onClick={() => handleApplyStamp(false)}
                        className="bg-stone-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md hover:bg-stone-850 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                      >
                        Kaşele
                      </button>

                      <button
                        disabled={stamping}
                        onClick={() => handleApplyStamp(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Sparkle size={14} weight="fill" />
                        Hızlı (Demo)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
