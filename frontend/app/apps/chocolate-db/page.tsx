"use client";

import React, { useEffect, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { chocolate_db } from "@/lib/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";
import { AuthModal } from "@/components/auth/AuthModal";
import ChocolateDBShell from "./components/ChocolateDBShell";
import ChocolateListItem from "./components/ChocolateListItem";
import { DiscoverPageSkeleton } from "./components/ChocolateListSkeleton";

const client = createBrowserClient();

const translations = {
  tr: {
    searchPlaceholder: "Çikolata veya marka ara...",
    noResults: "Arşivde bulunamadı...",
    loginRequired: "Lütfen önce giriş yapın.",
    all: "Tümü",
    loadMore: "Daha Fazla Yükle",
    loading: "Yükleniyor...",
    listed: "çikolata",
  },
  en: {
    searchPlaceholder: "Search chocolate or brand...",
    noResults: "Not found in archive...",
    loginRequired: "Please log in first.",
    all: "All",
    loadMore: "Load More",
    loading: "Loading...",
    listed: "chocolates",
  },
};

export default function ChocolateDBPage() {
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const LIMIT = 24;

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
        query,
      });

      if (isNewSearch || pageNum === 1) {
        setChocolates(resp.chocolates);
      } else {
        setChocolates((prev) => [...prev, ...resp.chocolates]);
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

  const filteredChocolates = chocolates.filter((c) => {
    return !selectedCategory || c.category === selectedCategory;
  });

  const categoryCounts: Record<string, number> = {};
  chocolates.forEach((c) => {
    if (c.category) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }
  });
  const categories = Array.from(
    new Set(chocolates.map((c) => c.category).filter(Boolean) as string[])
  ).sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));

  const filterClass = (active: boolean) =>
    `shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ChocolateDB",
    description:
      "Dünyanın en büyük çikolata arşivi ve puanlama platformu. Çokonat, Tadelle ve daha fazlası.",
    url: "https://allminiapps.com/apps/chocolate-db",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    author: {
      "@type": "Organization",
      name: "Everything Mini Apps Center",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
  };

  if (loading && chocolates.length === 0) {
    return (
      <ChocolateDBShell activeTab="discover">
        <DiscoverPageSkeleton />
      </ChocolateDBShell>
    );
  }

  return (
    <ChocolateDBShell activeTab="discover">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-2xl py-3 pl-11 pr-4 text-xs font-bold focus:outline-none focus:border-app-muted transition-all text-app-text placeholder-app-muted shadow-sm"
          />
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted" size={18} />
        </div>

        {categories.length > 0 && (
          <section className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-app-muted tracking-widest px-1 uppercase">
              {lang === "tr" ? "Kategoriler" : "Categories"}
            </span>
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className={filterClass(selectedCategory === "")}
              >
                {t.all}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={filterClass(selectedCategory === cat)}
                >
                  {cat} ({categoryCounts[cat]})
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-app-muted">
            {filteredChocolates.length} {t.listed}
          </span>
        </div>

        {filteredChocolates.length === 0 ? (
          <div className="text-center py-12 bg-app-surface border border-app-border rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-app-muted">{t.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredChocolates.map((choco) => (
              <ChocolateListItem
                key={choco.id}
                choco={choco}
                loginRequired={t.loginRequired}
                onUpdate={() => fetchChocolates(1, searchQuery, true)}
              />
            ))}
          </div>
        )}

        {hasMore && filteredChocolates.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 rounded-2xl bg-app-surface border border-app-border text-app-text text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-app-surface-muted transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              {loadingMore ? (
                <>
                  <div className="size-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.loadMore
              )}
            </button>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        title="ChocolateDB"
        subtitle="Çikolataları puanlamak ve yorumlamak için giriş yapmalısınız."
      />
    </ChocolateDBShell>
  );
}
