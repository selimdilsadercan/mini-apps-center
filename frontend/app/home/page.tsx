"use client";

import { useUser } from "@clerk/clerk-react";
import {
  MINI_APPS,
  BUSINESS_APPS,
  MiniApp,
  navigateToMiniApp,
  persistHomeTab,
  resolveInitialHomeTab,
  isValidHomeTab,
  type HomeTab,
} from "@/lib/apps";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChatTeardropDots,
  VideoCamera,
  Storefront,
  GraduationCap,
  Code,
  Wrench,
  Compass,
  GameController,
  ArrowRight,
  Heart,
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import HomeHeader from "@/components/home/HomeHeader";
import AppBar, { ActivePage } from "@/components/AppBar";
import { createBrowserClient } from "@/lib/api";
import { isRoutineDueToday } from "@/app/apps/ev-isleri/types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { toast } from "react-hot-toast";
import {
  type hub,
  type suggest,
  type recipe,
  type rutinler,
  type kim_gelir,
  type series_track,
  type ev_isleri,
  type read_tracker,
  type gym,
} from "@/lib/client";

// Sub-components
import { HomeTaskCheckButton } from "./components/common/HomeSummaryCard";
import { DiscoverTab } from "./components/DiscoverTab";
import { DeckView } from "./components/DeckView";
import { ExploreTab } from "./components/ExploreTab";
import { HobbyTab } from "./components/HobbyTab";
import { LifeTab } from "./components/LifeTab";
import { StudioTab, type StudioPackage } from "./components/StudioTab";
import { AIChatTab } from "./components/AIChatTab";

const client = createBrowserClient();
const STUDIO_CONTACT_URL = "https://t.me/superapp_support";

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

function getReadingBaseline(bookId: number, currentPage: number): number {
  if (typeof window === "undefined") return currentPage;
  try {
    const key = `reading_baseline_${bookId}`;
    const stored = localStorage.getItem(key);
    if (stored !== null) return parseInt(stored, 10);
    localStorage.setItem(key, String(currentPage));
    return currentPage;
  } catch {
    return currentPage;
  }
}

