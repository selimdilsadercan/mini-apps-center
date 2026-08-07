"use client";

import { useUser } from "@/contexts/AuthContext";
import {
  MINI_APPS,
  BUSINESS_APPS,
  MiniApp,
  navigateToMiniApp,
} from "@/lib/apps";
import { useRouter, useSearchParams } from "next/navigation";
import {
  VideoCamera,
  Compass,
  Megaphone,
  Coffee,
  MusicNotes,
  House,
  UserCircle,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HomeHeader from "@/components/home/HomeHeader";
import { createBrowserClient } from "@/lib/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "react-hot-toast";
import {
  type rutinler,
  type suggest,
  type recipe,
  type series_track,
  type ev_isleri,
  type read_tracker,
  type buyuk_maclar,
  type ytdb,
  type eksik_var,
  type gym,
  type campus_events,
  type workplaces,
  type places,
  type concert_list,
  type outdoor_activities,
} from "@/lib/client";

// Sub-components
import { DiscoverTab } from "../components/DiscoverTab";

const client = createBrowserClient();

function HomeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
      <div className="h-44 bg-app-surface rounded-2xl border border-app-border" />
    </div>
  );
}

function discoverQueryKey(userId?: string) {
  return ["hub", "discover", userId];
}

export default function TodayPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <TodayPageContent />
    </Suspense>
  );
}

