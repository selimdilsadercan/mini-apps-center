"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle,
  ClockAfternoon,
  ArrowUpRight,
  PaperPlaneTilt,
  Play,
  BookmarkSimple,
  Check,
  X,
  Users,
  Question,
  VideoCamera,
  EyeSlash,
  Prohibit,
  Barbell,
  ChefHat,
  Notepad,
  Plus,
  BookOpen,
  Broom,
  Basket,
  ArrowRight,
  Compass,
  GameController,
  ListBullets,
  Cards,
  Sparkle,
  Trophy,
  YoutubeLogo,
  FilmStrip,
  ProjectorScreen,
  Archive,
  CaretDown,
  CaretUp,
  ArrowsClockwise,
  Megaphone,
  Coffee,
  MusicNotes,
  Waves,
  Snowflake,
  Tent,
  Target,
  Car,
  Ticket,
  Anchor,
} from "@phosphor-icons/react";
import React, { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { MINI_APPS } from "@/lib/apps";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/api";
import { MOCK_GAMES, mapGameSaveToFrontend } from "../../apps/game-companion/lib/games";
import { useHome } from "@/contexts/HomeContext";
import { toast } from "react-hot-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  HomeSummaryCard,
  HomeTaskCheckButton,
  WidgetActionButton,
  HomeWidgetsDivider,
  HomeGroupHeader,
} from "./common/HomeSummaryCard";
import { PlacesHomeWidget } from "./PlacesHomeWidget";
import { getLinkedAppForRoutine } from "@/app/apps/rutinler/routineAppLinks";
import { isCapacitorIOS } from "@/lib/app-root";

const browserClient = createBrowserClient();

const WIDGET_MASONRY =
  "columns-1 md:columns-2 gap-3 md:gap-4";
const WIDGET_MASONRY_ITEM =
  "break-inside-avoid mb-3 md:mb-4 w-full overflow-hidden min-w-0";