function useUserPins(_apps?: any) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_pinned_apps");
      if (stored) setPinnedIds(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const togglePin = (appId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem("user_pinned_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const updateAppUsage = (_appId: string) => {};

  return { pinnedIds, isLoaded, togglePin, updateAppUsage };
}

function discoverQueryKey(userId?: string) {
  return ["hub", "discover", userId];
}

function exploreQueryKey(userId?: string) {
  return ["hub", "explore", userId];
}

function walletQueryKey(userId?: string) {
  return ["hub", "wallet", userId];
}

function lifeQueryKey(userId?: string) {
  return ["hub", "life", userId];
}

function syncAgendaCompletionInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  entry: rutinler.RoutineEntry,
  completed: boolean
) {
  queryClient.setQueryData(discoverQueryKey(userId), (old: any) => {
    if (!old || !old.todayAgenda) return old;

    const todayStr = new Date().toISOString().split("T")[0];
    const isTodaySlot =
      entry.period_type === "daily" ||
      (entry.period_type === "once" &&
        entry.created_at &&
        entry.created_at.startsWith(todayStr));

    const updatedAgenda = old.todayAgenda.map((item: rutinler.RoutineEntry) => {
      if (item.id !== entry.id) return item;
      return {
        ...item,
        is_completed: completed,
        is_completed_today: completed && isTodaySlot,
      };
    });

    return {
      ...old,
      todayAgenda: updatedAgenda,
    };
  });
}

function readingRemainingDays(weekStartStr: string, weeksCount: number = 1): number {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const startMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  const totalDays = weeksCount * 7;
  const endMs = startMs + totalDays * 86400000;
  const nowMs = Date.now();

  if (nowMs >= endMs) return 1;
  const diffDays = Math.ceil((endMs - nowMs) / 86400000);
  return Math.max(1, diffDays);
}

function readingDailyTarget(
  basePage: number,
  totalPages: number,
  remainingDays: number
): number {
  const remPages = Math.max(0, totalPages - basePage);
  if (!totalPages || remPages <= 0) return 5;
  if (remainingDays <= 1) return remPages;
  const rounded = Math.ceil(remPages / remainingDays / 10) * 10;
  return Math.min(Math.max(10, rounded), remPages);
}

function readingChunks(dailyTarget: number): number[] {
  const CHUNK = 30;
  const chunks: number[] = [];
  let rem = dailyTarget;
  while (rem > 0 && chunks.length < 12) {
    const c = Math.min(CHUNK, rem);
    chunks.push(c);
    rem -= c;
  }
  return chunks;
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tApps = useTranslations("apps");
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (isValidHomeTab(urlTab)) return urlTab;
    }
    return resolveInitialHomeTab(tabParam);
  });

  useEffect(() => {
    if (isValidHomeTab(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { pinnedIds, isLoaded: isPinsLoaded, togglePin: contextTogglePin, updateAppUsage } = useUserPins();
  const [studioSheetPkg, setStudioSheetPkg] = useState<StudioPackage | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const currentTab = typeof window !== "undefined" ? resolveInitialHomeTab(new URLSearchParams(window.location.search).get("tab")) : "discover";
      setActiveTab(currentTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = useCallback((tab: HomeTab) => {
    if (!isValidHomeTab(tab)) return;
    setActiveTab(tab);
    persistHomeTab(tab);
  }, []);

  useEffect(() => {
    const handleNavigateTab = (e: CustomEvent<{ category: HomeTab }>) => {
      if (e.detail?.category) {
        handleTabChange(e.detail.category);
      }
    };

    window.addEventListener("navigate-tab" as any, handleNavigateTab as any);
    return () => {
      window.removeEventListener("navigate-tab" as any, handleNavigateTab as any);
    };
  }, [handleTabChange]);

  const { confirm } = useConfirmDialog();
  const userId = user?.id;

  // Real-time synchronization: staleTime: 0 & instant refetching on window focus / reconnect
  const discoverQuery = useQuery({
    queryKey: discoverQueryKey(userId),
    queryFn: () => client.hub.getDiscoverWidgets({ userId }),
    enabled: isLoaded && activeTab === "discover",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const exploreQuery = useQuery({
    queryKey: exploreQueryKey(userId),
    queryFn: () => client.hub.getExploreWidgets({ userId }),
    enabled: isLoaded && activeTab === "explore",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const walletQuery = useQuery({
    queryKey: walletQueryKey(userId),
    queryFn: () => client.hub.getWalletWidgets({ userId }),
    enabled: isLoaded && activeTab === "wallet",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const lifeQuery = useQuery({
    queryKey: lifeQueryKey(userId),
    queryFn: () => client.hub.getLifeWidgets({ userId }),
    enabled: isLoaded && activeTab === "life",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const activeQuery =
    activeTab === "discover" || activeTab === "ai-chat"
      ? discoverQuery
      : activeTab === "explore"
        ? exploreQuery
        : activeTab === "wallet"
          ? walletQuery
          : lifeQuery;

  const data: any = activeQuery.data;
  const loading = activeQuery.isLoading;
  const isDataLoaded = !loading && !!data;

  const apps: MiniApp[] = data?.apps || MINI_APPS;
  const isAdmin = data?.user?.isAdmin || false;
  const hasBusinesses = data?.user?.hasBusinesses || false;
  const suggestions = data?.suggestions || [];
  const activities = data?.activities || [];
  const todaySeries = data?.todaySeries || [];
  const todayGymPlan = data?.todayGymPlan || null;
  const todayMeals = data?.todayMeals || [];
  const todayAgenda = data?.todayAgenda || [];
  const weeklyChores = data?.weeklyChores || null;
  const weeklyReadingGoal = data?.weeklyReadingGoal || null;

  const explorePlacesApps = useMemo(() => {
    const order = ["workplaces", "digital-menu", "stamp-card"];
    return apps
      .filter((app: MiniApp) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const exploreEventsApps = useMemo(() => {
    const order = ["campus-events", "concert-list"];
    return apps
      .filter((app: MiniApp) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const hobbyMediaApps = useMemo(() => {
    const order = ["series-track", "read-tracker", "youtube-series", "film-graph", "buyuk-maclar"];
    return apps
      .filter((app: MiniApp) => app.category === "Eğlence & Hobi" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const hobbyGamesApps = useMemo(() => {
    const order = ["game-companion", "iskambil"];
    return apps
      .filter((app: MiniApp) => app.category === "Eğlence & Hobi" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const walletApps = useMemo(() => {
    return MINI_APPS.filter((app: MiniApp) =>
      app.category === "Finans & Tasarruf" &&
      (!app.isCancelled || ["subcenter", "tasarruf-challenges", "budget"].includes(app.id))
    );
  }, []);

  // Business panel promos shown under the "Pro" tab, split by audience.
  const proBusinessApps = useMemo(() => {
    const order = ["business-page", "digital-menu", "stamp-card", "campus-events"];
    return BUSINESS_APPS.filter(
      (app: MiniApp) => app.isImplemented && !app.isCancelled && order.includes(app.id)
    ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  const proServiceApps = useMemo(() => {
    const order = ["tutor-crm", "standups", "board-game-clubs"];
    return BUSINESS_APPS.filter(
      (app: MiniApp) => app.isImplemented && !app.isCancelled && order.includes(app.id)
    ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  // Developer tools (linked to their own pages, not the business panel).
  const proDevApps = useMemo(() => {
    const order = ["tasket", "store-preview", "icon-export", "feedback-board", "icon-set-guide"];
    const all = [...MINI_APPS, ...BUSINESS_APPS];
    return order
      .map((id) => all.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
  }, []);

  // General utility tools.
  const proGeneralApps = useMemo(() => {
    const order = ["pdf-tools", "daily-weather", "tournament-manager"];
    const all = [...MINI_APPS, ...BUSINESS_APPS];
    return order
      .map((id) => all.find((a) => a.id === id))
      .filter((a): a is MiniApp => Boolean(a));
  }, []);

  const studioPackages = useMemo<StudioPackage[]>(
    () => [
      {
        id: "general",
        name: "Genel araçlar",
        description: "Günlük işlerini kolaylaştıran pratik araçlar.",
        icon: Wrench,
        color: "#10B981",
        apps: proGeneralApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "business",
        name: "İşletmeler için",
        description: "İşletmeni büyütmek için ihtiyacın olan tüm araçlar bir arada.",
        icon: Storefront,
        color: "#6366F1",
        apps: proBusinessApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "service",
        name: "Eğitmenler & topluluklar için",
        description: "Öğrenci, üye ve etkinlik yönetimini tek yerden.",
        icon: GraduationCap,
        color: "#0ea5e9",
        apps: proServiceApps,
        targetAudience: "",
        benefits: [],
      },
      {
        id: "dev",
        name: "Geliştiriciler için",
        description: "Uygulamanı yayına hazırlayan araçlar.",
        icon: Code,
        color: "#7C3AED",
        apps: proDevApps,
        targetAudience: "",
        benefits: [],
      },
    ],
    [proGeneralApps, proBusinessApps, proServiceApps, proDevApps]
  );

  const lifeHomeApps = useMemo(() => {
    const order = ["ev-isleri", "rutinler"];
    return apps
      .filter((app: MiniApp) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const lifeHealthApps = useMemo(() => {
    const order = ["eksik-var", "meal-planner", "gym", "study"];
    return apps
      .filter((app: MiniApp) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const handleAppClick = (app: MiniApp) => {
    navigateToMiniApp(app, router);
    updateAppUsage(app.id);
  };

  const togglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    contextTogglePin(appId);
  };

  const isHomeLoading = activeTab !== "ai-chat" && (!isLoaded || !isDataLoaded || loading);

  const getActivePage = () => {
    switch (activeTab) {
      case "explore":
        return ActivePage.EXPLORE;
      case "hobby":
        return ActivePage.HOBBY;
      case "wallet":
        return ActivePage.WALLET;
      case "life":
        return ActivePage.LIFE;
      case "ai-chat":
        return ActivePage.AI_CHAT;
      default:
        return ActivePage.HOME;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg pb-32">
      <HomeHeader
        activeTab={activeTab}
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />
      <AppBar activePage={getActivePage()} />

      <main className="px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
        {isHomeLoading ? (
          <HomeSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "discover" && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <section className="space-y-3">
                  <HomeSummaryCards
                    suggestions={suggestions}
                    activities={activities}
                    todaySeries={todaySeries}
                    todayGymPlan={todayGymPlan}
                    todayMeals={todayMeals}
                    todayAgenda={todayAgenda}
                    weeklyChores={weeklyChores}
                    weeklyReadingGoal={weeklyReadingGoal}
                    userId={user?.id}
                    loading={loading}
                  />
                </section>
              </motion.div>
            )}

            {activeTab === "explore" && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ExploreTab
                  explorePlacesApps={explorePlacesApps}
                  exploreEventsApps={exploreEventsApps}
                  tApps={tApps}
                  pinnedIds={pinnedIds}
                  togglePin={togglePin}
                  handleAppClick={handleAppClick}
                />
              </motion.div>
            )}

            {activeTab === "hobby" && (
              <motion.div
                key="hobby"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <HobbyTab
                  hobbyMediaApps={hobbyMediaApps}
                  hobbyGamesApps={hobbyGamesApps}
                  tApps={tApps}
                  pinnedIds={pinnedIds}
                  togglePin={togglePin}
                  handleAppClick={handleAppClick}
                />
              </motion.div>
            )}

            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StudioTab
                  studioPackages={studioPackages}
                  onSelectPackage={setStudioSheetPkg}
                />
              </motion.div>
            )}

            {activeTab === "life" && (
              <motion.div
                key="life"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LifeTab
                  suggestions={suggestions}
                  activities={activities}
                  lifeHomeApps={lifeHomeApps}
                  lifeHealthApps={lifeHealthApps}
                  walletApps={walletApps}
                  tApps={tApps}
                  pinnedIds={pinnedIds}
                  togglePin={togglePin}
                  handleAppClick={handleAppClick}
                />
              </motion.div>
            )}

            {activeTab === "ai-chat" && (
              <motion.div
                key="ai-chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <AIChatTab userId={user?.id} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Studio contact bottom sheet */}
      <Drawer.Root
        open={!!studioSheetPkg}
        onOpenChange={(o) => {
          if (!o) setStudioSheetPkg(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[190]" />
          <Drawer.Content className="bg-app-surface flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[200] max-w-lg mx-auto border-t border-app-border">
            {studioSheetPkg && (
              <div className="flex flex-col min-h-0 p-6 pb-8">
                <div className="w-12 h-1.5 bg-app-border rounded-full self-center mb-6 shrink-0" />
                <div className="flex items-center gap-4 shrink-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: studioSheetPkg.color }}
                  >
                    <studioSheetPkg.icon size={28} weight="fill" className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-black text-app-text tracking-tight">
                      {studioSheetPkg.name}
                    </h2>
                    <p className="text-app-muted text-[12px] font-medium leading-snug">
                      {studioSheetPkg.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 overflow-y-auto min-h-0">
                  {studioSheetPkg.apps.map((app) => {
                    const Icon = app.icon;
                    return (
                      <div
                        key={app.id}
                        className="flex items-center gap-3 py-3 border-b border-app-border/60 last:border-0"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: app.color }}
                        >
                          <Icon size={20} weight="fill" className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-app-text text-[14px] tracking-tight truncate">
                            {app.name}
                          </p>
                          <p className="text-app-muted text-[11px] font-medium leading-tight line-clamp-2 mt-0.5">
                            {app.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <a
                  href={STUDIO_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 shrink-0 w-full flex items-center justify-center gap-2 bg-app-text text-app-bg py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  <ChatTeardropDots size={16} weight="fill" />
                  İletişime Geç
                </a>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

const SERIES_DAILY_AIR_HOUR = 19;

function getSeriesEpisodeAirDateTime(airDateStr: string): Date {
  const datePart = airDateStr.split("T")[0];
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, m - 1, d, SERIES_DAILY_AIR_HOUR, 0, 0, 0);
}

function isSeriesEpisodeAvailableNow(airDateStr: string): boolean {
  return Date.now() >= getSeriesEpisodeAirDateTime(airDateStr).getTime();
}

function formatSeriesAirLabel(airDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const air = new Date(`${airDateStr.split("T")[0]}T12:00:00`);
  air.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - air.getTime()) / 86400000);
  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays > 1) {
    return air.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  }
  return air.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function buildSeriesTrackHref(_item: series_track.TodaySeriesItem) {
  return "/apps/series-track";
}

function getSuggestionCategoryLabel(category: suggest.InboxSuggestion["category"]) {
  switch (category) {
    case "movie":
      return "Film";
    case "tv":
      return "Dizi";
    case "song":
      return "Şarkı";
    case "place":
      return "Mekan";
    case "book":
      return "Kitap";
    case "video":
      return "Video";
    default:
      return "Öneri";
  }
}

function getMealTypeLabel(mealType: recipe.MealPlanMeal["mealType"]) {
  switch (mealType) {
    case "breakfast":
      return "Kahvaltı";
    case "lunch":
      return "Öğle";
    case "dinner":
      return "Akşam";
    default:
      return "Yemek";
  }
}

function getMealPlanningPrompt(missingTypes: recipe.MealPlanMeal["mealType"][]) {
  if (missingTypes.length === 0) return "";
  if (missingTypes.length === 1) return `${getMealTypeLabel(missingTypes[0])} planlanmadı`;
  if (missingTypes.length === 2) {
    return `${getMealTypeLabel(missingTypes[0])} ve ${getMealTypeLabel(missingTypes[1])} planlanmadı`;
  }
  return "Bugünün yemekleri planlanmadı";
}

const MEAL_TYPE_ORDER: recipe.MealPlanMeal["mealType"][] = ["breakfast", "lunch", "dinner"];

function getAgendaPeriodLabel(item: rutinler.RoutineEntry) {
  if (item.period_type === "once") return "Tek Seferlik";
  if (item.period_type === "daily") {
    if (item.daily_slot === "morning") return "Sabah";
    if (item.daily_slot === "afternoon") return "Öğle";
    return "Akşam";
  }
  if (item.period_type === "weekly") return "Haftalık";
  return "Aylık";
}

function HomeSummaryCards({
  suggestions,
  activities,
  todaySeries,
  todayGymPlan,
  todayMeals,
  todayAgenda,
  weeklyChores,
  weeklyReadingGoal,
  userId,
  loading,
}: {
  suggestions: suggest.InboxSuggestion[];
  activities: kim_gelir.Activity[];
  todaySeries: series_track.TodaySeriesItem[];
  todayGymPlan: gym.TodayPlan | null;
  todayMeals: recipe.MealPlanMeal[];
  todayAgenda: rutinler.RoutineEntry[];
  weeklyChores: ev_isleri.IntegratedTodayChores | null;
  weeklyReadingGoal: read_tracker.WeeklyGoal | null;
  userId?: string;
  loading: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Today's baseline page for the active reading goal (shared with read-tracker).
  const [readingBase, setReadingBase] = useState<number | null>(null);
  useEffect(() => {
    if (
      weeklyReadingGoal?.status === "active" &&
      weeklyReadingGoal.book_id != null &&
      weeklyReadingGoal.book_current_page != null
    ) {
      setReadingBase(
        getReadingBaseline(Number(weeklyReadingGoal.book_id), weeklyReadingGoal.book_current_page)
      );
    }
  }, [weeklyReadingGoal?.book_id, weeklyReadingGoal?.status]);

  const handleReadingUpdate = async (newPage: number) => {
    if (!userId || !weeklyReadingGoal?.book_id) return;
    const total = weeklyReadingGoal.book_total_pages || 0;
    const clamped = Math.max(0, total ? Math.min(total, newPage) : newPage);
    queryClient.setQueryData(discoverQueryKey(userId), (old: any) =>
      old?.weeklyReadingGoal
        ? { ...old, weeklyReadingGoal: { ...old.weeklyReadingGoal, book_current_page: clamped } }
        : old
    );
    try {
      const res = await client.read_tracker.getBooks(userId);
      const book = res.books?.find((b: any) => b.id === weeklyReadingGoal.book_id);
      if (book) {
        const validPage = Math.max(0, Math.min(book.total_pages || Infinity, newPage));
        let status: any = book.status;
        if (book.total_pages && validPage >= book.total_pages) status = "completed";
        else if (book.status === "to_read" && validPage > 0) status = "reading";
        await client.read_tracker.upsertBook({
          id: book.id,
          userId,
          title: book.title || "",
          author: book.author || "",
          coverImage: book.cover_image || "",
          totalPages: book.total_pages || 0,
          currentPage: validPage,
          status,
        });
      }
      invalidateDiscoverWidgets(queryClient, userId);
    } catch {
      invalidateDiscoverWidgets(queryClient, userId);
      toast.error("Sayfa güncellenemedi");
    }
  };

  const startGymSession = (name: string, id: string, exercises: any[]) => {
    try {
      const sessionData = {
        routineName: name,
        routineId: id,
        startedAt: new Date().toISOString(),
        exercises: exercises.map((e: any) => ({
          id: e.id,
          name: e.name,
          targetSets: e.targetSets || 3,
          targetReps: e.targetReps || "10",
          targetWeight: e.targetWeight || 0,
          completedSets: [],
        })),
      };
      sessionStorage.setItem("gym_active_session", JSON.stringify(sessionData));
    } catch (err) {
      console.error("Gym oturum başlatma hatası:", err);
    }
  };

  const { dailyWidgetStates, updateDailyWidgetStates } = useHome();
  const ignoredSeriesIds = dailyWidgetStates?.ignoredSeriesIds || [];
  const completedMealIds = dailyWidgetStates?.completedMealKeys || [];

  const handleIgnoreSeriesToday = (item: series_track.TodaySeriesItem) => {
    const newIds = Array.from(new Set([...ignoredSeriesIds, String(item.id), String(item.tmdbId)]));
    updateDailyWidgetStates({ ignoredSeriesIds: newIds });
    toast.success("Bugünlük gizlendi.");
  };

  const handleToggleMealCompleted = (mealKey: string) => {
    const isDone = completedMealIds.includes(mealKey);
    const newIds = isDone
      ? completedMealIds.filter((id) => id !== mealKey)
      : [...completedMealIds, mealKey];
    updateDailyWidgetStates({ completedMealKeys: newIds });
    toast.success(isDone ? "İşaret kaldırıldı." : "Öğün tamamlandı olarak işaretlendi!");
  };

  const pendingAvailableSeries = todaySeries.filter(
    (item) =>
      !item.isWatched &&
      !ignoredSeriesIds.includes(String(item.id)) &&
      !ignoredSeriesIds.includes(String(item.tmdbId)) &&
      isSeriesEpisodeAvailableNow(item.airDate)
  );

  const completedTodaySeries = todaySeries.filter(
    (item) =>
      item.isWatched &&
      !ignoredSeriesIds.includes(String(item.id)) &&
      !ignoredSeriesIds.includes(String(item.tmdbId))
  );

  const pendingSeriesWidget = pendingAvailableSeries.length > 0;
  const agendaEmptyText =
    todayAgenda.filter((item) => item.is_completed_today).length > 0
      ? "Bugün tamamlandı"
      : "Bugün yapılacak görev yok";

  const seriesEmptyText =
    completedTodaySeries.length > 0 ? "Bugün izlendi" : "Bugün bölüm yok";
  const primarySeriesItem = pendingAvailableSeries[0];
  const seriesTrackHref = primarySeriesItem
    ? buildSeriesTrackHref(primarySeriesItem)
    : "/apps/series-track";

  const renderCompletedSeriesRow = (item: series_track.TodaySeriesItem) => (
    <div
      key={item.id}
      className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60"
    >
      <HomeTaskCheckButton completed disabled />
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border">
        {item.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <VideoCamera size={16} weight="fill" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-app-text truncate line-through">
          {item.title}
        </p>
        <p className="text-[9px] text-app-muted font-bold truncate">
          S{item.season} B{item.episode}
        </p>
      </div>
    </div>
  );

  const sortedTodayMeals = [...todayMeals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType)
  );
  const allTodayMealsCompleted =
    sortedTodayMeals.length > 0 &&
    sortedTodayMeals.every((m) => completedMealIds.includes(m.id || m.mealType));
  const pendingTodayMeals = sortedTodayMeals.length > 0 && !allTodayMealsCompleted;
  const plannedMealTypes = new Set(todayMeals.map((meal) => meal.mealType));
  const missingMealTypes = MEAL_TYPE_ORDER.filter((type) => !plannedMealTypes.has(type));
  const needsMealPlanning = missingMealTypes.length > 0;
  const pendingMealsWidget =
    pendingTodayMeals || (needsMealPlanning && todayMeals.length === 0);
  const mealsEmptyText = allTodayMealsCompleted ? "Bugün tamamlandı" : "Bugün plan yok";
  const mealPlanningPrompt = getMealPlanningPrompt(missingMealTypes);

  const todayChoresAll = (weeklyChores as any)?.assignments || [];
  const pendingTodayChores = todayChoresAll
    .filter(
      (item: any) =>
        !item.completedAt &&
        isRoutineDueToday(item.recurrenceType ?? "weekly", item.dayOfWeek)
    )
    .sort((a: any, b: any) => a.choreName.localeCompare(b.choreName, "tr"));
  const completedTodayChores = todayChoresAll
    .filter(
      (item: any) =>
        !!item.completedAt &&
        isRoutineDueToday(item.recurrenceType ?? "weekly", item.dayOfWeek)
    )
    .sort((a: any, b: any) => a.choreName.localeCompare(b.choreName, "tr"));
  const choresEmptyText = !weeklyChores ? "Henüz board yok" : "Bugün görev yok";
  const pendingTodayGym = !!todayGymPlan?.routine && !todayGymPlan.completedToday;
  const completedTodayGym = !!todayGymPlan?.routine && todayGymPlan.completedToday;
  const gymEmptyText = completedTodayGym ? "Bugün tamamlandı" : "Bugün antrenman yok";

  const handleSuggestionStatus = async (shareId: string, status: suggest.RecipientStatus) => {
    if (!userId) return;
    const actionKey = `suggest-${shareId}-${status}`;
    try {
      setActionLoading(actionKey);
      await client.suggest.updateStatus({
        recipientClerkId: userId,
        suggestionId: shareId,
        status,
      });

      queryClient.setQueryData(["hub", "discover", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: prev.suggestions.map((item: any) =>
            item.shareId === shareId ? { ...item, status } : item
          ),
        };
      });

      queryClient.setQueryData(["hub", "life", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: prev.suggestions.map((item: any) =>
            item.shareId === shareId ? { ...item, status } : item
          ),
        };
      });

      toast.success(
        status === "saved"
          ? "Öneri kaydedildi"
          : status === "completed"
            ? "Tamamlandı"
            : "Yok sayıldı"
      );
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivityRespond = async (
    activityId: string,
    status: "gelirim" | "belki" | "gelemem"
  ) => {
    if (!userId) return;
    const actionKey = `activity-${activityId}-${status}`;
    try {
      setActionLoading(actionKey);
      await client.kim_gelir.respondToActivity({
        activityId,
        userId,
        status,
        selectedOptions: [],
      });

      const updateActivities = (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          activities: prev.activities.map((activity: any) => {
            if (activity.id !== activityId) return activity;
            const responses = activity.responses.map((response: any) =>
              response.userId === userId
                ? { ...response, status, selectedOptions: [], updatedAt: new Date().toISOString() }
                : response
            );
            if (!responses.some((response: any) => response.userId === userId)) {
              responses.push({
                userId,
                username: null,
                avatar: null,
                status,
                selectedOptions: [],
                updatedAt: new Date().toISOString(),
              });
            }
            return { ...activity, responses };
          }),
        };
      };

      queryClient.setQueryData(["hub", "discover", userId], updateActivities);
      queryClient.setQueryData(["hub", "life", userId], updateActivities);

      toast.success("Cevabın iletildi");
    } catch {
      toast.error("Cevap iletilemedi");
    } finally {
      setActionLoading(null);
    }
  };

  const openSeriesWatch = (item: series_track.TodaySeriesItem) => {
    let query = `${item.title} Sezon ${item.season} Bölüm ${item.episode} izle`;
    if (item.watchUrlSlug) query += ` ${item.watchUrlSlug}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  const handleToggleWatched = async (item: series_track.TodaySeriesItem) => {
    if (!userId) return;
    const actionKey = `series-${item.id}`;
    try {
      setActionLoading(actionKey);
      const res = await client.series_track.toggleEpisodeWatched({
        userId,
        seriesId: item.seriesId,
        seasonNumber: item.season,
        episodeNumber: item.episode,
      });

      queryClient.setQueryData(["hub", "discover", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          todaySeries: prev.todaySeries.map((seriesItem: any) =>
            seriesItem.id === item.id ? { ...seriesItem, isWatched: res.isWatched } : seriesItem
          ),
        };
      });

      toast.success(
        res.isWatched
          ? `S${item.season} B${item.episode} izlendi`
          : `S${item.season} B${item.episode} işareti kaldırıldı`
      );
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleChoreComplete = async (assignmentId: string) => {
    if (!userId) return;
    const actionKey = `chore-${assignmentId}`;
    try {
      setActionLoading(actionKey);
      const res = await client.ev_isleri.toggleAssignmentComplete(assignmentId, userId);

      queryClient.setQueryData(["hub", "discover", userId], (prev: any) => {
        if (!prev || !prev.weeklyChores) return prev;
        return {
          ...prev,
          weeklyChores: {
            ...prev.weeklyChores,
            assignments: prev.weeklyChores.assignments.map((item: any) =>
              item.id === assignmentId
                ? {
                  ...item,
                  completedAt: res.completed ? new Date().toISOString() : null,
                }
                : item
            ),
          },
        };
      });

      toast.success(res.completed ? "İş tamamlandı!" : "İşaret kaldırıldı");
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAgendaComplete = async (entryId: string, currentStatus: boolean) => {
    if (!userId) return;
    const actionKey = `agenda-${entryId}`;
    const entry = todayAgenda.find((item) => item.id === entryId);
    if (!entry) return;

    const newStatus = !currentStatus;
    try {
      setActionLoading(actionKey);
      syncAgendaCompletionInCache(queryClient, userId, entry, newStatus);

      await client.rutinler.toggleCompletion({
        entryId,
        userId,
        completed: newStatus,
      });

      invalidateDiscoverWidgets(queryClient, userId);
      toast.success(newStatus ? "Tamamlandı" : "İşaret kaldırıldı");
    } catch {
      syncAgendaCompletionInCache(queryClient, userId, entry, currentStatus);
      toast.error("İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostponeAgendaItem = async (entryId: string) => {
    if (!userId) return;
    const actionKey = `agenda-postpone-${entryId}`;
    try {
      setActionLoading(actionKey);

      queryClient.setQueryData(discoverQueryKey(userId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          todayAgenda: (old.todayAgenda || []).filter((e: any) => e.id !== entryId),
        };
      });

      await client.rutinler.postponeEntry({
        entryId,
        userId,
      });

      invalidateDiscoverWidgets(queryClient, userId);
      toast.success("Yarına ertelendi");
    } catch {
      invalidateDiscoverWidgets(queryClient, userId);
      toast.error("Erteleme başarısız oldu");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DiscoverTab
      loading={loading}
      userId={userId}
      actionLoading={actionLoading}
      todayAgenda={todayAgenda}
      agendaEmptyText={agendaEmptyText}
      getAgendaPeriodLabel={getAgendaPeriodLabel}
      handleToggleAgendaComplete={handleToggleAgendaComplete}
      handlePostponeAgendaItem={handlePostponeAgendaItem}
      suggestions={suggestions}
      getSuggestionCategoryLabel={getSuggestionCategoryLabel}
      handleSuggestionStatus={handleSuggestionStatus}
      activities={activities}
      handleActivityRespond={handleActivityRespond}
      todaySeries={todaySeries}
      pendingAvailableSeries={pendingAvailableSeries}
      completedTodaySeries={completedTodaySeries}
      pendingSeriesWidget={pendingSeriesWidget}
      seriesEmptyText={seriesEmptyText}
      seriesTrackHref={seriesTrackHref}
      formatSeriesAirLabel={formatSeriesAirLabel}
      openSeriesWatch={openSeriesWatch}
      handleToggleWatched={handleToggleWatched}
      handleIgnoreSeriesToday={handleIgnoreSeriesToday}
      renderCompletedSeriesRow={renderCompletedSeriesRow}
      todayGymPlan={todayGymPlan}
      pendingTodayGym={pendingTodayGym}
      completedTodayGym={completedTodayGym}
      gymEmptyText={gymEmptyText}
      startGymSession={startGymSession}
      todayMeals={todayMeals}
      sortedTodayMeals={sortedTodayMeals}
      completedMealIds={completedMealIds}
      allTodayMealsCompleted={allTodayMealsCompleted}
      pendingMealsWidget={pendingMealsWidget}
      needsMealPlanning={needsMealPlanning}
      mealPlanningPrompt={mealPlanningPrompt}
      mealsEmptyText={mealsEmptyText}
      getMealTypeLabel={getMealTypeLabel}
      handleToggleMealCompleted={handleToggleMealCompleted}
      weeklyReadingGoal={weeklyReadingGoal}
      readingBase={readingBase}
      readingRemainingDays={readingRemainingDays}
      readingDailyTarget={readingDailyTarget}
      readingChunks={readingChunks}
      handleReadingUpdate={handleReadingUpdate}
      weeklyChores={weeklyChores as any}
      pendingTodayChores={pendingTodayChores}
      completedTodayChores={completedTodayChores}
      choresEmptyText={choresEmptyText}
      handleToggleChoreComplete={handleToggleChoreComplete}
    />
  );
}

function invalidateDiscoverWidgets(
  queryClient: ReturnType<typeof useQueryClient>,
  userId?: string
) {
  if (!userId) return;
  void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
}
