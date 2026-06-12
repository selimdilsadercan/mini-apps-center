"use client";
import { getAppRootUrl } from "@/lib/apps";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/api";
import Client, { chocolate_db } from "@/lib/client";
import { 
  Star, 
  MagnifyingGlass,
  X,
  ArrowLeft,
  Check,
  BookmarkSimple,
  Prohibit
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";
import { AuthModal } from "@/components/auth/AuthModal";

const client = createBrowserClient();

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
    deleteReview: "Değerlendirmeyi Sil",
    submitting: "Gönderiliyor...",
    guest: "Misafir",
    emptyDescription: "Bu efsane lezzet henüz keşfedilmeyi bekliyor...",
    tried: "Denedim",
    wishlist: "Denemek İstiyorum",
    dislike: "Engelle / Gizle",
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
    deleteReview: "Delete Rating",
    submitting: "Submitting...",
    guest: "Guest",
    emptyDescription: "This legendary taste is waiting to be discovered...",
    tried: "Tried",
    wishlist: "Wishlist",
    dislike: "Block / Hide",
    loginRequired: "Please log in first."
  }
};

export default function ChocolateDBPage() {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user, isLoaded: isUserLoaded } = useUser();

  const [chocolates, setChocolates] = useState<chocolate_db.Chocolate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const LIMIT = 24;

  // Check auth on mount
  useEffect(() => {
    if (isUserLoaded && !user) {
      setShowAuthModal(true);
    }
  }, [isUserLoaded, user]);

  const fetchChocolates = async (pageNum = 1, query = "", isNewSearch = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const resp = await client.chocolate_db.listChocolates({ 
        userId: user?.id || "",
        page: pageNum,
        limit: LIMIT,
        query: query
      });

      if (isNewSearch || pageNum === 1) {
        setChocolates(resp.chocolates);
      } else {
        setChocolates(prev => [...prev, ...resp.chocolates]);
      }

      setHasMore(resp.chocolates.length === LIMIT);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch chocolates:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChocolates(1, searchQuery, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchChocolates(page + 1, searchQuery);
    }
  };

  const [selectedCategory, setSelectedCategory] = useState("");

  // Server-side filtered already, but we still have category filter on client for now
  // or we could move category to server too. For now let's keep client category filter
  // but search is server-side.
  const filteredChocolates = chocolates.filter(c => {
    const matchesCategory = !selectedCategory || c.category === selectedCategory;
    return matchesCategory;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ChocolateDB",
    "description": "Dünyanın en büyük çikolata arşivi ve puanlama platformu. Çokonat, Tadelle ve daha fazlası.",
    "url": "https://allminiapps.com/apps/chocolate-db",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "All",
    "author": {
      "@type": "Organization",
      "name": "Everything Mini Apps Center"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "TRY"
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#4A2C2A] pt-20 pb-12 px-4 sm:px-6 md:py-16 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => window.location.href = getAppRootUrl()}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#F3E5D8]/10 hover:bg-[#F3E5D8]/20 border border-[#F3E5D8]/20 text-[#F3E5D8] transition-all cursor-pointer shadow-lg"
          title={lang === "tr" ? "Geri Dön" : "Go Back"}
        >
          <ArrowLeft size={20} weight="bold" />
        </button>

        {/* Saved Page Button */}
        <button
          onClick={() => router.push("/apps/chocolate-db/saved")}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-[#F3E5D8]/10 hover:bg-[#F3E5D8]/20 border border-[#F3E5D8]/20 text-[#F3E5D8] transition-all cursor-pointer shadow-lg text-sm font-semibold"
          title={lang === "tr" ? "Listelerim" : "My Lists"}
        >
          <BookmarkSimple size={18} weight="bold" />
          <span>{lang === "tr" ? "Listelerim" : "My Lists"}</span>
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

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              selectedCategory === ""
                ? "bg-[#4A2C2A] text-[#F3E5D8] border-[#4A2C2A] dark:bg-[#D4AF37] dark:text-[#1A0F0A] dark:border-[#D4AF37] shadow-md"
                : "bg-white dark:bg-[#2A1812] text-[#4A2C2A]/70 dark:text-[#F3E5D8]/70 border-[#4A2C2A]/10 dark:border-white/10 hover:bg-[#4A2C2A]/5"
            }`}
          >
            {lang === "tr" ? "Tümü" : "All"}
          </button>
          {(() => {
            const counts: { [key: string]: number } = {};
            chocolates.forEach(c => {
              if (c.category) {
                counts[c.category] = (counts[c.category] || 0) + 1;
              }
            });
            return Array.from(new Set(chocolates.map(c => c.category).filter(Boolean) as string[]))
              .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#4A2C2A] text-[#F3E5D8] border-[#4A2C2A] dark:bg-[#D4AF37] dark:text-[#1A0F0A] dark:border-[#D4AF37] shadow-md"
                      : "bg-white dark:bg-[#2A1812] text-[#4A2C2A]/70 dark:text-[#F3E5D8]/70 border-[#4A2C2A]/10 dark:border-white/10 hover:bg-[#4A2C2A]/5"
                  }`}
                >
                  {cat} ({counts[cat]})
                </button>
              ));
          })()}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
              <div key={i} className="aspect-[3/4] bg-[#EEDCC5] dark:bg-[#2A1812] animate-pulse rounded-xl sm:rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {filteredChocolates.map((choco) => (
                <ChocolateCard key={choco.id} choco={choco} onReview={() => fetchChocolates(1, searchQuery, true)} lang={lang} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-[#F3E5D8] dark:text-[#1A0F0A] font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                    </>
                  ) : (
                    lang === "tr" ? "Daha Fazla Yükle" : "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && filteredChocolates.length === 0 && (
          <div className="text-center py-32 bg-[#EEDCC5] dark:bg-[#2A1812] rounded-2xl sm:rounded-3xl border-4 border-dashed border-[#4A2C2A]/10">
            <p className="text-xl opacity-50 font-bold">{t.noResults}</p>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        title="ChocolateDB'ye Hoş Geldiniz"
        subtitle="Çikolataları puanlamak, yorumlamak ve kendi arşivinizi oluşturmak için giriş yapmalısınız."
      />
    </div>
  );
}

