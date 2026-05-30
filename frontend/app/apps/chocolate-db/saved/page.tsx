"use client";

import React, { useEffect, useState } from "react";
import Client, { Local, chocolate_db } from "@/lib/client";
import { 
  Star, 
  ArrowLeft,
  Check,
  BookmarkSimple,
  Prohibit,
  X
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";

const client = new Client(Local);

const translations = {
  tr: {
    title: "Benim Listelerim",
    subtitle: "Kaydettiğiniz, denediğiniz ve puanladığınız tüm lezzetler.",
    loadingData: "Yükleniyor...",
    noResults: "Bu listede henüz hiçbir çikolata bulunmuyor...",
    rateTitle: "Değerlendir",
    saveReview: "Değerlendirmeyi Kaydet",
    deleteReview: "Değerlendirmeyi Sil",
    submitting: "Gönderiliyor...",
    guest: "Misafir",
    emptyDescription: "Bu efsane lezzet henüz keşfedilmeyi bekliyor...",
    tried: "Denedim",
    wishlist: "Denemek İstiyorum",
    dislike: "Engellenenler / Gizlenenler",
    rated: "Puanladıklarım",
    loginRequired: "Lütfen önce giriş yapın."
  },
  en: {
    title: "My Lists",
    subtitle: "All the tastes you saved, tried, and rated.",
    loadingData: "Loading...",
    noResults: "No chocolates found in this list yet...",
    rateTitle: "Rate",
    saveReview: "Save Rating",
    deleteReview: "Delete Rating",
    submitting: "Submitting...",
    guest: "Guest",
    emptyDescription: "This legendary taste is waiting to be discovered...",
    tried: "Tried",
    wishlist: "Wishlist",
    dislike: "Blocked / Hidden",
    rated: "Rated",
    loginRequired: "Please log in first."
  }
};

export default function SavedChocolatesPage() {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user } = useUser();

  const [chocolates, setChocolates] = useState<chocolate_db.Chocolate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wishlist" | "tried" | "rated" | "dislike">("wishlist");

  const fetchChocolates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const resp = await client.chocolate_db.listChocolates({ userId: user.id });
      setChocolates(resp.chocolates);
    } catch (err) {
      console.error("Failed to fetch chocolates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChocolates();
  }, [user?.id]);

  const filteredChocolates = chocolates.filter(c => {
    if (activeTab === "wishlist") return c.user_state === "wishlist";
    if (activeTab === "tried") return c.user_state === "tried";
    if (activeTab === "dislike") return c.user_state === "dislike";
    if (activeTab === "rated") return !!(c.user_rating && c.user_rating > 0);
    return false;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] flex flex-col items-center justify-center p-6">
        <p className="text-lg font-bold mb-4">{t.loginRequired}</p>
        <button 
          onClick={() => router.push("/apps/chocolate-db")}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#4A2C2A] text-white font-bold cursor-pointer hover:opacity-90 transition-all shadow-lg"
        >
          <ArrowLeft size={18} weight="bold" />
          {lang === "tr" ? "Geri Dön" : "Go Back"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#4A2C2A] pt-20 pb-12 px-4 sm:px-6 md:py-16 lg:px-8">
        <button
          onClick={() => router.push("/apps/chocolate-db")}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#F3E5D8]/10 hover:bg-[#F3E5D8]/20 border border-[#F3E5D8]/20 text-[#F3E5D8] transition-all cursor-pointer shadow-lg"
          title={lang === "tr" ? "Geri Dön" : "Go Back"}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#D4AF37] mb-2 tracking-tight drop-shadow-md">
            {t.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#F3E5D8] opacity-90 max-w-2xl mx-auto font-medium px-4">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-[#4A2C2A]/10 dark:border-white/10">
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-all ${
              activeTab === "wishlist"
                ? "bg-amber-500 text-white border-amber-500 shadow-md font-bold"
                : "bg-white dark:bg-[#2A1812] text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
            }`}
          >
            <BookmarkSimple size={16} weight="fill" />
            {t.wishlist}
          </button>
          <button
            onClick={() => setActiveTab("tried")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-all ${
              activeTab === "tried"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md font-bold"
                : "bg-white dark:bg-[#2A1812] text-emerald-600 dark:text-emerald-400 border-emerald-600/20 hover:bg-emerald-600/10"
            }`}
          >
            <Check size={16} weight="bold" />
            {t.tried}
          </button>
          <button
            onClick={() => setActiveTab("rated")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-all ${
              activeTab === "rated"
                ? "bg-[#D4AF37] text-[#1A0F0A] border-[#D4AF37] shadow-md font-bold"
                : "bg-white dark:bg-[#2A1812] text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/10"
            }`}
          >
            <Star size={16} weight="fill" />
            {t.rated}
          </button>
          <button
            onClick={() => setActiveTab("dislike")}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-all ${
              activeTab === "dislike"
                ? "bg-rose-600 text-white border-rose-600 shadow-md font-bold"
                : "bg-white dark:bg-[#2A1812] text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
            }`}
          >
            <Prohibit size={16} weight="fill" />
            {t.dislike}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-[#EEDCC5] dark:bg-[#2A1812] animate-pulse rounded-xl sm:rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {filteredChocolates.map((choco) => (
              <ChocolateCard key={choco.id} choco={choco} onReview={fetchChocolates} lang={lang} />
            ))}
          </div>
        )}

        {!loading && filteredChocolates.length === 0 && (
          <div className="text-center py-24 bg-[#EEDCC5] dark:bg-[#2A1812] rounded-2xl sm:rounded-3xl border-4 border-dashed border-[#4A2C2A]/10">
            <p className="text-base sm:text-lg opacity-60 font-bold px-4">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Duplicate the card component to keep code self-contained and avoid import issues
function ChocolateCard({ choco, onReview, lang }: { choco: chocolate_db.Chocolate, onReview: () => void, lang: string }) {
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showModal) {
      setRating(choco.user_rating || 0);
    }
  }, [showModal, choco.user_rating]);

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.addReview({
        chocolate_id: choco.id,
        rating,
        reviewer_name: user?.fullName || user?.username || t.guest,
        userId: user?.id
      });
      setShowModal(false);
      setRating(0);
      onReview();
    } catch (err) {
      console.error("Failed to add review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.deleteReview({
        chocolate_id: choco.id,
        userId: user.id
      });
      setShowModal(false);
      setRating(0);
      onReview();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateToggle = async (e: React.MouseEvent, state: "tried" | "wishlist" | "dislike") => {
    e.stopPropagation();
    if (!user) {
      alert(t.loginRequired);
      return;
    }
    const newState = choco.user_state === state ? "" : state;
    try {
      await client.chocolate_db.setUserState({
        userId: user.id,
        chocolateId: choco.id,
        state: newState as any
      });
      onReview();
    } catch (err) {
      console.error("Failed to update user state:", err);
    }
  };

  const chocoDesc = (lang === "tr" ? choco.description_tr : (choco.description_en || choco.description_tr)) || t.emptyDescription;

  return (
    <>
      <div 
        onClick={() => {
          if (!user) {
            alert(t.loginRequired);
            return;
          }
          setShowModal(true);
        }}
        className="group relative bg-white dark:bg-[#2A1812] rounded-xl sm:rounded-2xl p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full cursor-pointer border border-[#4A2C2A]/5 dark:border-white/5"
      >
        <div className="aspect-square relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-50/80 dark:bg-black/20 flex items-center justify-center">
          <img 
            src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
            alt={choco.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="pt-3 pb-0 flex flex-col flex-grow justify-between gap-3 text-[#4A2C2A] dark:text-[#F3E5D8]">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold line-clamp-1 text-[#4A2C2A] dark:text-[#F3E5D8]">{choco.name}</h3>
            <div className="flex items-center gap-1 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 px-2 py-0.5 rounded-full text-[#D4AF37] w-fit text-[10px] sm:text-xs font-bold">
              <Star weight="fill" className="size-3 sm:size-3.5" />
              <span>{choco.avg_rating.toFixed(1)}</span>
            </div>
            {choco.category && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4A2C2A]/5 dark:bg-[#D4AF37]/10 text-[#4A2C2A]/60 dark:text-[#D4AF37] w-fit">
                {choco.category}
              </span>
            )}
          </div>

          <p className="text-[10px] sm:text-xs opacity-60 line-clamp-2 font-medium leading-relaxed">
            {chocoDesc}
          </p>

          {/* JustWatch style states buttons - Grid for absolute equal width */}
          <div className="grid grid-cols-4 gap-1 w-full border-t border-[#4A2C2A]/10 dark:border-white/10 pt-3 mt-1">
            <div className="relative group/btn flex justify-center">
              <button
                onClick={(e) => handleStateToggle(e, "wishlist")}
                title={t.wishlist}
                className={`w-full py-1.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  choco.user_state === "wishlist"
                    ? "bg-amber-500 border-amber-500 text-white font-bold"
                    : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                }`}
              >
                <BookmarkSimple weight={choco.user_state === "wishlist" ? "fill" : "regular"} className="size-4 flex-shrink-0" />
              </button>
              <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none group-hover/btn:opacity-100 translate-y-1 group-hover/btn:translate-y-0 transition-all duration-200 bg-[#4A2C2A] dark:bg-[#F3E5D8] text-[#F3E5D8] dark:text-[#4A2C2A] text-[10px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 border border-[#D4AF37]/30">
                {t.wishlist}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#4A2C2A] dark:border-t-[#F3E5D8]"></div>
              </div>
            </div>
            
            <div className="relative group/btn flex justify-center">
              <button
                onClick={(e) => handleStateToggle(e, "tried")}
                title={t.tried}
                className={`w-full py-1.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  choco.user_state === "tried"
                    ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                    : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-emerald-600/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                <Check weight={choco.user_state === "tried" ? "bold" : "regular"} className="size-4 flex-shrink-0" />
              </button>
              <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none group-hover/btn:opacity-100 translate-y-1 group-hover/btn:translate-y-0 transition-all duration-200 bg-[#4A2C2A] dark:bg-[#F3E5D8] text-[#F3E5D8] dark:text-[#4A2C2A] text-[10px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 border border-[#D4AF37]/30">
                {t.tried}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#4A2C2A] dark:border-t-[#F3E5D8]"></div>
              </div>
            </div>

            <div className="relative group/btn flex justify-center">
              <button
                onClick={(e) => handleStateToggle(e, "dislike")}
                title={t.dislike}
                className={`w-full py-1.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  choco.user_state === "dislike"
                    ? "bg-rose-500 border-rose-500 text-white font-bold"
                    : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                }`}
              >
                <Prohibit weight={choco.user_state === "dislike" ? "fill" : "regular"} className="size-4 flex-shrink-0" />
              </button>
              <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none group-hover/btn:opacity-100 translate-y-1 group-hover/btn:translate-y-0 transition-all duration-200 bg-[#4A2C2A] dark:bg-[#F3E5D8] text-[#F3E5D8] dark:text-[#4A2C2A] text-[10px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 border border-[#D4AF37]/30">
                {t.dislike}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#4A2C2A] dark:border-t-[#F3E5D8]"></div>
              </div>
            </div>

            <div className="relative group/btn flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!user) {
                    alert(t.loginRequired);
                    return;
                  }
                  setShowModal(true);
                }}
                title={`${t.rateTitle} (${choco.user_rating ? `${choco.user_rating} ★` : ""})`}
                className={`w-full py-1.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                  choco.user_rating && choco.user_rating > 0
                    ? "bg-[#D4AF37] border-[#D4AF37] text-[#1A0F0A] font-bold shadow-md"
                    : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] dark:hover:text-[#D4AF37]"
                }`}
              >
                <Star 
                  weight={choco.user_rating && choco.user_rating > 0 ? "fill" : "regular"} 
                  className="size-4 flex-shrink-0" 
                />
              </button>
              <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none group-hover/btn:opacity-100 translate-y-1 group-hover/btn:translate-y-0 transition-all duration-200 bg-[#4A2C2A] dark:bg-[#F3E5D8] text-[#F3E5D8] dark:text-[#4A2C2A] text-[10px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 border border-[#D4AF37]/30">
                {choco.user_rating ? `${t.rateTitle} (${choco.user_rating} ★)` : t.rateTitle}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#4A2C2A] dark:border-t-[#F3E5D8]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#4A2C2A]/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#FDF5E6] dark:bg-[#1A0F0A] w-full max-w-sm rounded-2xl sm:rounded-3xl p-8 sm:p-10 shadow-3xl overflow-hidden">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-[#4A2C2A]/5 rounded-full transition-colors cursor-pointer"
            >
              <X weight="bold" className="size-6 text-[#4A2C2A]" />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-[#4A2C2A] dark:text-[#D4AF37] mb-6 text-center pr-8">
              {t.rateTitle} {choco.name}
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex justify-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-all hover:scale-125 cursor-pointer"
                  >
                    <Star 
                      weight={rating >= star ? "fill" : "regular"} 
                      className={`size-10 sm:size-12 ${rating >= star ? "text-[#D4AF37]" : "text-[#4A2C2A]/20 dark:text-white/10"}`} 
                    />
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSubmitReview} 
                disabled={isSubmitting || rating === 0}
                className="w-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-white dark:text-[#4A2C2A] py-3 rounded-xl font-bold text-sm sm:text-base shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? t.submitting : t.saveReview}
              </button>

              {choco.user_rating && choco.user_rating > 0 ? (
                <button 
                  onClick={handleDeleteReview} 
                  disabled={isSubmitting}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer border border-rose-500/20"
                >
                  {t.deleteReview}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
