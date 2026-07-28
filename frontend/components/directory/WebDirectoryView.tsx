"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  X,
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
  UsersThree,
} from "@phosphor-icons/react";
import { MINI_APPS, BUSINESS_APPS, getAppHref, type MiniApp } from "@/lib/apps";
import { getAppDirectoryPath } from "@/lib/app-catalog";

export type DirectoryMode = "b2c" | "b2b";

type AppGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  apps: MiniApp[];
};

const B2C_GROUPS: Omit<AppGroup, "apps">[] = [
  { id: "Pratik Araçlar", label: "Pratik Araçlar", icon: Wrench },
  { id: "Şehrini Keşfet", label: "Şehrini Keşfet", icon: Compass },
  { id: "Eğlence & Hobi", label: "Eğlence & Hobi", icon: GameController },
  { id: "Finans & Tasarruf", label: "Finans & Tasarruf", icon: CreditCard },
  { id: "Kampüslülere Özel", label: "Kampüs & Yaşam", icon: GraduationCap },
  { id: "Sosyal", label: "Sosyal", icon: UsersThree },
];

const B2B_GROUPS: Omit<AppGroup, "apps">[] = [
  { id: "menu", label: "Menü & Sipariş", icon: Wrench },
  { id: "crm", label: "Müşteri & CRM", icon: User },
  { id: "events", label: "Etkinlik & Topluluk", icon: Compass },
];

const B2B_GROUP_APP_IDS: Record<string, string[]> = {
  menu: ["digital-menu"],
  crm: ["stamp-card", "feedback-board", "tutor-crm"],
  events: ["campus-events", "business-page", "board-game-clubs", "standups"],
};

interface WebDirectoryViewProps {
  /** Landing Header/Footer ile kullanıldığında true. */
  embedded?: boolean;
}

function matchesSearch(app: MiniApp, query: string) {
  if (query.trim() === "") return true;
  const q = query.toLowerCase();
  return (
    app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)
  );
}

