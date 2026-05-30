"use client";

import React, { useEffect, useState } from "react";
import Client, { Local, chocolate_db } from "@/lib/client";
import { 
  Star, 
  MagnifyingGlass,
  X,
  ArrowLeft,
  Check,
  BookmarkSimple,
  ThumbsDown
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";

const client = new Client(Local);

const translations = {
  tr: {
    subtitle: "Çikolata arşivi. Puanla, yorumla, keşfet.",
    searchPlaceholder: "Çikolata veya marka ara...",
    popularFlavors: "Popüler Lezzetler",
    refreshData: "Verileri Yenile",
    loadingData: "Yükleniyor...",
    noResults: "Arşivde bulunamadı...",
    rateTitle: "Değerlendir",
    saveReview: "Değerlendirmeyi Kaydet",
    submitting: "Gönderiliyor...",
    guest: "Misafir",
    emptyDescription: "Bu efsane lezzet henüz keşfedilmeyi bekliyor...",
    tried: "Denedim",
    wishlist: "İstiyorum",
    dislike: "Beğenmedim",
    loginRequired: "Lütfen önce giriş yapın."
  },
  en: {
    subtitle: "Chocolate archive. Rate, review, discover.",
    searchPlaceholder: "Search chocolate or brand...",
    popularFlavors: "Popular Flavors",
    refreshData: "Refresh Data",
    loadingData: "Loading...",
    noResults: "Not found in archive...",
    rateTitle: "Rate",
    saveReview: "Save Rating",
    submitting: "Submitting...",
    guest: "Guest",
    emptyDescription: "This legendary taste is waiting to be discovered...",
    tried: "Tried",
    wishlist: "Wishlist",
    dislike: "Dislike",
    loginRequired: "Please log in first."
  }
};

export default function ChocolateDBPage() {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user } = useUser();

  const [chocolates, setChocolates] = useState<chocolate_db.Chocolate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChocolates = async () => {
    try {
      const resp = await client.chocolate_db.listChocolates({ userId: user?.id || "" });
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

  const filteredChocolates = chocolates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#4A2C2A] pt-20 pb-12 px-4 sm:px-6 md:py-16 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#F3E5D8]/10 hover:bg-[#F3E5D8]/20 border border-[#F3E5D8]/20 text-[#F3E5D8] transition-all cursor-pointer shadow-lg"
          title={lang === "tr" ? "Geri Dön" : "Go Back"}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#D4AF37] mb-2 tracking-tight drop-shadow-md">
            ChocolateDB
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[#F3E5D8] opacity-90 max-w-2xl mx-auto font-medium px-4">
            {t.subtitle}
          </p>
          
          <div className="mt-6 md:mt-10 max-w-xl mx-auto relative px-2">
            <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 text-[#4A2C2A] size-5 sm:size-6" />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-full border-none bg-[#F3E5D8] text-[#4A2C2A] placeholder:text-[#4A2C2A]/50 text-base sm:text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF37] transition-all"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-[#EEDCC5] dark:bg-[#2A1812] animate-pulse rounded-xl sm:rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
            {filteredChocolates.map((choco) => (
              <ChocolateCard key={choco.id} choco={choco} onReview={fetchChocolates} lang={lang} />
            ))}
          </div>
        )}

        {!loading && filteredChocolates.length === 0 && (
          <div className="text-center py-32 bg-[#EEDCC5] dark:bg-[#2A1812] rounded-2xl sm:rounded-3xl border-4 border-dashed border-[#4A2C2A]/10">
            <p className="text-xl opacity-50 font-bold">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChocolateCard({ choco, onReview, lang }: { choco: chocolate_db.Chocolate, onReview: () => void, lang: string }) {
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.addReview({
        chocolate_id: choco.id,
        rating,
        reviewer_name: t.guest
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

  const handleStateToggle = async (e: React.MouseEvent, state: "tried" | "wishlist" | "dislike") => {
    e.stopPropagation(); // Card click rating modal açılışını engelle
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
        onClick={() => setShowModal(true)}
        className="group relative bg-white dark:bg-[#2A1812] rounded-xl sm:rounded-2xl p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full cursor-pointer border border-[#4A2C2A]/5 dark:border-white/5"
      >
        {/* Image Container with Padding */}
        <div className="aspect-square relative overflow-hidden rounded-lg sm:rounded-xl bg-gray-50/80 dark:bg-black/20 flex items-center justify-center">
          <img 
            src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
            alt={choco.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Content with minimized spacing */}
        <div className="pt-3 pb-0 flex flex-col flex-grow justify-between gap-3 text-[#4A2C2A] dark:text-[#F3E5D8]">
          {/* Title & Rating Row */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold line-clamp-1 text-[#4A2C2A] dark:text-[#F3E5D8]">{choco.name}</h3>
            <div className="flex items-center gap-1 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 px-2 py-0.5 rounded-full text-[#D4AF37] w-fit text-[10px] sm:text-xs font-bold">
              <Star weight="fill" className="size-3 sm:size-3.5" />
              <span>{choco.avg_rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[10px] sm:text-xs opacity-60 line-clamp-2 font-medium leading-relaxed">
            {chocoDesc}
          </p>

          {/* JustWatch style states buttons - Grid for absolute equal width */}
          <div className="grid grid-cols-3 gap-1 w-full border-t border-[#4A2C2A]/10 dark:border-white/10 pt-3 mt-1">
            <button
              onClick={(e) => handleStateToggle(e, "wishlist")}
              title={t.wishlist}
              className={`py-1.5 rounded-lg flex items-center justify-center border transition-all ${
                choco.user_state === "wishlist"
                  ? "bg-amber-500 border-amber-500 text-white font-bold"
                  : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
              }`}
            >
              <BookmarkSimple weight={choco.user_state === "wishlist" ? "fill" : "regular"} className="size-4 flex-shrink-0" />
            </button>
            
            <button
              onClick={(e) => handleStateToggle(e, "tried")}
              title={t.tried}
              className={`py-1.5 rounded-lg flex items-center justify-center border transition-all ${
                choco.user_state === "tried"
                  ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                  : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-emerald-600/10 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              <Check weight={choco.user_state === "tried" ? "bold" : "regular"} className="size-4 flex-shrink-0" />
            </button>

            <button
              onClick={(e) => handleStateToggle(e, "dislike")}
              title={t.dislike}
              className={`py-1.5 rounded-lg flex items-center justify-center border transition-all ${
                choco.user_state === "dislike"
                  ? "bg-rose-500 border-rose-500 text-white font-bold"
                  : "border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <ThumbsDown weight={choco.user_state === "dislike" ? "fill" : "regular"} className="size-4 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#4A2C2A]/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#FDF5E6] dark:bg-[#1A0F0A] w-full max-w-sm rounded-2xl sm:rounded-3xl p-8 sm:p-10 shadow-3xl overflow-hidden">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-[#4A2C2A]/5 rounded-full transition-colors"
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
                    className="focus:outline-none transition-all hover:scale-125"
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
                className="w-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-white dark:text-[#4A2C2A] py-3 rounded-xl font-bold text-sm sm:text-base shadow-2xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isSubmitting ? t.submitting : t.saveReview}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
