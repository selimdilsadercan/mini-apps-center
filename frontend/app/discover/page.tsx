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

const DESKTOP_GRID_MIN_PX = 660;
const GRID_COLUMNS = 3;
const MOBILE_PEEK_PX = 40;
const MOBILE_SCROLL_GAP_PX = 12;
const MOBILE_SWIPE_THRESHOLD_PX = 40;

function AppListColumn({
  apps,
  installedIds,
  onGetApp,
  onOpenApp,
}: {
  apps: MiniApp[];
  installedIds: string[];
  onGetApp: (appId: string, e: React.MouseEvent) => void;
  onOpenApp: (app: MiniApp) => void;
}) {
  return (
    <div className="flex flex-col gap-5 min-w-0">
      {apps.map((app) => {
        const isInstalled = installedIds.includes(app.id);
        return (
          <div
            key={app.id}
            className="group flex items-center gap-3 min-w-0 w-full"
          >
            <button
              type="button"
              onClick={() => onOpenApp(app)}
              className="flex flex-1 items-center gap-3 min-w-0 overflow-hidden text-left active:scale-[0.98] transition-all duration-200"
            >
              <div
                className="w-[68px] h-[68px] rounded-[1.4rem] flex items-center justify-center shadow-lg relative overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundColor: app.color,
                  boxShadow: `0 8px 20px -6px ${app.color}50`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></div>
                <div className="absolute inset-0 border border-white/20 rounded-[1.4rem]"></div>
                <app.icon size={32} weight="fill" color="white" className="relative z-10" />
              </div>

              <div className="flex-1 min-w-0 border-b border-gray-100/60 pb-5 group-last:border-0 group-last:pb-0">
                <h3 className="font-bold text-gray-900 text-[16px] truncate group-hover:text-indigo-600 transition-colors">
                  {app.name}
                </h3>
                <p className="text-gray-500 text-[13px] leading-tight line-clamp-1 font-medium">
                  {app.category} • {app.description}
                </p>
              </div>
            </button>

            <button
              type="button"
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
  );
}

// App Store style horizontal section with vertical stacks of 3
function AppSection({
  title,
  apps,
  installedIds,
  onGetApp,
  onOpenApp,
  contentWidth,
}: {
  title: string;
  apps: MiniApp[];
  installedIds: string[];
  onGetApp: (appId: string, e: React.MouseEvent) => void;
  onOpenApp: (app: MiniApp) => void;
  contentWidth: number | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    scrollLeft: number;
  } | null>(null);
  const [slideWidth, setSlideWidth] = useState<number | null>(null);

  const mobileSlideWidth =
    slideWidth != null ? Math.max(260, slideWidth - MOBILE_PEEK_PX) : null;

  const scrollToAdjacentSlide = useCallback(
    (direction: 1 | -1) => {
      const el = scrollRef.current;
      if (!el || mobileSlideWidth == null) return;
      const step = mobileSlideWidth + MOBILE_SCROLL_GAP_PX;
      el.scrollTo({
        left: el.scrollLeft + direction * step,
        behavior: "smooth",
      });
    },
    [mobileSlideWidth],
  );

  const handleCarouselTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollLeft: el.scrollLeft,
      };
    },
    [],
  );

  const handleCarouselTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!el || !start || mobileSlideWidth == null) return;

      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;

      if (Math.abs(dy) > Math.abs(dx)) return;

      const nativeMoved = Math.abs(el.scrollLeft - start.scrollLeft);
      if (nativeMoved > 20) return;

      if (Math.abs(dx) < MOBILE_SWIPE_THRESHOLD_PX) return;

      scrollToAdjacentSlide(dx < 0 ? 1 : -1);
    },
    [mobileSlideWidth, scrollToAdjacentSlide],
  );

  const measureSlideWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setSlideWidth(el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    if (contentWidth != null && contentWidth >= DESKTOP_GRID_MIN_PX) return;
    measureSlideWidth();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureSlideWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureSlideWidth, contentWidth]);

  if (apps.length === 0) return null;

  const chunkedApps: MiniApp[][] = [];
  for (let i = 0; i < apps.length; i += 3) {
    chunkedApps.push(apps.slice(i, i + 3));
  }

  const useDesktopGrid =
    contentWidth != null && contentWidth >= DESKTOP_GRID_MIN_PX;

  return (
    <section className="mt-10 first:mt-4">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-tight">
          {title}
        </h2>
      </div>

      {useDesktopGrid ? (
        <div className="grid grid-cols-3 gap-5 w-full pb-6">
          {Array.from({ length: GRID_COLUMNS }, (_, colIdx) => {
            const chunk = chunkedApps[colIdx];
            if (!chunk) {
              return <div key={`empty-${colIdx}`} className="min-w-0" aria-hidden />;
            }
            return (
              <AppListColumn
                key={colIdx}
                apps={chunk}
                installedIds={installedIds}
                onGetApp={onGetApp}
                onOpenApp={onOpenApp}
              />
            );
          })}
        </div>
      ) : (
        <div
          ref={scrollRef}
          onTouchStart={handleCarouselTouchStart}
          onTouchEnd={handleCarouselTouchEnd}
          className="flex overflow-x-auto pb-6 gap-3 scrollbar-none no-scrollbar -mx-5 px-5 snap-x snap-proximity overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth"
          style={{ scrollPaddingInline: "1.25rem" }}
        >
          {chunkedApps.map((chunk, chunkIdx) => (
            <div
              key={chunkIdx}
              style={
                mobileSlideWidth != null
                  ? {
                      width: mobileSlideWidth,
                      flex: `0 0 ${mobileSlideWidth}px`,
                    }
                  : { width: "100%", flex: "0 0 100%" }
              }
              className="flex flex-col gap-5 shrink-0 snap-start min-w-0 box-border"
            >
              <AppListColumn
                apps={chunk}
                installedIds={installedIds}
                onGetApp={onGetApp}
                onOpenApp={onOpenApp}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


export default function Discover() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const t = useTranslations("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState<number | null>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [isPrefLoading, setIsPrefLoading] = useState(true);

  const measureContentWidth = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    setContentWidth(el.clientWidth);
  }, []);

  useLayoutEffect(() => {
    measureContentWidth();
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureContentWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureContentWidth]);


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
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decorative Gradient (Same as Home) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto max-w-4xl mx-auto w-full">
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
                      className="flex items-center justify-between w-full gap-4 min-w-0 bg-white p-4 rounded-[1.75rem] border border-gray-100 hover:border-indigo-100 transition-all group"
                    >
                      <button
                        type="button"
                        onClick={() => handleAppClick(app)}
                        className="flex-1 flex items-center min-w-0 text-left gap-4"
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
                          <p className="text-gray-500 text-sm truncate">{app.category}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInstalled) {
                            handleAppClick(app);
                          } else {
                            handleGetApp(app.id, e);
                          }
                        }}
                        className={`px-4 py-1.5 rounded-full font-black text-[12px] transition-all active:scale-95 cursor-pointer shrink-0 ${
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
          <div ref={contentRef} className="w-full min-w-0">
            <AppSection title={t("categories.Utilities")} apps={implementedApps.filter(a => a.category === 'Utilities').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Developer Tools")} apps={implementedApps.filter(a => a.category === 'Developer Tools').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Lifestyle")} apps={implementedApps.filter(a => a.category === 'Lifestyle').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Board Games & Fun")} apps={implementedApps.filter(a => a.category === 'Board Games & Fun').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Entertainment")} apps={implementedApps.filter(a => a.category === 'Entertainment').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Simulations")} apps={implementedApps.filter(a => a.category === 'Simulations').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
            <AppSection title={t("categories.Local Services")} apps={implementedApps.filter(a => a.category === 'Local Services').slice(0, 9)} installedIds={installedIds} onGetApp={handleGetApp} onOpenApp={handleAppClick} contentWidth={contentWidth} />
          </div>
        )}
      </main>

      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}


