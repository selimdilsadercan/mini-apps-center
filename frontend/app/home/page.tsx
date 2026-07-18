"use client";

import { useUser } from "@clerk/clerk-react";
import {
  MINI_APPS,
  BUSINESS_APPS,
  MiniApp,
  navigateToMiniApp,
  AppCategory,
  persistHomeTab,
  resolveInitialHomeTab,
  isValidHomeTab,
} from "@/lib/apps";
import { useRouter } from "next/navigation";
import {
  Heart,
  ChatTeardropDots,
  MagnifyingGlass,
  Prohibit,
  MapPin,
  ArrowRight,
  Users,
  Star,
  TrendUp,
  PiggyBank,
  VideoCamera,
  PaperPlaneTilt,
  CheckCircle,
  CalendarCheck,
  Play,
  BookmarkSimple,
  Check,
  X,
  Question,
  Barbell,
  ChefHat,
  Notepad,
  Broom,
  Plus,
  BookOpen,
  Storefront,
  GraduationCap,
  Code,
  Wrench,
  EyeSlash,
  ClockAfternoon,
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback, Suspense, type ComponentType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import AppBar, { ActivePage } from "@/components/AppBar";
import { useTranslations } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import {
  invalidateDiscoverWidgets,
  invalidateAllHubWidgets,
  syncAgendaCompletionInCache,
  discoverQueryKey,
} from "@/lib/cache/hubAgendaCache";
import { getTomorrowMidnightIso } from "@/lib/date-utils";
import {
  readingRemainingDays,
  readingDailyTarget,
  readingChunks,
  getReadingBaseline,
} from "@/lib/reading-daily";
import {
  rutinler,
  workplaces,
  series_track,
  hub,
  subcenter,
  tasarruf_challenges,
  suggest,
  kim_gelir,
  gym,
  recipe,
  ev_isleri,
  read_tracker,
} from "@/lib/client";
import Link from "next/link";
import { Drawer } from "vaul";
import HomeHeader from "@/components/home/HomeHeader";
import { startGymSession } from "@/app/apps/gym/types";
import { isRoutineDueToday } from "@/app/apps/ev-isleri/types";

const client = createBrowserClient();

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-app-bg pb-32">
        <HomeHeader activeTab="discover" isLoaded={false} user={null} isAdmin={false} hasBusinesses={false} />
        <AppBar activePage={ActivePage.HOME} />
        <main className="px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
          <HomeSkeleton />
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-app-surface-muted rounded-2xl ${className}`} />
);

const HomeSkeleton = () => (
  <div className="space-y-10">
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-32 col-span-2" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-1">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-48" />
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

function HomeContent() {
  const { isLoaded, user } = useUser();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("home");
  const tApps = useTranslations("apps");

  const [activeTab, setActiveTab] = useState<string>(() =>
    resolveInitialHomeTab(
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("tab")
        : null,
    ),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const queryTab = searchParams.get("tab");
    if (queryTab && isValidHomeTab(queryTab)) {
      setActiveTab(queryTab);
      persistHomeTab(queryTab);
      const newUrl = window.location.pathname;
      window.history.replaceState(
        { ...(window.history.state ?? {}), homeTab: queryTab },
        "",
        newUrl,
      );
    }

    localStorage.removeItem("last_business_url");
  }, [searchParams]);

  useEffect(() => {
    if (!isValidHomeTab(activeTab)) return;
    persistHomeTab(activeTab);
  }, [activeTab]);

  const {
    pinnedIds,
    lastUsed,
    usageCounts,
    isDataLoaded,
    hasBusinesses,
    updateAppUsage,
    togglePin: contextTogglePin,
    refreshSessionData,
  } = useHome();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.id) {
      invalidateAllHubWidgets(queryClient);
      refreshSessionData();
    }
  }, [user?.id, queryClient, refreshSessionData]);

  const [apps, setApps] = useState<MiniApp[]>([]);

  // Queries
  const discoverQuery = useQuery({
    queryKey: ["hub", "discover", user?.id],
    queryFn: () => client.hub.getDiscoverWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "discover",
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const exploreQuery = useQuery({
    queryKey: ["hub", "explore", user?.id],
    queryFn: () => client.hub.getExploreWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "explore",
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: "always",
  });

  const walletQuery = useQuery({
    queryKey: ["hub", "wallet", user?.id],
    queryFn: () => client.hub.getWalletWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "wallet",
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  const lifeQuery = useQuery({
    queryKey: ["hub", "life", user?.id],
    queryFn: () => client.hub.getLifeWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "life",
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  // Derived state from queries
  const suggestions = discoverQuery.data?.suggestions || lifeQuery.data?.suggestions || [];
  const activities = discoverQuery.data?.activities || lifeQuery.data?.activities || [];
  const todaySeries = discoverQuery.data?.todaySeries || [];
  const todayGymPlan = discoverQuery.data?.todayGymPlan || null;
  const todayMeals = discoverQuery.data?.todayMeals || [];
  const todayAgenda = discoverQuery.data?.todayAgenda || [];
  const weeklyChores = discoverQuery.data?.weeklyChores || null;
  const weeklyReadingGoal = discoverQuery.data?.weeklyReadingGoal ?? null;
  const places = exploreQuery.data?.places || [];
  const subscriptions = walletQuery.data?.subscriptions || [];
  const savingsStats = walletQuery.data?.savingsStats || null;

  const loading = useMemo(() => {
    if (activeTab === "discover") return discoverQuery.isLoading;
    if (activeTab === "explore") return exploreQuery.isLoading;
    if (activeTab === "wallet") return walletQuery.isLoading;
    if (activeTab === "life") return lifeQuery.isLoading;
    return false;
  }, [activeTab, discoverQuery.isLoading, exploreQuery.isLoading, walletQuery.isLoading, lifeQuery.isLoading]);

  useEffect(() => {
    const implementedApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);
    setApps(implementedApps);
  }, []);

  const hobbyMediaApps = useMemo(() => {
    const order = ["series-track", "read-tracker", "youtube-series", "film-graph", "buyuk-maclar"];
    return apps
      .filter((app) => app.category === "Eğlence & Hobi" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const hobbyGamesApps = useMemo(() => {
    const order = ["game-companion", "iskambil"];
    return apps
      .filter((app) => app.category === "Eğlence & Hobi" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const explorePlacesApps = useMemo(() => {
    const order = ["workplaces", "digital-menu", "stamp-card"];
    return apps
      .filter((app) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const exploreEventsApps = useMemo(() => {
    const order = ["campus-events", "concert-list"];
    return apps
      .filter((app) => app.category === "Şehrini Keşfet" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const walletApps = useMemo(() => {
    return MINI_APPS.filter(app =>
      app.category === "Finans & Tasarruf" &&
      (!app.isCancelled || ["subcenter", "tasarruf-challenges", "budget"].includes(app.id))
    );
  }, []);

  // Studio tab: tapping a package opens a contact bottom sheet listing its apps.
  const [studioSheetPkg, setStudioSheetPkg] = useState<StudioPackage | null>(null);
  // TODO: set the real contact target (WhatsApp/e-mail/link) for Studio inquiries.
  const STUDIO_CONTACT_URL = "https://wa.me/905555555555";

  // Business panel promos shown under the "Pro" tab, split by audience.
  const proBusinessApps = useMemo(() => {
    const order = ["business-page", "digital-menu", "stamp-card", "campus-events"];
    return BUSINESS_APPS.filter(
      (app) => app.isImplemented && !app.isCancelled && order.includes(app.id)
    ).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  const proServiceApps = useMemo(() => {
    const order = ["tutor-crm", "standups", "board-game-clubs"];
    return BUSINESS_APPS.filter(
      (app) => app.isImplemented && !app.isCancelled && order.includes(app.id)
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

  // Studio packages — each shown as a single card; the bottom sheet lists its apps.
  const studioPackages = useMemo<StudioPackage[]>(
    () => [
      {
        id: "general",
        name: "Genel araçlar",
        description: "Günlük işlerini kolaylaştıran pratik araçlar.",
        icon: Wrench,
        color: "#10B981",
        apps: proGeneralApps,
      },
      {
        id: "business",
        name: "İşletmeler için",
        description: "İşletmeni büyütmek için ihtiyacın olan tüm araçlar bir arada.",
        icon: Storefront,
        color: "#6366F1",
        apps: proBusinessApps,
      },
      {
        id: "service",
        name: "Eğitmenler & topluluklar için",
        description: "Öğrenci, üye ve etkinlik yönetimini tek yerden.",
        icon: GraduationCap,
        color: "#0EA5E9",
        apps: proServiceApps,
      },
      {
        id: "dev",
        name: "Geliştiriciler için",
        description: "Uygulamanı yayına hazırlayan araçlar.",
        icon: Code,
        color: "#7C3AED",
        apps: proDevApps,
      },
    ],
    [proGeneralApps, proBusinessApps, proServiceApps, proDevApps]
  );

  // A package card for the Studio tab — opens the contact bottom sheet.
  const renderStudioPackage = (pkg: StudioPackage) => {
    const Icon = pkg.icon;
    return (
      <button
        key={pkg.id}
        type="button"
        onClick={() => setStudioSheetPkg(pkg)}
        className="w-full text-left rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: pkg.color }}
          >
            <Icon size={24} weight="fill" className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-app-text text-[15px] tracking-tight">{pkg.name}</h3>
            <p className="text-app-muted text-[12px] font-medium leading-tight mt-0.5">
              {pkg.description}
            </p>
          </div>
          <ArrowRight size={16} weight="bold" className="text-app-muted shrink-0" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="flex -space-x-2">
            {pkg.apps.slice(0, 5).map((app) => {
              const AppIcon = app.icon;
              return (
                <div
                  key={app.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center border-2 border-app-surface shadow-sm"
                  style={{ backgroundColor: app.color }}
                >
                  <AppIcon size={13} weight="fill" className="text-white" />
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">
            {pkg.apps.length} araç
          </span>
        </div>
      </button>
    );
  };

  const lifeHomeApps = useMemo(() => {
    const order = ["ev-isleri", "rutinler"];
    return apps
      .filter((app) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const lifeHealthApps = useMemo(() => {
    const order = ["eksik-var", "meal-planner", "gym", "study"];
    return apps
      .filter((app) => app.category === "Kampüslülere Özel" && order.includes(app.id))
      .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [apps]);

  const toolsApps = useMemo(() => {
    return apps.filter(app => app.category === "Pratik Araçlar");
  }, [apps]);

  const handleAppClick = (app: MiniApp) => {
    navigateToMiniApp(app, router);
    updateAppUsage(app.id);
  };

  const togglePin = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    contextTogglePin(appId);
  };

  const isHomeLoading =
    !isLoaded ||
    !isDataLoaded ||
    loading;

  const getActivePage = () => {
    switch (activeTab) {
      case "explore": return ActivePage.EXPLORE;
      case "hobby": return ActivePage.HOBBY;
      case "wallet": return ActivePage.WALLET;
      case "life": return ActivePage.LIFE;
      default: return ActivePage.HOME;
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
                className="space-y-8"
              >
                {/* Mekanlar & Rehberler */}
                {explorePlacesApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Mekanlar & Rehberler
                    </h3>
                    <div className="space-y-0">
                      {explorePlacesApps.map((app, index) => (
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
                )}

                {/* Etkinlik & Topluluk */}
                {exploreEventsApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Etkinlik & Topluluk
                    </h3>
                    <div className="space-y-0">
                      {exploreEventsApps.map((app, index) => (
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
                )}
              </motion.div>
            )}

            {activeTab === "hobby" && (
              <motion.div
                key="hobby"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Medya & İçerik */}
                {hobbyMediaApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Medya & İçerik
                    </h3>
                    <div className="space-y-0">
                      {hobbyMediaApps.map((app, index) => (
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
                )}

                {/* Oyun & Etkinlik */}
                {hobbyGamesApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Oyun & Etkinlik
                    </h3>
                    <div className="space-y-0">
                      {hobbyGamesApps.map((app, index) => (
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
                )}
              </motion.div>
            )}

            {activeTab === "wallet" && (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Studio packages */}
                <section className="space-y-3">
                  {studioPackages.map(renderStudioPackage)}
                </section>
              </motion.div>
            )}

            {activeTab === "life" && (
              <motion.div
                key="life"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >

                {/* Suggest Inbox Widget */}
                {suggestions.length > 0 && (
                  <section>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                      {suggestions.map(suggestion => (
                        <Link
                          key={suggestion.id}
                          href={`/apps/suggest/detail?id=${suggestion.shareId}`}
                          className="w-48 bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border shadow-inner">
                              {suggestion.imageUrl ? (
                                <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <PaperPlaneTilt size={20} weight="fill" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[11px] font-black text-app-text uppercase tracking-tight truncate">{suggestion.title}</h3>
                              <p className="text-[9px] text-app-muted font-bold truncate">@{suggestion.senderUsername || "birisi"}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">
                              {suggestion.category === "movie" ? "Film" :
                                suggestion.category === "tv" ? "Dizi" :
                                  suggestion.category === "song" ? "Şarkı" :
                                    suggestion.category === "place" ? "Mekan" : "Öneri"}
                            </span>
                            {suggestion.status === "pending" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ne Yapsak Activities Widget */}
                {activities.length > 0 && (
                  <section>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                      {activities.map(activity => (
                        <Link
                          key={activity.id}
                          href={`/apps/kim-gelir/activity?id=${activity.id}`}
                          className="w-56 bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 text-red-500">
                              <Users size={20} weight="fill" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[11px] font-black text-app-text uppercase tracking-tight truncate">{activity.title}</h3>
                              <p className="text-[9px] text-app-muted font-bold truncate">{activity.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {activity.responses.slice(0, 3).map((resp, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                                  {resp.avatar ? (
                                    <img src={resp.avatar} alt={resp.username || ""} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-app-muted">
                                      {(resp.username || "?")[0]}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {activity.responses.length > 3 && (
                                <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[7px] font-black text-white">
                                  +{activity.responses.length - 3}
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">
                              {activity.timeOption === "custom" ? activity.customTime : activity.timeOption}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Ev & Düzen */}
                {lifeHomeApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Ev & Düzen
                    </h3>
                    <div className="space-y-0">
                      {lifeHomeApps.map((app, index) => (
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
                )}

                {/* Sağlık & Odak */}
                {lifeHealthApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Sağlık & Odak
                    </h3>
                    <div className="space-y-0">
                      {lifeHealthApps.map((app, index) => (
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
                )}

                {/* Finans & Bütçe */}
                {walletApps.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
                      Finans & Bütçe
                    </h3>
                    <div className="space-y-0">
                      {walletApps.map((app, index) => (
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
                )}
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
                <div className="mx-auto w-12 h-1.5 bg-app-border rounded-full mb-6 shrink-0" />
                <div className="flex flex-col items-center text-center shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-4"
                    style={{ backgroundColor: studioSheetPkg.color }}
                  >
                    {(() => {
                      const Icon = studioSheetPkg.icon;
                      return <Icon size={32} weight="fill" className="text-white" />;
                    })()}
                  </div>
                  <Drawer.Title className="text-lg font-black text-app-text tracking-tight">
                    {studioSheetPkg.name}
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-app-muted font-medium mt-2 max-w-xs">
                    {studioSheetPkg.description}
                  </Drawer.Description>
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

interface StudioPackage {
  id: string;
  name: string;
  description: string;
  icon: MiniApp["icon"];
  color: string;
  apps: MiniApp[];
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
    case "movie": return "Film";
    case "tv": return "Dizi";
    case "song": return "Şarkı";
    case "place": return "Mekan";
    case "book": return "Kitap";
    case "video": return "Video";
    default: return "Öneri";
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

function isMealTypeVisibleAtTime(
  mealType: recipe.MealPlanMeal["mealType"],
  now: Date = new Date()
): boolean {
  const hour = now.getHours();
  switch (mealType) {
    case "breakfast":
      return hour < 12;
    case "lunch":
      return hour < 15;
    case "dinner":
      return hour < 22;
    default:
      return true;
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
        getReadingBaseline(weeklyReadingGoal.book_id, weeklyReadingGoal.book_current_page)
      );
    }
  }, [weeklyReadingGoal?.book_id, weeklyReadingGoal?.status]);

  // Update the reading goal book's page from the widget, preserving other fields.
  const handleReadingUpdate = async (newPage: number) => {
    if (!userId || !weeklyReadingGoal?.book_id) return;
    const total = weeklyReadingGoal.book_total_pages || 0;
    const clamped = Math.max(0, total ? Math.min(total, newPage) : newPage);
    // Optimistic patch so the buttons feel instant.
    queryClient.setQueryData(discoverQueryKey(userId), (old: any) =>
      old?.weeklyReadingGoal
        ? { ...old, weeklyReadingGoal: { ...old.weeklyReadingGoal, book_current_page: clamped } }
        : old
    );
    try {
      const res = await client.read_tracker.getBooks(userId);
      const book = res.books?.find((b) => b.id === weeklyReadingGoal.book_id);
      if (book) {
        const validPage = Math.max(0, Math.min(book.total_pages || Infinity, newPage));
        let status = book.status;
        if (book.total_pages && validPage >= book.total_pages) status = "completed";
        else if (book.status === "to_read" && validPage > 0) status = "reading";
        await client.read_tracker.upsertBook({
          id: book.id,
          userId,
          title: book.title,
          author: book.author,
          totalPages: book.total_pages,
          currentPage: validPage,
          status,
          rating: book.rating,
          review: book.review,
          coverImage: book.cover_image,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      invalidateDiscoverWidgets(queryClient, userId);
    }
  };

  const previewSuggestions = suggestions.slice(0, 2);
  const previewActivities = activities.slice(0, 2);
  const pendingTodayAgenda = todayAgenda.filter((item) => !item.is_completed);
  const completedTodayAgenda = todayAgenda.filter((item) => item.is_completed_today);
  const previewTodayAgenda = pendingTodayAgenda.slice(0, 4);
  const agendaEmptyText =
    completedTodayAgenda.length > 0 ? "Bugün tamamlandı" : "Bugün plan yok";
  const renderCompletedAgendaRow = (item: rutinler.RoutineEntry) => (
    <div
      key={item.id}
      className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60"
    >
      <HomeTaskCheckButton completed disabled />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black truncate text-app-muted line-through">
          {item.item_emoji ? `${item.item_emoji} ` : ""}
          {item.item_name}
        </p>
        <p className="text-[9px] text-app-muted font-bold truncate">
          {getAgendaPeriodLabel(item)}
        </p>
      </div>
    </div>
  );
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
      isSeriesEpisodeAvailableNow(item.airDate) &&
      !ignoredSeriesIds.includes(String(item.id)) &&
      !ignoredSeriesIds.includes(String(item.tmdbId)),
  );
  const completedTodaySeries = todaySeries.filter((item) => item.isWatched);
  const pendingSeriesWidget = pendingAvailableSeries.length > 0;
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
  const pendingTodayMeals =
    sortedTodayMeals.length > 0 && !allTodayMealsCompleted;
  const plannedMealTypes = new Set(todayMeals.map((meal) => meal.mealType));
  const missingMealTypes = MEAL_TYPE_ORDER.filter((type) => !plannedMealTypes.has(type));
  const needsMealPlanning = missingMealTypes.length > 0;
  const pendingMealsWidget =
    pendingTodayMeals || (needsMealPlanning && todayMeals.length === 0);
  const mealsEmptyText = allTodayMealsCompleted ? "Bugün tamamlandı" : "Bugün plan yok";
  const mealPlanningPrompt = getMealPlanningPrompt(missingMealTypes);

  const todayChoresAll = weeklyChores?.assignments || [];
  const pendingTodayChores = todayChoresAll
    .filter(
      (item) =>
        !item.completedAt &&
        isRoutineDueToday(item.recurrenceType ?? "weekly", item.dayOfWeek)
    )
    .sort((a, b) => a.choreName.localeCompare(b.choreName, "tr"));
  const completedTodayChores = todayChoresAll
    .filter(
      (item) =>
        !!item.completedAt &&
        isRoutineDueToday(item.recurrenceType ?? "weekly", item.dayOfWeek)
    )
    .sort((a, b) => a.choreName.localeCompare(b.choreName, "tr"));
  const choresEmptyText = !weeklyChores ? "Henüz board yok" : "Bugün görev yok";
  const pendingTodayGym =
    !!todayGymPlan?.routine && !todayGymPlan.completedToday;
  const completedTodayGym =
    !!todayGymPlan?.routine && todayGymPlan.completedToday;
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

      // Update Discover Query Cache
      queryClient.setQueryData(["hub", "discover", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: prev.suggestions.map((item: any) =>
            item.shareId === shareId ? { ...item, status } : item
          )
        };
      });

      // Update Life Query Cache
      queryClient.setQueryData(["hub", "life", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          suggestions: prev.suggestions.map((item: any) =>
            item.shareId === shareId ? { ...item, status } : item
          )
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
          })
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
          )
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
            )
          }
        };
      });

      toast.success(res.completed ? "Görev tamamlandı" : "Görev işareti kaldırıldı");
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

      // Optimistic cache update
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

  const widgets = [
    {
      key: "agenda",
      loading: loading,
      hasContent: pendingTodayAgenda.length > 0,
      hasCompletedOnly: completedTodayAgenda.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/rutinler"
          icon={CalendarCheck}
          color="#7C3AED"
          title="Bugünün Planı"
          subtitle="Ajanda"
          loading={loading}
          emptyText={agendaEmptyText}
          hasContent={pendingTodayAgenda.length > 0}
          emptyFooter={
            !pendingTodayAgenda.length && completedTodayAgenda.length > 0 ? (
              <>{completedTodayAgenda.map(renderCompletedAgendaRow)}</>
            ) : undefined
          }
        >
          {previewTodayAgenda.map((item) => (
            <div key={item.id} className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border flex items-center justify-center text-sm">
                  {item.item_emoji ? (
                    item.item_emoji
                  ) : (
                    <CalendarCheck size={16} weight="bold" className="text-app-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate">{item.item_name}</p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    {getAgendaPeriodLabel(item)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <WidgetActionButton
                  onClick={() => void handleToggleAgendaComplete(item.id, false)}
                  loading={actionLoading === `agenda-${item.id}`}
                  icon={CheckCircle}
                >
                  Bitti
                </WidgetActionButton>

                <WidgetActionButton
                  onClick={() => void handlePostponeAgendaItem(item.id)}
                  loading={actionLoading === `agenda-postpone-${item.id}`}
                  icon={ClockAfternoon}
                >
                  Ertele
                </WidgetActionButton>
              </div>
            </div>
          ))}
          {pendingTodayAgenda.length > 0 &&
            completedTodayAgenda.map(renderCompletedAgendaRow)}
        </HomeSummaryCard>
      ),
    },
    {
      key: "suggest",
      loading: loading,
      hasContent: previewSuggestions.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/suggest"
          icon={PaperPlaneTilt}
          color="#6366f1"
          title="Gelen Öneriler"
          subtitle="Suggest"
          loading={loading}
          emptyText="Yeni öneri yok"
          hasContent={previewSuggestions.length > 0}
        >
          {previewSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border">
                  {suggestion.imageUrl ? (
                    <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <PaperPlaneTilt size={16} weight="fill" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate">{suggestion.title}</p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    @{suggestion.senderUsername || "birisi"} · {getSuggestionCategoryLabel(suggestion.category)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {suggestion.externalLink && (
                  <WidgetActionButton
                    onClick={() => window.open(suggestion.externalLink!, "_blank")}
                    icon={Play}
                  >
                    Aç
                  </WidgetActionButton>
                )}
                {suggestion.status !== "saved" && suggestion.status !== "completed" && (
                  <WidgetActionButton
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "saved")}
                    loading={actionLoading === `suggest-${suggestion.shareId}-saved`}
                    icon={BookmarkSimple}
                  >
                    Kaydet
                  </WidgetActionButton>
                )}
                {suggestion.status !== "completed" && (
                  <WidgetActionButton
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "completed")}
                    loading={actionLoading === `suggest-${suggestion.shareId}-completed`}
                    icon={Check}
                  >
                    Tamamla
                  </WidgetActionButton>
                )}
                {suggestion.status === "pending" && (
                  <WidgetActionButton
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "ignored")}
                    loading={actionLoading === `suggest-${suggestion.shareId}-ignored`}
                    icon={X}
                  >
                    Yok say
                  </WidgetActionButton>
                )}
              </div>
            </div>
          ))}
        </HomeSummaryCard>
      ),
    },
    {
      key: "activities",
      loading: loading,
      hasContent: previewActivities.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/kim-gelir"
          icon={Users}
          color="#FF5252"
          title="Plan Davetleri"
          subtitle="Ne Yapsak?"
          loading={loading}
          emptyText="Aktif davet yok"
          hasContent={previewActivities.length > 0}
        >
          {previewActivities.map((activity) => {
            const myResponse = activity.responses.find((response) => response.userId === userId)?.status;
            return (
              <div key={activity.id} className="px-4 py-3 border-t border-app-border space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 text-red-500">
                    <Users size={16} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-app-text truncate">{activity.title}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate">
                      {activity.location || "Konum belirtilmedi"} · {activity.responses.length} yanıt
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "gelirim")}
                    loading={actionLoading === `activity-${activity.id}-gelirim`}
                    icon={Check}
                    selected={myResponse === "gelirim"}
                  >
                    Gelirim
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "belki")}
                    loading={actionLoading === `activity-${activity.id}-belki`}
                    icon={Question}
                    selected={myResponse === "belki"}
                  >
                    Belki
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "gelemem")}
                    loading={actionLoading === `activity-${activity.id}-gelemem`}
                    icon={X}
                    selected={myResponse === "gelemem"}
                  >
                    Gelemiyorum
                  </WidgetActionButton>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      ),
    },
    {
      key: "series",
      loading: loading,
      hasContent: pendingSeriesWidget,
      hasCompletedOnly: completedTodaySeries.length > 0,
      card: (
        <HomeSummaryCard
          href={seriesTrackHref}
          icon={VideoCamera}
          color="#E50914"
          title="Bugünün Dizileri"
          subtitle="SeriesTrack"
          loading={loading}
          emptyText={seriesEmptyText}
          hasContent={pendingSeriesWidget}
          emptyFooter={
            !pendingSeriesWidget && completedTodaySeries.length > 0 ? (
              <>{completedTodaySeries.map(renderCompletedSeriesRow)}</>
            ) : undefined
          }
        >
          {pendingAvailableSeries.map((item) => (
            <div key={item.id} className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
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
                  <p className="text-[11px] font-black text-app-text truncate">{item.title}</p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    S{item.season} B{item.episode}
                    {" · "}
                    {formatSeriesAirLabel(item.airDate)}
                    {item.source === "episode-club" ? " · Episode Club" : ""}
                  </p>
                </div>
                {(item.extraUnwatchedCount ?? 0) > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-app-surface-muted text-app-muted text-[9px] font-black tabular-nums border border-app-border">
                    +{item.extraUnwatchedCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <WidgetActionButton onClick={() => openSeriesWatch(item)} icon={Play}>
                  İzle
                </WidgetActionButton>
                <WidgetActionButton
                  onClick={() => handleToggleWatched(item)}
                  loading={actionLoading === `series-${item.id}`}
                  icon={CheckCircle}
                >
                  İzlendi
                </WidgetActionButton>
                <WidgetActionButton
                  onClick={() => handleIgnoreSeriesToday(item)}
                  icon={EyeSlash}
                >
                  Yoksay
                </WidgetActionButton>
              </div>
            </div>
          ))}
          {pendingSeriesWidget && completedTodaySeries.map(renderCompletedSeriesRow)}
        </HomeSummaryCard>
      ),
    },
    {
      key: "gym",
      loading: loading,
      hasContent: pendingTodayGym,
      hasCompletedOnly: completedTodayGym,
      card: (
        <HomeSummaryCard
          href="/apps/gym"
          icon={Barbell}
          color="#8B5CF6"
          title="Bugünün Antrenmanı"
          subtitle="Gym"
          loading={loading}
          emptyText={gymEmptyText}
          hasContent={pendingTodayGym}
          emptyFooter={
            completedTodayGym ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60">
                <HomeTaskCheckButton completed disabled />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate line-through">
                    {todayGymPlan!.routine!.name}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    {todayGymPlan!.routine!.exercises.length} egzersiz
                  </p>
                </div>
              </div>
            ) : undefined
          }
        >
          {todayGymPlan?.routine && (
            <div className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 border border-violet-100 text-violet-600">
                  <Barbell size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate">
                    {todayGymPlan.routine.name}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    {todayGymPlan.routine.exercises.length} egzersiz
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <WidgetActionButton
                  onClick={() => {
                    startGymSession(
                      todayGymPlan.routine!.name,
                      todayGymPlan.routine!.id,
                      todayGymPlan.routine!.exercises
                    );
                    router.push("/apps/gym/session");
                  }}
                  icon={Play}
                >
                  Başlat
                </WidgetActionButton>
              </div>
            </div>
          )}
        </HomeSummaryCard>
      ),
    },
    {
      key: "chores",
      loading: loading,
      hasContent: pendingTodayChores.length > 0,
      hasCompletedOnly: completedTodayChores.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/ev-isleri"
          icon={Broom}
          color="#14B8A6"
          title="Bugünün İşleri"
          subtitle={weeklyChores?.boardName ?? "Ev İşleri"}
          loading={loading}
          emptyText={choresEmptyText}
          hasContent={pendingTodayChores.length > 0}
          emptyFooter={
            completedTodayChores.length > 0 ? (
              <>
                {completedTodayChores.map((item) => {
                  const isMine = item.assigneeClerkId === userId;
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60"
                    >
                      <HomeTaskCheckButton completed disabled />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black truncate text-app-muted line-through">
                          {item.choreIcon ? `${item.choreIcon} ` : ""}
                          {item.choreName}
                        </p>
                        <p className="text-[9px] text-app-muted font-bold truncate">
                          {item.assigneeUsername ?? "Üye"}
                          {isMine ? " · Sen" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : undefined
          }
        >
          {pendingTodayChores.map((item) => {
            const isMine = item.assigneeClerkId === userId;
            return (
              <div
                key={item.id}
                className="px-4 py-3 border-t border-app-border flex items-center gap-3"
              >
                <HomeTaskCheckButton
                  disabled={actionLoading === `chore-${item.id}`}
                  onClick={() => void handleToggleChoreComplete(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate text-app-text">
                    {item.choreIcon ? `${item.choreIcon} ` : ""}
                    {item.choreName}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    {item.assigneeUsername ?? "Üye"}
                    {isMine ? " · Sen" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      ),
    },
    {
      key: "meals",
      loading: loading,
      hasContent: pendingMealsWidget,
      hasCompletedOnly: allTodayMealsCompleted,
      card: (
        <HomeSummaryCard
          href="/apps/recipe/plan"
          icon={ChefHat}
          color="#F97316"
          title="Bugünün Yemek Planı"
          subtitle="Meal Planner"
          loading={loading}
          emptyText={mealsEmptyText}
          hasContent={pendingMealsWidget}
          emptyFooter={
            allTodayMealsCompleted ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60">
                <HomeTaskCheckButton completed disabled />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate line-through">
                    {sortedTodayMeals.map((meal) => `${getMealTypeLabel(meal.mealType)}: ${meal.title}`).join(" · ")}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    {sortedTodayMeals.length} öğün tamamlandı
                  </p>
                </div>
              </div>
            ) : undefined
          }
        >
          {todayMeals.length > 0 && !allTodayMealsCompleted && (
            <div className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
                  <ChefHat size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate">
                    {sortedTodayMeals.map((meal) => `${getMealTypeLabel(meal.mealType)}: ${meal.title}`).join(" · ")}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    Günün Menüsü ({completedMealIds.length}/{sortedTodayMeals.length} tamamlandı)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sortedTodayMeals.map((meal) => {
                  const mealKey = meal.id || meal.mealType;
                  const isDone = completedMealIds.includes(mealKey);
                  return (
                    <WidgetActionButton
                      key={mealKey}
                      onClick={() => handleToggleMealCompleted(mealKey)}
                      icon={isDone ? CheckCircle : Check}
                    >
                      <span className={isDone ? "line-through opacity-70" : ""}>
                        {getMealTypeLabel(meal.mealType)}
                      </span>
                    </WidgetActionButton>
                  );
                })}
              </div>
            </div>
          )}
          {needsMealPlanning && todayMeals.length === 0 && (
            <div className="px-4 py-3 border-t border-app-border space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
                  <Notepad size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text">{mealPlanningPrompt}</p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    Bugünün menüsünü şimdi oluştur
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <WidgetActionButton
                  onClick={() => router.push("/apps/recipe/plan")}
                  icon={Plus}
                >
                  Planla
                </WidgetActionButton>
              </div>
            </div>
          )}
        </HomeSummaryCard>
      ),
    },
    {
      key: "reading",
      loading: loading,
      hasContent: (() => {
        if (!weeklyReadingGoal || weeklyReadingGoal.status !== "active") return false;
        const rgTotal = weeklyReadingGoal.book_total_pages || 0;
        const rgCurrent = weeklyReadingGoal.book_current_page ?? 0;
        const rgBase = readingBase ?? rgCurrent;
        const rgRemainingDays = readingRemainingDays(weeklyReadingGoal.week_start, weeklyReadingGoal.weeks);
        const rgDailyTarget = readingDailyTarget(rgBase, rgTotal, rgRemainingDays);
        const rgChunks = readingChunks(rgDailyTarget);
        const rgHasTarget = rgTotal > 0 && rgTotal - rgBase > 0 && rgChunks.length > 0;
        const totalTodayPages = rgChunks.reduce((a, b) => a + b, 0);
        const isTodayDone = rgHasTarget && rgCurrent >= rgBase + totalTodayPages;
        return !isTodayDone;
      })(),
      hasCompletedOnly: (() => {
        if (!weeklyReadingGoal) return false;
        if (weeklyReadingGoal.status === "completed") return true;
        if (weeklyReadingGoal.status === "active") {
          const rgTotal = weeklyReadingGoal.book_total_pages || 0;
          const rgCurrent = weeklyReadingGoal.book_current_page ?? 0;
          const rgBase = readingBase ?? rgCurrent;
          const rgRemainingDays = readingRemainingDays(weeklyReadingGoal.week_start, weeklyReadingGoal.weeks);
          const rgDailyTarget = readingDailyTarget(rgBase, rgTotal, rgRemainingDays);
          const rgChunks = readingChunks(rgDailyTarget);
          const rgHasTarget = rgTotal > 0 && rgTotal - rgBase > 0 && rgChunks.length > 0;
          const totalTodayPages = rgChunks.reduce((a, b) => a + b, 0);
          return rgHasTarget && rgCurrent >= rgBase + totalTodayPages;
        }
        return false;
      })(),
      card: (() => {
        const isActive = weeklyReadingGoal?.status === "active";
        const isCompleted = weeklyReadingGoal?.status === "completed";
        const isSkipped = weeklyReadingGoal?.status === "skipped";
        const bookTitle = weeklyReadingGoal?.book_title || null;
        const bookCover = weeklyReadingGoal?.book_cover || null;

        const rgTotal = weeklyReadingGoal?.book_total_pages || 0;
        const rgCurrent = weeklyReadingGoal?.book_current_page ?? 0;
        const rgBase = readingBase ?? rgCurrent;
        const rgRemainingDays = weeklyReadingGoal
          ? readingRemainingDays(weeklyReadingGoal.week_start, weeklyReadingGoal.weeks)
          : 1;
        const rgDailyTarget = readingDailyTarget(rgBase, rgTotal, rgRemainingDays);
        const rgChunks = readingChunks(rgDailyTarget);
        const rgHasTarget = rgTotal > 0 && rgTotal - rgBase > 0 && rgChunks.length > 0;
        const totalTodayPages = rgChunks.reduce((a, b) => a + b, 0);
        const isTodayTargetCompleted = isActive && rgHasTarget && rgCurrent >= rgBase + totalTodayPages;

        const emptyText = isCompleted
          ? "Bu hafta tamamlandı 🎉"
          : isTodayTargetCompleted
            ? "Bugünün okuma hedefi tamamlandı 🎉"
            : isSkipped
              ? "Bu hafta pas geçildi"
              : "Bu hafta hedef yok";

        const pressReadingChunk = (i: number) => {
          const cumInc = rgChunks.slice(0, i + 1).reduce((a, b) => a + b, 0);
          const cumExc = rgChunks.slice(0, i).reduce((a, b) => a + b, 0);
          const filled = rgCurrent >= rgBase + cumInc;
          handleReadingUpdate(filled ? rgBase + cumExc : rgBase + cumInc);
        };

        const hasCardContent = isActive && !isTodayTargetCompleted;

        return (
          <HomeSummaryCard
            href="/apps/read-tracker"
            icon={BookOpen}
            color="#7C5C43"
            title="Haftalık Okuma"
            subtitle="Oku Oku"
            loading={loading}
            emptyText={emptyText}
            hasContent={hasCardContent}
            emptyFooter={
              (isCompleted || isTodayTargetCompleted || isSkipped) && bookTitle ? (
                <div className="px-4 py-3 border-t border-app-border space-y-2.5 opacity-70">
                  <div className="flex items-center gap-3">
                    <HomeTaskCheckButton
                      completed
                      onClick={
                        isActive && isTodayTargetCompleted
                          ? () => {
                            const lastChunkExc = rgChunks.slice(0, rgChunks.length - 1).reduce((a, b) => a + b, 0);
                            handleReadingUpdate(rgBase + lastChunkExc);
                          }
                          : undefined
                      }
                      disabled={!isActive || !isTodayTargetCompleted}
                    />
                    {bookCover ? (
                      <img
                        src={bookCover}
                        alt={bookTitle}
                        className="w-9 h-12 object-cover rounded-lg border border-app-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
                        <BookOpen size={16} weight="fill" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black text-app-text truncate ${isCompleted || isTodayTargetCompleted ? "line-through" : ""}`}>
                        {bookTitle}
                      </p>
                      <p className="text-[9px] text-app-muted font-bold truncate">
                        {isCompleted
                          ? "Kitap bitirildi 🎉"
                          : isTodayTargetCompleted
                            ? `Bugün tamamlandı (${rgCurrent}${rgTotal ? ` / ${rgTotal}` : ""} sayfa)`
                            : "Pas geçildi"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : undefined
            }
          >
            {isActive && bookTitle && (
              <div className="px-4 py-3 border-t border-app-border space-y-2.5">
                <div className="flex items-center gap-3">
                  {bookCover ? (
                    <img
                      src={bookCover}
                      alt={bookTitle}
                      className="w-9 h-12 object-cover rounded-lg border border-app-border shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
                      <BookOpen size={16} weight="fill" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-app-text truncate">{bookTitle}</p>
                    <p className="text-[9px] text-app-muted font-bold">
                      {weeklyReadingGoal?.book_current_page !== undefined && weeklyReadingGoal?.book_current_page !== null
                        ? `Sayfa ${weeklyReadingGoal.book_current_page}${weeklyReadingGoal.book_total_pages ? ` / ${weeklyReadingGoal.book_total_pages}` : ""}`
                        : "Bu hafta okunuyor"}
                    </p>
                  </div>
                </div>
                {rgHasTarget && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rgChunks.map((c, i) => {
                      const cumInc = rgChunks.slice(0, i + 1).reduce((a, b) => a + b, 0);
                      const filled = rgCurrent >= rgBase + cumInc;
                      return (
                        <WidgetActionButton
                          key={i}
                          onClick={() => pressReadingChunk(i)}
                          icon={filled ? CheckCircle : Plus}
                          selected={filled}
                        >
                          {c} <span className="normal-case font-bold">syf</span>
                        </WidgetActionButton>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {isActive && !bookTitle && (
              <div className="px-4 py-3 border-t border-app-border space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
                    <BookOpen size={16} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-app-text">Serbest okuma</p>
                    <p className="text-[9px] text-app-muted font-bold">Hedef aktif</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <WidgetActionButton onClick={() => router.push("/apps/read-tracker")} icon={ArrowRight}>
                    Uygulamayı Aç
                  </WidgetActionButton>
                </div>
              </div>
            )}
          </HomeSummaryCard>
        );
      })(),
    },
  ];

  const activeWidgets = widgets.filter((widget) => widget.loading || widget.hasContent);
  const emptyWidgets = widgets
    .filter((widget) => {
      if (widget.key === "suggest" || widget.key === "activities") {
        return false;
      }
      return !widget.loading && !widget.hasContent;
    })
    .sort((a, b) => {
      if (a.hasCompletedOnly === b.hasCompletedOnly) return 0;
      return a.hasCompletedOnly ? -1 : 1;
    });

  return (
    <>
      {activeWidgets.map((widget) => (
        <div key={widget.key}>{widget.card}</div>
      ))}

      {activeWidgets.length > 0 && emptyWidgets.length > 0 && <HomeWidgetsDivider />}

      {emptyWidgets.map((widget) => (
        <div key={widget.key}>{widget.card}</div>
      ))}
    </>
  );
}

function HomeWidgetsDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 border-t border-dashed border-app-border" />
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">—</span>
      <div className="flex-1 border-t border-dashed border-app-border" />
    </div>
  );
}