function TodayPageContent() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Pull to Refresh State and Refs
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;
      if (diff > 0 && window.scrollY === 0) {
        if (e.cancelable) e.preventDefault();
        setPullDistance(Math.min(diff * 0.4, 80));
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;
      if (pullDistance >= 50) {
        setIsRefreshing(true);
        Promise.all([
          queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) }),
          queryClient.invalidateQueries({ queryKey: ["film-graph", "daily-suggestions", userId] }),
          queryClient.invalidateQueries({ queryKey: ["diary-summary", userId] }),
        ]).then(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        }).catch(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startYRef.current = e.clientY;
        isPullingRef.current = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const diff = e.clientY - startYRef.current;
      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.4, 80));
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    };

    const handleMouseUp = () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;
      if (pullDistance >= 50) {
        setIsRefreshing(true);
        Promise.all([
          queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) }),
          queryClient.invalidateQueries({ queryKey: ["film-graph", "daily-suggestions", userId] }),
          queryClient.invalidateQueries({ queryKey: ["diary-summary", userId] }),
        ]).then(() => {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 600);
        }).catch(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [userId, isRefreshing, pullDistance, queryClient]);

  // Real-time synchronization: discover widgets
  const discoverQuery = useQuery({
    queryKey: discoverQueryKey(userId),
    queryFn: () => client.hub.getDiscoverWidgets({ userId }),
    enabled: isLoaded,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const eventsQuery = useQuery({
    queryKey: ["campus-events-all", userId],
    queryFn: () => client.campus_events.getEvents({ userId: userId || undefined }),
    enabled: isLoaded,
  });

  const placesQuery = useQuery({
    queryKey: ["workplaces-all", userId],
    queryFn: () => client.workplaces.listPlaces({ userId: userId || undefined, city: "kahramanmaras" }),
    enabled: isLoaded,
  });

  const upcomingConcertsQuery = useQuery({
    queryKey: ["upcoming-concerts-all"],
    queryFn: () => client.concert_list.getUpcomingConcerts(),
    enabled: isLoaded,
  });

  const outdoorVenuesQuery = useQuery({
    queryKey: ["outdoor-venues-all"],
    queryFn: () => client.outdoor_activities.getVenues({}),
    enabled: isLoaded,
  });

  const dailyMoviesQuery = useQuery({
    queryKey: ["film-graph", "daily-suggestions", userId],
    queryFn: () => client.film_graph.getDailySuggestions(userId || ""),
    enabled: isLoaded && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  const diarySummaryQuery = useQuery({
    queryKey: ["diary-summary", userId, new Date().getFullYear(), new Date().getMonth() + 1],
    queryFn: () => client.diary.getSummary(
      userId || "",
      new Date().getFullYear(),
      new Date().getMonth() + 1
    ),
    enabled: isLoaded && !!userId,
  });

  const handleResetMovieSuggestions = async () => {
    if (!userId) return;
    try {
      await client.film_graph.resetDailySuggestions({ userId });
      toast.success("Bugünün film önerileri yenilendi!");
      void queryClient.invalidateQueries({ queryKey: ["film-graph", "daily-suggestions", userId] });
    } catch (err: any) {
      toast.error(`Sıfırlama hatası: ${err.message || "Bilinmeyen hata"}`);
    }
  };

  const data: any = discoverQuery.data;
  const loading = discoverQuery.isLoading;
  const isHomeLoading = !isLoaded || loading;

  const { isAdmin } = useIsAdmin();
  const hasBusinesses = data?.user?.hasBusinesses || false;
  const suggestions = data?.suggestions || [];
  const activities = data?.activities || [];
  const todaySeries: series_track.TodaySeriesItem[] = data?.todaySeries || [];
  const todayGymPlan = data?.todayGymPlan || null;
  const todayMeals = data?.todayMeals || [];
  const todayAgenda = data?.todayAgenda || [];
  const weeklyChores = data?.weeklyChores || null;
  const weeklyReadingGoal = data?.weeklyReadingGoal || null;
  const todayMatches: buyuk_maclar.BigMatch[] = data?.todayMatches || [];
  const youtubeSeries: ytdb.Series[] = data?.youtubeSeries || [];
  const eksikItems: eksik_var.MissingItem[] = data?.eksikItems || [];
  const hasFollowedSeries = data?.hasFollowedSeries || false;
  const events = eventsQuery.data?.events || [];
  const places = placesQuery.data?.places || [];
  const cafeRestaurantPlaces = places.filter((p) => {
    const venueTypes = p.types || [];
    return venueTypes.some(type => ["cafe", "restaurant", "dessert", "library"].includes(type));
  });
  const upcomingConcerts = upcomingConcertsQuery.data?.concerts || [];
  const outdoorVenues = outdoorVenuesQuery.data?.venues || [];

  const movieSuggestions = useMemo(() => {
    const list = [];
    if (dailyMoviesQuery.data?.movie1) list.push(dailyMoviesQuery.data.movie1);
    if (dailyMoviesQuery.data?.movie2) list.push(dailyMoviesQuery.data.movie2);
    if (dailyMoviesQuery.data?.movie3) list.push(dailyMoviesQuery.data.movie3);
    return list;
  }, [dailyMoviesQuery.data]);

  const moviesLoading = dailyMoviesQuery.isLoading;

  return (
    <>
      <HomeHeader
        activeTab="discover"
        isLoaded={isLoaded}
        user={user}
        isAdmin={isAdmin}
        hasBusinesses={hasBusinesses}
      />

      {/* Pull to Refresh Indicator */}
      <div
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-150 ease-out bg-app-bg md:hidden"
        style={{
          height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? 48 : 0)}px` : "0px",
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-app-muted text-[10px] font-black uppercase tracking-wider py-2">
          <div
            className={`w-4 h-4 border-2 border-app-border border-t-red-500 rounded-full ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 4}deg)`,
            }}
          />
          <span>{isRefreshing ? "Yenileniyor..." : pullDistance >= 50 ? "Bırak ve Yenile" : "Yenilemek için çek"}</span>
        </div>
      </div>

      <main className="px-4 md:px-8 pt-4 pb-2 max-w-lg md:max-w-4xl mx-auto w-full">
        {isHomeLoading ? (
          <HomeSkeleton />
        ) : (
          <DiscoverTab
            isAdmin={isAdmin}
            events={events}
            places={places}
            cafeRestaurantPlaces={cafeRestaurantPlaces}
            upcomingConcerts={upcomingConcerts}
            outdoorVenues={outdoorVenues}
            loading={loading}
            userId={userId}
            actionLoading={null}
            todayAgenda={todayAgenda}
            agendaEmptyText="Bugün yapılacak görev yok"
            getAgendaPeriodLabel={(item) => item.period_type === "once" ? "Tek Seferlik" : "Rutin"}
            handleToggleAgendaComplete={async (id, completed) => {
              await client.rutinler.toggleCompletion({ entryId: id, userId: userId || "", completed });
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            handlePostponeAgendaItem={async (id) => {
              await client.rutinler.postponeEntry({ entryId: id, userId: userId || "" });
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            suggestions={suggestions}
            getSuggestionCategoryLabel={(cat) => "Öneri"}
            handleSuggestionStatus={async (shareId, status) => {
              await client.suggest.updateStatus({ recipientClerkId: userId || "", suggestionId: shareId, status });
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            activities={activities}
            handleActivityRespond={async (id, response) => {
              await client.kim_gelir.respondToActivity({ activityId: id, userId: userId || "", status: response, selectedOptions: [] });
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            todaySeries={todaySeries}
            pendingAvailableSeries={todaySeries.filter((s: series_track.TodaySeriesItem) => !s.isWatched)}
            completedTodaySeries={todaySeries.filter((s: series_track.TodaySeriesItem) => s.isWatched)}
            pendingSeriesWidget={todaySeries.some((s: series_track.TodaySeriesItem) => !s.isWatched)}
            seriesEmptyText="Bugün bölüm yok"
            seriesTrackHref="/apps/series-track"
            formatSeriesAirLabel={(dateStr) => "Bugün"}
            openSeriesWatch={(item) => {}}
            handleToggleWatched={async (item) => {
              await client.series_track.toggleEpisodeWatched({ userId: userId || "", seriesId: item.seriesId, seasonNumber: item.season, episodeNumber: item.episode });
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            handleIgnoreSeriesToday={(item) => {}}
            renderCompletedSeriesRow={(item) => <div key={item.id}>{item.title}</div>}
            todayGymPlan={todayGymPlan}
            pendingTodayGym={!!todayGymPlan && !todayGymPlan.completedToday}
            completedTodayGym={!!todayGymPlan && todayGymPlan.completedToday}
            gymEmptyText="Bugün dinlenme günü"
            startGymSession={(name, id, exercises) => {}}
            todayMeals={todayMeals}
            sortedTodayMeals={todayMeals}
            completedMealIds={[]}
            allTodayMealsCompleted={false}
            pendingMealsWidget={todayMeals.length > 0}
            needsMealPlanning={false}
            mealPlanningPrompt=""
            mealsEmptyText="Bugün plan yok"
            getMealTypeLabel={(type) => "Yemek"}
            handleToggleMealCompleted={(mealKeyOrKeys) => {}}
            weeklyReadingGoal={weeklyReadingGoal}
            readingBase={0}
            readingRemainingDays={() => 1}
            readingDailyTarget={() => 5}
            readingChunks={() => [30]}
            handleReadingUpdate={async (pages) => {}}
            weeklyChores={weeklyChores}
            pendingTodayChores={[]}
            completedTodayChores={[]}
            choresEmptyText="Bugün görev yok"
            handleToggleChoreComplete={async (id) => {
              await client.ev_isleri.toggleAssignmentComplete(id, userId || "");
              void queryClient.invalidateQueries({ queryKey: discoverQueryKey(userId) });
            }}
            todayMatches={todayMatches}
            youtubeSeries={youtubeSeries}
            movieSuggestions={movieSuggestions}
            moviesLoading={moviesLoading}
            onResetMovieSuggestions={handleResetMovieSuggestions}
            eksikItems={eksikItems}
            hasFollowedSeries={hasFollowedSeries}
            diarySummary={diarySummaryQuery.data || null}
          />
        )}
      </main>
    </>
  );
}
