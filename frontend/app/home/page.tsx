"use client";

import { useUser } from "@clerk/clerk-react";
import { MINI_APPS, MiniApp, navigateToMiniApp, AppCategory } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { 
  Sparkle, 
  Heart,
  Storefront,
  ShieldCheck,
  ChatTeardropDots,
  MagnifyingGlass,
  UserCircle,
  Prohibit,
  MapPin,
  ArrowRight,
  Compass,
  Wallet,
  Users,
  Star,
  TrendUp,
  List,
  CreditCard,
  ChartBar,
  PiggyBank,
  Wrench,
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
  Broom,
  Clock,
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
  rutinler,
  workplaces, 
  series_track, 
  hub,
  subcenter,
  budget,
  tasarruf_challenges,
  suggest,
  kim_gelir,
  gym,
  recipe,
  ev_isleri,
} from "@/lib/client";
import Link from "next/link";
import { startGymSession } from "@/app/apps/gym/types";
import {
  getIsoWeekday,
} from "@/app/apps/ev-isleri/types";

const client = createBrowserClient();

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-[#FAF9F7] pb-32">
        <AppBar activePage={ActivePage.HOME} />
        <main className="px-5 py-2 max-w-lg mx-auto w-full">
          <section className="mt-8 mb-8 flex items-center justify-between">
            <div className="flex flex-col">
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </section>
          <HomeSkeleton />
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
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

  const [activeTab, setActiveTab] = useState<string>("discover");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const queryTab = searchParams.get("tab");
      if (queryTab) {
        setActiveTab(queryTab);
        localStorage.setItem("last_active_tab", queryTab);
        // Clear tab from query parameters to keep URL clean
        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
      } else {
        const stored = localStorage.getItem("last_active_tab");
        if (stored) {
          setActiveTab(stored);
        }
      }
      // Clear business back target when we are on the home hub
      localStorage.removeItem("last_business_url");
    }
  }, [searchParams]);

  const { 
    pinnedIds, 
    lastUsed, 
    usageCounts, 
    isDataLoaded, 
    hasBusinesses,
    updateAppUsage, 
    togglePin: contextTogglePin 
  } = useHome();

  const [apps, setApps] = useState<MiniApp[]>([]);
  
  // Queries
  const discoverQuery = useQuery({
    queryKey: ["hub", "discover", user?.id],
    queryFn: () => client.hub.getDiscoverWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "discover",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const exploreQuery = useQuery({
    queryKey: ["hub", "explore", user?.id],
    queryFn: () => client.hub.getExploreWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "explore",
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const hobbyQuery = useQuery({
    queryKey: ["hub", "hobby", user?.id],
    queryFn: () => client.hub.getHobbyWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "hobby",
    staleTime: 5 * 60 * 1000,
  });

  const walletQuery = useQuery({
    queryKey: ["hub", "wallet", user?.id],
    queryFn: () => client.hub.getWalletWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "wallet",
    staleTime: 5 * 60 * 1000,
  });

  const lifeQuery = useQuery({
    queryKey: ["hub", "life", user?.id],
    queryFn: () => client.hub.getLifeWidgets({ userId: user?.id }),
    enabled: !!user?.id && activeTab === "life",
    staleTime: 5 * 60 * 1000,
  });

  // Derived state from queries
  const suggestions = discoverQuery.data?.suggestions || lifeQuery.data?.suggestions || [];
  const activities = discoverQuery.data?.activities || lifeQuery.data?.activities || [];
  const todaySeries = discoverQuery.data?.todaySeries || [];
  const todayGymPlan = discoverQuery.data?.todayGymPlan || null;
  const todayMeals = discoverQuery.data?.todayMeals || [];
  const todayAgenda = discoverQuery.data?.todayAgenda || [];
  const weeklyChores = discoverQuery.data?.weeklyChores || null;
  const places = exploreQuery.data?.places || [];
  const userSeries = hobbyQuery.data?.series || [];
  const subscriptions = walletQuery.data?.subscriptions || [];
  const budgetProjects = walletQuery.data?.budgetProjects || [];
  const savingsStats = walletQuery.data?.savingsStats || null;

  const loading = useMemo(() => {
    if (activeTab === "discover") return discoverQuery.isLoading;
    if (activeTab === "explore") return exploreQuery.isLoading;
    if (activeTab === "hobby") return hobbyQuery.isLoading;
    if (activeTab === "wallet") return walletQuery.isLoading;
    if (activeTab === "life") return lifeQuery.isLoading;
    return false;
  }, [activeTab, discoverQuery.isLoading, exploreQuery.isLoading, hobbyQuery.isLoading, walletQuery.isLoading, lifeQuery.isLoading]);

  useEffect(() => {
    const implementedApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);
    setApps(implementedApps);
  }, []);

  const hobbyApps = useMemo(() => {
    return apps.filter(app => app.category === "Eğlence & Hobi");
  }, [apps]);

  const exploreApps = useMemo(() => {
    return apps.filter(app => app.category === "Şehrini Keşfet");
  }, [apps]);

  const walletApps = useMemo(() => {
    return MINI_APPS.filter(app => 
      app.category === "Finans & Tasarruf" && 
      (!app.isCancelled || ["subcenter", "tasarruf-challenges", "budget"].includes(app.id))
    );
  }, []);

  const lifeApps = useMemo(() => {
    const order = ["eksik-var", "ev-isleri", "rutinler", "meal-planner", "gym"];
    return apps
      .filter((app) => app.category === "Kampüslülere Özel")
      .sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
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
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] pb-32">
      <AppBar activePage={getActivePage()} />
      
      <main className="px-5 py-2 max-w-lg mx-auto w-full">
          {/* Header Section */}
          <section className="mt-8 mb-8 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-[1000] text-gray-900 tracking-tighter uppercase leading-none">
                Everything
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                {activeTab === "discover" ? "Bugün" : 
                 activeTab === "explore" ? "Şehrini Keşfet" : 
                 activeTab === "hobby" ? "Hobi" : 
                 activeTab === "wallet" ? "Cüzdan" : "Yaşam"}
              </p>
            </div>
          <div className="flex items-center gap-2">
            {!isLoaded ? (
              <>
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <Skeleton className="w-10 h-10 rounded-full" />
              </>
            ) : (
              <>
                {isAdmin && (
                  <button
                    onClick={() => router.push("/admin")}
                    title="Yönetim Paneli"
                    className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50"
                  >
                    <ShieldCheck size={20} weight="bold" />
                  </button>
                )}
                {(isAdmin || hasBusinesses) && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    title="İşletme Paneli"
                    className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50"
                  >
                    <Storefront size={20} weight="bold" />
                  </button>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => router.push("/home/list")}
                    className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50"
                  >
                    <List size={20} weight="bold" />
                  </button>
                )}
                <button 
                  onClick={() => router.push("/profile")}
                  className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-all"
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={40} weight="fill" className="text-gray-300" />
                  )}
                </button>
              </>
            )}
          </div>
        </section>

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
                  userId={user?.id}
                  loading={loading}
                />
              </section>

              {/* Pratik Araçlar Section (Tools) */}
              {toolsApps.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Wrench size={14} weight="bold" className="text-gray-900" />
                      Pratik Araçlar
                    </h2>
                  </div>
                  <div className="space-y-0">
                    {toolsApps.map((app, index) => (
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

          {activeTab === "explore" && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Featured Places for Explore */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Star size={14} weight="bold" className="text-gray-900" />
                    Öne Çıkan Mekanlar
                  </h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                  {places.map(place => (
                    <Link 
                      key={place.id} 
                      href={`/apps/workplaces/place?placeId=${place.id}`}
                      className="w-48 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm shrink-0 active:scale-[0.98] transition-all"
                    >
                      <div className="h-28 bg-gray-50 relative">
                        {place.image_url ? (
                          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <MapPin size={32} weight="fill" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-[11px] font-black text-gray-900 truncate uppercase tracking-tight">{place.name}</h3>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5 truncate">{place.district}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Compass size={14} weight="bold" className="text-gray-900" />
                    Şehrinde Yapabileceklerin
                  </h2>
                </div>
                <div className="space-y-0">
                  {exploreApps.map((app, index) => (
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
            </motion.div>
          )}

          {activeTab === "hobby" && (
            <motion.div
              key="hobby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* User's Series Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <VideoCamera size={14} weight="bold" className="text-gray-900" />
                    Dizilerin
                  </h2>
                  <Link href="/apps/series-track" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                    Tümünü Gör
                  </Link>
                </div>
                
                {userSeries.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {userSeries.slice(0, 2).map(series => (
                      <Link 
                        key={series.id} 
                        href={`/apps/series-track`}
                        className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all group"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                          {series.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w200${series.poster_path}`} alt={series.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <VideoCamera size={24} weight="fill" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{series.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                              {series.status === "watching" ? "İzliyorum" : 
                               series.status === "completed" ? "Bitti" : 
                               series.status === "dropped" ? "Bıraktım" : "İzleyeceğim"}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={16} weight="bold" className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link 
                    href="/apps/series-track"
                    className="w-full py-8 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-gray-200 group active:scale-[0.98] transition-all"
                  >
                    <VideoCamera size={32} weight="thin" className="text-gray-300 mb-2 group-hover:text-[#00aeef] transition-colors" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Henüz dizi eklemedin</p>
                  </Link>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Heart size={14} weight="bold" className="text-gray-900" />
                    Hobi Dünyan
                  </h2>
                </div>
                <div className="space-y-0">
                  {hobbyApps.map((app, index) => (
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
            </motion.div>
          )}

          {activeTab === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Subscriptions Section */}
              {subscriptions.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <CreditCard size={14} weight="bold" className="text-gray-900" />
                      Aktif Aboneliklerin
                    </h2>
                    <Link href="/apps/subcenter" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                      Tümünü Gör
                    </Link>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                    {subscriptions.map(sub => (
                      <Link 
                        key={sub.id} 
                        href="/apps/subcenter"
                        className="w-40 p-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
                      >
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: sub.color }}
                        >
                          <span className="text-xl">{sub.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{sub.name}</h3>
                          <p className="text-[9px] text-gray-400 font-bold mt-1">
                            {sub.price} {sub.currency === "TRY" ? "₺" : sub.currency} / {sub.cycle === "monthly" ? "Ay" : "Yıl"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Budget Projects Section */}
              {budgetProjects.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ChartBar size={14} weight="bold" className="text-gray-900" />
                      Bütçe Projelerin
                    </h2>
                    <Link href="/apps/budget" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                      Tümünü Gör
                    </Link>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                    {budgetProjects.map(project => (
                      <Link 
                        key={project.id} 
                        href={`/apps/budget/project?id=${project.id}`}
                        className="w-48 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm shrink-0 active:scale-[0.98] transition-all text-left"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-inner">
                            {project.emoji || "💰"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{project.name}</h3>
                            <p className="text-[9px] text-gray-400 font-bold">{project.currency}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gray-900 rounded-full" 
                              style={{ width: `${Math.min(((project.totalSpent || 0) / (project.targetBudget || 1)) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                            <span className="text-gray-900">{project.totalSpent || 0} {project.currency}</span>
                            <span className="text-gray-400">{project.targetBudget} {project.currency}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Savings Summary Section */}
              {savingsStats && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <PiggyBank size={14} weight="bold" className="text-gray-900" />
                      Tasarruf Özeti
                    </h2>
                    <Link href="/apps/tasarruf-challenges" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                      Meydan Oku
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendUp size={14} className="text-gray-900" weight="bold" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Toplam Tasarruf</span>
                      </div>
                      <div className="text-lg font-black text-gray-900">{savingsStats.userTotalSavings.toLocaleString()}₺</div>
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkle size={14} className="text-gray-900" weight="bold" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Bu Ay</span>
                      </div>
                      <div className="text-lg font-black text-gray-900">{savingsStats.userMonthSavings.toLocaleString()}₺</div>
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Wallet size={14} weight="bold" className="text-gray-900" />
                    Paranı Yönet
                  </h2>
                </div>
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
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <PaperPlaneTilt size={14} weight="bold" className="text-gray-900" />
                      Gelen Öneriler
                    </h2>
                    <Link href="/apps/suggest" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                      Tümünü Gör
                    </Link>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                    {suggestions.map(suggestion => (
                      <Link 
                        key={suggestion.id} 
                        href={`/apps/suggest/detail?id=${suggestion.shareId}`}
                        className="w-48 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100 shadow-inner">
                            {suggestion.imageUrl ? (
                              <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <PaperPlaneTilt size={20} weight="fill" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{suggestion.title}</h3>
                            <p className="text-[9px] text-gray-400 font-bold truncate">@{suggestion.senderUsername || "birisi"}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
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
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Users size={14} weight="bold" className="text-gray-900" />
                      Aktif Davetlerin
                    </h2>
                    <Link href="/apps/kim-gelir" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                      Tümünü Gör
                    </Link>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                    {activities.map(activity => (
                      <Link 
                        key={activity.id} 
                        href={`/apps/kim-gelir/activity?id=${activity.id}`}
                        className="w-56 bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 text-red-500">
                            <Users size={20} weight="fill" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate">{activity.title}</h3>
                            <p className="text-[9px] text-gray-400 font-bold truncate">{activity.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {activity.responses.slice(0, 3).map((resp, i) => (
                              <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                                {resp.avatar ? (
                                  <img src={resp.avatar} alt={resp.username || ""} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">
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
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                            {activity.timeOption === "custom" ? activity.customTime : activity.timeOption}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkle size={14} weight="bold" className="text-gray-900" />
                    Yaşam
                  </h2>
                </div>
                <div className="space-y-0">
                  {lifeApps.map((app, index) => (
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
            </motion.div>
          )}
        </AnimatePresence>
      )}
      </main>
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

function formatSeriesAirLabels(airDateStr: string) {
  const dt = getSeriesEpisodeAirDateTime(airDateStr);
  return {
    timeLabel: dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
    dateLabel: dt.toLocaleDateString("tr-TR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  };
}

function SeriesAirTimeBadge({ airDate }: { airDate: string }) {
  const { timeLabel, dateLabel } = formatSeriesAirLabels(airDate);
  return (
    <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-red-50 border border-red-100">
      <Clock size={14} weight="fill" className="text-red-500 shrink-0" />
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[10px] font-black text-red-700 tabular-nums">{timeLabel}</span>
        <span className="text-[8px] font-bold text-red-400 capitalize truncate">{dateLabel}</span>
      </div>
    </div>
  );
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

const MEAL_TYPE_ORDER: recipe.MealPlanMeal["mealType"][] = ["breakfast", "lunch", "dinner"];

function HomeSummaryCards({
  suggestions,
  activities,
  todaySeries,
  todayGymPlan,
  todayMeals,
  todayAgenda,
  weeklyChores,
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
  userId?: string;
  loading: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const previewSuggestions = suggestions.slice(0, 2);
  const previewActivities = activities.slice(0, 2);
  const pendingTodayAgenda = todayAgenda.filter((item) => !item.is_completed);
  const completedTodayAgenda = todayAgenda.filter((item) => item.is_completed);
  const previewTodayAgenda = pendingTodayAgenda.slice(0, 4);
  const pendingTodaySeries = todaySeries
    .filter((item) => !item.isWatched)
    .sort((a, b) => {
      const aAired = isSeriesEpisodeAvailableNow(a.airDate);
      const bAired = isSeriesEpisodeAvailableNow(b.airDate);
      if (aAired !== bAired) return aAired ? -1 : 1;
      return 0;
    });
  const completedTodaySeries = todaySeries.filter((item) => item.isWatched);
  const seriesEmptyText = "Bugün bölüm yok";
  const previewTodayMeals = [...todayMeals]
    .filter((meal) => isMealTypeVisibleAtTime(meal.mealType))
    .sort(
      (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType)
    );

  const todayChoresAll = weeklyChores?.assignments || [];
  const pendingTodayChores = todayChoresAll
    .filter((item) => !item.completedAt && item.dayOfWeek === getIsoWeekday())
    .sort((a, b) => a.choreName.localeCompare(b.choreName, "tr"));
  const completedTodayChores = todayChoresAll
    .filter((item) => !!item.completedAt && item.dayOfWeek === getIsoWeekday())
    .sort((a, b) => a.choreName.localeCompare(b.choreName, "tr"));
  const choresEmptyText = !weeklyChores ? "Henüz board yok" : "Bugün görev yok";

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
    try {
      setActionLoading(actionKey);
      const newStatus = !currentStatus;
      await client.rutinler.toggleCompletion({
        entryId,
        userId,
        completed: newStatus,
      });

      queryClient.setQueryData(["hub", "discover", userId], (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          todayAgenda: prev.todayAgenda.map((item: any) => 
            item.id === entryId ? { ...item, is_completed: newStatus } : item
          )
        };
      });

      toast.success(newStatus ? "Tamamlandı" : "İşaret kaldırıldı");
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const widgets = [
    {
      key: "agenda",
      loading: loading,
      hasContent: pendingTodayAgenda.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/rutinler"
          icon={CalendarCheck}
          color="#7C3AED"
          title="Bugünün Planı"
          subtitle="Ajanda"
          loading={loading}
          emptyText="Bugün plan yok"
          hasContent={pendingTodayAgenda.length > 0}
          emptyFooter={
            completedTodayAgenda.length > 0 ? (
              <>
                {completedTodayAgenda.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-t border-gray-50 flex items-center gap-3 opacity-60"
                  >
                    <button
                      type="button"
                      disabled={actionLoading === `agenda-${item.id}`}
                      onClick={() => void handleToggleAgendaComplete(item.id, true)}
                      className="shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 bg-emerald-500 border-emerald-500 text-white"
                    >
                      <CheckCircle size={18} weight="fill" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate text-gray-400 line-through">
                        {item.item_emoji ? `${item.item_emoji} ` : ""}
                        {item.item_name}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold truncate">
                        {item.period_type === "once" ? "Tek Seferlik" : 
                         item.period_type === "daily" ? (item.daily_slot === "morning" ? "Sabah" : item.daily_slot === "afternoon" ? "Öğle" : "Akşam") :
                         item.period_type === "weekly" ? "Haftalık" : "Aylık"}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            ) : undefined
          }
        >
          {previewTodayAgenda.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 border-t border-gray-50 flex items-center gap-3"
            >
              <button
                type="button"
                disabled={actionLoading === `agenda-${item.id}`}
                onClick={() => void handleToggleAgendaComplete(item.id, false)}
                className="shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 bg-gray-50 border-gray-100 text-gray-300 hover:border-emerald-200 hover:text-emerald-500"
              >
                <CheckCircle size={18} weight="regular" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate text-gray-900">
                  {item.item_emoji ? `${item.item_emoji} ` : ""}
                  {item.item_name}
                </p>
                <p className="text-[9px] text-gray-400 font-bold truncate">
                  {item.period_type === "once" ? "Tek Seferlik" : 
                   item.period_type === "daily" ? (item.daily_slot === "morning" ? "Sabah" : item.daily_slot === "afternoon" ? "Öğle" : "Akşam") :
                   item.period_type === "weekly" ? "Haftalık" : "Aylık"}
                </p>
              </div>
            </div>
          ))}
        </HomeSummaryCard>
      ),
    },
    {
      key: "suggest",
      loading: loading,
      hasContent: previewSuggestions.length > 0,
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
            <div key={suggestion.id} className="px-4 py-3 border-t border-gray-50 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                  {suggestion.imageUrl ? (
                    <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <PaperPlaneTilt size={16} weight="fill" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-gray-900 truncate">{suggestion.title}</p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">
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
                    variant="success"
                  >
                    Tamamla
                  </WidgetActionButton>
                )}
                {suggestion.status === "pending" && (
                  <WidgetActionButton
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "ignored")}
                    loading={actionLoading === `suggest-${suggestion.shareId}-ignored`}
                    icon={X}
                    variant="muted"
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
              <div key={activity.id} className="px-4 py-3 border-t border-gray-50 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 text-red-500">
                    <Users size={16} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-900 truncate">{activity.title}</p>
                    <p className="text-[9px] text-gray-400 font-bold truncate">
                      {activity.location || "Konum belirtilmedi"} · {activity.responses.length} yanıt
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "gelirim")}
                    loading={actionLoading === `activity-${activity.id}-gelirim`}
                    icon={Check}
                    variant={myResponse === "gelirim" ? "success" : "default"}
                  >
                    Gelirim
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "belki")}
                    loading={actionLoading === `activity-${activity.id}-belki`}
                    icon={Question}
                    variant={myResponse === "belki" ? "warning" : "default"}
                  >
                    Belki
                  </WidgetActionButton>
                  <WidgetActionButton
                    onClick={() => handleActivityRespond(activity.id, "gelemem")}
                    loading={actionLoading === `activity-${activity.id}-gelemem`}
                    icon={X}
                    variant={myResponse === "gelemem" ? "danger" : "default"}
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
      hasContent: pendingTodaySeries.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/series-track"
          icon={VideoCamera}
          color="#E50914"
          title="Bugünün Dizileri"
          subtitle="SeriesTrack"
          loading={loading}
          emptyText={seriesEmptyText}
          hasContent={pendingTodaySeries.length > 0}
          emptyFooter={
            completedTodaySeries.length > 0 ? (
              <>
                {completedTodaySeries.map((item) => (
                  <div key={item.id} className="px-4 py-3 border-t border-gray-50 space-y-2.5 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
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
                        <p className="text-[11px] font-black text-gray-900 truncate line-through">
                          {item.title}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold truncate">
                          S{item.season} B{item.episode}
                          {item.episodeTitle ? ` · ${item.episodeTitle}` : ""}
                        </p>
                      </div>
                      <SeriesAirTimeBadge airDate={item.airDate} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <WidgetActionButton
                        onClick={() => handleToggleWatched(item)}
                        loading={actionLoading === `series-${item.id}`}
                        icon={CheckCircle}
                        variant="success"
                      >
                        İzlendi
                      </WidgetActionButton>
                    </div>
                  </div>
                ))}
              </>
            ) : undefined
          }
        >
          {pendingTodaySeries.map((item) => {
            const isAired = isSeriesEpisodeAvailableNow(item.airDate);
            const { timeLabel } = formatSeriesAirLabels(item.airDate);
            return (
            <div key={item.id} className={`px-4 py-3 border-t border-gray-50 space-y-2.5 ${!isAired ? "opacity-80" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
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
                  <p className="text-[11px] font-black text-gray-900 truncate">{item.title}</p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">
                    S{item.season} B{item.episode}
                    {item.episodeTitle ? ` · ${item.episodeTitle}` : ""}
                    {" · "}
                    {item.source === "episode-club" ? "Episode Club" : "Yeni Bölüm"}
                  </p>
                </div>
                <SeriesAirTimeBadge airDate={item.airDate} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isAired ? (
                  <>
                    <WidgetActionButton onClick={() => openSeriesWatch(item)} icon={Play}>
                      İzle
                    </WidgetActionButton>
                    <WidgetActionButton
                      onClick={() => handleToggleWatched(item)}
                      loading={actionLoading === `series-${item.id}`}
                      icon={CheckCircle}
                    >
                      İzlendi işaretle
                    </WidgetActionButton>
                  </>
                ) : (
                  <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-wide text-gray-400">
                    {timeLabel}&apos;da yayında
                  </span>
                )}
              </div>
            </div>
            );
          })}
        </HomeSummaryCard>
      ),
    },
    {
      key: "gym",
      loading: loading,
      hasContent: !!todayGymPlan?.routine,
      card: (
        <HomeSummaryCard
          href="/apps/gym"
          icon={Barbell}
          color="#8B5CF6"
          title="Bugünün Antrenmanı"
          subtitle="Gym"
          loading={loading}
          emptyText="Bugün antrenman yok"
          hasContent={!!todayGymPlan?.routine}
        >
          {todayGymPlan?.routine && (
            <div className="px-4 py-3 border-t border-gray-50 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 border border-violet-100 text-violet-600">
                  <Barbell size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-gray-900 truncate">
                    {todayGymPlan.routine.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">
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
                  variant="success"
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
      card: (
        <HomeSummaryCard
          href={
            weeklyChores?.boardId
              ? `/apps/ev-isleri/board/${weeklyChores.boardId}`
              : "/apps/ev-isleri"
          }
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
                      className="px-4 py-3 border-t border-gray-50 flex items-center gap-3 opacity-60"
                    >
                      <button
                        type="button"
                        disabled={actionLoading === `chore-${item.id}`}
                        onClick={() => void handleToggleChoreComplete(item.id)}
                        className="shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 bg-emerald-500 border-emerald-500 text-white"
                      >
                        <CheckCircle size={18} weight="fill" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black truncate text-gray-400 line-through">
                          {item.choreIcon ? `${item.choreIcon} ` : ""}
                          {item.choreName}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold truncate">
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
                className="px-4 py-3 border-t border-gray-50 flex items-center gap-3"
              >
                <button
                  type="button"
                  disabled={actionLoading === `chore-${item.id}`}
                  onClick={() => void handleToggleChoreComplete(item.id)}
                  className="shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 bg-gray-50 border-gray-100 text-gray-300 hover:border-emerald-200 hover:text-emerald-500"
                >
                  <CheckCircle size={18} weight="regular" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate text-gray-900">
                    {item.choreIcon ? `${item.choreIcon} ` : ""}
                    {item.choreName}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">
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
      hasContent: previewTodayMeals.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/recipe/plan"
          icon={ChefHat}
          color="#F97316"
          title="Bugünün Yemek Planı"
          subtitle="Meal Planner"
          loading={loading}
          emptyText="Bugün plan yok"
          hasContent={previewTodayMeals.length > 0}
        >
          {previewTodayMeals.map((meal) => (
            <div key={meal.id} className="px-4 py-3 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100 text-orange-500 font-black text-sm">
                  {meal.title.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-gray-900 truncate">{meal.title}</p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">
                    {getMealTypeLabel(meal.mealType)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </HomeSummaryCard>
      ),
    },
  ];

  const activeWidgets = widgets.filter((widget) => widget.loading || widget.hasContent);
  const emptyWidgets = widgets.filter((widget) => {
    if (widget.key === "suggest" || widget.key === "activities") {
      return false;
    }
    return !widget.loading && !widget.hasContent;
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
      <div className="flex-1 border-t border-dashed border-gray-200" />
      <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">—</span>
      <div className="flex-1 border-t border-dashed border-gray-200" />
    </div>
  );
}

function WidgetActionButton({
  onClick,
  icon: Icon,
  children,
  loading,
  variant = "default",
}: {
  onClick: () => void;
  icon: ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  children: ReactNode;
  loading?: boolean;
  variant?: "default" | "success" | "warning" | "danger" | "muted";
}) {
  const variantClass =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : variant === "warning"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : variant === "danger"
          ? "bg-rose-50 text-rose-700 border-rose-100"
          : variant === "muted"
            ? "bg-gray-50 text-gray-500 border-gray-100"
            : "bg-white text-gray-900 border-gray-200";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50 ${variantClass}`}
    >
      <Icon size={12} weight="bold" />
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
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} weight="fill" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black text-gray-900 tracking-tight">{title}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all shrink-0"
          aria-label={`${title} uygulamasını aç`}
        >
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>

      {loading ? (
        <div className="px-4 py-4 border-t border-gray-50 space-y-2">
          <div className="h-9 bg-gray-50 rounded-xl animate-pulse" />
          <div className="h-9 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      ) : hasContent ? (
        children
      ) : (
        <div className="border-t border-gray-50">
          {!emptyFooter && (
            <div className="px-4 py-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{emptyText}</p>
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
