"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle,
  ClockAfternoon,
  ArrowUpRight,
  PaperPlaneTilt,
  Play,
  Check,
  X,
  VideoCamera,
  EyeSlash,
  Barbell,
  ChefHat,
  Notepad,
  Plus,
  BookOpen,
  Broom,
  Sparkle,
  Compass,
  GameController,
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  Eye,
  CaretUp,
  CaretDown,
  Sliders,
  Trophy,
  YoutubeLogo,
  Robot,
  Storefront,
} from "@phosphor-icons/react";
import { getLinkedAppForRoutine } from "@/app/apps/rutinler/routineAppLinks";
import { useHome } from "@/contexts/HomeContext";
import { motion, AnimatePresence } from "framer-motion";

export interface DeckCardData {
  id: string;
  categoryTitle: string;
  categorySubtitle: string;
  categoryColor: string;
  icon: any;
  appHref?: string;
  content: React.ReactNode;
  statusType?: "pending" | "discover" | "completed";
  footerAction?: {
    label: string;
    onClick: () => void;
    icon?: any;
  };
}

interface DeckViewProps {
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
  pendingAvailableSeries: any[];
  completedTodaySeries: any[];
  seriesTrackHref: string;
  formatSeriesAirLabel: (dateStr: string) => string;
  openSeriesWatch: (item: any) => void;
  handleToggleWatched: (item: any) => Promise<void>;
  handleIgnoreSeriesToday: (item: any) => void;
  // Gym
  todayGymPlan: any;
  pendingTodayGym: boolean;
  completedTodayGym: boolean;
  startGymSession: (name: string, id: string, exercises: any[]) => void;
  // Meals
  todayMeals: any[];
  sortedTodayMeals: any[];
  completedMealIds: string[];
  allTodayMealsCompleted: boolean;
  pendingMealsWidget: boolean;
  needsMealPlanning: boolean;
  mealPlanningPrompt: string;
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
  handleToggleChoreComplete: (choreId: string) => Promise<void>;
  todayMatches: any[];
  youtubeSeries: any[];
}

