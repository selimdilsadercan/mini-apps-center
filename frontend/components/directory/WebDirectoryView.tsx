"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  X,
  Sparkle,
  Storefront,
  User,
  ArrowSquareOut,
  Wrench,
  Compass,
  GameController,
  CreditCard,
  GraduationCap,
  Question,
  CaretDown,
  CaretRight,
  Globe,
  DeviceMobile,
} from "@phosphor-icons/react";
import { MINI_APPS, BUSINESS_APPS, MiniApp, getAppHref } from "@/lib/apps";

export type DirectoryMode = "b2c" | "b2b";

export default function WebDirectoryView() {
  const [mode, setMode] = useState<DirectoryMode>("b2c");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // List of highlighted web-first utility tool IDs
  const WEB_UTILITY_IDS = [
    "pdf-tools",
    "store-preview",
    "icon-export",
    "tasket",
    "tournament-manager",
    "icon-set-guide",
    "daily-weather",
  ];

  // Base list depending on mode
  const currentAppList = useMemo(() => {
    if (mode === "b2b") {
      return BUSINESS_APPS.filter((a) => a.isImplemented && !a.isCancelled);
    }
    return MINI_APPS.filter((a) => a.isImplemented && !a.isCancelled);
  }, [mode]);

  // Dynamic Categories based on mode
  const categories = useMemo(() => {
    if (mode === "b2b") {
      return [
        { id: "all", label: "Tüm İşletme Araçları", icon: Storefront },
        { id: "menu", label: "Menü & Sipariş", icon: Wrench },
        { id: "crm", label: "Müşteri & CRM", icon: User },
        { id: "events", label: "Etkinlik & Topluluk", icon: Compass },
      ];
    }
    return [
      { id: "all", label: "Tüm Uygulamalar", icon: Sparkle },
      { id: "tools", label: "🛠️ Web & Pratik Araçlar", icon: Wrench },
      { id: "explore", label: "📍 Şehrini Keşfet", icon: Compass },
      { id: "hobby", label: "🎮 Eğlence & Hobi", icon: GameController },
      { id: "wallet", label: "💼 Finans & Cüzdan", icon: CreditCard },
      { id: "life", label: "🎓 Kampüs & Yaşam", icon: GraduationCap },
    ];
  }, [mode]);

  // Filtering logic
  const filteredApps = useMemo(() => {
    return currentAppList.filter((app) => {
      // Search query filter
      const matchesSearch =
        searchQuery.trim() === "" ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory === "all") return true;

      if (mode === "b2c") {
        if (selectedCategory === "tools") {
          return app.category === "Pratik Araçlar" || WEB_UTILITY_IDS.includes(app.id);
        }
        if (selectedCategory === "explore") return app.category === "Şehrini Keşfet";
        if (selectedCategory === "hobby") return app.category === "Eğlence & Hobi";
        if (selectedCategory === "wallet") return app.category === "Finans & Tasarruf";
        if (selectedCategory === "life") return app.category === "Kampüslülere Özel";
      }

      return true;
    });
  }, [currentAppList, searchQuery, selectedCategory, mode]);

  // Web Utility Highlights (for B2C mode)
  const webUtilityTools = useMemo(() => {
    return MINI_APPS.filter(
      (a) => WEB_UTILITY_IDS.includes(a.id) && a.isImplemented && !a.isCancelled
    );
  }, []);

  const faqs = [
    {
      q: "Bu web araçlarını kullanmak için üye olmak gerekiyor mu?",
      a: "Hayır! PDF Düzenleyici, Store Preview, Icon Exporter gibi birçok web aracımızı üye olmadan, doğrudan tarayıcınızda anında kullanabilirsiniz.",
    },
    {
      q: "Mobil uygulama ile web araçları arasındaki fark nedir?",
      a: "Mobil uygulamamız (my.allminiapps.com / Android APK) günlük yaşamınızı, ev işlerinizi, spor ve ajandanızı takip etmek için kurgulanmıştır. Web araçlarımız ise tarayıcı başında hızlıca halletmek istediğiniz pratik işler ve işletme yönetimi içindir.",
    },
    {
      q: "İşletmem için QR Menü veya Müdavim Kartı nasıl oluşturabilirim?",
      a: "Üstteki 'İşletmeler İçin' sekmesine geçip Dijital Menü veya Müdavim Kartı uygulamasını seçerek birkaç dakika içinde işletme profilinizi ve menünüzü oluşturabilirsiniz.",
    },
    {
      q: "Uygulamalar ücretsiz mi?",
      a: "Bireysel araçlarımızın ve temel işletme çözümlerimizin tamamı ücretsizdir.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 font-sans pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Tag */}
          <div className="flex items-center gap-3">
            <a
              href="/directory"
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                ✦
              </div>
              <div>
                <span className="font-black text-lg tracking-tight uppercase text-gray-900 block leading-none">
                  Everything
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">
                  Web App Directory
                </span>
              </div>
            </a>
          </div>

          {/* Mode Switcher: B2C vs B2B */}
          <div className="inline-flex p-1 bg-gray-100 rounded-2xl border border-gray-200/80">
            <button
              onClick={() => {
                setMode("b2c");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "b2c"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <User size={14} weight="bold" />
              <span>Bireysel Araçlar</span>
            </button>
            <button
              onClick={() => {
                setMode("b2b");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "b2b"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Storefront size={14} weight="bold" />
              <span>İşletmeler İçin</span>
            </button>
          </div>

          {/* Direct link to Login / Hub */}
          <a
            href="https://my.allminiapps.com"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <span>Kişisel Hub'a Git</span>
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-10">
        {/* Banner Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            <Sparkle size={14} weight="fill" />
            <span>
              {mode === "b2c"
                ? "Tüm Günlük Araçlar ve Uygulama Kataloğu"
                : "İşletmenizi Büyütecek Dijital Çözümler"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight uppercase">
            {mode === "b2c" ? (
              <>
                Web'de Anında Açılan <br className="hidden sm:inline" />
                <span className="text-indigo-600">Mikro Uygulamalar</span>
              </>
            ) : (
              <>
                İşletmeniz İçin <br className="hidden sm:inline" />
                <span className="text-indigo-600">Dijital QR & Sadakat Sistemleri</span>
              </>
            )}
          </h1>

          <p className="text-gray-600 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
            {mode === "b2c"
              ? "Giriş yapma zorunluluğu olmadan tarayıcınızda hemen kullanabileceğiniz pratik web araçları, şehir rehberleri ve hobi uygulamaları."
              : "Kafeniz, restoranınız veya işletmeniz için komisyonsuz QR menü, dijital müdavim kartı ve müşteri yönetim araçları."}
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={18}
                className="absolute left-4 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  mode === "b2c"
                    ? "Uygulama veya araç ara... (Örn: PDF, Store, Mekan, Turnuva)"
                    : "İşletme aracı ara... (Örn: Menü, Müdavim, CRM)"
                }
                className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl border border-gray-200 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Web Utility Tools Highlight Section (B2C Mode Only) */}
        {mode === "b2c" && searchQuery === "" && selectedCategory === "all" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-600" />
                <span>Web'de Anında Çalışan Öne Çıkan Araçlar</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {webUtilityTools.map((app) => {
                const Icon = app.icon;
                const href = getAppHref(app);
                return (
                  <a
                    key={`highlight-${app.id}`}
                    href={href}
                    className="group bg-white p-4 rounded-2xl border border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: app.color }}
                        >
                          <Icon size={20} weight="fill" />
                        </div>
                      </div>
                      <h3 className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      <span>{app.cta || "Aracı Aç"}</span>
                      <ArrowSquareOut size={14} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
              {mode === "b2c" ? "Tüm Uygulama Kataloğu" : "İşletme Çözümleri"} ({filteredApps.length})
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const CatIcon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200/80 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <CatIcon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main App Grid */}
        <section>
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <MagnifyingGlass size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900">Aradığınız uygulama bulunamadı</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Farklı bir arama terimi deneyebilir veya kategorileri sıfırlayabilirsiniz.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredApps.map((app) => {
                  const Icon = app.icon;
                  const href = getAppHref(app);

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={app.id}
                      className="group bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
                            style={{ backgroundColor: app.color }}
                          >
                            <Icon size={22} weight="fill" />
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {app.category}
                        </div>
                        <h3 className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                        <a
                          href={href}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs group-hover:shadow-md active:scale-95"
                        >
                          <span>{app.cta || "Uygulamayı Aç"}</span>
                          <ArrowSquareOut size={14} />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* FAQ Accordion Section (SEO Rich Snippets) */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <Question size={20} className="text-indigo-600" weight="bold" />
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-100 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-gray-900 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <CaretDown size={16} className="text-indigo-600 shrink-0" />
                  ) : (
                    <CaretRight size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-xs font-medium text-gray-600 leading-relaxed bg-gray-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SEO Text Block */}
        <footer className="text-center pt-8 border-t border-gray-200/60 text-xs text-gray-500 font-medium space-y-2">
          <p className="max-w-2xl mx-auto leading-relaxed">
            <strong>Everything Web App Directory:</strong> PDF araçlarından App Store ekran görüntüsü hazırlayıcıya, kafe QR menülerinden şehir rehberlerine kadar tüm dijital ihtiyaçlarınız için geliştirilmiş mikro web uygulamaları kataloğu.
          </p>
          <p>© 2026 Everything Center. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
