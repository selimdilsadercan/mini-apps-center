"use client";

import React, { useEffect, useState } from "react";
import Client, { Local, chocolate_db } from "@/lib/client";
import { 
  Star, 
  ChatTeardropText, 
  TrendUp, 
  MagnifyingGlass,
  CaretRight,
  X,
  ArrowLeft
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const client = new Client(Local);

const translations = {
  tr: {
    subtitle: "Çikolata arşivi. Puanla, yorumla, keşfet.",
    searchPlaceholder: "Çikolata veya marka ara...",
    popularFlavors: "Popüler Lezzetler",
    refreshData: "Verileri Yenile",
    loadingData: "Yükleniyor...",
    noResults: "Arşivde bulunamadı...",
    reviewsCount: "YORUM",
    rateReview: "PUANLA & YORUMLA",
    rateTitle: "Değerlendir",
    commentPlaceholder: "Lezzet, doku, haz... Senin için bu çikolata ne ifade ediyor?",
    saveReview: "DEĞERLENDİRMEYİ KAYDET",
    submitting: "GÖNDERİLİYOR...",
    guest: "Misafir",
    emptyDescription: "Bu efsane lezzet henüz keşfedilmeyi bekliyor...",
  },
  en: {
    subtitle: "Chocolate archive. Rate, review, discover.",
    searchPlaceholder: "Search chocolate or brand...",
    popularFlavors: "Popular Flavors",
    refreshData: "Refresh Data",
    loadingData: "Loading...",
    noResults: "Not found in archive...",
    reviewsCount: "REVIEWS",
    rateReview: "RATE & REVIEW",
    rateTitle: "Rate",
    commentPlaceholder: "Taste, texture, pleasure... What does this chocolate mean to you?",
    saveReview: "SAVE REVIEW",
    submitting: "SUBMITTING...",
    guest: "Guest",
    emptyDescription: "This legendary taste is waiting to be discovered...",
  }
};

export default function ChocolateDBPage() {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang as "tr" | "en"] || translations.tr;

  const [chocolates, setChocolates] = useState<chocolate_db.Chocolate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchChocolates = async () => {
    try {
      const resp = await client.chocolate_db.listChocolates();
      setChocolates(resp.chocolates);
    } catch (err) {
      console.error("Failed to fetch chocolates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChocolates();
  }, []);

  const filteredChocolates = chocolates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] font-sans">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#4A2C2A] py-16 px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          className="absolute top-6 left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#F3E5D8]/10 hover:bg-[#F3E5D8]/20 border border-[#F3E5D8]/20 text-[#F3E5D8] transition-all cursor-pointer shadow-lg"
          title={lang === "tr" ? "Geri Dön" : "Go Back"}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-[#D4AF37] mb-4 tracking-tight drop-shadow-lg uppercase">
            ChocolateDB
          </h1>
          <p className="text-xl md:text-2xl text-[#F3E5D8] opacity-90 max-w-2xl mx-auto font-medium">
            {t.subtitle}
          </p>
          
          <div className="mt-10 max-w-xl mx-auto relative">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A2C2A] size-6" />
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-4 py-4 rounded-full border-none bg-[#F3E5D8] text-[#4A2C2A] placeholder:text-[#4A2C2A]/50 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#D4AF37] transition-all"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#D4AF37] rounded-2xl shadow-lg rotate-3">
              <TrendUp weight="bold" className="size-6 text-[#4A2C2A]" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-wider">{t.popularFlavors}</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[450px] bg-[#EEDCC5] dark:bg-[#2A1812] animate-pulse rounded-[2.5rem]"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredChocolates.map((choco) => (
              <ChocolateCard key={choco.id} choco={choco} onReview={fetchChocolates} lang={lang} />
            ))}
          </div>
        )}

        {!loading && filteredChocolates.length === 0 && (
          <div className="text-center py-32 bg-[#EEDCC5] dark:bg-[#2A1812] rounded-[3rem] border-4 border-dashed border-[#4A2C2A]/10">
            <p className="text-3xl opacity-40 font-black uppercase">{t.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChocolateCard({ choco, onReview, lang }: { choco: chocolate_db.Chocolate, onReview: () => void, lang: string }) {
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.addReview({
        chocolate_id: choco.id,
        rating,
        comment,
        reviewer_name: t.guest
      });
      setShowModal(false);
      setRating(0);
      setComment("");
      onReview();
    } catch (err) {
      console.error("Failed to add review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chocoDesc = (lang === "tr" ? choco.description_tr : (choco.description_en || choco.description_tr)) || t.emptyDescription;

  return (
    <>
      <div className="group relative bg-white dark:bg-[#2A1812] rounded-[2.5rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(74,44,42,0.3)] transition-all duration-500 hover:-translate-y-3 flex flex-col h-full">
        {/* Image Container */}
        <div className="aspect-[4/5] relative overflow-hidden">
          <img 
            src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
            alt={choco.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4A2C2A] via-transparent to-transparent opacity-80"></div>
          
          <div className="absolute top-5 left-5">
            <span className="bg-[#D4AF37] text-[#4A2C2A] font-black text-xs px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
              {choco.brand}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <h3 className="text-3xl font-black mb-2 drop-shadow-2xl tracking-tighter uppercase leading-none">{choco.name}</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[#D4AF37]">
                <Star weight="fill" className="size-5" />
                <span className="text-2xl font-black">{choco.avg_rating.toFixed(1)}</span>
              </div>
              <div className="h-4 w-[2px] bg-white/20"></div>
              <div className="flex items-center gap-1.5 text-white/80 text-sm font-bold uppercase tracking-wide">
                <ChatTeardropText weight="fill" className="size-5" />
                <span>{choco.review_count} {t.reviewsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col flex-grow">
          <p className="text-sm opacity-70 line-clamp-3 mb-8 font-medium leading-relaxed italic flex-grow">
            "{chocoDesc}"
          </p>
          
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-white dark:text-[#4A2C2A] hover:opacity-90 rounded-2xl font-black py-5 flex items-center justify-center gap-2 group/btn transition-all uppercase tracking-widest text-sm shadow-xl"
          >
            {t.rateReview}
            <CaretRight weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#4A2C2A]/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#FDF5E6] dark:bg-[#1A0F0A] w-full max-w-lg rounded-[3rem] p-10 shadow-3xl overflow-hidden">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 p-2 hover:bg-[#4A2C2A]/5 rounded-full transition-colors"
            >
              <X weight="bold" className="size-6 text-[#4A2C2A]" />
            </button>

            <h2 className="text-3xl font-black text-[#4A2C2A] dark:text-[#D4AF37] uppercase mb-8 pr-12">
              {t.rateTitle} {choco.name}
            </h2>

            <div className="space-y-8">
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-all hover:scale-125"
                  >
                    <Star 
                      weight={rating >= star ? "fill" : "regular"} 
                      className={`size-12 ${rating >= star ? "text-[#D4AF37]" : "text-[#4A2C2A]/20 dark:text-white/10"}`} 
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder={t.commentPlaceholder}
                className="w-full rounded-[2rem] border-2 border-[#4A2C2A]/10 bg-white dark:bg-white/5 dark:text-white p-6 min-h-[150px] focus:outline-none focus:border-[#D4AF37] transition-colors text-lg"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              />

              <button 
                onClick={handleSubmitReview} 
                disabled={isSubmitting || rating === 0}
                className="w-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-white dark:text-[#4A2C2A] py-6 rounded-[2rem] font-black text-lg shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 uppercase tracking-widest"
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
