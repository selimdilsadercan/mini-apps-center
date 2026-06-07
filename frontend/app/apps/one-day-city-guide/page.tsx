"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Compass, 
  MapPin, 
  CaretRight, 
  ArrowLeft,
  Info
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { getAppRootUrl } from "@/lib/apps";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { CITY_GUIDES } from "./data";

export default function CityGuidePage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("oneDayCityGuide");
  const cities = Object.values(CITY_GUIDES);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = getAppRootUrl())}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">One Day City Guide</h1>
          </div>
          <Compass size={24} weight="duotone" className="text-teal-600" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="bg-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-900/10 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">
                {locale === 'tr' ? 'Şehri Bir Günde Keşfet' : 'Discover the City in a Day'}
              </h2>
              <p className="text-teal-50/90 text-sm leading-relaxed">
                {locale === 'tr' 
                  ? 'Kısıtlı zamanın mı var? En iyi rotalar, yerel lezzetler ve gizli kalmış mekanlarla dolu rehberlerimizle gününü planla.'
                  : 'Limited time? Plan your day with our guides full of the best routes, local flavors, and hidden gems.'}
              </p>
            </div>
            <Compass 
              size={120} 
              weight="duotone" 
              className="absolute -right-8 -bottom-8 text-teal-600/20 rotate-12" 
            />
          </div>
        </section>

        {/* City List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={20} weight="fill" className="text-teal-600" />
              {locale === 'tr' ? 'Şehirler' : 'Cities'}
            </h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
              {cities.length} {locale === 'tr' ? 'Şehir' : 'Cities'}
            </span>
          </div>

          <div className="grid gap-4">
            {cities.map((guide, index) => (
              <motion.button
                key={guide.city.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/apps/one-day-city-guide/${guide.city.id}`)}
                className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {locale === 'tr' ? guide.city.nameTr : guide.city.nameEn}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {locale === 'tr' ? guide.city.countryTr : guide.city.countryEn}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1 mb-3">
                      {locale === 'tr' ? guide.city.descriptionTr : guide.city.descriptionEn}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(locale === 'tr' ? guide.city.bestForTr : guide.city.bestForEn).slice(0, 2).map((tag) => (
                        <span 
                          key={tag} 
                          className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {(locale === 'tr' ? guide.city.bestForTr : guide.city.bestForEn).length > 2 && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          +{(locale === 'tr' ? guide.city.bestForTr : guide.city.bestForEn).length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-teal-50 transition-colors">
                    <CaretRight size={20} weight="bold" className="text-slate-400 group-hover:text-teal-600" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Coming Soon / Info */}
        <section className="mt-12 p-6 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Info size={24} weight="bold" className="text-slate-400" />
          </div>
          <h4 className="font-bold text-slate-800 mb-1">
            {locale === 'tr' ? 'Yeni Şehirler Yolda' : 'New Cities Coming Soon'}
          </h4>
          <p className="text-sm text-slate-500 max-w-[280px]">
            {locale === 'tr' 
              ? 'Ekibimiz yeni şehir rotaları üzerinde çalışıyor. Yakında İstanbul, İzmir ve daha fazlası burada olacak.'
              : 'Our team is working on new city routes. Istanbul, Izmir and more will be here soon.'}
          </p>
        </section>
      </main>
    </div>
  );
}
