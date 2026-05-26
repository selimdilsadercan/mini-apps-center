"use client";

import React, { useState, useEffect } from "react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { 
  Sparkle, 
  ArrowLeft, 
  Cards, 
  FilmReel, 
  Cookie, 
  Smiley, 
  ArrowRight,
  Shuffle
} from "@phosphor-icons/react";
import Link from "next/link";

// Curated data imports
import { CURATED_SUGGESTIONS, CuratedSuggestion } from "./suggestions_data";

interface Suggestion {
  category: "game" | "chocolate" | "movie" | "activity";
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  linkLabel?: string;
}

export default function StopScrollPage() {
  const { locale } = useLanguage();
  const t = useTranslations("stopScroll");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  const getNewSuggestion = () => {
    setIsShuffling(true);
    
    setTimeout(() => {
      // Pick a random suggestion from the curated 100 items list
      const randomCurated = CURATED_SUGGESTIONS[Math.floor(Math.random() * CURATED_SUGGESTIONS.length)];
      
      const selected: Suggestion = {
        category: randomCurated.category,
        title: locale === "tr" ? randomCurated.titleTr : randomCurated.titleEn,
        description: locale === "tr" ? randomCurated.descTr : randomCurated.descEn,
        link: randomCurated.link,
        linkLabel: locale === "tr" ? randomCurated.linkLabelTr : randomCurated.linkLabelEn,
        imageUrl: randomCurated.imageUrl
      };

      setSuggestion(selected);
      setIsShuffling(false);
    }, 600);
  };

  useEffect(() => {
    getNewSuggestion();
  }, [locale]);

  const getIcon = (category: Suggestion["category"]) => {
    switch (category) {
      case "game":
        return <Cards size={32} className="text-red-500" />;
      case "chocolate":
        return <Cookie size={32} className="text-amber-600" />;
      case "movie":
        return <FilmReel size={32} className="text-blue-500" />;
      case "activity":
        return <Smiley size={32} className="text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden select-none">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <Link 
          href="/home" 
          className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">{locale === "tr" ? "Ana Sayfa" : "Home"}</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-xs text-slate-400">
          <Sparkle size={14} className="text-amber-500 animate-pulse" />
          <span>Stop Scrolling</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-lg my-auto flex flex-col items-center justify-center z-10 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-amber-400 to-blue-400 mb-3">
            {t("title")}
          </h1>
          <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Suggestion Card */}
        <div className={`w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl transition-all duration-500 transform ${
          isShuffling ? "opacity-50 scale-95 rotate-1" : "opacity-100 scale-100 rotate-0"
        }`}>
          {suggestion && (
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6 shadow-inner">
                {getIcon(suggestion.category)}
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                {t(`categories.${suggestion.category}`)}
              </span>
              <h2 className="text-2xl font-bold mb-4 text-slate-100">
                {suggestion.title}
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
                {suggestion.description}
              </p>

              {suggestion.imageUrl && (
                <div className="w-full max-w-[200px] aspect-[2/3] relative rounded-2xl overflow-hidden mb-6 border border-slate-800 shadow-md">
                  <img 
                    src={suggestion.imageUrl} 
                    alt={suggestion.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {suggestion.link && (
                <Link
                  href={suggestion.link}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors duration-200"
                >
                  <span>{suggestion.linkLabel}</span>
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={getNewSuggestion}
          disabled={isShuffling}
          className="mt-8 flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 text-slate-950 rounded-full font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Shuffle size={20} className={isShuffling ? "animate-spin" : ""} />
          <span>{t("buttonText")}</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-600 z-10">
        &copy; {new Date().getFullYear()} Everything OS. Make today count.
      </footer>
    </div>
  );
}