function HomeTaskCheckButton({
  onClick,
  disabled,
  completed = false,
}: {
  onClick?: () => void;
  disabled?: boolean;
  completed?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-app-surface-muted hover:bg-app-border/30 ${completed ? "text-app-muted" : "text-app-muted hover:text-app-text"
        }`}
    >
      {completed ? (
        <CheckCircle size={18} weight="fill" />
      ) : (
        <CheckCircle size={18} weight="regular" />
      )}
    </button>
  );
}

function WidgetActionButton({
  onClick,
  icon: Icon,
  children,
  loading,
  selected = false,
  iconSize = 10,
}: {
  onClick: () => void;
  icon: ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  children: ReactNode;
  loading?: boolean;
  selected?: boolean;
  iconSize?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer hover:bg-app-surface-muted hover:border-app-muted active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-app-text border-app-border ${selected ? "bg-app-text/10 border-app-text/40 ring-1 ring-app-text/30" : ""
        }`}
    >
      <Icon size={iconSize} weight="bold" />
      {children}
    </button>
  );
}

function HomeSummaryCard({
  href,
  icon: Icon,
  color,
  title,
  subtitle,
  loading,
  emptyText,
  hasContent,
  emptyFooter,
  children,
}: {
  href: string;
  icon: ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  color: string;
  title: string;
  subtitle: string;
  loading: boolean;
  emptyText: string;
  hasContent: boolean;
  emptyFooter?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-app-text tracking-tight">{title}</p>
          <p className="text-[9px] font-bold text-app-muted tracking-wide">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-app-muted hover:text-app-text hover:bg-app-surface-muted active:scale-95 transition-all shrink-0"
          aria-label={`${title} uygulamasını aç`}
        >
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>

      {loading ? (
        <div className="px-4 py-4 border-t border-app-border space-y-2">
          <div className="h-9 bg-app-surface-muted rounded-xl animate-pulse" />
          <div className="h-9 bg-app-surface-muted rounded-xl animate-pulse" />
        </div>
      ) : hasContent ? (
        children
      ) : (
        <div className="border-t border-app-border">
          {!emptyFooter && (
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{emptyText}</p>
            </div>
          )}
          {emptyFooter}
        </div>
      )}
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
        className="w-full flex items-center gap-4 py-3 px-1 transition-all active:scale-[0.98] text-left border-b border-app-border last:border-0 cursor-pointer"
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
          style={{ backgroundColor: app.color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <Icon size={22} weight="fill" className="text-white relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-app-text text-[15px] tracking-tight truncate group-hover:text-app-muted transition-colors mb-0.5">
            {app.cta || app.description}
          </h3>
          <p className="text-[11px] font-medium text-app-muted line-clamp-1 leading-tight">
            {appName}
          </p>
        </div>

        <button
          onClick={onPin}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${isPinned
            ? "text-app-muted hover:text-app-text hover:scale-110"
            : "text-app-muted/30 hover:text-app-muted hover:scale-110"
            }`}
          title={isPinned ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        >
          <Heart size={16} weight={isPinned ? "fill" : "bold"} />
        </button>
      </div>
    </motion.div>
  );
}
