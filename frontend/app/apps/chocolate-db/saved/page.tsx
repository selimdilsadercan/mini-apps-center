"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/api";
import Client, { chocolate_db } from "@/lib/client";
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

const client = createBrowserClient();

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
      <div className="min-h-screen bg-[#FAF9F7] text-gray-900 flex flex-col items-center justify-center p-6">
        <p className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">{t.loginRequired}</p>
        <button 
          onClick={() => router.push("/apps/chocolate-db")}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-gray-100 text-gray-900 font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} weight="bold" />
          {lang === "tr" ? "Geri Dön" : "Go Back"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 font-sans pb-20">
      {/* Hero Header */}
      <div className="relative bg-white pt-20 pb-12 px-5 border-b border-gray-100">
        <button
          onClick={() => router.push("/apps/chocolate-db")}
          className="absolute top-6 left-5 z-10 flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-100 text-gray-900 transition-all cursor-pointer shadow-sm active:scale-95 hover:bg-gray-50"
          title={lang === "tr" ? "Geri Dön" : "Go Back"}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="relative max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-[1000] text-gray-900 tracking-tighter uppercase leading-none mb-2">
            {t.title}
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar -mx-5 px-5">
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              activeTab === "wishlist"
                ? "bg-amber-500 text-white border-amber-500 shadow-md"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <BookmarkSimple size={14} weight="fill" />
            {t.wishlist}
          </button>
          <button
            onClick={() => setActiveTab("tried")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              activeTab === "tried"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <Check size={14} weight="bold" />
            {t.tried}
          </button>
          <button
            onClick={() => setActiveTab("rated")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              activeTab === "rated"
                ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <Star size={14} weight="fill" />
            {t.rated}
          </button>
          <button
            onClick={() => setActiveTab("dislike")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              activeTab === "dislike"
                ? "bg-rose-600 text-white border-rose-600 shadow-md"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <Prohibit size={14} weight="fill" />
            {t.dislike}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-white border border-gray-100 animate-pulse rounded-[2rem]"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredChocolates.map((choco) => (
              <ChocolateCard key={choco.id} choco={choco} onReview={fetchChocolates} lang={lang} />
            ))}
          </div>
        )}

        {!loading && filteredChocolates.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.noResults}</p>
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
        className="group relative bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-all flex flex-col h-full cursor-pointer"
      >
        <div className="aspect-square relative overflow-hidden rounded-2xl bg-gray-50 mb-4">
          <img 
            src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
            alt={choco.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-gray-900 uppercase tracking-wider border border-white/50 flex items-center gap-1">
            <Star size={10} weight="fill" className="text-yellow-400" />
            {choco.avg_rating.toFixed(1)}
          </div>
        </div>

        <div className="flex flex-col flex-grow gap-1">
          <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight line-clamp-1">{choco.name}</h3>
          <p className="text-[9px] text-gray-400 font-bold line-clamp-2 leading-relaxed h-7">
            {choco.brand}
          </p>
          
          {/* State Indicators */}
          <div className="flex gap-1 mt-2">
            <button
              onClick={(e) => handleStateToggle(e, "wishlist")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                choco.user_state === "wishlist"
                  ? "bg-amber-100 text-amber-600"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <BookmarkSimple weight={choco.user_state === "wishlist" ? "fill" : "bold"} size={14} />
            </button>
            <button
              onClick={(e) => handleStateToggle(e, "tried")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                choco.user_state === "tried"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              <Check weight="bold" size={14} />
            </button>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                choco.user_rating && choco.user_rating > 0
                  ? "bg-yellow-100 text-yellow-600"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <Star weight={choco.user_rating && choco.user_rating > 0 ? "fill" : "bold"} size={14} />
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#FAF9F7] w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-900 cursor-pointer active:scale-95"
            >
              <X weight="bold" className="size-5" />
            </button>

            <h2 className="text-2xl font-[1000] text-gray-900 tracking-tighter uppercase leading-none mb-2 text-center">
              {t.rateTitle}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center mb-10">
              {choco.name}
            </p>

            <div className="space-y-10">
              <div className="flex flex-col items-center gap-6">
                <div className="text-5xl font-[1000] text-gray-900 tracking-tighter">
                  {rating || 0}<span className="text-xl text-gray-300 ml-1">/10</span>
                </div>
                
                <div className="flex justify-center gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-all hover:scale-125 cursor-pointer"
                    >
                      <Star 
                        weight={rating >= star ? "fill" : "bold"} 
                        className={`size-7 sm:size-8 ${rating >= star ? "text-yellow-400" : "text-gray-200"}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleSubmitReview} 
                  disabled={isSubmitting || rating === 0}
                  className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.submitting : t.saveReview}
                </button>

                {choco.user_rating && choco.user_rating > 0 ? (
                  <button 
                    onClick={handleDeleteReview} 
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-rose-500 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {t.deleteReview}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