const DEFAULT_MOVIES = [
  { id: "101", title: "Dune: Part Two", year: 2024, voteAverage: 8.6, posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLPoL6VFiH2G2WFiipM32M2Y.jpg" },
  { id: "102", title: "Oppenheimer", year: 2023, voteAverage: 8.9, posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: "103", title: "Interstellar", year: 2014, voteAverage: 8.7, posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
];

interface DiscoverTabProps {
  isAdmin?: boolean;
  events?: any[];
  places?: any[];
  cafeRestaurantPlaces?: any[];
  upcomingConcerts?: any[];
  outdoorVenues?: any[];
  loading: boolean;
  userId?: string;
  actionLoading: string | null;
  // Agenda
  todayAgenda: any[];
  agendaEmptyText: string;
  getAgendaPeriodLabel: (item: any) => string;
  handleToggleAgendaComplete: (id: string, completed: boolean) => Promise<void>;
  handlePostponeAgendaItem: (id: string) => Promise<void>;
  // Suggestions
  suggestions: any[];
  getSuggestionCategoryLabel: (category: any) => string;
  handleSuggestionStatus: (shareId: string, status: any) => Promise<void>;
  // Activities
  activities: any[];
  handleActivityRespond: (id: string, response: any) => Promise<void>;
  // Series
  todaySeries: any[];
  pendingAvailableSeries: any[];
  completedTodaySeries: any[];
  pendingSeriesWidget: boolean;
  seriesEmptyText: string;
  seriesTrackHref: string;
  formatSeriesAirLabel: (dateStr: string) => string;
  openSeriesWatch: (item: any) => void;
  handleToggleWatched: (item: any) => Promise<void>;
  handleIgnoreSeriesToday: (item: any) => void;
  renderCompletedSeriesRow: (item: any) => React.ReactNode;
  // Gym
  todayGymPlan: any;
  pendingTodayGym: boolean;
  completedTodayGym: boolean;
  gymEmptyText: string;
  startGymSession: (name: string, id: string, exercises: any[]) => void;
  // Meals
  todayMeals: any[];
  sortedTodayMeals: any[];
  completedMealIds: string[];
  allTodayMealsCompleted: boolean;
  pendingMealsWidget: boolean;
  needsMealPlanning: boolean;
  mealPlanningPrompt: string;
  mealsEmptyText: string;
  getMealTypeLabel: (type: any) => string;
  handleToggleMealCompleted: (mealKeyOrKeys: string | string[]) => void;
  // Reading
  weeklyReadingGoal: any;
  readingBase: number | null;
  readingRemainingDays: (start: string, weeks?: number) => number;
  readingDailyTarget: (base: number, total: number, days: number) => number;
  readingChunks: (target: number) => number[];
  handleReadingUpdate: (pages: number) => Promise<void>;
  // Chores
  weeklyChores: any;
  pendingTodayChores: any[];
  completedTodayChores: any[];
  choresEmptyText: string;
  handleToggleChoreComplete: (choreId: string) => Promise<void>;
  todayMatches: any[];
  youtubeSeries: any[];
  movieSuggestions: any[];
  moviesLoading: boolean;
  onResetMovieSuggestions?: () => void;
  eksikItems: any[];
  hasFollowedSeries: boolean;
}

import { DeckView } from "./DeckView";
import { ConcertVenueLink } from "@/app/apps/concert-list/components/PlacePicker";
import { NeYapsakWidget } from "./NeYapsakWidget";
import { useMarasSources } from "@/app/apps/kim-gelir/hooks/useMarasSources";

export function DiscoverTab(props: DiscoverTabProps) {
  const {
    isAdmin = false,
    events = [],
    places = [],
    cafeRestaurantPlaces = [],
    upcomingConcerts = [],
    outdoorVenues = [],
    loading,
    userId,
    actionLoading,
    todayAgenda,
    agendaEmptyText,
    getAgendaPeriodLabel,
    handleToggleAgendaComplete,
    handlePostponeAgendaItem,
    suggestions,
    getSuggestionCategoryLabel,
    handleSuggestionStatus,
    activities,
    handleActivityRespond,
    pendingAvailableSeries,
    completedTodaySeries,
    pendingSeriesWidget,
    seriesEmptyText,
    seriesTrackHref,
    formatSeriesAirLabel,
    openSeriesWatch,
    handleToggleWatched,
    handleIgnoreSeriesToday,
    renderCompletedSeriesRow,
    todayGymPlan,
    pendingTodayGym,
    completedTodayGym,
    gymEmptyText,
    startGymSession,
    todayMeals,
    sortedTodayMeals,
    completedMealIds,
    allTodayMealsCompleted,
    pendingMealsWidget,
    needsMealPlanning,
    mealPlanningPrompt,
    mealsEmptyText,
    getMealTypeLabel,
    handleToggleMealCompleted,
    weeklyReadingGoal,
    readingBase,
    readingRemainingDays,
    readingDailyTarget,
    readingChunks,
    handleReadingUpdate,
    weeklyChores,
    pendingTodayChores,
    completedTodayChores,
    choresEmptyText,
    handleToggleChoreComplete,
    todayMatches = [],
    youtubeSeries = [],
    movieSuggestions = [],
    moviesLoading = true,
    onResetMovieSuggestions,
    eksikItems = [],
    hasFollowedSeries,
  } = props;

  const queryClient = useQueryClient();
  const router = useRouter();

  const searchParams = useSearchParams();
  const subTabParam = searchParams?.get("subTab");

  const isIOSApp = useSyncExternalStore(
    () => () => {},
    () => isCapacitorIOS(),
    () => false
  );

  const [subTab, setSubTab] = useState<"explore" | "daily">("explore");

  useEffect(() => {
    if (isIOSApp) {
      setSubTab("explore");
      return;
    }
    if (subTabParam === "explore" || subTabParam === "daily") {
      setSubTab(subTabParam);
    } else {
      setSubTab("explore");
    }
  }, [subTabParam, isIOSApp]);

  const activeSubTab: "explore" | "daily" = isIOSApp ? "explore" : subTab;
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedMaras = async () => {
    try {
      setIsSeeding(true);
      const res = await browserClient.campus_events.seedMarasEvents();
      toast.success(`${res.count} Maraş Fuarı konseri yüklendi!`);
      void queryClient.invalidateQueries({ queryKey: ["campus-events-all", userId] });
    } catch (err: any) {
      toast.error(`Yükleme hatası: ${err.message || "Bilinmeyen hata"}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const gameSavesQuery = useQuery({
    queryKey: ["yazboz", "recent-saves", userId],
    queryFn: () => browserClient.yazboz.getGameSaves(userId || ""),
    enabled: !!userId,
    staleTime: 0,
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const cineverseSessionsQuery = useQuery({
    queryKey: ["film-graph", "cineverse-sessions", todayStr],
    queryFn: async () => {
      const [piazzaRes, arsanRes] = await Promise.all([
        browserClient.film_graph.getCineverseSessions({ date: todayStr, theaterSlug: "piazza-kahramanmaras" }),
        browserClient.film_graph.getCineverseSessions({ date: todayStr, theaterSlug: "kahramanmaras-arsan-sinemasi" }),
      ]);
      const moviesRes = await browserClient.film_graph.getCineverseMovies();
      return {
        sessions: [...(piazzaRes.sessions || []), ...(arsanRes.sessions || [])],
        movies: moviesRes.movies || [],
      };
    },
    staleTime: 60 * 1000,
  });

  const cineverseData = cineverseSessionsQuery.data;
  const sessionsLoading = cineverseSessionsQuery.isLoading;

  const marasSources = useMarasSources(userId);

  const recentGameSaves = useMemo(() => {
    if (!gameSavesQuery.data?.gameSaves) return [];
    return gameSavesQuery.data.gameSaves
      .map(mapGameSaveToFrontend)
      .filter(Boolean)
      .sort((a: any, b: any) => (b.createdTime || 0) - (a.createdTime || 0))
      .slice(0, 5);
  }, [gameSavesQuery.data]);

  const recentGameTemplates = useMemo(() => {
    const playedTemplateIds = new Set<string>();
    const templates: any[] = [];
    
    recentGameSaves.forEach((save: any) => {
      const templateId = save.gameTemplate;
      if (templateId && !playedTemplateIds.has(templateId)) {
        playedTemplateIds.add(templateId);
        const g = MOCK_GAMES.find((game: any) => game._id === templateId);
        if (g) templates.push(g);
      }
    });

    const fallbacks = ["g1", "g6", "g9"]; // 101 Okey, Carcassonne, Catan
    fallbacks.forEach((id) => {
      if (templates.length < 3 && !playedTemplateIds.has(id)) {
        playedTemplateIds.add(id);
        const g = MOCK_GAMES.find((game: any) => game._id === id);
        if (g) templates.push(g);
      }
    });

    return templates.slice(0, 3);
  }, [recentGameSaves]);

  const [viewMode, setViewMode] = useState<"cards" | "list" | "assistant">("list");
  const ignoreMovie = async (movieId: string) => {
    if (!userId) return;
    try {
      await browserClient.film_graph.ignoreFilm({
        userId,
        movieId: String(movieId),
      });
      void queryClient.invalidateQueries({ queryKey: ["film-graph", "daily-suggestions", userId] });
    } catch (e) {
      console.error(e);
      toast.error("Film listeden kaldırılamadı");
    }
  };

  const addHomeMovieToList = async (movie: any, status: "want" | "watched") => {
    if (!userId) return;
    try {
      const dbMovie = {
        movie_id: String(movie.id),
        title: movie.title,
        year: movie.year || 0,
        status: status,
        poster_url: movie.posterUrl || "",
        vote_average: movie.voteAverage || 0,
      };

      await browserClient.film_graph.syncUserFilm({
        userId,
        movie: dbMovie,
      });

      // Maintain local storage compatibility for film-graph app
      const savedData = localStorage.getItem("everything_films");
      let films = [];
      let personsObj = {};
      if (savedData) {
        const parsed = JSON.parse(savedData);
        films = parsed.films || [];
        personsObj = parsed.persons || {};
      }

      const mId = String(movie.id);
      const newFilm = {
        id: mId,
        title: movie.title,
        year: movie.year || 0,
        directorId: movie.directorId || "",
        actorIds: movie.actorIds || [],
        imgUrl: movie.posterUrl,
        overview: movie.overview || "",
        voteAverage: movie.voteAverage || 0,
        status: status
      };

      if (films.some((f: any) => String(f.id) === mId)) {
        films = films.map((f: any) => String(f.id) === mId ? { ...f, status } : f);
      } else {
        films.push(newFilm);
      }

      localStorage.setItem("everything_films", JSON.stringify({ films, persons: personsObj }));

      void queryClient.invalidateQueries({ queryKey: ["film-graph", "daily-suggestions", userId] });
      toast.success(status === "watched" ? "İzledim olarak kaydedildi!" : "İzleneceklere eklendi!");
    } catch (e) {
      console.error(e);
      toast.error("İşlem gerçekleştirilemedi");
    }
  };

  const { dailyWidgetStates, updateDailyWidgetStates } = useHome();
  const hiddenCardIds = dailyWidgetStates?.hiddenCardIds || [];
  const permanentlyHiddenCardIds = dailyWidgetStates?.permanentlyHiddenCardIds || [];

  const getWidgetCardId = (key: string) => {
    const map: Record<string, string> = {
      agenda: "agenda-unified",
      chores: "chores-unified",
      series: "series-unified",
      seriesTrack: "series-unified",
      reading: "read-tracker",
      readTracker: "read-tracker",
      youtubeSeries: "youtube-series-unified",
      matches: "matches-unified",
      gym: "gym-today",
      meals: "meals-today",
    };
    return map[key] || key;
  };

  const isWidgetTodayHidden = (key: string) => {
    return hiddenCardIds.includes(getWidgetCardId(key));
  };

  const isWidgetPermanentlyHidden = (key: string) => {
    return permanentlyHiddenCardIds.includes(getWidgetCardId(key));
  };

  const isWidgetHidden = (key: string) => {
    const cardId = getWidgetCardId(key);
    return hiddenCardIds.includes(cardId) || permanentlyHiddenCardIds.includes(cardId);
  };

  const [isHiddenExpanded, setIsHiddenExpanded] = useState(false);
  const [isPermHiddenExpanded, setIsPermHiddenExpanded] = useState(false);

  const [hideNoticeOpen, setHideNoticeOpen] = useState(false);
  const [pendingHideAction, setPendingHideAction] = useState<{
    cardId: string;
    mode: "today" | "permanent";
  } | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const executeHide = (cardId: string, mode: "today" | "permanent") => {
    if (mode === "today") {
      const newHidden = hiddenCardIds.includes(cardId)
        ? hiddenCardIds.filter((id: string) => id !== cardId)
        : [...hiddenCardIds, cardId];
      const newPerm = permanentlyHiddenCardIds.filter((id: string) => id !== cardId);
      void updateDailyWidgetStates({ hiddenCardIds: newHidden, permanentlyHiddenCardIds: newPerm });
      toast.success("Widget bugünlük gizlendi");
    } else {
      const newPerm = permanentlyHiddenCardIds.includes(cardId)
        ? permanentlyHiddenCardIds.filter((id: string) => id !== cardId)
        : [...permanentlyHiddenCardIds, cardId];
      const newHidden = hiddenCardIds.filter((id: string) => id !== cardId);
      void updateDailyWidgetStates({ permanentlyHiddenCardIds: newPerm, hiddenCardIds: newHidden });
      toast.success("Widget tüm günlerde gizlendi");
    }
  };

  const handleRestoreWidget = (key: string) => {
    const cardId = getWidgetCardId(key);
    const newHidden = hiddenCardIds.filter((id: string) => id !== cardId);
    const newPerm = permanentlyHiddenCardIds.filter((id: string) => id !== cardId);
    void updateDailyWidgetStates({ hiddenCardIds: newHidden, permanentlyHiddenCardIds: newPerm });
    toast.success("Widget tekrar görünür yapıldı");
  };

  const triggerHide = (key: string, mode: "today" | "permanent") => {
    const cardId = getWidgetCardId(key);
    const isNoticeDismissed = localStorage.getItem("everything_hide_notice_dismissed") === "true";
    if (isNoticeDismissed) {
      executeHide(cardId, mode);
    } else {
      setPendingHideAction({ cardId, mode });
      setDontShowAgain(false);
      setHideNoticeOpen(true);
    }
  };

  const confirmHideNotice = () => {
    if (dontShowAgain) {
      localStorage.setItem("everything_hide_notice_dismissed", "true");
    }
    if (pendingHideAction) {
      executeHide(pendingHideAction.cardId, pendingHideAction.mode);
    }
    setHideNoticeOpen(false);
    setPendingHideAction(null);
  };

  const previewSuggestions = suggestions.slice(0, 2);
  const previewActivities = activities.slice(0, 2);
  const pendingTodayAgenda = todayAgenda.filter((item: any) => !item.is_completed);
  const completedTodayAgenda = todayAgenda.filter((item: any) => item.is_completed_today);
  const previewTodayAgenda = pendingTodayAgenda.slice(0, 4);

  const renderCompletedAgendaRow = (item: any) => (
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

  const isYazbozImplemented = MINI_APPS.find((app) => app.id === "game-companion")?.isImplemented !== false;
  const isYtdbImplemented = MINI_APPS.find((app) => app.id === "youtube-series")?.isImplemented !== false;

  const widgets = [
    {
      key: "places-widget",
      title: "Mekanlar",
      icon: Coffee,
      color: "#D97706",
      loading: loading,
      hasContent: (cafeRestaurantPlaces.length > 0 ? cafeRestaurantPlaces : places).some(
        (p: { latitude?: number | null; longitude?: number | null }) =>
          p.latitude != null && p.longitude != null
      ),
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/workplaces/map"
          icon={Coffee}
          color="#D97706"
          title="Mekanlar"
          subtitle="Kahramanmaraş"
          loading={loading}
          emptyText="Mekan bulunamadı"
          hasContent={(cafeRestaurantPlaces.length > 0 ? cafeRestaurantPlaces : places).some(
            (p: { latitude?: number | null; longitude?: number | null }) =>
              p.latitude != null && p.longitude != null
          )}
        >
          <PlacesHomeWidget
            places={cafeRestaurantPlaces.length > 0 ? cafeRestaurantPlaces : places}
          />
        </HomeSummaryCard>
      )
    },
    {
      key: "outdoor-activities-widget",
      title: "Aktiviteler",
      icon: Compass,
      color: "#0F766E",
      loading: loading,
      hasContent: outdoorVenues.length > 0,
      card: (() => {
        const grouped = outdoorVenues.reduce((acc: any, venue: any) => {
          if (!acc[venue.category]) {
            acc[venue.category] = [];
          }
          acc[venue.category].push(venue);
          return acc;
        }, {});

        const CATEGORY_ACTIONS: Record<string, string> = {
          "horse-riding": "Ata Binmeye Git 🏇",
          "canoeing": "Kano Yapmaya Git 🚣",
          "skiing": "Kayak Yapmaya Git ⛷️",
          "camping": "Kampa Git 🏕️",
          "lasertag": "Lasertag Oynamaya Git 🔫",
          "paintball": "Paintball Oynamaya Git 🎯",
          "diving": "Dalış Yapmaya Git 🤿",
          "gokart": "Gokart Sürmeye Git 🏎️",
        };

        const CATEGORY_ICONS: Record<string, any> = {
          "horse-riding": Compass,
          "canoeing": Waves,
          "skiing": Snowflake,
          "camping": Tent,
          "lasertag": Target,
          "paintball": Target,
          "diving": Anchor,
          "gokart": Car,
        };

        return (
          <HomeSummaryCard
            href="/apps/outdoor-activities"
            icon={Compass}
            color="#0F766E"
            title="Aktiviteler"
            subtitle="Aktif Doğa ve Spor Seçenekleri"
            loading={loading}
            emptyText="Aktivite mekanı bulunamadı 🏕️"
            hasContent={outdoorVenues.length > 0}
          >
            {(() => {
              const CATEGORY_ORDER = ["horse-riding", "canoeing", "camping", "lasertag", "paintball", "diving", "gokart", "skiing"];
              const sorted = Object.entries(grouped).sort((a, b) => {
                const idxA = CATEGORY_ORDER.indexOf(a[0]);
                const idxB = CATEGORY_ORDER.indexOf(b[0]);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
              });
              return sorted.slice(0, 3).map(([catId, catVenues]: any) => {
                const actionName = CATEGORY_ACTIONS[catId] || "Aktivite Yap 🌟";
                const CatIcon = CATEGORY_ICONS[catId] || Compass;
                const firstVenue = catVenues[0];

                return (
                  <div
                    key={catId}
                    onClick={() => router.push(`/apps/outdoor-activities?category=${catId}`)}
                    className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-[36px] h-[36px] rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                        <CatIcon size={18} className="text-[#0F766E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-app-text truncate">{actionName}</p>
                        <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                          📍 {firstVenue.name} ({firstVenue.district || firstVenue.city}) {catVenues.length > 1 ? `ve ${catVenues.length - 1} yer daha` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </HomeSummaryCard>
        );
      })()
    },
    {
      key: "cinema-widget",
      title: "Bugün Sinemada",
      icon: Ticket,
      color: "#D97706",
      loading: sessionsLoading,
      hasContent: (cineverseData?.sessions || []).length > 0,
      hasCompletedOnly: false,
      card: (() => {
        const sessions = cineverseData?.sessions || [];
        const movies = cineverseData?.movies || [];
        // Group sessions by movie title and take top 3 movies
        const grouped: Record<string, { title: string; posterUrl: string; times: { time: string; bookingUrl: string | null }[] }> = {};
        sessions.forEach((s: any) => {
          if (!grouped[s.movie_title]) {
            const movie = movies.find((m: any) => m.title === s.movie_title);
            grouped[s.movie_title] = {
              title: s.movie_title,
              posterUrl: movie?.image_url || s.poster_url || "",
              times: [],
            };
          }
          grouped[s.movie_title].times.push({ time: s.time, bookingUrl: s.booking_url });
        });
        const topMovies = Object.values(grouped)
          .sort((a, b) => b.times.length - a.times.length)
          .slice(0, 3);
        return (
          <HomeSummaryCard
            href="/apps/film-graph"
            icon={Ticket}
            color="#D97706"
            title="Bugün Sinemada"
            subtitle="Piazza & Arsan Sineması"
            loading={sessionsLoading}
            emptyText="Bugün için seans bilgisi yok 🎬"
            hasContent={sessions.length > 0}
          >
            {topMovies.map((movie) => (
              <div
                key={movie.title}
                className="px-4 py-3 border-t border-app-border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Ticket size={16} className="text-app-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{movie.title}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {movie.times.slice(0, 4).map(({ time, bookingUrl }) => (
                        <button
                          key={time}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (bookingUrl) window.open(bookingUrl, "_blank");
                            else router.push("/apps/film-graph");
                          }}
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-app-surface border border-app-border text-app-text hover:bg-app-tab-active transition-all cursor-pointer"
                        >
                          {time}
                        </button>
                      ))}
                      {movie.times.length > 4 && (
                        <span className="text-[9px] text-app-muted font-bold">+{movie.times.length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </HomeSummaryCard>
        );
      })(),
    },
    {
      key: "upcoming-concerts-widget",

      title: "Yaklaşan Konserler",
      icon: MusicNotes,
      color: "#FF1493",
      loading: loading,
      hasContent: upcomingConcerts.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/concert-list"
          icon={MusicNotes}
          color="#FF1493"
          title="Yaklaşan Konserler"
          subtitle="Şehirde Canlı Müzik"
          loading={loading}
          emptyText="Yakında konser bulunamadı 🎸"
          hasContent={upcomingConcerts.length > 0}
        >
          {upcomingConcerts.slice(0, 3).map((concert: any) => {
            const concertDate = new Date(concert.date);
            const dateStr = concertDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
            return (
              <div
                key={concert.id}
                onClick={() => router.push(`/apps/concert-list`)}
                className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/30 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                    {concert.imageUrl ? (
                      <img src={concert.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MusicNotes size={16} className="text-app-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{concert.artist}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5 flex items-center gap-1">
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-w-0"
                      >
                        <ConcertVenueLink
                          venue={concert.venue || "Konser Salonu"}
                          placeId={concert.placeId}
                          className="text-[9px] text-app-muted font-bold"
                        />
                      </span>
                      <span className="shrink-0">· {dateStr}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      )
    },
    {
      key: "events-widget",
      title: "Yaklaşan Etkinlikler",
      icon: Megaphone,
      color: "#00aeef",
      loading: loading,
      hasContent: events.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/campus-events"
          icon={Megaphone}
          color="#00aeef"
          title="Yaklaşan Etkinlikler"
          subtitle="Şehirde Neler Var?"
          loading={loading}
          emptyText="Yaklaşan etkinlik yok 🎭"
          hasContent={events.length > 0}
        >
          {events.slice(0, 3).map((event: any) => {
            const eventDate = new Date(event.event_date);
            const dateStr = eventDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
            const timeStr = eventDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div
                key={event.id}
                onClick={() => router.push(`/apps/campus-events/event?id=${event.id}`)}
                className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/30 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                    {event.image_url ? (
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Megaphone size={16} className="text-app-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{event.title}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                      {event.location || "Şehir Etkinliği"} · {dateStr} · {timeStr}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      )
    },
    {
      key: "yazboz-widget",
      title: "Masa Oyunu Oynayın",
      icon: GameController,
      color: "#3B82F6",
      loading: loading || gameSavesQuery.isLoading,
      hasContent: isYazbozImplemented,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/game-companion"
          icon={GameController}
          color="#3B82F6"
          title="Bir Masa Oyunu Oynayın"
          subtitle="Yazboz"
          loading={loading || gameSavesQuery.isLoading}
          emptyText=""
          hasContent={isYazbozImplemented}
          onHideToday={() => triggerHide("yazboz-widget", "today")}
          onHidePermanent={() => triggerHide("yazboz-widget", "permanent")}
          isTodayHidden={isWidgetTodayHidden("yazboz-widget")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("yazboz-widget")}
          onRestore={() => handleRestoreWidget("yazboz-widget")}
        >
          {recentGameTemplates.map((game: any) => (
            <div 
              key={game._id} 
              onClick={() => {
                router.push(`/apps/game-companion/create-game?gameId=${game._id}`);
              }}
              className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/30 active:bg-app-surface-muted/60 transition-all select-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center text-lg shrink-0">
                  {game.emoji || "🎲"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-app-text truncate capitalize">{game.name}</p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    {game.listName || "Masa Oyunu"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </HomeSummaryCard>
      ),
    },
    {
      key: "eksik-var",
      title: "Alışveriş Listem",
      icon: Basket,
      color: "#10B981",
      loading: loading,
      hasContent: (() => {
        const hasUsed = eksikItems && eksikItems.length > 0;
        if (!hasUsed) return true;
        const activeMissing = (eksikItems || []).filter((i: any) => !i.is_used);
        const todayItems = activeMissing.filter((i: any) => (i.timing || "today") === "today");
        const monthItems = activeMissing.filter((i: any) => (i.timing || "today") === "month_start");
        return todayItems.length > 0 || monthItems.length > 0;
      })(),
      hasCompletedOnly: false,
      card: (() => {
        const hasUsed = eksikItems && eksikItems.length > 0;
        const activeMissing = (eksikItems || []).filter((i: any) => !i.is_used);
        const todayItems = activeMissing.filter((i: any) => (i.timing || "today") === "today");
        const monthItems = activeMissing.filter((i: any) => (i.timing || "today") === "month_start");

        const formatItemsLine = (items: any[]) => {
          if (items.length === 0) return "";
          if (items.length <= 2) {
            return items.map((i) => i.name).join(", ");
          }
          const firstTwo = items.slice(0, 2).map((i) => i.name).join(", ");
          return `${firstTwo}, +${items.length - 2} ürün`;
        };

        const hasContent = !hasUsed || todayItems.length > 0 || monthItems.length > 0;

        return (
          <HomeSummaryCard
            href="/apps/eksik-var"
            icon={Basket}
            color="#10B981"
            title="Alışveriş Listem"
            subtitle="Eksik Var"
            loading={loading}
            emptyText="Tüm eksikler tamamlandı! 🛒"
            hasContent={hasContent}
            onHideToday={() => triggerHide("eksik-var", "today")}
            onHidePermanent={() => triggerHide("eksik-var", "permanent")}
            isTodayHidden={isWidgetTodayHidden("eksik-var")}
            isPermanentlyHidden={isWidgetPermanentlyHidden("eksik-var")}
            onRestore={() => handleRestoreWidget("eksik-var")}
          >
            {!hasUsed ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                  <Basket size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text">Listeniz Boş</p>
                  <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                    Henüz listenize ürün eklemediniz. İhtiyaçlarınızı kaydetmek için tıklayın.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {todayItems.length > 0 && (
                  <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <Basket size={16} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-app-text">Bugün Alınacaklar</p>
                      <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                        {formatItemsLine(todayItems)}
                      </p>
                    </div>
                  </div>
                )}
                {monthItems.length > 0 && (
                  <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                      <Basket size={16} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-app-text">Ay Başı Alınacaklar</p>
                      <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                        {formatItemsLine(monthItems)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </HomeSummaryCard>
        );
      })(),
    },
    {
      key: "agenda",
      title: "Rutinler",
      icon: CalendarCheck,
      color: "#6366F1",
      loading: loading,
      hasContent: (() => {
        const hasUsed = todayAgenda && todayAgenda.length > 0;
        if (!hasUsed) return true;
        return pendingTodayAgenda.length > 0;
      })(),
      hasCompletedOnly: completedTodayAgenda.length > 0,
      card: (
        <HomeSummaryCard
          href="/apps/rutinler"
          icon={CalendarCheck}
          color="#7C3AED"
          title="Bugünün Yapılacakları"
          subtitle="Ajanda"
          loading={loading}
          emptyText={agendaEmptyText}
          hasContent={todayAgenda.length === 0 || pendingTodayAgenda.length > 0}
          onHideToday={() => triggerHide("agenda", "today")}
          onHidePermanent={() => triggerHide("agenda", "permanent")}
          isTodayHidden={isWidgetTodayHidden("agenda")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("agenda")}
          onRestore={() => handleRestoreWidget("agenda")}
          emptyFooter={
            todayAgenda.length > 0 && !pendingTodayAgenda.length && completedTodayAgenda.length > 0 ? (
              <>{completedTodayAgenda.map(renderCompletedAgendaRow)}</>
            ) : undefined
          }
        >
          {todayAgenda.length === 0 ? (
            <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <CalendarCheck size={16} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-app-text">Göreviniz Yok</p>
                <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                  Henüz bir rutin eklemediniz. Günlük alışkanlıklarınızı ve görevlerinizi takip etmek için tıklayın.
                </p>
              </div>
            </div>
          ) : (
            previewTodayAgenda.map((item: any) => (
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

                  {(() => {
                    const linkedApp = getLinkedAppForRoutine(item.item_name);
                    if (!linkedApp) return null;
                    return (
                      <WidgetActionButton
                        onClick={() => router.push(linkedApp.appHref)}
                        icon={ArrowUpRight}
                      >
                        {linkedApp.label}
                      </WidgetActionButton>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
          {todayAgenda.length > 0 && pendingTodayAgenda.length > 0 &&
            completedTodayAgenda.map(renderCompletedAgendaRow)}
        </HomeSummaryCard>
      ),
    },
    {
      key: "suggest",
      title: "Sana Öneriler",
      icon: PaperPlaneTilt,
      color: "#8B5CF6",
      loading: loading,
      hasContent: previewSuggestions.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/suggest"
          icon={PaperPlaneTilt}
          color="#EC4899"
          title="Sana Özel Öneriler"
          subtitle="Tavsiyeler"
          loading={loading}
          emptyText="Henüz sana gelen yeni bir öneri yok ✨"
          hasContent={previewSuggestions.length > 0}
          onHideToday={() => triggerHide("suggest", "today")}
          onHidePermanent={() => triggerHide("suggest", "permanent")}
          isTodayHidden={isWidgetTodayHidden("suggest")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("suggest")}
          onRestore={() => handleRestoreWidget("suggest")}
        >
          {previewSuggestions.map((suggestion: any) => (
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
      key: "ne-yapsak",
      title: "Ne Yapsak?",
      icon: Users,
      color: "#FF5252",
      loading: loading || marasSources.loading,
      hasContent: marasSources.suggestions.length > 0 || previewActivities.length > 0,
      hasCompletedOnly: false,
      card: (
        <NeYapsakWidget
          suggestions={marasSources.suggestions}
          suggestionsLoading={marasSources.loading}
          activities={activities}
          userId={userId}
          actionLoading={actionLoading}
          onRespond={handleActivityRespond}
          onHideToday={() => triggerHide("ne-yapsak", "today")}
          onHidePermanent={() => triggerHide("ne-yapsak", "permanent")}
          isTodayHidden={isWidgetTodayHidden("ne-yapsak")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("ne-yapsak")}
          onRestore={() => handleRestoreWidget("ne-yapsak")}
        />
      ),
    },
    {
      key: "matches",
      title: "Büyük Maçlar",
      icon: Trophy,
      color: "#3B82F6",
      loading: loading,
      hasContent: todayMatches.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/buyuk-maclar"
          icon={Trophy}
          color="#EAB308"
          title="Yakındaki Büyük Maçlar"
          subtitle="Büyük Maçlar"
          loading={loading}
          emptyText="Yakın tarihte takip edilen büyük maç yok 🏆"
          hasContent={todayMatches.length > 0}
          onHideToday={() => triggerHide("matches", "today")}
          onHidePermanent={() => triggerHide("matches", "permanent")}
          isTodayHidden={isWidgetTodayHidden("matches")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("matches")}
          onRestore={() => handleRestoreWidget("matches")}
        >
          {todayMatches.slice(0, 4).map((match: any) => {
            const isLive = match.state === "live";
            const isFinished = match.state === "finished";
            const matchDate = new Date(match.startAt);
            const startTime = matchDate.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const startDate = matchDate.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            });
            return (
              <div key={match.id} className="px-4 py-3 border-t border-app-border">
                <div className="flex items-center gap-3">
                  <div className="w-16 px-1.5 py-1 rounded-xl bg-app-surface border border-app-border flex flex-col items-center justify-center shrink-0">
                    {isLive ? (
                      <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        CANLI
                      </span>
                    ) : (
                      <span className="text-[7px] font-black text-app-muted uppercase">
                        {startDate}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-app-text tabular-nums mt-0.5">
                      {startTime}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-app-text truncate">
                        {match.home} <span className="text-app-muted font-bold text-[10px] mx-0.5">vs</span> {match.away}
                      </p>
                      <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                        {match.competitionTr}
                      </p>
                    </div>

                    {(isLive || isFinished) && (
                      <span className="shrink-0 px-2.5 py-1 rounded-xl bg-app-surface border border-app-border text-[11px] font-black text-app-text tabular-nums">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      ),
    },
    {
      key: "series",
      title: "Dizilerim",
      icon: Play,
      color: "#EF4444",
      loading: loading,
      hasContent: (() => {
        if (!hasFollowedSeries) return true;
        return pendingSeriesWidget;
      })(),
      hasCompletedOnly: completedTodaySeries.length > 0,
      card: (
        <HomeSummaryCard
          href={seriesTrackHref}
          icon={VideoCamera}
          color="#EF4444"
          title="Bugünün Dizileri"
          subtitle="SeriesTrack"
          loading={loading}
          emptyText={seriesEmptyText}
          hasContent={!hasFollowedSeries || pendingAvailableSeries.length > 0}
          onHideToday={() => triggerHide("seriesTrack", "today")}
          onHidePermanent={() => triggerHide("seriesTrack", "permanent")}
          isTodayHidden={isWidgetTodayHidden("seriesTrack")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("seriesTrack")}
          onRestore={() => handleRestoreWidget("seriesTrack")}
          emptyFooter={
            hasFollowedSeries && !pendingSeriesWidget && completedTodaySeries.length > 0 ? (
              <>{completedTodaySeries.map(renderCompletedSeriesRow)}</>
            ) : undefined
          }
        >
          {!hasFollowedSeries ? (
            <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/50">
                <VideoCamera size={16} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-app-text">Takip Edilen Dizi Yok</p>
                <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                  Henüz bir dizi takip etmiyorsunuz. Yeni bölümleri kaçırmamak için dizilerinizi ekleyin.
                </p>
              </div>
            </div>
          ) : (
            pendingAvailableSeries.map((item: any) => (
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
                </div>
              </div>
            ))
          )}
          {hasFollowedSeries && pendingSeriesWidget && completedTodaySeries.map(renderCompletedSeriesRow)}
        </HomeSummaryCard>
      ),
    },
    {
      key: "gym",
      title: "Bugünün Antrenmanı",
      icon: Barbell,
      color: "#10B981",
      loading: loading,
      hasContent: (() => {
        const hasUsed = todayGymPlan && todayGymPlan.hasRoutines;
        if (!hasUsed) return true;
        return pendingTodayGym;
      })(),
      hasCompletedOnly: completedTodayGym,
      card: (
        <HomeSummaryCard
          href="/apps/gym"
          icon={Barbell}
          color="#8B5CF6"
          title="Bugünün Antrenmanı"
          subtitle="Gym"
          loading={loading}
          emptyText="Bugün dinlenme günü"
          hasContent={!(todayGymPlan && todayGymPlan.hasRoutines) || pendingTodayGym}
          onHideToday={() => triggerHide("gym", "today")}
          onHidePermanent={() => triggerHide("gym", "permanent")}
          isTodayHidden={isWidgetTodayHidden("gym")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("gym")}
          onRestore={() => handleRestoreWidget("gym")}
          emptyFooter={
            completedTodayGym && todayGymPlan?.routine ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60">
                <HomeTaskCheckButton completed disabled />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate line-through">
                    {todayGymPlan.routine.name}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    {todayGymPlan.routine.exercises.length} egzersiz
                  </p>
                </div>
              </div>
            ) : undefined
          }
        >
          {!(todayGymPlan && todayGymPlan.hasRoutines) ? (
            <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-100/50">
                <Barbell size={16} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-app-text">Programınız Yok</p>
                <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                  Henüz bir antrenman programı oluşturmadınız. Antrenmanlarınızı takip etmek için program oluşturun.
                </p>
              </div>
            </div>
          ) : (
            todayGymPlan?.routine && (
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
            )
          )}
        </HomeSummaryCard>
      ),
    },
    {
      key: "chores",
      title: "Bugünün Ev İşleri",
      icon: Broom,
      color: "#F97316",
      loading: loading,
      hasContent: (() => {
        const hasUsed = weeklyChores !== null;
        if (!hasUsed) return true;
        return pendingTodayChores.length > 0;
      })(),
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
          hasContent={weeklyChores === null || pendingTodayChores.length > 0}
          onHideToday={() => triggerHide("chores", "today")}
          onHidePermanent={() => triggerHide("chores", "permanent")}
          isTodayHidden={isWidgetTodayHidden("chores")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("chores")}
          onRestore={() => handleRestoreWidget("chores")}
          emptyFooter={
            weeklyChores !== null && completedTodayChores.length > 0 ? (
              <>
                {completedTodayChores.map((item: any) => {
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
          {weeklyChores === null ? (
            <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/50">
                <Broom size={16} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-app-text">Pano Bulunmadı</p>
                <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                  Henüz bir ev işi panosu oluşturmadınız. Ev işlerini planlamak ve paylaşmak için pano oluşturun.
                </p>
              </div>
            </div>
          ) : (
            pendingTodayChores.map((item: any) => {
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
            })
          )}
        </HomeSummaryCard>
      ),
    },
    {
      key: "meals",
      title: "Bugünün Öğünleri",
      icon: ChefHat,
      color: "#10B981",
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
          onHideToday={() => triggerHide("meals", "today")}
          onHidePermanent={() => triggerHide("meals", "permanent")}
          isTodayHidden={isWidgetTodayHidden("meals")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("meals")}
          onRestore={() => handleRestoreWidget("meals")}
          emptyFooter={
            allTodayMealsCompleted ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 opacity-60">
                <HomeTaskCheckButton completed disabled />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate line-through">
                    {sortedTodayMeals.map((m) => m.title).join(" · ")}
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
                    {sortedTodayMeals.map((m) => m.title).join(" · ")}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    Günün Menüsü ({completedMealIds.length}/{sortedTodayMeals.length} tamamlandı)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(() => {
                  const groups: Record<string, { mealType: string; isDone: boolean; keys: string[] }> = {};
                  sortedTodayMeals.forEach((meal: any) => {
                    const type = meal.mealType;
                    const mealKey = meal.id || meal.mealType;
                    const isMealDone = completedMealIds.includes(mealKey);
                    
                    if (!groups[type]) {
                      groups[type] = {
                        mealType: type,
                        isDone: true,
                        keys: [],
                      };
                    }
                    groups[type].keys.push(mealKey);
                    if (!isMealDone) {
                      groups[type].isDone = false;
                    }
                  });

                  return Object.values(groups).map((group) => {
                    return (
                      <WidgetActionButton
                        key={group.mealType}
                        onClick={() => handleToggleMealCompleted(group.keys)}
                        icon={group.isDone ? CheckCircle : Check}
                      >
                        <span className={group.isDone ? "line-through opacity-70" : ""}>
                          {getMealTypeLabel(group.mealType)}
                        </span>
                      </WidgetActionButton>
                    );
                  });
                })()}
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
      title: "Okuma Hedefin",
      icon: BookOpen,
      color: "#3B82F6",
      loading: loading,
      hasContent: (() => {
        if (!weeklyReadingGoal) return true;
        if (weeklyReadingGoal.status !== "active") return false;
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

        const hasCardContent = !weeklyReadingGoal || (isActive && !isTodayTargetCompleted);

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
            onHideToday={() => triggerHide("readTracker", "today")}
            onHidePermanent={() => triggerHide("readTracker", "permanent")}
            isTodayHidden={isWidgetTodayHidden("readTracker")}
            isPermanentlyHidden={isWidgetPermanentlyHidden("readTracker")}
            onRestore={() => handleRestoreWidget("readTracker")}
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
            {!weeklyReadingGoal ? (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100 text-amber-600">
                  <BookOpen size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text">Hedef Belirlenmedi</p>
                  <p className="text-[9px] text-app-muted font-bold mt-0.5 whitespace-normal">
                    Henüz bir okuma hedefi belirlemediniz. Kitap okuma alışkanlığınızı takip etmek için hedef oluşturun.
                  </p>
                </div>
              </div>
            ) : isActive && bookTitle ? (
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
                    {rgChunks.map((c: any, i: number) => {
                      const cumInc = rgChunks.slice(0, i + 1).reduce((a: any, b: any) => a + b, 0);
                      const filled = rgCurrent >= rgBase + cumInc;
                      return (
                        <WidgetActionButton
                          key={i}
                          onClick={() => pressReadingChunk(i)}
                          icon={filled ? CheckCircle : Plus}
                          selected={filled}
                        >
                          <span className={filled ? "line-through" : ""}>
                            {c} <span className="normal-case font-bold">syf</span>
                          </span>
                        </WidgetActionButton>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              isActive && !bookTitle && (
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
              )
            )}
          </HomeSummaryCard>
        );
      })(),
    },
    {
      key: "youtubeSeries",
      title: "YouTube Serileri",
      icon: YoutubeLogo,
      color: "#FF0000",
      loading: loading,
      hasContent: isYtdbImplemented && youtubeSeries.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/youtube-discover"
          icon={YoutubeLogo}
          color="#FF0000"
          title="İzlenecek Videolar Bul"
          subtitle="YTDB"
          loading={loading}
          emptyText="İzlenecek videolar bulunmuyor 📺"
          hasContent={isYtdbImplemented && youtubeSeries.length > 0}
          onHideToday={() => triggerHide("youtubeSeries", "today")}
          onHidePermanent={() => triggerHide("youtubeSeries", "permanent")}
          isTodayHidden={isWidgetTodayHidden("youtubeSeries")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("youtubeSeries")}
          onRestore={() => handleRestoreWidget("youtubeSeries")}
        >
          {youtubeSeries.slice(0, 4).map((series: any) => {
            const thumbnailUrl = series.youtube_id
              ? `https://img.youtube.com/vi/${series.youtube_id}/mqdefault.jpg`
              : null;
            return (
              <div
                key={series.id}
                onClick={() => router.push(`/apps/youtube-discover/seri?id=${series.id}`)}
                className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/30 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-9 rounded-lg overflow-hidden bg-app-surface-muted shrink-0 border border-app-border flex items-center justify-center">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={series.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-md">{series.emoji || "📺"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">
                      {series.title}
                    </p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                      {series.creator} · {series.episode_count || series.episodes?.length || 0} Bölüm
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </HomeSummaryCard>
      ),
    },
    {
      key: "movies",
      title: "Günün Film Önerileri",
      icon: FilmStrip,
      color: "#8B5CF6",
      loading: moviesLoading,
      hasContent: movieSuggestions.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/film-graph"
          icon={ProjectorScreen}
          color="#D97706"
          title="Bir Film İzle"
          subtitle="Film Keşfet"
          loading={moviesLoading}
          emptyText="İzlenecek film bulunamadı 🍿"
          hasContent={movieSuggestions.length > 0}
          onHideToday={() => triggerHide("movies", "today")}
          onHidePermanent={() => triggerHide("movies", "permanent")}
          isTodayHidden={isWidgetTodayHidden("movies")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("movies")}
          onRestore={() => handleRestoreWidget("movies")}
          footerAction={
            onResetMovieSuggestions && (
              <button
                type="button"
                onClick={onResetMovieSuggestions}
                className="flex items-center gap-1 text-app-muted hover:text-amber-500 hover:bg-amber-500/5 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 py-1 px-2 rounded-lg shrink-0"
              >
                <ArrowsClockwise size={12} />
                <span>Önerileri Yenile</span>
              </button>
            )
          }
        >
          {movieSuggestions.map((movie: any) => (
            <div
              key={movie.id}
              className="px-4 py-3 border-t border-app-border space-y-2.5"
            >
              <div
                onClick={() => router.push(`/apps/film-graph?movie=${movie.id}`)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all text-left"
              >
                <div className="w-9 h-12 rounded-lg overflow-hidden bg-app-surface-muted shrink-0 border border-app-border flex items-center justify-center">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ProjectorScreen size={18} className="text-app-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-app-text truncate flex items-center gap-1.5">
                    <span>{movie.title}</span>
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    {movie.year || (movie.releaseDate ? movie.releaseDate.split("-")[0] : "")} {movie.imdbRating ? `· ★ ${!isNaN(parseFloat(String(movie.imdbRating))) ? parseFloat(String(movie.imdbRating)).toFixed(1) : movie.imdbRating}` : movie.voteAverage ? `· ★ ${typeof movie.voteAverage === "number" ? movie.voteAverage.toFixed(1) : movie.voteAverage}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <WidgetActionButton
                  onClick={() => addHomeMovieToList(movie, "watched")}
                  icon={CheckCircle}
                >
                  İzledim
                </WidgetActionButton>

                {!movie.isSaved && (
                  <WidgetActionButton
                    onClick={() => addHomeMovieToList(movie, "want")}
                    icon={BookmarkSimple}
                  >
                    Kaydet
                  </WidgetActionButton>
                )}

                <WidgetActionButton
                  onClick={() => ignoreMovie(movie.id)}
                  icon={EyeSlash}
                >
                  İlgilenmiyorum
                </WidgetActionButton>
              </div>
            </div>
          ))}
        </HomeSummaryCard>
      ),
    },
  ];

  const filteredWidgets = widgets.filter((w) => {
    const isExploreWidget = w.key === "events-widget" || w.key === "upcoming-concerts-widget" || w.key === "outdoor-activities-widget" || w.key === "cinema-widget" || w.key === "places-widget" || w.key === "ne-yapsak";
    if (activeSubTab === "explore") {
      return isExploreWidget;
    } else {
      return !isExploreWidget;
    }
  });

  const pendingWidgets = filteredWidgets.filter(
    (widget) =>
      widget.key !== "matches" &&
      widget.key !== "youtubeSeries" &&
      widget.key !== "movies" &&
      widget.key !== "yazboz-widget" &&
      widget.key !== "cinema-widget" &&
      widget.key !== "events-widget" &&
      widget.key !== "places-widget" &&
      widget.key !== "upcoming-concerts-widget" &&
      widget.key !== "outdoor-activities-widget" &&
      widget.key !== "ne-yapsak" &&
      !isWidgetHidden(widget.key) &&
      (widget.loading || widget.hasContent)
  );

  const hasAnyDiscover = (() => {
    const matchesWidget = filteredWidgets.find((w) => w.key === "matches");
    const ytWidget = filteredWidgets.find((w) => w.key === "youtubeSeries");
    const moviesWidget = filteredWidgets.find((w) => w.key === "movies");
    const yazbozWidget = filteredWidgets.find((w) => w.key === "yazboz-widget");
    const eventsWidget = filteredWidgets.find((w) => w.key === "events-widget");
    const placesWidget = filteredWidgets.find((w) => w.key === "places-widget");
    const upcomingConcertsWidget = filteredWidgets.find((w) => w.key === "upcoming-concerts-widget");
    const outdoorWidget = filteredWidgets.find((w) => w.key === "outdoor-activities-widget");
    return (
      Boolean(matchesWidget && matchesWidget.hasContent && !isWidgetHidden("matches")) ||
      Boolean(ytWidget && ytWidget.hasContent && !isWidgetHidden("youtubeSeries")) ||
      Boolean(moviesWidget && moviesWidget.hasContent && !isWidgetHidden("movies")) ||
      Boolean(yazbozWidget && yazbozWidget.hasContent && !isWidgetHidden("yazboz-widget")) ||
      Boolean(eventsWidget && eventsWidget.hasContent && !isWidgetHidden("events-widget")) ||
      Boolean(placesWidget && !isWidgetHidden("places-widget")) ||
      Boolean(upcomingConcertsWidget && upcomingConcertsWidget.hasContent && !isWidgetHidden("upcoming-concerts-widget")) ||
      Boolean(outdoorWidget && outdoorWidget.hasContent && !isWidgetHidden("outdoor-activities-widget"))
    );
  })();

  const finishedWidgets = filteredWidgets.filter((widget) => {
    if (
      widget.key === "suggest" ||
      widget.key === "ne-yapsak" ||
      widget.key === "matches" ||
      widget.key === "youtubeSeries" ||
      widget.key === "movies" ||
      widget.key === "yazboz-widget" ||
      widget.key === "events-widget" ||
      widget.key === "places-widget" ||
      widget.key === "upcoming-concerts-widget" ||
      widget.key === "outdoor-activities-widget" ||
      widget.key === "cinema-widget" ||
      isWidgetHidden(widget.key)
    )
      return false;

    let isUsed = true;
    if (widget.key === "eksik-var") isUsed = eksikItems && eksikItems.length > 0;
    if (widget.key === "agenda") isUsed = todayAgenda && todayAgenda.length > 0;
    if (widget.key === "series") isUsed = hasFollowedSeries;
    if (widget.key === "gym") isUsed = !!(todayGymPlan && todayGymPlan.hasRoutines);
    if (widget.key === "chores") isUsed = weeklyChores !== null;
    if (widget.key === "reading") isUsed = weeklyReadingGoal !== null;

    return !widget.loading && !widget.hasContent && isUsed;
  });

  return (
    <div className="space-y-4">
      {/* Today tabs — Şehirde / Günlük (iOS native: yalnızca Şehirde) */}
      {!isIOSApp && (
        <div className="flex justify-start">
          <div className="relative inline-flex items-center gap-0.5 rounded-xl border border-app-border/70 bg-app-tab-track p-0.5">
            {(
              [
                { id: "explore" as const, label: "Şehirde", icon: Compass },
                { id: "daily" as const, label: "Günlük", icon: CalendarCheck },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const isActive = subTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSubTab(id)}
                  className={`relative z-10 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors duration-200 cursor-pointer select-none ${
                    isActive ? "text-app-text" : "text-app-muted hover:text-app-text"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="today-subtab-pill"
                      className="absolute inset-0 rounded-lg bg-app-tab-active shadow-sm ring-1 ring-app-border/40"
                      transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <Icon size={12} weight={isActive ? "fill" : "bold"} />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* 1. YAPILACAKLAR */}
      {pendingWidgets.length > 0 && (
        <div className="space-y-2.5">
          <HomeGroupHeader title="Yapılacaklar" />
          <div className={WIDGET_MASONRY}>
            <AnimatePresence initial={false}>
              {pendingWidgets.map((widget) => (
                <motion.div
                  key={widget.key}
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 1.15,
                    y: -30,
                    filter: "blur(12px)",
                    height: 0,
                    transition: { duration: 0.45, ease: "easeOut" }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={WIDGET_MASONRY_ITEM}
                >
                  {widget.card}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 2. BAŞKA NE YAPABİLİRİM? */}
      {(() => {
        const matchesWidget = filteredWidgets.find((w) => w.key === "matches");
        const ytWidget = filteredWidgets.find((w) => w.key === "youtubeSeries");
        const moviesWidget = filteredWidgets.find((w) => w.key === "movies");
        const yazbozWidget = filteredWidgets.find((w) => w.key === "yazboz-widget");
        const cinemaWidget = filteredWidgets.find((w) => w.key === "cinema-widget");
        const outdoorWidget = filteredWidgets.find((w) => w.key === "outdoor-activities-widget");
        const eventsWidget = filteredWidgets.find((w) => w.key === "events-widget");
        const placesWidget = filteredWidgets.find((w) => w.key === "places-widget");
        const upcomingConcertsWidget = filteredWidgets.find((w) => w.key === "upcoming-concerts-widget");
        const neYapsakWidget = filteredWidgets.find((w) => w.key === "ne-yapsak");

        const visibleMatches = matchesWidget && matchesWidget.hasContent && !isWidgetHidden("matches");
        const visibleYt = ytWidget && ytWidget.hasContent && !isWidgetHidden("youtubeSeries");
        const visibleMovies = moviesWidget && moviesWidget.hasContent && !isWidgetHidden("movies");
        const showCityWidget = (key: string) =>
          activeSubTab === "explore" || !isWidgetHidden(key);

        const visibleYazboz = yazbozWidget && yazbozWidget.hasContent && showCityWidget("yazboz-widget");
        const visibleCinema = cinemaWidget && cinemaWidget.hasContent && showCityWidget("cinema-widget");
        const visibleOutdoor = outdoorWidget && outdoorWidget.hasContent && showCityWidget("outdoor-activities-widget");
        const visibleEvents = eventsWidget && eventsWidget.hasContent && showCityWidget("events-widget");
        const visiblePlaces = placesWidget && showCityWidget("places-widget");
        const visibleUpcomingConcerts = upcomingConcertsWidget && upcomingConcertsWidget.hasContent && showCityWidget("upcoming-concerts-widget");
        const visibleNeYapsak = neYapsakWidget && neYapsakWidget.hasContent && showCityWidget("ne-yapsak");

        const hasAny = visibleNeYapsak || visibleMatches || visibleYt || visibleMovies || visibleYazboz || visibleCinema || visibleEvents || visiblePlaces || visibleUpcomingConcerts || visibleOutdoor;

        if (!hasAny) return null;

        return (
          <div className="pt-2 space-y-2.5">
            <HomeGroupHeader title={activeSubTab === "explore" ? "Bugün Şehirde" : "Başka Ne Yapabilirim?"} />
            <div className={WIDGET_MASONRY}>
              <AnimatePresence initial={false}>
                {visibleNeYapsak && neYapsakWidget && (
                  <motion.div
                    key="ne-yapsak"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {neYapsakWidget.card}
                  </motion.div>
                )}
                {visiblePlaces && placesWidget && (
                  <motion.div
                    key="places-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {placesWidget.card}
                  </motion.div>
                )}
                {visibleOutdoor && outdoorWidget && (
                  <motion.div
                    key="outdoor-activities-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {outdoorWidget.card}
                  </motion.div>
                )}
                {visibleEvents && eventsWidget && (
                  <motion.div
                    key="events-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {eventsWidget.card}
                  </motion.div>
                )}
                {visibleCinema && cinemaWidget && (
                  <motion.div
                    key="cinema-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {cinemaWidget.card}
                  </motion.div>
                )}
                {visibleUpcomingConcerts && upcomingConcertsWidget && (
                  <motion.div
                    key="upcoming-concerts-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {upcomingConcertsWidget.card}
                  </motion.div>
                )}
                {visibleMovies && moviesWidget && (
                  <motion.div
                    key="movies"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {moviesWidget.card}
                  </motion.div>
                )}
                {visibleYazboz && yazbozWidget && (
                  <motion.div
                    key="yazboz-widget"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {yazbozWidget.card}
                  </motion.div>
                )}
                {visibleMatches && matchesWidget && (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {matchesWidget.card}
                  </motion.div>
                )}
                {visibleYt && ytWidget && (
                  <motion.div
                    key="youtubeSeries"
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.15,
                      y: -30,
                      filter: "blur(12px)",
                      height: 0,
                      transition: { duration: 0.45, ease: "easeOut" }
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={WIDGET_MASONRY_ITEM}
                  >
                    {ytWidget.card}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })()}

      {/* 3. BİTENLER (Bugün Bitirdiklerim) */}
      {finishedWidgets.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <HomeGroupHeader title="Bugün Bitirdiklerim" />
          <div className={WIDGET_MASONRY}>
            <AnimatePresence initial={false}>
              {finishedWidgets.map((widget) => (
                <motion.div
                  key={widget.key}
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 1.15,
                    y: -30,
                    filter: "blur(12px)",
                    height: 0,
                    transition: { duration: 0.45, ease: "easeOut" }
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={WIDGET_MASONRY_ITEM}
                >
                  {widget.card}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state: tüm widget'lar gizlendiğinde */}
      {pendingWidgets.length === 0 && finishedWidgets.length === 0 && !hasAnyDiscover && widgets.some((w) => isWidgetHidden(w.key)) && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Check size={30} weight="bold" className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-app-text">Bugün için her şey tamam!</p>
            <p className="text-xs text-app-muted mt-0.5">Tüm widget'ları bugün için gizledin.</p>
          </div>
        </div>
      )}

      {/* 4. BUGÜN GİZLENENLER (Collapsible Accordion) — sadece Günlük sekmesi */}
      {activeSubTab === "daily" && (() => {
        const HIDDEN_WIDGET_ORDER: Record<string, number> = {
          "agenda": 1,
          "meals": 2,
          "reading": 3,
          "movies": 4,
          "yazboz-widget": 1000,
        };
        const todayHidden = filteredWidgets
          .filter((w) => isWidgetTodayHidden(w.key))
          .sort((a, b) => {
            const orderA = HIDDEN_WIDGET_ORDER[a.key] ?? 999;
            const orderB = HIDDEN_WIDGET_ORDER[b.key] ?? 999;
            return orderA - orderB;
          });
        return (
          <div className="pt-3 border-t border-app-border/60 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsHiddenExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-1 py-1.5 text-app-muted hover:text-app-text transition-all cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <Archive size={16} weight="bold" className="text-app-muted group-hover:text-app-text" />
                <span className="text-[11px] font-black uppercase tracking-widest text-app-muted group-hover:text-app-text">
                  Bugün Gizlenenler ({todayHidden.length})
                </span>
              </div>
              {isHiddenExpanded ? (
                <CaretUp size={14} weight="bold" />
              ) : (
                <CaretDown size={14} weight="bold" />
              )}
            </button>

            <AnimatePresence>
              {isHiddenExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 overflow-hidden pt-1"
                >
                  {todayHidden.length === 0 ? (
                    <p className="text-[10px] text-app-muted font-bold text-center py-2">
                      Bugün gizlenen widget yok
                    </p>
                  ) : (
                    <AnimatePresence initial={false}>
                      {todayHidden.map((w) => (
                        <motion.div
                          key={w.key}
                          initial={{ opacity: 0, height: 0, scale: 0.98 }}
                          animate={{ opacity: 1, height: "auto", scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 1.15,
                            y: -30,
                            filter: "blur(12px)",
                            height: 0,
                            transition: { duration: 0.45, ease: "easeOut" }
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="overflow-hidden"
                        >
                          {w.card}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* 5. KOMPLE GİZLENENLER (Collapsible Accordion) — sadece Günlük sekmesi */}
      {activeSubTab === "daily" && (() => {
        const permHidden = filteredWidgets.filter((w) => isWidgetPermanentlyHidden(w.key));
        return (
          <div className="pt-3 border-t border-app-border/60 space-y-2.5">
            <button
              type="button"
              onClick={() => setIsPermHiddenExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between px-1 py-1.5 text-app-muted hover:text-app-text transition-all cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2">
                <Prohibit size={16} weight="bold" className="text-app-muted group-hover:text-app-text" />
                <span className="text-[11px] font-black uppercase tracking-widest text-app-muted group-hover:text-app-text">
                  Kalıcı Gizlenenler ({permHidden.length})
                </span>
              </div>
              {isPermHiddenExpanded ? (
                <CaretUp size={14} weight="bold" />
              ) : (
                <CaretDown size={14} weight="bold" />
              )}
            </button>

            <AnimatePresence>
              {isPermHiddenExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3 overflow-hidden pt-1"
                >
                  {permHidden.length === 0 ? (
                    <p className="text-[10px] text-app-muted font-bold text-center py-2">
                      Kalıcı gizlenen widget yok
                    </p>
                  ) : (
                    <AnimatePresence initial={false}>
                      {permHidden.map((w) => (
                        <motion.div
                          key={w.key}
                          initial={{ opacity: 0, height: 0, scale: 0.98 }}
                          animate={{ opacity: 1, height: "auto", scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 1.15,
                            y: -30,
                            filter: "blur(12px)",
                            height: 0,
                            transition: { duration: 0.45, ease: "easeOut" }
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="overflow-hidden"
                        >
                          {w.card}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* Bottom Sheet for first time Hide Notification */}
      <Drawer open={hideNoticeOpen} onOpenChange={setHideNoticeOpen}>
        <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface p-5 pb-6">
          <DrawerHeader className="px-4 pt-4 pb-2 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mb-3 shadow-2xs">
              <Archive size={24} weight="fill" />
            </div>
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight text-center">
              Widget Gizleniyor
            </DrawerTitle>
            <DrawerDescription className="text-xs text-app-muted mt-1.5 text-center max-w-xs">
              {pendingHideAction?.mode === "permanent"
                ? "Bu widget tüm günlerde gizlenecektir. Sayfanın en altındaki 'Kalıcı Gizlenenler' bölümünden dilediğiniz zaman tekrar görünür yapabilirsiniz."
                : "Bu widget bugünlük gizlenecektir. Sayfanın altındaki 'Bugün Gizlenenler' bölümünden dilediğiniz zaman tekrar görünür yapabilirsiniz."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="py-3 border-t border-b border-app-border/80 my-3 flex items-center justify-center">
            <label className="flex items-center gap-2.5 text-xs font-bold text-app-text cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-app-border text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
              />
              <span>Bir daha gösterme</span>
            </label>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setHideNoticeOpen(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-app-muted hover:text-app-text bg-app-surface-muted transition-all active:scale-95 cursor-pointer w-full max-w-[120px]"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={confirmHideNotice}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-amber-500 hover:bg-amber-600 transition-all active:scale-95 shadow-sm cursor-pointer w-full max-w-[150px]"
            >
              Tamam, Gizle
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
