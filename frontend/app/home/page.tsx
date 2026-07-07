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
  Prohibit,
  MapPin,
  Megaphone,
  ArrowRight,
  Coffee,
  Calendar,
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
  CheckCircle
} from "@phosphor-icons/react";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppBar, { ActivePage } from "@/components/AppBar";
import { useTranslations } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useHome } from "@/contexts/HomeContext";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import { 
  workplaces, 
  campus_events, 
  series_track, 
  hub,
  subcenter,
  budget,
  tasarruf_challenges,
  suggest,
  kim_gelir
} from "@/lib/client";
import Link from "next/link";

const client = createBrowserClient();

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </main>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { isLoaded, user } = useUser();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("home");
  const tApps = useTranslations("apps");

  const activeTab = searchParams.get("tab") || "discover";

  // Store active tab in localStorage to remember it when coming back from mini apps
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_active_tab", activeTab);
      // Clear business back target when we are on the home hub
      localStorage.removeItem("last_business_url");
    }
  }, [activeTab]);

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
  
  // Integrated Content State
  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [events, setEvents] = useState<campus_events.CampusEvent[]>([]);
  const [userSeries, setUserSeries] = useState<series_track.UserSeries[]>([]);
  const [subscriptions, setSubscriptions] = useState<subcenter.Subscription[]>([]);
  const [budgetProjects, setBudgetProjects] = useState<budget.Project[]>([]);
  const [savingsStats, setSavingsStats] = useState<tasarruf_challenges.StatsResponse | null>(null);
  const [suggestions, setSuggestions] = useState<suggest.InboxSuggestion[]>([]);
  const [activities, setActivities] = useState<kim_gelir.Activity[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    const implementedApps = MINI_APPS.filter((app) => app.isImplemented && !app.isCancelled);
    setApps(implementedApps);
  }, []);

  const fetchIntegratedContent = useCallback(async () => {
    // Fetch content for all tabs that need it
    try {
      setLoadingContent(true);
      
      const res = await client.hub.getHomeWidgets({ userId: user?.id });

      setPlaces(res.places?.slice(0, 6) || []);
      setEvents(res.events?.slice(0, 6) || []);
      
      // Sort series by updated_at and prioritize "watching" status
      const sortedSeries = (res.series || []).sort((a: any, b: any) => {
        if (a.status === "watching" && b.status !== "watching") return -1;
        if (a.status !== "watching" && b.status === "watching") return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      setUserSeries(sortedSeries.slice(0, 2));
      
      setSubscriptions(res.subscriptions?.slice(0, 6) || []);
      setBudgetProjects(res.budgetProjects?.slice(0, 6) || []);
      setSavingsStats(res.savingsStats);
      setSuggestions(res.suggestions || []);
      setActivities(res.activities || []);
    } catch (err) {
      console.error("Failed to fetch integrated content:", err);
    } finally {
      setLoadingContent(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded) {
      fetchIntegratedContent();
    }
  }, [isLoaded, fetchIntegratedContent]);

  const hobbyApps = useMemo(() => {
    return apps.filter(app => app.category === "Eğlence & Hobi");
  }, [apps]);

  const socialApps = useMemo(() => {
    return apps.filter(app => app.category === "Sosyal");
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
    const order = ["eksik-var", "meal-planner"];
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

  if (!isLoaded || !isDataLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
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
          </div>
        </section>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "discover" && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Special Admin/Business Section */}
              {(isAdmin || hasBusinesses) && (
                <section className="space-y-1">
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
                </section>
              )}

              {/* Events Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Megaphone size={14} weight="bold" className="text-gray-900" />
                    Yaklaşan Etkinlikler
                  </h2>
                  <Link href="/apps/campus-events" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                    Tümünü Gör
                  </Link>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
                  {loadingContent ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="w-64 h-40 bg-white rounded-3xl animate-pulse shrink-0 border border-gray-100" />
                    ))
                  ) : events.length > 0 ? (
                    events.map(event => (
                      <Link 
                        key={event.id} 
                        href={`/apps/campus-events/event?id=${event.id}`}
                        className="w-64 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm shrink-0 group active:scale-[0.98] transition-all"
                      >
                        <div className="h-32 relative overflow-hidden bg-gray-50">
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <Megaphone size={40} weight="fill" />
                            </div>
                          )}
                                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-gray-900 uppercase tracking-wider border border-white/50">
                                    {new Date(event.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                                  </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{event.title}</h3>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate flex items-center gap-1">
                            <MapPin size={10} weight="fill" />
                            {event.location}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="w-full py-10 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Henüz etkinlik yok</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Places Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Coffee size={14} weight="bold" className="text-gray-900" />
                    Popüler Mekanlar
                  </h2>
                  <Link href="/apps/workplaces" className="text-[10px] font-black text-gray-900 uppercase tracking-wider hover:underline">
                    Keşfet
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {loadingContent ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
                    ))
                  ) : places.length > 0 ? (
                    places.map(place => (
                      <Link 
                        key={place.id} 
                        href={`/apps/workplaces/place?placeId=${place.id}`}
                        className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all group"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-50">
                          {place.image_url ? (
                            <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                              <MapPin size={24} weight="fill" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">{place.name}</h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                      {place.district}
                                    </span>
                            {place.rating && (
                              <span className="text-[9px] font-black text-gray-400 flex items-center gap-0.5">
                                ★ {place.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={16} weight="bold" className="text-gray-300 group-hover:text-gray-900 transition-colors" />
                      </Link>
                    ))
                  ) : (
                    <div className="w-full py-10 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mekan bulunamadı</p>
                    </div>
                  )}
                </div>
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
                    {userSeries.map(series => (
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

              {/* Arkadaşlarınla Section (Social) */}
              {socialApps.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Users size={14} weight="bold" className="text-gray-900" />
                      Arkadaşlarınla
                    </h2>
                  </div>
                  <div className="space-y-0">
                    {socialApps.map((app, index) => (
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
