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
  Barbell,
  ChefHat,
  Notepad,
  Plus,
  BookOpen,
  Broom,
  ArrowRight,
  Compass,
  GameController,
  ListBullets,
  Cards,
  Sparkle,
} from "@phosphor-icons/react";
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
}

import { useState } from "react";
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
  } = props;

  const router = useRouter();
  const [viewMode, setViewMode] = useState<"cards" | "list" | "assistant">("cards");

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
  ];

  const pendingWidgets = widgets.filter((widget) => widget.loading || widget.hasContent);
  const finishedWidgets = widgets.filter((widget) => {
    if (widget.key === "suggest" || widget.key === "activities") return false;
    return !widget.loading && !widget.hasContent;
  });

  return (
    <div className="space-y-4">
      {/* Görünüm modu: Kartlar / Liste / Asistan */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-xl border border-app-border bg-app-surface-muted">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              viewMode === "cards"
                ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            <Cards size={13} weight="bold" />
            <span>Kartlar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              viewMode === "list"
                ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            <ListBullets size={13} weight="bold" />
            <span>Liste</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("assistant")}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              viewMode === "assistant"
                ? "bg-app-surface text-app-text border border-app-border shadow-xs"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            <Sparkle size={13} weight="bold" />
            <span>Asistan</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "cards" ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0, scale: 0.93, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <DeckView {...props} />
          </motion.div>
        ) : viewMode === "assistant" ? (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <AIChatView />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="space-y-4"
          >
            {/* 1. YAPILACAKLAR */}
            {pendingWidgets.length > 0 && (
              <div className="space-y-2.5">
                <HomeGroupHeader title="Yapılacaklar" />
                {pendingWidgets.map((widget) => (
                  <div key={widget.key}>{widget.card}</div>
                ))}
              </div>
            )}

            {/* 2. BAŞKA NE YAPABİLİRİM? */}
            <div className="pt-2 space-y-2.5">
              <HomeGroupHeader title="Başka Ne Yapabilirim?" />
              <div className="space-y-3">
                {/* Dizi & Film Keşfet Card */}
                <HomeSummaryCard
                  href={seriesTrackHref}
                  icon={VideoCamera}
                  color="#E50914"
                  title="Popüler Dizi & Filmler"
                  subtitle="SeriesTrack & Trendler"
                  loading={false}
                  emptyText="Trend Dizileri Keşfet"
                  hasContent={true}
                >
                  <div className="px-4 py-3 border-t border-app-border space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
                        <VideoCamera size={20} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-app-text truncate">
                          SeriesTrack Keşfet
                        </p>
                        <p className="text-[9px] font-bold text-app-muted truncate mt-0.5">
                          Yeni bölümler, trend yapımlar ve sinema önerileri
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <WidgetActionButton onClick={() => router.push(seriesTrackHref)} icon={Play}>
                        Trend Yapımları Gör
                      </WidgetActionButton>
                    </div>
                  </div>
                </HomeSummaryCard>

                {/* Şehrini Keşfet Card */}
                <HomeSummaryCard
                  href="/home?tab=explore"
                  icon={Compass}
                  color="#10B981"
                  title="Şehrini Keşfet & Etkinlikler"
                  subtitle="Mekanlar & Rotalar"
                  loading={false}
                  emptyText="Keşfet"
                  hasContent={true}
                >
                  <div className="px-4 py-3 border-t border-app-border space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Compass size={20} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-app-text truncate">
                          Popüler Mekanlar & Etkinlikler
                        </p>
                        <p className="text-[9px] font-bold text-app-muted truncate mt-0.5">
                          Çevrendeki kafeler, restoranlar ve etkinlik takvimi
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <WidgetActionButton onClick={() => router.push("/home?tab=explore")} icon={ArrowRight}>
                        Mekanları İncele
                      </WidgetActionButton>
                    </div>
                  </div>
                </HomeSummaryCard>

                {/* Hobi & Oyunlar Card */}
                <HomeSummaryCard
                  href="/home?tab=hobby"
                  icon={GameController}
                  color="#8B5CF6"
                  title="Hobi & Eğlence"
                  subtitle="Oyunlar & Müzik"
                  loading={false}
                  emptyText="Keşfet"
                  hasContent={true}
                >
                  <div className="px-4 py-3 border-t border-app-border space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <GameController size={20} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-app-text truncate">
                          Oyunlar & Hobi Dünyası
                        </p>
                        <p className="text-[9px] font-bold text-app-muted truncate mt-0.5">
                          Mini oyunlar, çalma listeleri ve hobi araçları
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <WidgetActionButton onClick={() => router.push("/home?tab=hobby")} icon={ArrowRight}>
                        Eğlenceye Geç
                      </WidgetActionButton>
                    </div>
                  </div>
                </HomeSummaryCard>
              </div>
            </div>

            {/* 3. BİTENLER (Bugün Bitirdiklerim) */}
            {finishedWidgets.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <HomeGroupHeader title="Bugün Bitirdiklerim" />
                {finishedWidgets.map((widget) => (
                  <div key={widget.key}>{widget.card}</div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