function DeckActionButton({
  onClick,
  icon: Icon,
  children,
  loading,
  selected = false,
}: {
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
  loading?: boolean;
  selected?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50 ${selected
        ? "bg-app-surface-muted text-app-muted border-app-border/60 line-through opacity-45 shadow-none"
        : "bg-app-surface text-app-text border-app-border shadow-sm hover:bg-app-surface-muted"
        }`}
    >
      <Icon size={14} weight="bold" />
      <span className={selected ? "line-through" : ""}>{children}</span>
    </button>
  );
}

export function DeckView(props: DeckViewProps) {
  const router = useRouter();
  const {
    loading,
    userId,
    actionLoading,
    todayAgenda,
    getAgendaPeriodLabel,
    handleToggleAgendaComplete,
    handlePostponeAgendaItem,
    suggestions,
    getSuggestionCategoryLabel,
    handleSuggestionStatus,
    activities,
    handleActivityRespond,
    pendingAvailableSeries,
    completedTodaySeries = [],
    seriesTrackHref,
    formatSeriesAirLabel,
    openSeriesWatch,
    handleToggleWatched,
    handleIgnoreSeriesToday,
    todayGymPlan,
    pendingTodayGym,
    completedTodayGym = false,
    startGymSession,
    todayMeals,
    sortedTodayMeals,
    completedMealIds,
    allTodayMealsCompleted,
    needsMealPlanning,
    mealPlanningPrompt,
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
    completedTodayChores = [],
    handleToggleChoreComplete,
    todayMatches = [],
    youtubeSeries = [],
  } = props;

  const [isEditingLayout, setIsEditingLayout] = React.useState(false);

  // Build unified deck cards (1 single card per application/category containing its items list):
  const cards: DeckCardData[] = [];

  // 0. Welcome / Overview Card
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "Merhaba" : "İyi Akşamlar";
  const dayName = now.toLocaleDateString("tr-TR", { weekday: "long" });
  const dateStr = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

  // 1. Unified Ajanda Card (Only Today's Pending + Today's Completed items)
  const pendingAgenda = todayAgenda.filter((item: any) => !item.is_completed);
  const completedAgenda = todayAgenda.filter((item: any) => item.is_completed_today);
  const activeTodayAgenda = [...pendingAgenda, ...completedAgenda];

  // Quick suggestions — only show relevant ones
  const quickLinks = [
    { label: "Rutinler", href: "/apps/rutinler", icon: CalendarCheck, color: "#7C3AED", show: pendingAgenda.length > 0 },
    { label: "Yemek", href: "/apps/meal-planner", icon: ChefHat, color: "#F97316", show: todayMeals.length > 0 },
    { label: "Antrenman", href: "/apps/gym", icon: Barbell, color: "#EF4444", show: !!todayGymPlan },
    { label: "Ev İşleri", href: "/apps/ev-isleri", icon: Broom, color: "#14B8A6", show: pendingTodayChores.length > 0 },
    { label: "Maçlar", href: "/apps/buyuk-maclar", icon: Trophy, color: "#EAB308", show: todayMatches.length > 0 },
    { label: "YTDB", href: "/apps/youtube-discover", icon: YoutubeLogo, color: "#FF0000", show: youtubeSeries.length > 0 },
    { label: "Keşfet", href: "/apps/subcenter", icon: Compass, color: "#06B6D4", show: true },
    { label: "Kitap", href: "/apps/reading", icon: BookOpen, color: "#8B5CF6", show: !!weeklyReadingGoal },
  ].filter(l => l.show);

  const summaryStats = [
    pendingAgenda.length > 0 && { label: `${pendingAgenda.length} görev`, color: "#7C3AED" },
    pendingTodayChores.length > 0 && { label: `${pendingTodayChores.length} ev işi`, color: "#14B8A6" },
    todayMatches.length > 0 && { label: `${todayMatches.length} maç`, color: "#EAB308" },
    pendingTodayGym && { label: "Antrenman var", color: "#EF4444" },
  ].filter(Boolean) as { label: string; color: string }[];

  cards.push({
    id: "welcome-overview",
    categoryTitle: greeting,
    categorySubtitle: `${dayName}, ${dateStr}`,
    categoryColor: "transparent",
    icon: function EverythingLogo() {
      return <img src="/android-chrome-192x192.png" alt="Everything" className="w-10 h-10 rounded-2xl object-cover" />;
    },
    statusType: "discover",
    content: (() => {
      const infos: { icon: any; title: string; desc: string; color: string }[] = [
        {
          icon: Sparkle,
          title: "Everything Nedir?",
          desc: "Günlük hayatınızı ve işlerinizi kolaylaştıran servisler ve pratik araçlar bir arada.",
          color: "#6366F1",
        },
        {
          icon: Compass,
          title: "Diğer Sayfalarda Ne Var?",
          desc: "Hobi, Yaşam, Şehrini Keşfet ve Cüzdan sekmelerinde ilgi alanlarınıza özel servisler bulunur.",
          color: "#0EA5E9",
        },
        {
          icon: Robot,
          title: "Yapay Zeka Asistanı",
          desc: "Akıllı asistan ile konuşarak görevlerinizi yönetebilir ve hızlıca bilgi alabilirsiniz.",
          color: "#8B5CF6",
        },
        {
          icon: Storefront,
          title: "İşletmeler İçin",
          desc: "İşletmenizi büyütmek, randevuları ve müşteri topluluğunuzu yönetmek için özel stüdyo araçları.",
          color: "#10B981",
        },
      ];
      return (
        <div className="flex-1 flex flex-col overflow-hidden py-1">
          {/* Vertical info cards */}
          <div className="overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-none flex-1 min-h-0">
            {infos.map((info, idx) => (
              <div
                key={idx}
                className="w-full rounded-2xl border border-app-border bg-app-surface-muted p-2.5 flex flex-col gap-1.5 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: info.color }}
                  >
                    <info.icon size={14} weight="fill" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-app-text leading-tight">
                    {info.title}
                  </span>
                </div>
                <p className="text-[10px] text-app-muted leading-relaxed pl-9">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );
    })(),
  });

  if (todayAgenda) {
    cards.push({
      id: "agenda-unified",
      categoryTitle: "Bugünün Görevleri",
      categorySubtitle: "Ajanda",
      categoryColor: "#7C3AED",
      icon: CalendarCheck,
      appHref: "/apps/rutinler",
      statusType: pendingAgenda.length > 0 ? "pending" : "completed",
      content: (
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-2 space-y-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {activeTodayAgenda.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-app-border bg-app-surface-muted/20 my-auto flex flex-col items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500/80 mb-2" weight="fill" />
                <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">
                  Bugün yapılacak görev yok 🎉
                </p>
              </div>
            ) : (
              activeTodayAgenda.map((item: any) => {
                const linkedApp = getLinkedAppForRoutine(item.item_name);
                const isDone = item.is_completed || item.is_completed_today;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isDone
                      ? "bg-app-surface-muted/50 border-app-border/40 opacity-60"
                      : "bg-app-surface-muted border-app-border"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xl shrink-0">{item.item_emoji || "⏰"}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black truncate ${isDone ? "line-through text-app-muted" : "text-app-text"}`}>
                          {item.item_name}
                        </p>
                        <p className="text-[10px] font-bold text-app-muted truncate">
                          {getAgendaPeriodLabel(item)} {linkedApp ? `· ${linkedApp.label}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={actionLoading === `agenda-${item.id}`}
                        onClick={() => void handleToggleAgendaComplete(item.id, isDone)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 bg-transparent text-app-text border-white/20 hover:bg-white/10 ${isDone ? "opacity-60" : ""
                          }`}
                      >
                        <CheckCircle size={10} weight="bold" />
                        <span>{isDone ? "Tamamlandı" : "Tamamla"}</span>
                      </button>
                      {!isDone && (
                        <button
                          type="button"
                          disabled={actionLoading === `agenda-postpone-${item.id}`}
                          onClick={() => void handlePostponeAgendaItem(item.id)}
                          className="p-1.5 rounded-lg text-app-muted hover:text-app-text border border-white/20 bg-transparent text-[10px] transition-all"
                          title="Ertele"
                        >
                          <ClockAfternoon size={10} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ),
    });
  }

  // 2. Unified Ev İşleri Card
  const allChores = [...pendingTodayChores, ...completedTodayChores];
  if (weeklyChores) {
    cards.push({
      id: "chores-unified",
      categoryTitle: "Bugünün Ev İşleri",
      categorySubtitle: "Ev İşleri",
      categoryColor: "#14B8A6",
      icon: Broom,
      appHref: "/apps/ev-isleri",
      statusType: pendingTodayChores.length > 0 ? "pending" : "completed",
      content: (
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-2 space-y-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {allChores.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-dashed border-app-border bg-app-surface-muted/20 my-auto flex flex-col items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500/80 mb-2" weight="fill" />
                <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">
                  Bugün ev işi yok 🎉
                </p>
              </div>
            ) : (
              allChores.map((chore: any) => {
                const isDone = completedTodayChores.some((c: any) => c.id === chore.id);
                return (
                  <div
                    key={chore.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isDone
                      ? "bg-app-surface-muted/50 border-app-border/40 opacity-60"
                      : "bg-app-surface-muted border-app-border"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xl shrink-0">{chore.choreIcon || "🧹"}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black truncate ${isDone ? "line-through text-app-muted" : "text-app-text"}`}>
                          {chore.choreName}
                        </p>
                        <p className="text-[10px] font-bold text-app-muted truncate">
                          Atanan: {chore.assigneeUsername || "Üye"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading === `chore-${chore.id}`}
                      onClick={() => void handleToggleChoreComplete(chore.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 bg-transparent text-app-text border-white/20 hover:bg-white/10 ${isDone ? "opacity-60" : ""
                        }`}
                    >
                      <CheckCircle size={10} weight="bold" />
                      <span>{isDone ? "Bitti" : "Tamamla"}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ),
    });
  }

  // 3. Unified Matches Card (Büyük Maçlar)
  cards.push({
    id: "matches-unified",
    categoryTitle: "Yakındaki Büyük Maçlar",
    categorySubtitle: "Büyük Maçlar",
    categoryColor: "#E11D48",
    icon: Trophy,
    appHref: "/apps/buyuk-maclar",
    statusType: "discover",

    content: (
      <div className="flex-1 flex flex-col justify-center overflow-hidden py-2">
        <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1 flex flex-col justify-center">
          {todayMatches.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-app-border bg-app-surface-muted/20 my-auto flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">⚽</span>
              <p className="text-[10px] font-black text-app-muted uppercase tracking-widest">
                Yakın zamanda büyük bir maç yok
              </p>
            </div>
          ) : (
            todayMatches.slice(0, 4).map((match: any) => {
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
                <div
                  key={match.id}
                  className="p-3 rounded-2xl border bg-app-surface-muted border-app-border flex items-center justify-between gap-3 shrink-0"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-16 px-1.5 py-1 rounded-xl bg-app-surface border border-app-border flex flex-col items-center justify-center shrink-0">
                      {isLive ? (
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-rose-500" />
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
            })
          )}
        </div>
      </div>
    ),
  });

  // 3.5. Unified SeriesTrack Card (Bugünün Dizileri)
  const allSeries = [...pendingAvailableSeries, ...completedTodaySeries];
  if (allSeries.length > 0) {
    cards.push({
      id: "series-unified",
      categoryTitle: "Bugünün Dizileri",
      categorySubtitle: "SeriesTrack",
      categoryColor: "#E50914",
      icon: VideoCamera,
      appHref: seriesTrackHref,
      statusType: pendingAvailableSeries.length > 0 ? "pending" : "completed",
      content: (
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-2 space-y-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {allSeries.map((series: any) => {
              const isDone = completedTodaySeries.some((s: any) => s.id === series.id);
              return (
                <div
                  key={series.id}
                  className={`rounded-2xl border transition-all space-y-2 p-2.5 ${isDone
                    ? "bg-app-surface-muted/50 border-app-border/40 opacity-60"
                    : "bg-app-surface-muted border-app-border"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {series.posterPath ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${series.posterPath}`}
                        alt={series.title}
                        className="w-9 h-12 object-cover rounded-lg border border-app-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-12 rounded-lg bg-[#E50914] text-white flex items-center justify-center shrink-0">
                        <VideoCamera size={18} weight="fill" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black truncate ${isDone ? "line-through text-app-muted" : "text-app-text"}`}>
                        {series.title}
                      </p>
                      <p className="text-[10px] font-bold text-app-muted truncate">
                        S{series.season} B{series.episode}
                        {series.airDate ? ` · ${formatSeriesAirLabel(series.airDate)}` : ""}
                        {series.source === "episode-club" ? " · Episode Club" : ""}
                      </p>
                    </div>
                    {(series.extraUnwatchedCount ?? 0) > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-app-surface-muted text-app-muted text-[9px] font-black tabular-nums border border-white/20">
                        +{series.extraUnwatchedCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!isDone ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openSeriesWatch(series)}
                          className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-white/20 hover:bg-white/10"
                        >
                          <Play size={10} weight="fill" />
                          <span>İzle</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading === `series-${series.id}`}
                          onClick={() => void handleToggleWatched(series)}
                          className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-white/20 hover:bg-white/10"
                        >
                          <CheckCircle size={10} weight="bold" />
                          <span>İzlendi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleIgnoreSeriesToday(series)}
                          className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-white/20 hover:bg-white/10"
                        >
                          <EyeSlash size={10} weight="bold" />
                          <span>Yoksay</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleToggleWatched(series)}
                        className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-app-border opacity-60"
                      >
                        <CheckCircle size={10} weight="bold" />
                        <span>İzlendi</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  // 4. Unified Suggestions Card
  if (suggestions.length > 0) {
    cards.push({
      id: "suggestions-unified",
      categoryTitle: "Yeni Öneriler",
      categorySubtitle: "Suggest",
      categoryColor: "#6366f1",
      icon: PaperPlaneTilt,
      appHref: "/apps/suggest",
      statusType: "discover",
      content: (
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-2 space-y-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {suggestions.map((suggestion: any) => (
              <div
                key={suggestion.id}
                className="p-3 rounded-2xl border bg-app-surface-muted border-app-border flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-app-surface-muted text-app-muted flex items-center justify-center shrink-0 border border-app-border">
                    <PaperPlaneTilt size={16} weight="fill" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-app-text truncate">
                      {suggestion.title}
                    </p>
                    <p className="text-[10px] font-bold text-app-muted truncate">
                      @{suggestion.senderUsername || "birisi"} · {getSuggestionCategoryLabel(suggestion.category)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={actionLoading === `suggest-${suggestion.shareId}-completed`}
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "completed")}
                    className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 bg-transparent text-app-text border-white/20 hover:bg-white/10"
                  >
                    <Check size={10} weight="bold" />
                    <span>Tamamla</span>
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === `suggest-${suggestion.shareId}-ignored`}
                    onClick={() => handleSuggestionStatus(suggestion.shareId, "ignored")}
                    className="p-1.5 rounded-lg text-app-muted hover:text-app-text border border-white/20 bg-transparent text-[10px] transition-all"
                    title="Yok Say"
                  >
                    <X size={10} weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // 4.5. Unified YouTube Discover Card
  if (youtubeSeries.length > 0) {
    cards.push({
      id: "youtube-series-unified",
      categoryTitle: "İzlenecek Videolar Bul",
      categorySubtitle: "YTDB",
      categoryColor: "#FF0000",
      icon: YoutubeLogo,
      appHref: "/apps/youtube-discover",
      statusType: "discover",
      content: (
        <div className="flex-1 flex flex-col justify-center overflow-hidden py-2">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {youtubeSeries.slice(0, 4).map((series: any) => {
              const thumbnailUrl = series.youtube_id
                ? `https://img.youtube.com/vi/${series.youtube_id}/mqdefault.jpg`
                : null;
              return (
                <div
                  key={series.id}
                  onClick={() => router.push(`/apps/youtube-discover/seri?id=${series.id}`)}
                  className="p-3 rounded-2xl border bg-app-surface-muted border-app-border flex items-center justify-between gap-3 cursor-pointer hover:bg-app-surface-muted/80 active:scale-[0.99] transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-app-surface-muted shrink-0 border border-app-border flex items-center justify-center">
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
                      <p className="text-xs font-black text-app-text truncate">
                        {series.title}
                      </p>
                      <p className="text-[10px] font-bold text-app-muted truncate mt-0.5">
                        {series.creator} · {series.episode_count || series.episodes?.length || 0} Bölüm
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  // 5. Gym Card
  if (todayGymPlan?.routine) {
    cards.push({
      id: "gym-today",
      categoryTitle: "Bugünün Antrenmanı",
      categorySubtitle: "Gym",
      categoryColor: "#8B5CF6",
      icon: Barbell,
      appHref: "/apps/gym",
      statusType: completedTodayGym ? "completed" : "pending",
      content: (
        <div className="py-2">
          {/* Exercise list container with button at bottom */}
          <div className={`rounded-2xl border overflow-hidden ${completedTodayGym
            ? "bg-app-surface-muted/50 border-app-border/40"
            : "bg-app-surface-muted border-app-border"
            }`}>
            {(() => {
              const MAX_VISIBLE = 3;
              const exercises = todayGymPlan.routine.exercises;
              const visible = exercises.slice(0, MAX_VISIBLE);
              const remaining = exercises.length - MAX_VISIBLE;
              return (
                <>
                  {visible.map((ex: any, i: number) => {
                    const setsCount = ex.sets?.length ?? 0;
                    const firstSet = ex.sets?.[0];
                    const isWeighted = ex.trackingType === "weighted";
                    const isDuration = ex.trackingType === "duration";
                    return (
                      <div
                        key={ex.slug || i}
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5"
                      >
                        <span className="text-[10px] font-black tabular-nums shrink-0 w-4 text-center text-app-muted">
                          {completedTodayGym ? "✓" : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] font-black truncate ${completedTodayGym ? "line-through text-app-muted" : "text-app-text"
                            }`}>
                            {ex.name}
                          </p>
                          <p className="text-[9px] font-bold text-app-muted truncate">
                            {setsCount > 0 ? `${setsCount} set` : ""}
                            {firstSet && isWeighted && firstSet.reps ? ` · ${firstSet.reps} tekrar` : ""}
                            {firstSet && isWeighted && firstSet.weightKg ? ` · ${firstSet.weightKg} kg` : ""}
                            {isDuration && firstSet?.reps ? ` · ${firstSet.reps} sn` : ""}
                            {!setsCount && !isDuration ? "Vücut ağırlığı" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {remaining > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
                      <span className="text-[10px] font-black tabular-nums shrink-0 w-4 text-center text-app-muted">···</span>
                      <p className="text-[10px] font-bold text-app-muted">+{remaining} egzersiz daha</p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Button row — inside container */}
            <div className="flex items-center gap-1.5 px-4 py-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!completedTodayGym) {
                    startGymSession(
                      todayGymPlan.routine!.name,
                      todayGymPlan.routine!.id,
                      todayGymPlan.routine!.exercises
                    );
                    router.push("/apps/gym/session");
                  } else {
                    router.push("/apps/gym");
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-white/20 hover:bg-white/10"
              >
                {completedTodayGym
                  ? <><CheckCircle size={10} weight="bold" /><span>Antrenman Bitti</span></>
                  : <><Play size={10} weight="fill" /><span>Antrenmanı Başlat</span></>
                }
              </button>
            </div>
          </div>
        </div>
      ),
    });
  }

  // 6. Meal Planner Card
  if (todayMeals.length > 0) {
    cards.push({
      id: "meals-today",
      categoryTitle: "Bugünün Yemek Planı",
      categorySubtitle: "Meal Planner",
      categoryColor: "#F97316",
      icon: ChefHat,
      appHref: "/apps/recipe/plan",
      statusType: allTodayMealsCompleted ? "completed" : "pending",
      content: (
        <div className="flex-1 flex flex-col overflow-hidden py-2 space-y-3">
          <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
            {sortedTodayMeals.map((meal: any) => {
              const mealKey = meal.id || meal.mealType;
              const isDone = completedMealIds.includes(mealKey);
              return (
                <div
                  key={mealKey}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${isDone
                    ? "bg-app-surface-muted/50 border-app-border/40 opacity-60"
                    : "bg-app-surface-muted border-app-border"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-app-surface-muted text-app-muted flex items-center justify-center shrink-0 border border-app-border">
                      <ChefHat size={14} weight="fill" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black truncate ${isDone ? "line-through text-app-muted" : "text-app-text"}`}>
                        {meal.title}
                      </p>
                      <p className="text-[10px] font-bold text-app-muted truncate">
                        {getMealTypeLabel(meal.mealType)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMealCompleted(mealKey)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide flex items-center gap-1 cursor-pointer transition-all bg-transparent text-app-text border-white/20 hover:bg-white/10 ${isDone ? "opacity-60" : ""
                      }`}
                  >
                    <CheckCircle size={10} weight="bold" />
                    <span>{isDone ? "Yendi" : "Yedim"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  } else if (needsMealPlanning) {
    cards.push({
      id: "meal-planning-prompt",
      categoryTitle: "Bugünün Menüsü",
      categorySubtitle: "Meal Planner",
      categoryColor: "#F97316",
      icon: ChefHat,
      appHref: "/apps/recipe/plan",
      statusType: "pending",
      content: (
        <div className="flex-1 flex flex-col justify-between">
          <div className="my-auto py-4 flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Notepad size={32} weight="fill" />
            </div>
            <div>
              <h4 className="text-sm font-black text-app-text">{mealPlanningPrompt}</h4>
              <p className="text-[11px] text-app-muted font-bold mt-0.5">
                Bugünün menüsünü şimdi oluştur
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-app-border/40">
            <DeckActionButton
              primary
              onClick={() => router.push("/apps/recipe/plan")}
              icon={Plus}
            >
              Yemek Planı Oluştur
            </DeckActionButton>
          </div>
        </div>
      ),
    });
  }

  // 7. Reading Card
  if (weeklyReadingGoal && (weeklyReadingGoal.status === "active" || weeklyReadingGoal.status === "completed")) {
    const isCompleted = weeklyReadingGoal.status === "completed";
    const rgTotal = weeklyReadingGoal.book_total_pages || 0;
    const rgCurrent = weeklyReadingGoal.book_current_page ?? 0;
    const rgBase = readingBase ?? rgCurrent;
    const rgRemainingDays = readingRemainingDays(weeklyReadingGoal.week_start, weeklyReadingGoal.weeks);
    const rgDailyTarget = readingDailyTarget(rgBase, rgTotal, rgRemainingDays);
    const rgChunks = readingChunks(rgDailyTarget);
    const rgHasTarget = rgTotal > 0 && rgTotal - rgBase > 0 && rgChunks.length > 0;
    const totalTodayPages = rgChunks.reduce((a, b) => a + b, 0);
    const isTodayTargetCompleted = rgHasTarget && rgCurrent >= rgBase + totalTodayPages;

    if (weeklyReadingGoal.book_title) {
      cards.push({
        id: "reading-today",
        categoryTitle: "Bugünün Okuması",
        categorySubtitle: "Oku Oku",
        categoryColor: "#7C5C43",
        icon: BookOpen,
        appHref: "/apps/read-tracker",
        statusType: (isCompleted || isTodayTargetCompleted) ? "completed" : "pending",
        content: (
          <div className="flex-1 flex flex-col justify-between">
            <div className="my-auto py-3 flex flex-col items-center text-center space-y-2">
              {weeklyReadingGoal.book_cover ? (
                <img
                  src={weeklyReadingGoal.book_cover}
                  alt={weeklyReadingGoal.book_title}
                  className={`w-16 h-24 object-cover rounded-xl border border-app-border shadow-md transition-all ${isCompleted || isTodayTargetCompleted ? "opacity-60" : ""
                    }`}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[#7C5C43] text-white flex items-center justify-center shadow-inner">
                  <BookOpen size={30} weight="fill" />
                </div>
              )}
              <div>
                <h4 className={`text-sm font-black text-app-text tracking-tight ${isCompleted || isTodayTargetCompleted ? "line-through text-app-muted" : ""
                  }`}>
                  {weeklyReadingGoal.book_title}
                </h4>
                <p className="text-[10px] font-bold text-emerald-500 mt-0.5 flex items-center gap-1 justify-center">
                  {isCompleted ? (
                    <><CheckCircle size={10} weight="bold" /><span>Kitap bitirildi 🎉</span></>
                  ) : isTodayTargetCompleted ? (
                    <><CheckCircle size={10} weight="bold" /><span>Bugünün hedefi tamamlandı 🎉</span></>
                  ) : (
                    <span className="text-app-muted">Sayfa {rgCurrent}{rgTotal ? ` / ${rgTotal}` : ""}</span>
                  )}
                </p>
              </div>
            </div>

            {rgHasTarget && !isCompleted && (
              <div className="pt-3 border-t border-app-border/40 space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-wider text-app-muted text-center">
                  Bugünün Okuma Parçaları:
                </p>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {rgChunks.map((c, i) => {
                    const cumInc = rgChunks.slice(0, i + 1).reduce((a, b) => a + b, 0);
                    const filled = rgCurrent >= rgBase + cumInc;
                    return (
                      <DeckActionButton
                        key={i}
                        selected={filled}
                        onClick={() => {
                          const cumExc = rgChunks.slice(0, i).reduce((a, b) => a + b, 0);
                          handleReadingUpdate(filled ? rgBase + cumExc : rgBase + cumInc);
                        }}
                        icon={filled ? CheckCircle : Plus}
                      >
                        {c} sf
                      </DeckActionButton>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ),
      });
    }
  }



  const { dailyWidgetStates, updateDailyWidgetStates } = useHome();
  const cardOrder = dailyWidgetStates?.cardOrder || [];
  const hiddenCardIds = dailyWidgetStates?.hiddenCardIds || [];

  const handleMoveCard = (cardId: string, direction: "up" | "down") => {
    const currentOrder = [...cardOrder];
    // Populate any cards not yet in custom order to preserve full list length
    cards.forEach((c) => {
      if (!currentOrder.includes(c.id)) {
        currentOrder.push(c.id);
      }
    });

    const index = currentOrder.indexOf(cardId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentOrder.length) return;

    // Swap elements
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[newIndex];
    currentOrder[newIndex] = temp;

    void updateDailyWidgetStates({ cardOrder: currentOrder });
  };

  const handleToggleHideCard = (cardId: string) => {
    const newHidden = hiddenCardIds.includes(cardId)
      ? hiddenCardIds.filter((id) => id !== cardId)
      : [...hiddenCardIds, cardId];
    void updateDailyWidgetStates({ hiddenCardIds: newHidden });
  };

  // Dynamic sort: active (by order/priority) -> discover -> completed -> hidden (at the very end)
  cards.sort((a, b) => {
    // Welcome card always stays at position 0
    if (a.id === "welcome-overview") return -1;
    if (b.id === "welcome-overview") return 1;

    const isAHidden = hiddenCardIds.includes(a.id);
    const isBHidden = hiddenCardIds.includes(b.id);

    if (isAHidden && !isBHidden) return 1;
    if (!isAHidden && isBHidden) return -1;
    if (isAHidden && isBHidden) return 0;

    const indexA = cardOrder.indexOf(a.id);
    const indexB = cardOrder.indexOf(b.id);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    const order = { pending: 0, discover: 1, completed: 2 };
    const aType = a.statusType ?? "discover";
    const bType = b.statusType ?? "discover";
    return order[aType] - order[bType];
  });

  const totalCards = cards.length;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const hasInitializedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!scrollRef.current) return;
    if (totalCards <= 1) return;

    try {
      const seen = localStorage.getItem("everything_welcome_onboarding_seen");
      if (seen === "true") {
        hasInitializedRef.current = true;
        const timer = setTimeout(() => {
          if (!scrollRef.current) return;
          const el = scrollRef.current;
          const cardWidth = el.clientWidth;
          if (cardWidth > 0) {
            el.scrollLeft = cardWidth;
            setActiveIndex(1);
          }
        }, 60);
        return () => clearTimeout(timer);
      }
    } catch {
      // safe fallback
    }
  }, [totalCards]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.clientWidth;
    if (cardWidth > 0) {
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(Math.max(0, Math.min(idx, totalCards - 1)));
      if (idx >= 1) {
        try {
          localStorage.setItem("everything_welcome_onboarding_seen", "true");
        } catch {
          // safe fallback
        }
      }
    }
  };

  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.clientWidth;
    el.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl border border-app-border bg-app-surface shadow-sm space-y-4 animate-pulse min-h-[460px] flex flex-col justify-between">
        <div className="h-6 w-32 bg-app-surface-muted rounded-lg" />
        <div className="h-56 bg-app-surface-muted rounded-2xl" />
        <div className="h-10 bg-app-surface-muted rounded-xl" />
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="p-8 text-center rounded-3xl border border-app-border bg-app-surface shadow-sm space-y-4 min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
          <Sparkle size={32} weight="fill" />
        </div>
        <div>
          <h3 className="text-base font-black text-app-text tracking-tight uppercase">
            Günün Kartları Tamamlandı! 🎉
          </h3>
          <p className="text-xs font-bold text-app-muted max-w-xs mx-auto mt-1">
            Bugünlük tamamlanacak tüm görevleri ve aksiyonları bitirdin. Harika bir gün!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-3 group">
      {/* Desktop Prev Button */}
      {activeIndex > 1 && (
        <button
          type="button"
          onClick={() => scrollToCard(activeIndex - 1)}
          className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-app-surface/90 backdrop-blur-md border border-app-border shadow-lg items-center justify-center text-app-text hover:bg-app-surface-muted hover:scale-105 active:scale-95 transition-all"
          title="Önceki Kart"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
      )}

      {/* Desktop Next Button */}
      {activeIndex < totalCards - 1 && (
        <button
          type="button"
          onClick={() => scrollToCard(activeIndex + 1)}
          className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-app-surface/90 backdrop-blur-md border border-app-border shadow-lg items-center justify-center text-app-text hover:bg-app-surface-muted hover:scale-105 active:scale-95 transition-all"
          title="Sonraki Kart"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      )}

      {/* Carousel Scroll Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="-mx-4 sm:mx-0 flex gap-3.5 sm:gap-0 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-1 no-scrollbar scroll-px-4 sm:scroll-px-0"
      >
        {/* Mobile Left Spacer */}
        <div className="shrink-0 w-[1.5%] sm:hidden pointer-events-none" />

        {cards.map((card, i) => {
          const isHidden = hiddenCardIds.includes(card.id);
          return (
            <div
              key={card.id}
              className={`snap-center shrink-0 w-[91%] sm:w-full h-[calc(100vh-215px)] min-h-[460px] max-h-[640px] flex flex-col justify-between rounded-[28px] border bg-app-surface shadow-lg p-4 transition-all duration-300 ${
                isHidden
                  ? "opacity-45 border-dashed border-app-border/60 scale-[0.97] saturate-[0.3]"
                  : "border-app-border"
              }`}
            >
              {/* Header */}
              <div className={`flex items-center border-b border-app-border/60 pb-3.5 shrink-0 ${card.id === "welcome-overview" ? "justify-center" : "justify-between"}`}>
                <div className={`flex items-center gap-3 ${card.id === "welcome-overview" ? "justify-center" : ""}`}>
                  {card.id === "welcome-overview" ? (
                    <img src="/android-chrome-192x192.png" alt="Everything" className="w-10 h-10 rounded-2xl object-cover" />
                  ) : (
                    <>
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: card.categoryColor }}
                      >
                        <card.icon size={22} weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-app-text tracking-tight flex items-center gap-2">
                          {card.categoryTitle}
                          {isHidden && (
                            <span className="text-[8px] font-black text-app-muted uppercase bg-app-surface-muted px-1.5 py-0.5 rounded-lg border border-app-border shrink-0">
                              İlgilenmiyorum
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] font-bold text-app-muted tracking-wide mt-0.5">
                          {card.categorySubtitle}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {card.appHref && (
                  <button
                    type="button"
                    onClick={() => router.push(card.appHref!)}
                    className="w-9 h-9 rounded-xl border border-app-border bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all shrink-0 active:scale-95 shadow-sm"
                    title="Uygulamayı Aç"
                  >
                    <ArrowUpRight size={16} weight="bold" />
                  </button>
                )}
              </div>

              {/* Card content */}
              <div className="flex-1 overflow-hidden flex flex-col justify-center min-h-0">
                {card.content}
              </div>

              {/* Navigation & Action Footer */}
              <div className="pt-3 border-t border-app-border/60 shrink-0 flex items-center justify-between mt-2.5 relative">
                {/* Left Side: Arrow Navigation (hidden for welcome card) */}
                {card.id !== "welcome-overview" && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={i <= 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToCard(i - 1);
                      }}
                      className="flex items-center gap-1 text-app-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <ArrowLeft size={11} weight="bold" />
                    </button>

                    <button
                      type="button"
                      disabled={i === totalCards - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToCard(i + 1);
                      }}
                      className="flex items-center gap-1 text-app-muted hover:text-app-text disabled:opacity-30 disabled:cursor-not-allowed text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <ArrowRight size={11} weight="bold" />
                    </button>
                  </div>
                )}

                {/* Center: scroll hint (welcome card only) */}
                {card.id === "welcome-overview" && (
                  <p className="absolute left-1/2 -translate-x-1/2 text-[9px] font-black text-app-muted uppercase tracking-widest flex items-center gap-1 pointer-events-none select-none whitespace-nowrap">
                    <ArrowRight size={10} weight="bold" />
                    <span>Başlamak için kaydır</span>
                  </p>
                )}

                {/* Right Side: Gizle + footerAction (hidden for welcome card) */}
                {card.id !== "welcome-overview" && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToCard(0);
                      }}
                      className="flex items-center gap-1 text-app-muted hover:text-app-text text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <X size={11} weight="bold" />
                      <span>Gizle</span>
                    </button>

                    {card.footerAction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          card.footerAction?.onClick();
                        }}
                        className="flex items-center gap-1 text-app-muted hover:text-app-text text-[9px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shrink-0"
                      >
                        {card.footerAction.icon && <card.footerAction.icon size={11} weight="bold" className="shrink-0" />}
                        <span>{card.footerAction.label}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Mobile Right Spacer */}
        <div className="shrink-0 w-[1.5%] sm:hidden pointer-events-none" />
      </div>
    </div>
  );
}
