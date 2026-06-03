"use client";

import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import AppBar, { ActivePage } from "@/components/AppBar";
import MiniAppCard from "@/components/MiniAppCard";
import { MINI_APPS, AppCategory, MiniApp, getAppHref } from "@/lib/apps";
import { 
  MagnifyingGlass, 
  Sparkle,
  CirclesFour,
  X,
  Star,
  TrendUp,
  Fire
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getUserPreferencesAction, updateAppOrderAction } from "../home/actions";
import { useTranslations } from "@/contexts/LanguageContext";

const CATEGORIES: AppCategory[] = ['Utilities', 'Developer Tools', 'Lifestyle', 'Board Games & Fun', 'Entertainment', 'Simulations', 'Local Services'];

// App Store style horizontal section with vertical stacks of 3
function AppSection({ 
  title, 
  apps, 
  installedIds, 
  onGetApp, 
  onOpenApp 
}: { 
  title: string; 
  apps: MiniApp[]; 
  installedIds: string[]; 
  onGetApp: (appId: string, e: React.MouseEvent) => void; 
  onOpenApp: (app: MiniApp) => void; 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState<number | null>(null);

  const measureSlideWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setSlideWidth(el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    measureSlideWidth();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureSlideWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureSlideWidth]);

  if (apps.length === 0) return null;
  
  // Chunk apps into groups of 3 for vertical stacking
  const chunkedApps = [];
  for (let i = 0; i < apps.length; i += 3) {
    chunkedApps.push(apps.slice(i, i + 3));
  }
  
  return (
    <section className="mt-10 first:mt-4">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-tight">
          {title}
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto pb-6 gap-5 scrollbar-none no-scrollbar -mx-5 pl-4 pr-5 snap-x snap-mandatory overscroll-x-contain touch-pan-x scroll-pl-4"
      >
        {chunkedApps.map((chunk, chunkIdx) => (
          <div
            key={chunkIdx}
            style={
              slideWidth != null
                ? { width: Math.min(slideWidth, 320) }
                : undefined
            }
            className="flex flex-col gap-5 shrink-0 snap-start snap-always w-[calc(100vw-2.5rem)] max-w-[320px]"
          >
            {chunk.map((app) => {
              const isInstalled = installedIds.includes(app.id);
              return (
                <div 
                  key={app.id}
                  className="group flex items-center justify-between gap-4"
                >
                  <button 
                    onClick={() => onOpenApp(app)}
                    className="flex-1 flex items-center text-left gap-4 active:scale-[0.98] transition-all duration-200"
                  >
                    {/* Icon */}
                    <div 
                      className="w-[68px] h-[68px] rounded-[1.4rem] flex items-center justify-center shadow-lg relative overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
                      style={{ 
                        backgroundColor: app.color,
                        boxShadow: `0 8px 20px -6px ${app.color}50`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></div>
                      <div className="absolute inset-0 border border-white/20 rounded-[1.4rem]"></div>
                      <app.icon size={32} weight="fill" color="white" className="relative z-10" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 border-b border-gray-100/60 pb-5 group-last:border-0 group-last:pb-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-bold text-gray-900 text-[16px] truncate group-hover:text-indigo-600 transition-colors">
                          {app.name}
                        </h3>
                      </div>
                      <p className="text-gray-500 text-[13px] leading-tight line-clamp-1 font-medium">
                        {app.description}
                      </p>
                    </div>
                  </button>

                  {/* Get / Open Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInstalled) {
                        onOpenApp(app);
                      } else {
                        onGetApp(app.id, e);
                      }
                    }}
                    className={`px-5 py-2 rounded-full font-black text-[12px] transition-all active:scale-95 cursor-pointer shrink-0 select-none ${
                      isInstalled
                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-indigo-600 hover:text-white"
                    }`}
                  >
                    {isInstalled ? "OPEN" : "GET"}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}


export default function Discover() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const t = useTranslations("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [isPrefLoading, setIsPrefLoading] = useState(true);


  const implementedApps = useMemo(() => MINI_APPS.filter(a => a.isImplemented), []);

  // Load installed apps
  useEffect(() => {
    async function loadInstalled() {
      if (!isLoaded) return;
      try {
        let orderIds: string[] | null = null;

        // Try backend first
        if (user?.id) {
          const { data } = await getUserPreferencesAction(user.id);
          if (data && data.length > 0) {
            orderIds = data;
          }
        }

        // Fallback to localStorage
        if (!orderIds) {
          const savedOrder = localStorage.getItem(
            `app_order_${user?.id || "guest"}`,
          );
          if (savedOrder) {
            try {
              orderIds = JSON.parse(savedOrder) as string[];
            } catch (e) {}
          }
        }

        if (orderIds) {
          setInstalledIds(orderIds);
        } else {
          // If never set, assume all implemented apps are installed by default
          const defaultOrder = implementedApps.map(a => a.id);
          setInstalledIds(defaultOrder);
        }
      } finally {
        setIsPrefLoading(false);
      }
    }

    loadInstalled();
  }, [user?.id, isLoaded, implementedApps]);
  
  const filteredApps = useMemo(() => {
    if (!searchQuery) return [];
    return implementedApps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, implementedApps]);

  const handleAppClick = (app: MiniApp) => {
    const href = getAppHref(app);
    if (href.startsWith("http")) {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  const handleGetApp = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newInstalled = [...installedIds, appId];
    setInstalledIds(newInstalled);
    
    // Save to localStorage
    localStorage.setItem(
      `app_order_${user?.id || "guest"}`,
      JSON.stringify(newInstalled),
    );

    // Save to backend
    if (user?.id) {
      await updateAppOrderAction(user.id, newInstalled);
    }

    const appName = MINI_APPS.find(a => a.id === appId)?.name || "App";
    toast.success(t("addedToast", { appName }));
  };

  if (!isLoaded || isPrefLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
        </main>
        <AppBar activePage={ActivePage.DISCOVER} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Background Decorative Gradient (Same as Home) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto max-w-4xl mx-auto w-full overflow-x-hidden">
        {/* Header Section */}
        <header className="pt-8 pb-4">
          <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-none mb-1.5">
            {t("title")}
          </h1>
          <p className="text-gray-500 text-sm font-medium">{t("subtitle")}</p>
        </header>

        {/* Search Bar */}
        <div className="sticky top-0 z-50 bg-[#FAF9F7]/90 backdrop-blur-xl -mx-5 px-5 py-2.5 mb-2 transition-all duration-300">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3.5 sm:left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 text-gray-400 transition-colors">
              <MagnifyingGlass size={18} weight="bold" className="sm:w-5 sm:h-5" />
            </div>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 bg-white/80 border border-gray-200/50 rounded-[1.5rem] py-3 sm:py-3.5 pl-10 sm:pl-12 pr-10 sm:pr-12 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-semibold text-sm sm:text-base text-gray-900 placeholder:text-gray-400/80 truncate"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3.5 sm:right-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {searchQuery ? (
          /* Search Results */
          <section className="mt-6">
            <h2 className="text-xl font-extrabold mb-5 px-1 flex items-center gap-2">
              {t("resultsFor", { query: searchQuery })}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {filteredApps.length > 0 ? (
                filteredApps.map(app => {
                  const isInstalled = installedIds.includes(app.id);
                  return (
                    <div 
                      key={app.id} 
                      className="flex items-center justify-between w-full gap-4 bg-white p-4 rounded-[1.75rem] border border-gray-100 hover:border-indigo-100 transition-all group"
                    >
                      <button 
                        onClick={() => handleAppClick(app)}
                        className="flex-1 flex items-center text-left gap-4"
                      >
                        <div 
                          className="w-14 h-14 rounded-[1rem] flex items-center justify-center shrink-0 relative overflow-hidden shadow-md" 
                          style={{ backgroundColor: app.color }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                          <app.icon size={24} color="white" weight="fill" className="relative z-10" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{app.name}</h3>
                          <p className="text-gray-500 text-sm truncate">{app.description}</p>
                        </div>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInstalled) {
                            handleAppClick(app);
                          } else {
                            handleGetApp(app.id, e);
                          }
                        }}
                        className={`px-4 py-1.5 rounded-full font-black text-[12px] transition-all active:scale-95 cursor-pointer ${
                          isInstalled
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                        }`}
                      >
                        {isInstalled ? "OPEN" : "GET"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <h3 className="text-gray-900 font-bold">{t("noResults")}</h3>
                  <p className="text-gray-500 text-sm">{t("tryDifferent")}</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Main App Store Layout */
          <>
            {/* Categorized Sections */}
            <AppSection title={t("categories.Utilities")} apps={implementedApps.filter(a => a.category === 'Utilities').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Developer Tools")} apps={implementedApps.filter(a => a.category === 'Developer Tools').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Lifestyle")} apps={implementedApps.filter(a => a.category === 'Lifestyle').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Board Games & Fun")} apps={implementedApps.filter(a => a.category === 'Board Games & Fun').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Entertainment")} apps={implementedApps.filter(a => a.category === 'Entertainment').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Simulations")} apps={implementedApps.filter(a => a.category === 'Simulations').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
            <AppSection title={t("categories.Local Services")} apps={implementedApps.filter(a => a.category === 'Local Services').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} />
          </>
        )}
      </main>

      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}


