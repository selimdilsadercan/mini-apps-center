"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Cards,
  Plus,
  CheckCircle,
  CaretLeft,
  Storefront,
  QrCode,
  Sparkle,
  Ticket,
  Info,
  Clock,
  Check,
  User,
  ShieldCheck,
  Star,
  Barcode,
  Warning
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [role, setRole] = useState<"customer" | "business">("customer");
  
  // Data State
  const [businesses, setBusinesses] = useState<stamp_card.Business[]>([]);
  const [userCards, setUserCards] = useState<stamp_card.UserCard[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<stamp_card.RedeemedReward[]>([]);
  const [myBusinesses, setMyBusinesses] = useState<stamp_card.UserOwnedBusiness[]>([]);

  // Selected card details
  const [selectedCard, setSelectedCard] = useState<stamp_card.UserCard | null>(null);
  const [isStampDrawerOpen, setIsStampDrawerOpen] = useState(false);
  const [isAddCardDrawerOpen, setIsAddCardDrawerOpen] = useState(false);
  const [isCreateBizDrawerOpen, setIsCreateBizDrawerOpen] = useState(false);
  
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
        setMyBusinesses([]);
        return;
      }

      const dataRes = await client.stamp_card.getUserData(user.id);
      setUserCards(dataRes.cards || []);
      setRedeemedRewards(dataRes.rewards || []);
      setMyBusinesses(dataRes.my_businesses || []);
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
      const myBiz = myBusinesses.find(b => b.id === selectedCard.business_id);
      const pinToSubmit = bypassPin ? (myBiz?.pin_code || "1234") : pinCode;

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

          {/* Role selector */}
          <div className="bg-stone-100 p-1 rounded-2xl border border-stone-200/60 flex">
            <button
              onClick={() => setRole("customer")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5 ${
                role === "customer"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/10"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <User size={14} weight="fill" />
              Müşteri
            </button>
            <button
              onClick={() => setRole("business")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all flex items-center gap-1.5 ${
                role === "business"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/10"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Storefront size={14} weight="fill" />
              İşletme
            </button>
          </div>
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

        {/* Customer Mode View */}
        {role === "customer" && (
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
                  <p className="text-stone-500 text-[10px] max-w-[220px] leading-relaxed mb-6">
                    Müşteri kartı eklemek ve hediye kazanmak için ilk işletmeni seç.
                  </p>
                  <button
                    onClick={() => setIsAddCardDrawerOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Katalogu Keşfet
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userCards.map((card) => {
                    const style = getCardStyle(card.business_name);
                    return (
                      <motion.div
                        key={card.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedCard(card);
                          setIsStampDrawerOpen(true);
                        }}
                        className={`bg-gradient-to-br ${style.from} p-5 rounded-[2.2rem] border ${style.border} shadow-xl ${style.shadow} cursor-pointer flex flex-col justify-between group relative overflow-hidden aspect-[1.8/1] text-white`}
                      >
                        {/* Card gloss overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 blur-xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white font-black text-sm overflow-hidden shadow-inner">
                              {card.business_logo ? (
                                <img src={card.business_logo} alt={card.business_name} className="w-full h-full object-cover" />
                              ) : (
                                card.business_name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <h3 className="font-black text-white text-xs tracking-tight leading-none mb-1">{card.business_name}</h3>
                              <span className="inline-flex items-center bg-white/10 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                {card.business_reward}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black tracking-tighter text-white">{card.stamps_count}</span>
                            <span className="text-[10px] font-black text-white/50">/{card.stamp_limit}</span>
                          </div>
                        </div>

                        {/* Perforated divider line inside the card */}
                        {/* Stamp panel representation: 2 Rows, Larger and Centered */}
                        <div className={`grid ${card.stamp_limit === 8 ? "grid-cols-4" : card.stamp_limit === 10 ? "grid-cols-5" : card.stamp_limit === 12 ? "grid-cols-6" : "grid-cols-4"} gap-3 justify-center justify-items-center max-w-[260px] mx-auto relative z-10 py-2`}>
                          {Array.from({ length: card.stamp_limit }).map((_, idx) => {
                            const isStamped = idx < card.stamps_count;
                            const isLast = idx === card.stamp_limit - 1;
                            return (
                              <div
                                key={idx} 
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                                  isStamped
                                    ? "bg-white text-stone-900 border border-white/20 shadow-md shadow-white/5"
                                    : isLast
                                    ? "bg-white/10 border border-dashed border-white/30 text-white/70 animate-pulse"
                                    : "bg-black/15 border border-white/5 text-white/20"
                                }`}
                              >
                                {isStamped ? (
                                  getBusinessEmoji(card.business_name)
                                ) : isLast ? (
                                  "🎁"
                                ) : (
                                  <span className="filter grayscale opacity-25 text-xl pointer-events-none select-none">
                                    {getBusinessEmoji(card.business_name)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {card.completed_count > 0 && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/25 px-2 py-0.5 rounded-full text-[8px] font-black text-amber-400 z-10">
                            <Star size={8} weight="fill" />
                            x{card.completed_count}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Redeemed / Active Coupons */}
            <div>
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                <Ticket size={16} className="text-amber-500" />
                Kazandığım Ödüller ({redeemedRewards.filter(r => !r.is_used).length})
              </h2>

              {redeemedRewards.filter(r => !r.is_used).length === 0 ? (
                <div className="py-6 text-center text-stone-500 text-[9px] font-black uppercase tracking-widest bg-white rounded-2xl border border-stone-200/60 shadow-sm">
                  Kullanılmayı bekleyen ödülün bulunmuyor.
                </div>
              ) : (
                <div className="space-y-4">
                  {redeemedRewards.filter(r => !r.is_used).map((reward) => (
                    <div
                      key={reward.id}
                      className="bg-white rounded-[2rem] border border-stone-200/80 overflow-hidden shadow-sm relative flex"
                    >
                      {/* Ticket Side */}
                      <div className="flex-1 p-5 border-r border-dashed border-stone-100 relative">
                        {/* Curved ticket cuts */}
                        <div className="absolute top-[-8px] right-[-8px] w-4 h-4 bg-[#FDFBF7] rounded-full border border-stone-200/60" />
                        <div className="absolute bottom-[-8px] right-[-8px] w-4 h-4 bg-[#FDFBF7] rounded-full border border-stone-200/60" />

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-amber-650 font-black text-xs border border-stone-200/60">
                            {reward.business_logo ? (
                              <img src={reward.business_logo} alt={reward.business_name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              reward.business_name.substring(0, 1).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-stone-800">{reward.business_name}</h3>
                            <p className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">
                              Tarih: {new Date(reward.redeemed_at).toLocaleDateString("tr-TR")}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="text-sm font-black text-amber-600 uppercase tracking-tight">
                            {reward.reward_title}
                          </h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Barcode size={24} className="text-stone-300" />
                            <p className="text-[8px] text-stone-450 font-black tracking-widest uppercase">
                              #{reward.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Redeem Button Container */}
                      <div className="w-24 bg-stone-50 flex flex-col items-center justify-center p-3">
                        <button
                          onClick={() => handleUseReward(reward.id)}
                          className="bg-gradient-to-b from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest py-3 px-1 rounded-2xl w-full text-center shadow-md shadow-orange-500/10"
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
        )}

        {/* Business Mode View */}
        {role === "business" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <Storefront size={16} className="text-amber-500" />
                Kampanyalarım
              </h2>
              <button
                onClick={() => setIsCreateBizDrawerOpen(true)}
                className="bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1 shadow-md"
              >
                <Plus size={12} weight="bold" />
                İŞLETME EKLE
              </button>
            </div>

            {myBusinesses.length === 0 ? (
              <div className="py-14 text-center bg-white rounded-[2.5rem] border border-dashed border-stone-200/80 flex flex-col items-center justify-center p-8 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 mb-4 border border-stone-200/60">
                  <Storefront size={22} />
                </div>
                <p className="text-stone-850 text-xs font-black uppercase tracking-wider mb-1">Kayıtlı İşletme Yok</p>
                <p className="text-stone-500 text-[10px] max-w-[220px] leading-relaxed mb-6">
                  Loyalty kampanyalarını başlatmak için ilk dükkanını oluştur.
                </p>
                <button
                  onClick={() => setIsCreateBizDrawerOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl"
                >
                  Yeni İşletme Oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="bg-white p-5 rounded-[2rem] border border-stone-200/80 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-center text-amber-600 font-black text-lg overflow-hidden">
                        {biz.logo_url ? (
                          <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          biz.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-stone-850">{biz.name}</h3>
                        <p className="text-[10px] text-stone-450 mt-1">{biz.description || "Açıklama girilmedi."}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl">
                          PIN: <span className="font-mono">{biz.pin_code}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                          KAŞE LİMİTİ
                        </p>
                        <p className="text-sm font-black text-stone-850">{biz.stamp_limit} Adet</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                          KAMPANYA ÖDÜLÜ
                        </p>
                        <p className="text-xs font-black text-amber-600 uppercase truncate">
                          {biz.reward_title}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between items-center text-[9px] text-stone-400 font-black border-t border-stone-100">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        BAŞLANGIÇ: {new Date(biz.created_at).toLocaleDateString("tr-TR")}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 uppercase tracking-wider">
                        <ShieldCheck size={12} weight="bold" />
                        Kullanımda
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

      {/* 3. Create Business Drawer */}
      <Drawer.Root open={isCreateBizDrawerOpen} onOpenChange={setIsCreateBizDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-12 h-1 bg-stone-200 rounded-full mb-6" />
              <Drawer.Title className="text-xl font-black text-stone-900 tracking-tight mb-1">
                KAMPANYA <span className="text-amber-500">BAŞLAT</span>
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[9px] font-black uppercase tracking-wider mb-6">
                İşletmen için sadakat kartı şablonu oluştur
              </Drawer.Description>

              <CreateBusinessForm
                onComplete={() => {
                  setIsCreateBizDrawerOpen(false);
                  fetchData();
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}

// Subcomponent: Add/Create Business Form
function CreateBusinessForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    stampLimit: 8,
    rewardTitle: "",
    pinCode: "1234"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Lütfen giriş yapın.");
      return;
    }
    if (formData.pinCode.length !== 4) {
      toast.error("PIN kodu 4 hane olmalıdır.");
      return;
    }

    try {
      setLoading(true);
      const res = await client.business.createBusiness({
        userId: user.id,
        name: formData.name,
        description: formData.description,
        logoUrl: formData.logoUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&auto=format&fit=crop&q=80",
        themeColor: "#F59E0B"
      });
      if (res.business) {
        await client.stamp_card.createBusiness({
          businessId: res.business.id,
          stampLimit: formData.stampLimit,
          rewardTitle: formData.rewardTitle,
          pinCode: formData.pinCode
        });
        toast.success("Kampanya başarıyla oluşturuldu!");
        onComplete();
      }
    } catch (err) {
      console.error(err);
      toast.error("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-12">
      <div className="space-y-1">
        <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">İşletme Adı</label>
        <input
          required
          placeholder="Brew Coffee Lab"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Açıklama / Slogan</label>
        <input
          placeholder="Her 8 kahve alımında bir kahve bizden!"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Logo Görsel Linki</label>
        <input
          placeholder="https://..."
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Hedef Kaşe</label>
          <select
            value={formData.stampLimit}
            onChange={(e) => setFormData({ ...formData, stampLimit: parseInt(e.target.value) })}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
          >
            {[5, 6, 8, 10, 12].map((num) => (
              <option key={num} value={num} className="bg-white text-stone-800">
                {num} Kaşe
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Onay PIN Kodu</label>
          <input
            required
            maxLength={4}
            placeholder="1234"
            value={formData.pinCode}
            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-center font-mono focus:border-amber-500 focus:bg-white outline-none text-amber-600"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Hediye Ödül Nedir?</label>
        <input
          required
          placeholder="Filtre Kahve Hediye"
          value={formData.rewardTitle}
          onChange={(e) => setFormData({ ...formData, rewardTitle: e.target.value })}
          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
        />
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle size={18} weight="bold" />
            <span>Kampanyayı Başlat</span>
          </>
        )}
      </button>
    </form>
  );
}
