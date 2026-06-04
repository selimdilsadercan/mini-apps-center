"use client";
import { getRootHomeUrl } from "@/lib/apps";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { 
  Sparkle, 
  ArrowLeft, 
  Cards, 
  FilmReel, 
  Cookie, 
  Smiley, 
  ArrowRight,
  Shuffle,
  SquaresFour,
  List
} from "@phosphor-icons/react";
import Link from "next/link";

// Curated data imports
import { CURATED_SUGGESTIONS, CuratedSuggestion } from "./suggestions_data";

interface Suggestion {
  category: string;
  title: string;
  description: string;
  icon: string;
  link?: string;
  linkLabel?: string;
}

export default function StopScrollPage() {
  const { locale } = useLanguage();
  const t = useTranslations("stopScroll");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [viewMode, setViewMode] = useState<"random" | "all">("random");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    const cats = new Set<string>();
    CURATED_SUGGESTIONS.forEach(s => cats.add(s.category));
    return Array.from(cats);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getNewSuggestion = () => {
    setIsShuffling(true);
    
    setTimeout(() => {
      const randomCurated = CURATED_SUGGESTIONS[Math.floor(Math.random() * CURATED_SUGGESTIONS.length)];
      
      const selected: Suggestion = {
        category: randomCurated.category,
        title: locale === "tr" ? randomCurated.titleTr : randomCurated.titleEn,
        description: locale === "tr" ? randomCurated.descTr : randomCurated.descEn,
        icon: randomCurated.icon,
        link: randomCurated.link,
        linkLabel: locale === "tr" ? randomCurated.linkLabelTr : randomCurated.linkLabelEn,
      };

      setSuggestion(selected);
      setIsShuffling(false);
      setViewMode("random");
    }, 600);
  };

  useEffect(() => {
    getNewSuggestion();
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 mb-8">
        <Link 
          href={getRootHomeUrl()} 
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors duration-200"
        >
          <ArrowLeft size={20} weight="bold" />
          <span className="text-sm font-bold">{locale === "tr" ? "Ana Sayfa" : "Home"}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode(viewMode === "random" ? "all" : "random")}
            className="flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full text-xs font-bold text-gray-600 shadow-sm hover:bg-white transition-all"
          >
            {viewMode === "random" ? (
              <>
                <SquaresFour size={14} weight="bold" />
                <span>{locale === "tr" ? "Tümünü Gör" : "See All"}</span>
              </>
            ) : (
              <>
                <Shuffle size={14} weight="bold" />
                <span>{locale === "tr" ? "Öneri Al" : "Get Suggestion"}</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md border border-gray-100 rounded-full text-xs font-bold text-gray-600 shadow-sm">
            <Sparkle size={14} weight="fill" className="text-indigo-500 animate-pulse" />
            <span>{locale === "tr" ? "Ne Yapsam?" : "What to Do?"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center z-10 py-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 mb-4">
            {viewMode === "random" ? t("title") : (locale === "tr" ? "Tüm Aktiviteler" : "All Activities")}
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
            {viewMode === "random" ? t("subtitle") : (locale === "tr" ? "Kategorilere göre tüm aktivite seçeneklerimiz." : "All our activity options by category.")}
          </p>
        </div>

        {viewMode === "random" ? (
          <div className="w-full flex flex-col items-center">
            {/* Suggestion Card */}
            <div className={`w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white shadow-2xl shadow-indigo-100/50 rounded-[2.5rem] p-8 md:p-10 transition-all duration-500 transform ${
              isShuffling ? "opacity-50 scale-95 rotate-1" : "opacity-100 scale-100 rotate-0"
            }`}>
              {suggestion && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner text-4xl">
                    {suggestion.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-black mb-3">
                    {t(`categories.${suggestion.category}`)}
                  </span>
                  <h2 className="text-2xl font-black mb-4 text-gray-900 leading-tight">
                    {suggestion.title}
                  </h2>
                  <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-8 font-medium max-w-sm">
                    {suggestion.description}
                  </p>

                  {suggestion.link && (
                    <Link
                      href={suggestion.link}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-colors duration-200"
                    >
                      <span>{suggestion.linkLabel}</span>
                      <ArrowRight size={18} weight="bold" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={getNewSuggestion}
              disabled={isShuffling}
              className="mt-12 flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none group"
            >
              <Shuffle size={24} weight="bold" className={isShuffling ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
              <span className="text-lg">{t("buttonText")}</span>
            </button>
          </div>
        ) : (
          <div className="w-full space-y-12 pb-12">
            {categories.map(category => {
              const categoryItems = CURATED_SUGGESTIONS.filter(s => s.category === category);
              const isExpanded = expandedCategories[category];
              const visibleItems = isExpanded ? categoryItems : categoryItems.slice(0, 4);
              const hasMore = categoryItems.length > 4;

              return (
                <section key={category} className="w-full">
                  <h2 className="text-xl font-black text-gray-900 mb-6 px-2 flex items-center gap-3">
                    <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm">
                      {categoryItems[0]?.icon}
                    </span>
                    {t(`categories.${category}`)}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleItems.map(item => (
                      <div 
                        key={item.id}
                        className="bg-white/60 backdrop-blur-sm border border-white rounded-3xl p-5 hover:border-indigo-100 hover:bg-white transition-all group cursor-pointer"
                        onClick={() => {
                          const selected: Suggestion = {
                            category: item.category,
                            title: locale === "tr" ? item.titleTr : item.titleEn,
                            description: locale === "tr" ? item.descTr : item.descEn,
                            icon: item.icon,
                            link: item.link,
                            linkLabel: locale === "tr" ? item.linkLabelTr : item.linkLabelEn,
                          };
                          setSuggestion(selected);
                          setViewMode("random");
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 group-hover:bg-indigo-50 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1 truncate">
                              {locale === "tr" ? item.titleTr : item.titleEn}
                            </h3>
                            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 font-medium">
                              {locale === "tr" ? item.descTr : item.descEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {hasMore && (
                    <button
                      onClick={() => toggleCategory(category)}
                      className="mt-6 w-full py-4 bg-white/40 hover:bg-white/60 border border-white/60 rounded-2xl text-sm font-bold text-indigo-600 transition-all active:scale-[0.98]"
                    >
                      {isExpanded 
                        ? (locale === "tr" ? "Daha Az Göster" : "Show Less") 
                        : (locale === "tr" ? `Daha Fazla Göster (${categoryItems.length - 4}+)` : `Show More (${categoryItems.length - 4}+)`)
                      }
                    </button>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] font-bold text-gray-300 tracking-widest uppercase z-10 mt-8">
        &copy; {new Date().getFullYear()} Everything OS • Ne Yapsam?
      </footer>
    </div>
  );
}


