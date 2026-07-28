"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Sun,
  Moon,
} from "@phosphor-icons/react";
import { MINI_APPS, BUSINESS_APPS, getAppHref } from "@/lib/apps";

export type DirectoryMode = "b2c" | "b2b";
type DirectoryTheme = "light" | "dark";

const WEB_UTILITY_IDS = [
  "pdf-tools",
  "store-preview",
  "icon-export",
  "tasket",
  "tournament-manager",
  "icon-set-guide",
  "daily-weather",
];

export default function WebDirectoryView() {
  const [mode, setMode] = useState<DirectoryMode>("b2c");
  const [theme, setTheme] = useState<DirectoryTheme>("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("directory-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("directory-theme", next);
      return next;
    });
  };

  const currentAppList = useMemo(() => {
    if (mode === "b2b") {
      return BUSINESS_APPS.filter((a) => a.isImplemented && !a.isCancelled);
    }
    return MINI_APPS.filter((a) => a.isImplemented && !a.isCancelled);
  }, [mode]);

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

  const filteredApps = useMemo(() => {
    return currentAppList.filter((app) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
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
    <div
      className={`min-h-screen font-sans pb-24 bg-[#FAF9F7] text-gray-900 dark:bg-[#0a0a0c] dark:text-zinc-100 ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                ✦
              </div>
              <div>
                <span className="font-black text-lg tracking-tight uppercase text-gray-900 dark:text-white block leading-none">
                  Everything
                </span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none">
                  Web App Directory
                </span>
              </div>
            </a>
          </div>

          <div className="inline-flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800">
            <button
              onClick={() => {
                setMode("b2c");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "b2c"
                  ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200"
              }`}
            >
              <User size={14} weight="bold" />
              <span className="hidden sm:inline">Bireysel Araçlar</span>
              <span className="sm:hidden">Bireysel</span>
            </button>
            <button
              onClick={() => {
                setMode("b2b");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === "b2b"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-200"
              }`}
            >
              <Storefront size={14} weight="bold" />
              <span className="hidden sm:inline">İşletmeler İçin</span>
              <span className="sm:hidden">İşletme</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              aria-label={theme === "dark" ? "Açık mod" : "Koyu mod"}
            >
              {theme === "dark" ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
            <a
              href="https://my.allminiapps.com"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-gray-800 dark:hover:bg-zinc-100 transition-all shadow-sm active:scale-95"
            >
              <span>Kişisel Hub&apos;a Git</span>
              <ArrowSquareOut size={14} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-10">
        <section className="max-w-xl mx-auto">
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 text-gray-400 dark:text-zinc-500 pointer-events-none"
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
              className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 p-1 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        {mode === "b2c" && searchQuery === "" && selectedCategory === "all" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-500 flex items-center gap-1.5">
                <Globe size={14} className="text-teal-600 dark:text-teal-400" />
                <span>Web&apos;de Anında Çalışan Öne Çıkan Araçlar</span>
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
                    className="group bg-white dark:bg-zinc-900/50 p-4 rounded-2xl border border-teal-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                      <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {app.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                      <span>{app.cta || "Aracı Aç"}</span>
                      <ArrowSquareOut size={14} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-zinc-500">
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
                      ? "bg-gray-900 dark:bg-white text-white dark:text-zinc-950 border-gray-900 dark:border-white shadow-sm"
                      : "bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border-gray-200/80 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <CatIcon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900/50 rounded-3xl border border-gray-200/80 dark:border-zinc-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                <MagnifyingGlass size={24} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Aradığınız uygulama bulunamadı</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mx-auto">
                Farklı bir arama terimi deneyebilir veya kategorileri sıfırlayabilirsiniz.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="group bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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

                        <div className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                          {app.category}
                        </div>
                        <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-1 line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <a
                          href={href}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-900 dark:bg-teal-600 hover:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs group-hover:shadow-md active:scale-95"
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

        <section className="bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <Question size={20} className="text-teal-600 dark:text-teal-400" weight="bold" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Sıkça Sorulan Sorular
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-gray-900 dark:text-white flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <CaretDown size={16} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  ) : (
                    <CaretRight size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-xs font-medium text-gray-600 dark:text-zinc-400 leading-relaxed bg-gray-50/50 dark:bg-zinc-900/50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center pt-8 border-t border-gray-200/60 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-500 font-medium space-y-2">
          <p className="max-w-2xl mx-auto leading-relaxed">
            <strong className="text-gray-700 dark:text-zinc-300">Everything Web App Directory:</strong> PDF
            araçlarından App Store ekran görüntüsü hazırlayıcıya, kafe QR menülerinden şehir rehberlerine kadar
            tüm dijital ihtiyaçlarınız için geliştirilmiş mikro web uygulamaları kataloğu.
          </p>
          <p>© 2026 Everything Center. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