export default function WebDirectoryView({ embedded = false }: WebDirectoryViewProps) {
  const [mode, setMode] = useState<DirectoryMode>("b2c");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const currentAppList = useMemo(() => {
    if (mode === "b2b") {
      return BUSINESS_APPS.filter((a) => a.isImplemented && !a.isCancelled);
    }
    return MINI_APPS.filter((a) => a.isImplemented && !a.isCancelled);
  }, [mode]);

  const groupedApps = useMemo((): AppGroup[] => {
    const searched = currentAppList.filter((app) => matchesSearch(app, searchQuery));

    if (mode === "b2b") {
      return B2B_GROUPS.map((group) => ({
        ...group,
        apps: searched.filter((app) => B2B_GROUP_APP_IDS[group.id]?.includes(app.id)),
      })).filter((group) => group.apps.length > 0);
    }

    return B2C_GROUPS.map((group) => ({
      ...group,
      apps: searched.filter((app) => app.category === group.id),
    })).filter((group) => group.apps.length > 0);
  }, [currentAppList, searchQuery, mode]);

  const totalVisibleApps = useMemo(
    () => groupedApps.reduce((sum, group) => sum + group.apps.length, 0),
    [groupedApps],
  );

  const faqs = [
    {
      q: "Bu web araçlarını kullanmak için üye olmak gerekiyor mu?",
      a: "Hayır! PDF Düzenleyici, Store Preview, Icon Exporter gibi birçok web aracımızı üye olmadan, doğrudan tarayıcınızda anında kullanabilirsiniz.",
    },
    {
      q: "Mobil uygulama ile web araçları arasındaki fark nedir?",
      a: "Mobil uygulamamız günlük yaşamınızı, ev işlerinizi, spor ve ajandanızı takip etmek için kurgulanmıştır. Web araçlarımız ise tarayıcı başında hızlıca halletmek istediğiniz pratik işler ve işletme yönetimi içindir.",
    },
    {
      q: "İşletmem için QR Menü veya Müdavim Kartı nasıl oluşturabilirim?",
      a: "Üstteki 'İşletmeler İçin' sekmesine geçip Dijital Menü veya Müdavim Kartı uygulamasını seçerek birkaç dakika içinde işletme profilinizi oluşturabilirsiniz.",
    },
    {
      q: "Uygulamalar ücretsiz mi?",
      a: "Bireysel araçlarımızın ve temel işletme çözümlerimizin tamamı ücretsizdir.",
    },
  ];

  const shellClass = embedded
    ? "max-w-6xl mx-auto px-6 space-y-10"
    : "min-h-screen bg-[#0a0a0c] text-zinc-100 font-sans pb-24";

  return (
    <div className={shellClass}>
      {!embedded && (
        <header className="sticky top-0 z-40 bg-[#0a0a0c]/90 backdrop-blur-md border-b border-zinc-800/80">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link href="/" className="text-xl font-black text-white hover:text-teal-400 transition-colors">
              Everything
            </Link>
          </div>
        </header>
      )}

      <div className={embedded ? "space-y-10" : "max-w-6xl mx-auto px-6 pt-8 space-y-10"}>
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="inline-flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800 self-start">
            <button
              onClick={() => {
                setMode("b2c");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "b2c"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <User size={14} weight="bold" />
              Bireysel
            </button>
            <button
              onClick={() => {
                setMode("b2b");
                setSearchQuery("");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mode === "b2b"
                  ? "bg-white text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              <Storefront size={14} weight="bold" />
              İşletmeler
            </button>
          </div>

          <div className="relative flex-1 max-w-xl">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                mode === "b2c"
                  ? "Uygulama ara... (PDF, YKS, Mekan)"
                  : "İşletme aracı ara... (Menü, CRM)"
              }
              className="w-full pl-11 pr-10 py-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 text-sm font-semibold text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-500 hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        <section className="space-y-12">
          {totalVisibleApps === 0 ? (
            <div className="text-center py-16 bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8 space-y-3">
              <MagnifyingGlass size={32} className="text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Sonuç bulunamadı</h3>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-teal-500/10 text-teal-400 rounded-xl text-xs font-bold hover:bg-teal-500/20 transition-colors"
              >
                Aramayı Temizle
              </button>
            </div>
          ) : (
            groupedApps.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal-400">
                      <GroupIcon size={18} weight="bold" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white tracking-tight">
                        {group.label}
                      </h2>
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        {group.apps.length} uygulama
                      </p>
                    </div>
                  </div>
                  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {group.apps.map((app) => (
                        <AppCard key={app.id} app={app} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })
          )}
        </section>

        <section className="bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
          <div className="flex items-center gap-2">
            <Question size={20} className="text-teal-400" weight="bold" />
            <h2 className="text-lg font-black text-white tracking-tight">Sıkça Sorulan Sorular</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-zinc-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-white flex items-center justify-between gap-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <CaretDown size={16} className="text-teal-400 shrink-0" />
                  ) : (
                    <CaretRight size={16} className="text-zinc-500 shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-xs font-medium text-zinc-400 leading-relaxed bg-zinc-900/80">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AppCard({ app }: { app: MiniApp }) {
  const router = useRouter();
  const Icon = app.icon;
  const introHref = getAppDirectoryPath(app.id);
  const openHref = getAppHref(app);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      role="link"
      tabIndex={0}
      onClick={() => router.push(introHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(introHref);
        }
      }}
      className="group h-full bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-all flex flex-col justify-between cursor-pointer"
    >
        <div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm mb-3 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: app.color }}
          >
            <Icon size={22} weight="fill" />
          </div>
          <h3 className="text-base font-black text-white group-hover:text-teal-400 transition-colors">
            {app.name}
          </h3>
          <p className="text-xs text-zinc-400 font-medium mt-1 line-clamp-2 leading-relaxed">
            {app.description}
          </p>
        </div>

        <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 group-hover:text-teal-400 transition-colors">
            Tanıtım sayfası →
          </span>
          <a
            href={openHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all active:scale-95"
          >
            <span>Aç</span>
            <ArrowSquareOut size={14} />
          </a>
        </div>
      </motion.div>
  );
}