function ChocolateCard({ choco, onReview, lang }: { choco: chocolate_db.Chocolate, onReview: () => void, lang: string }) {
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user } = useUser();

  const handleStateToggle = async (e: React.MouseEvent, state: "tried" | "wishlist" | "dislike") => {
    e.preventDefault();
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
    <Link 
      href={`/apps/chocolate-db/${choco.id}`}
      className="group relative bg-white dark:bg-[#2A1812] rounded-xl sm:rounded-2xl p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full cursor-pointer border border-[#4A2C2A]/5 dark:border-white/5 no-underline"
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
            <span>{choco.avg_rating.toFixed(1)}/10</span>
          </div>
          {choco.category && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#4A2C2A]/5 dark:bg-[#D4AF37]/10 text-[#4A2C2A]/60 dark:text-[#D4AF37] w-fit">
              {choco.category}
            </span>
          )}
        </div>

        {/* Description */}
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
            <div
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
            </div>
            <div className="absolute bottom-full mb-2 opacity-0 pointer-events-none group-hover/btn:opacity-100 translate-y-1 group-hover/btn:translate-y-0 transition-all duration-200 bg-[#4A2C2A] dark:bg-[#F3E5D8] text-[#F3E5D8] dark:text-[#4A2C2A] text-[10px] font-bold py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 border border-[#D4AF37]/30">
              {choco.user_rating ? `${t.rateTitle} (${choco.user_rating} ★)` : t.rateTitle}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#4A2C2A] dark:border-t-[#F3E5D8]"></div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
