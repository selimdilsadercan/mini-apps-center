"use client";

import { useUser } from "@clerk/clerk-react";
import { MINI_APPS, MiniApp, navigateToMiniApp, AppCategory } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { 
  Sparkle, 
  CaretRight, 
  Heart,
  Storefront,
  ShieldCheck,
  ChatTeardropDots,
  MagnifyingGlass,
  UserCircle,
  Prohibit
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppBar, { ActivePage } from "@/components/AppBar";
import { useTranslations } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";

type TabType = "all" | "favorites";

export default function Home() {
  const { isLoaded, user } = useUser();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const t = useTranslations("home");
  const tApps = useTranslations("apps");

  const { 
    pinnedIds, 
    lastUsed, 
    usageCounts, 
    isDataLoaded, 
    hasBusinesses,
    updateAppUsage, 
    togglePin: contextTogglePin 
  } = useHome();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [cancelledApps, setCancelledApps] = useState<MiniApp[]>([]);

  useEffect(() => {
    const implementedApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);
    const cancelled = MINI_APPS.filter((app) => app.isCancelled);
    setApps(implementedApps);
    setCancelledApps(cancelled);
  }, []);

  // Group apps by category
  const groupedApps = useMemo(() => {
    const grouped: Record<string, MiniApp[]> = {};
    
    const categoryOrder = [
      "Sosyal & Etkinlik",
      "Şehrini Keşfet",
      "Pratik Araçlar",
      "Finans & Tasarruf",
      "Eğlence & Hobi",
      "Kampüslülere Özel"
    ];

    apps.forEach(app => {
      if (!grouped[app.category]) grouped[app.category] = [];
      grouped[app.category].push(app);
    });

    return Object.entries(grouped).sort(([catA], [catB]) => {
      const indexA = categoryOrder.indexOf(catA);
      const indexB = categoryOrder.indexOf(catB);
      return (indexA > -1 ? indexA : 99) - (indexB > -1 ? indexB : 99);
    });
  }, [apps]);

  const pinnedApps = useMemo(() => {
    return apps.filter(app => pinnedIds.includes(app.id));
  }, [apps, pinnedIds]);

  const handleAppClick = (app: MiniApp) => {
    // 1. Önce hemen yönlendir
    navigateToMiniApp(app, router);
    
    // 2. Arka planda istatistikleri güncelle (UI sıralamasını bozmadan)
    updateAppUsage(app.id);
  };

  const togglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    contextTogglePin(appId);
  };

  if (!isLoaded || !isDataLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] pb-12">
      <main className="px-5 py-2 max-w-lg mx-auto w-full">
        {/* Header Section */}
        <section className="mt-8 mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-[1000] text-gray-900 tracking-tighter uppercase">
            Everything
          </h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-all"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={40} weight="fill" className="text-gray-300" />
              )}
            </button>
          </div>
        </section>

        {/* Pills (Tabs) */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "all" 
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Senin İçin
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "favorites" 
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Favoriler
          </button>
        </div>

        {/* Special Pinned Section */}
        <section className="mb-4">
          {isAdmin && (
            <SpecialRow 
              title="Yönetim Paneli" 
              subtitle="Sistem ayarları ve kullanıcı yönetimi"
              icon={ShieldCheck}
              color="#4F46E5"
              onClick={() => router.push("/admin")}
            />
          )}
          {(isAdmin || hasBusinesses) && (
            <SpecialRow 
              title="İşletme Paneli" 
              subtitle="İşletmeni yönet ve istatistikleri gör"
              icon={Storefront}
              color="#EF4444"
              onClick={() => router.push("/dashboard")}
            />
          )}
          <SpecialRow 
            title="Feedback Ver" 
            subtitle="Uygulamayı geliştirmemize yardımcı ol"
            icon={ChatTeardropDots}
            color="#7C3AED"
            onClick={() => router.push("/f?board=9be81ce2")}
          />
        </section>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "all" ? (
            <motion.div
              key="all"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-10 mt-8"
            >
              {groupedApps.map(([category, categoryApps]) => (
                <section key={category} className="space-y-3">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] px-1">
                    {category}
                  </h2>
                  <div className="space-y-0">
                    {categoryApps.map((app, index) => (
                      <AppRow 
                        key={app.id} 
                        app={app} 
                        index={index} 
                        tApps={tApps}
                        isPinned={pinnedIds.includes(app.id)}
                        onPin={(e) => togglePin(e, app.id)}
                        onClick={() => handleAppClick(app)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8 mt-8"
            >
              {pinnedApps.length > 0 ? (
                <div className="space-y-0">
                  {pinnedApps.map((app, index) => (
                    <AppRow 
                      key={`fav-${app.id}`} 
                      app={app} 
                      index={index} 
                      tApps={tApps}
                      isPinned={true}
                      onPin={(e) => togglePin(e, app.id)}
                      onClick={() => handleAppClick(app)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <Heart size={40} weight="light" className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 text-sm font-medium">Henüz favori uygulaman yok.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Only: Cancelled Apps Section */}
        {isAdmin && cancelledApps.length > 0 && (
          <section className="space-y-3 mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
              <Prohibit size={14} weight="bold" />
              İptal Edilenler (Admin)
            </h2>
            <div className="space-y-0">
              {cancelledApps.map((app, index) => (
                <AppRow 
                  key={`cancelled-${app.id}`} 
                  app={app} 
                  index={index} 
                  tApps={tApps}
                  isPinned={pinnedIds.includes(app.id)}
                  onPin={(e) => togglePin(e, app.id)}
                  onClick={() => handleAppClick(app)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function SpecialRow({ title, subtitle, icon: Icon, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="w-full flex items-center gap-4 py-3 px-1 transition-all active:scale-[0.98] group text-left border-b border-gray-50 last:border-0 cursor-pointer"
    >
      <div 
        className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <Icon size={22} weight="fill" className="text-white relative z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-[15px] tracking-tight truncate group-hover:text-gray-600 transition-colors mb-0.5">
          {title}
        </h3>
        <p className="text-[11px] font-medium text-gray-400 truncate leading-tight">
          {subtitle}
        </p>
      </div>
      <div className="shrink-0 transition-opacity">
        <CaretRight size={16} weight="bold" className="text-gray-300" />
      </div>
    </div>
  );
}

function AppRow({ 
  app, 
  index, 
  tApps,
  isPinned,
  onPin,
  onClick 
}: { 
  app: MiniApp; 
  index: number; 
  tApps: any;
  isPinned: boolean;
  onPin: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const Icon = app.icon;
  const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="relative group"
    >
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 py-3 px-1 transition-all active:scale-[0.98] text-left border-b border-gray-50 last:border-0 cursor-pointer"
      >
        <div 
          className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
          style={{ backgroundColor: app.color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <Icon size={22} weight="fill" className="text-white relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-[15px] tracking-tight truncate group-hover:text-gray-600 transition-colors mb-0.5">
            {app.cta || app.description}
          </h3>
          <p className="text-[11px] font-medium text-gray-400 line-clamp-1 leading-tight">
            {appName}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={onPin}
            className={`p-1 rounded-full transition-all ${
              isPinned 
                ? "text-gray-400 hover:text-red-500" 
                : "text-gray-200 hover:text-gray-400 md:opacity-0 md:group-hover:opacity-100"
            }`}
          >
            <Heart size={16} weight={isPinned ? "fill" : "bold"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}