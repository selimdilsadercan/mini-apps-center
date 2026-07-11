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
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 font-sans pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 py-3 max-w-lg mx-auto w-full flex items-center gap-2">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            title={lang === "tr" ? "Geri Dön" : "Go Back"}
          >
            <ArrowLeft size={14} weight="bold" className="text-amber-700" />
          </button>

          <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 truncate">
            ChocolateDB
          </h1>
        </div>

        {/* Tabs + Search row */}
        <div className="px-4 pb-3 max-w-lg mx-auto w-full flex flex-col gap-2">
          {/* Tabs */}
          <div className="flex">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
              <button
                onClick={() => {/* already on discover */}}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all outline-none bg-white text-gray-900 shadow-sm`}
              >
                <MagnifyingGlass size={13} weight="bold" className="text-amber-700" />
                <span className="normal-case">{lang === "tr" ? "Keşfet" : "Discover"}</span>
              </button>
              <button
                onClick={() => router.push("/apps/chocolate-db/saved")}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all outline-none text-gray-500 hover:text-gray-700`}
              >
                <BookmarkSimple size={13} weight="bold" className="text-gray-400" />
                <span className="normal-case">{lang === "tr" ? "Listelerim" : "My Lists"}</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200/80 bg-gray-50/80 text-gray-900 placeholder:text-gray-400 text-sm shadow-sm focus:outline-none focus:border-amber-300 transition-all"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar -mx-5 px-5">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
              selectedCategory === ""
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
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
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-gray-900 text-white border-gray-900 shadow-md"
                      : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  {cat} ({counts[cat]})
                </button>
              ));
          })()}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-white border border-gray-100 animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {filteredChocolates.map((choco) => (
                <ChocolateCard key={choco.id} choco={choco} onReview={() => fetchChocolates(1, searchQuery, true)} lang={lang} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-4 rounded-2xl bg-white border border-gray-100 text-gray-900 text-[11px] font-[1000] uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  {loadingMore ? (
                    <>
                      <div className="size-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
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
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t.noResults}</p>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        title="ChocolateDB"
        subtitle="Çikolataları puanlamak ve yorumlamak için giriş yapmalısınız."
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
      className="group relative bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-all flex flex-col h-full cursor-pointer no-underline"
    >
      {/* Image Container */}
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

      {/* Content */}
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
    </Link>
  );
}
