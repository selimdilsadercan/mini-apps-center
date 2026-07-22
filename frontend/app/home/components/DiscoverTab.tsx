"use client";

import { useRouter } from "next/navigation";
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
} from "@phosphor-icons/react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const browserClient = createBrowserClient();

const DEFAULT_MOVIES = [
  { id: "101", title: "Dune: Part Two", year: 2024, voteAverage: 8.6, posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLPoL6VFiH2G2WFiipM32M2Y.jpg" },
  { id: "102", title: "Oppenheimer", year: 2023, voteAverage: 8.9, posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { id: "103", title: "Interstellar", year: 2014, voteAverage: 8.7, posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
];
import {
  HomeSummaryCard,
  HomeTaskCheckButton,
  WidgetActionButton,
  HomeWidgetsDivider,
  HomeGroupHeader,
} from "./common/HomeSummaryCard";
import { getLinkedAppForRoutine } from "@/app/apps/rutinler/routineAppLinks";
import { AIChatView } from "@/components/ai-chat/AIChatView";

interface DiscoverTabProps {
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
  handleToggleMealCompleted: (mealKey: string) => void;
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
}

import { DeckView } from "./DeckView";

export function DiscoverTab(props: DiscoverTabProps) {
  const {
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
  } = props;

  const queryClient = useQueryClient();
  const router = useRouter();

  const gameSavesQuery = useQuery({
    queryKey: ["yazboz", "recent-saves", userId],
    queryFn: () => browserClient.yazboz.getGameSaves(userId || ""),
    enabled: !!userId,
    staleTime: 0,
  });

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

  const widgets = [
    {
      key: "yazboz-widget",
      title: "Masa Oyunu Oynayın",
      icon: GameController,
      color: "#3B82F6",
      loading: loading || gameSavesQuery.isLoading,
      hasContent: true,
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
          hasContent={true}
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
        const activeMissing = (eksikItems || []).filter((i: any) => !i.is_used);
        const todayItems = activeMissing.filter((i: any) => (i.timing || "today") === "today");
        const monthItems = activeMissing.filter((i: any) => (i.timing || "today") === "month_start");
        return todayItems.length > 0 || monthItems.length > 0;
      })(),
      hasCompletedOnly: false,
      card: (() => {
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

        const hasContent = todayItems.length > 0 || monthItems.length > 0;

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
            {todayItems.length > 0 && (
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                  <Basket size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-app-text truncate">Bugün Alınacaklar</p>
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
                  <p className="text-[11px] font-black text-app-text truncate">Ay Başı Alınacaklar</p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    {formatItemsLine(monthItems)}
                  </p>
                </div>
              </div>
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
      hasContent: pendingTodayAgenda.length > 0,
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
          hasContent={pendingTodayAgenda.length > 0}
          onHideToday={() => triggerHide("agenda", "today")}
          onHidePermanent={() => triggerHide("agenda", "permanent")}
          isTodayHidden={isWidgetTodayHidden("agenda")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("agenda")}
          onRestore={() => handleRestoreWidget("agenda")}
          emptyFooter={
            !pendingTodayAgenda.length && completedTodayAgenda.length > 0 ? (
              <>{completedTodayAgenda.map(renderCompletedAgendaRow)}</>
            ) : undefined
          }
        >
          {previewTodayAgenda.map((item: any) => (
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
          ))}
          {pendingTodayAgenda.length > 0 &&
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
      key: "activities",
      title: "Etkinlikler",
      icon: Users,
      color: "#EC4899",
      loading: loading,
      hasContent: previewActivities.length > 0,
      hasCompletedOnly: false,
      card: (
        <HomeSummaryCard
          href="/apps/kim-gelir"
          icon={Users}
          color="#3B82F6"
          title="Etkinlik Davetleri"
          subtitle="Kim Gelir"
          loading={loading}
          emptyText="Henüz yeni bir etkinlik davetin yok 🎉"
          hasContent={previewActivities.length > 0}
          onHideToday={() => triggerHide("activities", "today")}
          onHidePermanent={() => triggerHide("activities", "permanent")}
          isTodayHidden={isWidgetTodayHidden("activities")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("activities")}
          onRestore={() => handleRestoreWidget("activities")}
        >
          {previewActivities.map((activity: any) => {
            const myResponse = activity.responses.find((response: any) => response.userId === userId)?.status;
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
      hasContent: pendingSeriesWidget,
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
          hasContent={pendingAvailableSeries.length > 0}
          onHideToday={() => triggerHide("seriesTrack", "today")}
          onHidePermanent={() => triggerHide("seriesTrack", "permanent")}
          isTodayHidden={isWidgetTodayHidden("seriesTrack")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("seriesTrack")}
          onRestore={() => handleRestoreWidget("seriesTrack")}
          emptyFooter={
            !pendingSeriesWidget && completedTodaySeries.length > 0 ? (
              <>{completedTodaySeries.map(renderCompletedSeriesRow)}</>
            ) : undefined
          }
        >
          {pendingAvailableSeries.map((item: any) => (
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
          ))}
          {pendingSeriesWidget && completedTodaySeries.map(renderCompletedSeriesRow)}
        </HomeSummaryCard>
      ),
    },
    {
      key: "gym",
      title: "Bugünün Antrenmanı",
      icon: Barbell,
      color: "#10B981",
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
          emptyText="Bugün dinlenme günü"
          hasContent={pendingTodayGym}
          onHideToday={() => triggerHide("gym", "today")}
          onHidePermanent={() => triggerHide("gym", "permanent")}
          isTodayHidden={isWidgetTodayHidden("gym")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("gym")}
          onRestore={() => handleRestoreWidget("gym")}
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
      title: "Bugünün Ev İşleri",
      icon: Broom,
      color: "#F97316",
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
          onHideToday={() => triggerHide("chores", "today")}
          onHidePermanent={() => triggerHide("chores", "permanent")}
          isTodayHidden={isWidgetTodayHidden("chores")}
          isPermanentlyHidden={isWidgetPermanentlyHidden("chores")}
          onRestore={() => handleRestoreWidget("chores")}
          emptyFooter={
            completedTodayChores.length > 0 ? (
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
          {pendingTodayChores.map((item: any) => {
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
                    {sortedTodayMeals.map((meal: any) => `${getMealTypeLabel(meal.mealType)}: ${meal.title}`).join(" · ")}
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
                    {sortedTodayMeals.map((meal: any) => `${getMealTypeLabel(meal.mealType)}: ${meal.title}`).join(" · ")}
                  </p>
                  <p className="text-[9px] text-app-muted font-bold truncate">
                    Günün Menüsü ({completedMealIds.length}/{sortedTodayMeals.length} tamamlandı)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sortedTodayMeals.map((meal: any) => {
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
      title: "Okuma Hedefin",
      icon: BookOpen,
      color: "#3B82F6",
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
    {
      key: "youtubeSeries",
      title: "YouTube Serileri",
      icon: YoutubeLogo,
      color: "#FF0000",
      loading: loading,
      hasContent: youtubeSeries.length > 0,
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
          hasContent={youtubeSeries.length > 0}
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

  const pendingWidgets = widgets.filter(
    (widget) =>
      widget.key !== "matches" &&
      widget.key !== "youtubeSeries" &&
      widget.key !== "movies" &&
      widget.key !== "yazboz-widget" &&
      !isWidgetHidden(widget.key) &&
      (widget.loading || widget.hasContent)
  );

  const hasAnyDiscover = (() => {
    const matchesWidget = widgets.find((w) => w.key === "matches");
    const ytWidget = widgets.find((w) => w.key === "youtubeSeries");
    const moviesWidget = widgets.find((w) => w.key === "movies");
    const yazbozWidget = widgets.find((w) => w.key === "yazboz-widget");
    return (
      Boolean(matchesWidget && matchesWidget.hasContent && !isWidgetHidden("matches")) ||
      Boolean(ytWidget && ytWidget.hasContent && !isWidgetHidden("youtubeSeries")) ||
      Boolean(moviesWidget && moviesWidget.hasContent && !isWidgetHidden("movies")) ||
      Boolean(yazbozWidget && yazbozWidget.hasContent && !isWidgetHidden("yazboz-widget"))
    );
  })();

  const finishedWidgets = widgets.filter((widget) => {
    if (
      widget.key === "suggest" ||
      widget.key === "activities" ||
      widget.key === "matches" ||
      widget.key === "youtubeSeries" ||
      widget.key === "movies" ||
      widget.key === "yazboz-widget" ||
      isWidgetHidden(widget.key)
    )
      return false;
    return !widget.loading && !widget.hasContent;
  });

  return (
    <div className="space-y-4">
      {/* 1. YAPILACAKLAR */}
      {pendingWidgets.length > 0 && (
        <div className="space-y-2.5">
          <HomeGroupHeader title="Yapılacaklar" />
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {pendingWidgets.map((widget) => (
                <motion.div
                  key={widget.key}
                  layout
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="overflow-hidden"
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
        const matchesWidget = widgets.find((w) => w.key === "matches");
        const ytWidget = widgets.find((w) => w.key === "youtubeSeries");
        const moviesWidget = widgets.find((w) => w.key === "movies");
        const yazbozWidget = widgets.find((w) => w.key === "yazboz-widget");

        const visibleMatches = matchesWidget && matchesWidget.hasContent && !isWidgetHidden("matches");
        const visibleYt = ytWidget && ytWidget.hasContent && !isWidgetHidden("youtubeSeries");
        const visibleMovies = moviesWidget && moviesWidget.hasContent && !isWidgetHidden("movies");
        const visibleYazboz = yazbozWidget && yazbozWidget.hasContent && !isWidgetHidden("yazboz-widget");

        const hasAny = visibleMatches || visibleYt || visibleMovies || visibleYazboz;

        if (!hasAny) return null;

        return (
          <div className="pt-2 space-y-2.5">
            <HomeGroupHeader title="Başka Ne Yapabilirim?" />
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {visibleMovies && moviesWidget && (
                  <motion.div
                    key="movies"
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden"
                  >
                    {moviesWidget.card}
                  </motion.div>
                )}
                {visibleYazboz && yazbozWidget && (
                  <motion.div
                    key="yazboz-widget"
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden"
                  >
                    {yazbozWidget.card}
                  </motion.div>
                )}
                {visibleMatches && matchesWidget && (
                  <motion.div
                    key="matches"
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden"
                  >
                    {matchesWidget.card}
                  </motion.div>
                )}
                {visibleYt && ytWidget && (
                  <motion.div
                    key="youtubeSeries"
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="overflow-hidden"
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
          <div className="space-y-2.5">
            <AnimatePresence initial={false}>
              {finishedWidgets.map((widget) => (
                <motion.div
                  key={widget.key}
                  layout
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="overflow-hidden"
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

      {/* 4. BUGÜN GİZLENENLER (Collapsible Accordion) */}
      {(() => {
        const todayHidden = widgets.filter((w) => isWidgetTodayHidden(w.key));
        if (todayHidden.length === 0) return null;
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
                  {todayHidden.map((w) => (
                    <div key={w.key}>{w.card}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* 5. KOMPLE GİZLENENLER (Collapsible Accordion) */}
      {(() => {
        const permHidden = widgets.filter((w) => isWidgetPermanentlyHidden(w.key));
        if (permHidden.length === 0) return null;
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
                  {permHidden.map((w) => (
                    <div key={w.key}>{w.card}</div>
                  ))}
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
