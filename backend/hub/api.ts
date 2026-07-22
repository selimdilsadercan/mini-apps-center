import { api } from "encore.dev/api";

// Import API functions directly from service API files
import { listPlaces } from "../workplaces/api";
import { getEvents } from "../campus-events/api";
import { getUserSeries, getTodayEpisodes, TodaySeriesItem } from "../series-track/api";
import { getUserSubscriptions } from "../subcenter/api";
import { getUserProjects } from "../budget/api";
import { getStats as getTasarrufStats } from "../tasarruf-challenges/api";
import { getStats as getSustainabilityStats, SustainabilityStats } from "../surdurulebilirlik/api";
import { getInbox } from "../suggest/api";
import { getActivities } from "../kim-gelir/api";
import { getTodayPlan, TodayPlan } from "../gym/api";
import { getTodayMeals, MealPlanMeal } from "../recipe/api";
import { getTodayAgenda, RoutineEntry } from "../rutinler/api";
import { getTodayIntegratedChores, IntegratedTodayChores } from "../ev-isleri/api";
import { getWeeklyGoals, WeeklyGoal } from "../read-tracker/api";
import { listMatches, BigMatch } from "../buyuk-maclar/api";
import { listSeries, Series } from "../ytdb/api";
import { getItems as getEksikItems, MissingItem } from "../eksik-var/api";

// Import types
import { Place } from "../workplaces/api";
import { CampusEvent } from "../campus-events/api";
import { UserSeries } from "../series-track/api";
import { Subscription } from "../subcenter/api";
import { Project } from "../budget/api";
import { StatsResponse } from "../tasarruf-challenges/api";
import { InboxSuggestion } from "../suggest/api";
import { Activity } from "../kim-gelir/api";

export interface DiscoverWidgetsResponse {
  suggestions: InboxSuggestion[];
  activities: Activity[];
  todaySeries: TodaySeriesItem[];
  todayGymPlan: TodayPlan | null;
  todayMeals: MealPlanMeal[];
  todayAgenda: RoutineEntry[];
  weeklyChores: IntegratedTodayChores | null;
  weeklyReadingGoal: WeeklyGoal | null;
  todayMatches: BigMatch[];
  youtubeSeries: Series[];
  eksikItems: MissingItem[];
  hasFollowedSeries: boolean;
}

export interface ExploreWidgetsResponse {
  places: Place[];
}

export interface HobbyWidgetsResponse {
  series: UserSeries[];
}

export interface WalletWidgetsResponse {
  subscriptions: Subscription[];
  budgetProjects: Project[];
  savingsStats: StatsResponse | null;
  sustainabilityStats: SustainabilityStats | null;
}

export interface LifeWidgetsResponse {
  suggestions: InboxSuggestion[];
  activities: Activity[];
  sustainabilityStats: SustainabilityStats | null;
}

export interface HomeWidgetsResponse {
  places: Place[];
  events: CampusEvent[];
  series: UserSeries[];
  subscriptions: Subscription[];
  budgetProjects: Project[];
  savingsStats: StatsResponse | null;
  sustainabilityStats: SustainabilityStats | null;
  suggestions: InboxSuggestion[];
  activities: Activity[];
}

export interface GetHomeWidgetsRequest {
  userId?: string;
}

const fetchWithFallback = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await promise;
  } catch (e) {
    console.error("Hub aggregate fetch error:", e);
    return fallback;
  }
};

/**
 * Aggregates data for the "Discover" (Bugün) tab
 */
export const getDiscoverWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets/discover" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<DiscoverWidgetsResponse> => {
    if (!userId) {
      return {
        suggestions: [],
        activities: [],
        todaySeries: [],
        todayGymPlan: null,
        todayMeals: [],
        todayAgenda: [],
        weeklyChores: null,
        weeklyReadingGoal: null,
        todayMatches: [],
        youtubeSeries: [],
        eksikItems: [],
        hasFollowedSeries: false,
      };
    }

    // Helper: get Monday of current week (YYYY-MM-DD) in Europe/Istanbul timezone
    const getMonday = () => {
      const trStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
      const d = new Date(trStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const date = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${date}`;
    };
    const currentWeekStart = getMonday();

    const [suggestRes, activityRes, seriesRes, gymRes, mealRes, agendaRes, choresRes, readingGoalsRes, matchRes, ytRes, eksikRes] = await Promise.all([
      fetchWithFallback(getInbox({ userId }), { suggestions: [] }),
      fetchWithFallback(getActivities({ userId }), { activities: [] }),
      fetchWithFallback(getTodayEpisodes({ userId }), { items: [], hasFollowedSeries: false }),
      fetchWithFallback(getTodayPlan({ userId }), null),
      fetchWithFallback(getTodayMeals({ userId }), { meals: [] }),
      fetchWithFallback(getTodayAgenda({ userId }), { entries: [] }),
      fetchWithFallback(getTodayIntegratedChores({ userId }), { chores: null }),
      fetchWithFallback(getWeeklyGoals({ userId }), { goals: [] }),
      fetchWithFallback(listMatches({ sport: "all" }), { matches: [], fetchedAt: "", source: "" }),
      fetchWithFallback(listSeries(), { series: [] }),
      fetchWithFallback(getEksikItems({ userId }), { items: [] }),
    ]);

    const currentWeekGoal =
      // 1. Bu haftanın aktif hedefi
      readingGoalsRes.goals?.find(
        (g: WeeklyGoal) => g.week_start === currentWeekStart && g.status === "active"
      ) ??
      // 2. Herhangi bir haftadan kalan ve hala aktif (devam eden) hedef
      readingGoalsRes.goals?.find((g: WeeklyGoal) => g.status === "active") ??
      // 3. Bu haftaya ait tamamlanmış veya pas geçilmiş hedef
      readingGoalsRes.goals?.find((g: WeeklyGoal) => g.week_start === currentWeekStart) ??
      null;

    const maxLookaheadMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    const filteredMatches = (matchRes.matches || []).filter((m: BigMatch) => {
      if (m.state === "live") return true;
      const t = Date.parse(m.startAt);
      if (Number.isNaN(t)) return false;
      if (m.state === "finished") {
        return now - t <= 24 * 60 * 60 * 1000;
      }
      return t - now <= maxLookaheadMs;
    });

    return {
      suggestions: suggestRes.suggestions || [],
      activities: activityRes.activities || [],
      todaySeries: seriesRes.items || [],
      todayGymPlan: gymRes,
      todayMeals: mealRes.meals || [],
      todayAgenda: agendaRes.entries || [],
      weeklyChores: choresRes.chores,
      weeklyReadingGoal: currentWeekGoal,
      todayMatches: filteredMatches,
      youtubeSeries: ytRes.series || [],
      eksikItems: (typeof eksikRes !== "undefined" && eksikRes?.items) || [],
      hasFollowedSeries: seriesRes.hasFollowedSeries || false,
    };
  }
);

/**
 * Aggregates data for the "Explore" tab
 */
export const getExploreWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets/explore" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<ExploreWidgetsResponse> => {
    const placesRes = await fetchWithFallback(listPlaces({ userId }), { places: [] });
    return { places: placesRes.places || [] };
  }
);

/**
 * Aggregates data for the "Hobby" tab
 */
export const getHobbyWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets/hobby" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<HobbyWidgetsResponse> => {
    if (!userId) return { series: [] };
    const seriesRes = await fetchWithFallback(getUserSeries({ userId }), { series: [] });
    return { series: seriesRes.series || [] };
  }
);

/**
 * Aggregates data for the "Wallet" tab
 */
export const getWalletWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets/wallet" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<WalletWidgetsResponse> => {
    if (!userId) return { subscriptions: [], budgetProjects: [], savingsStats: null, sustainabilityStats: null };
    
    const [subRes, budgetRes, savingsStats, sustainabilityStats] = await Promise.all([
      fetchWithFallback(getUserSubscriptions({ userId }), { subscriptions: [] }),
      fetchWithFallback(getUserProjects({ userId }), { projects: [] }),
      fetchWithFallback(getTasarrufStats({ userId }), null),
      fetchWithFallback(getSustainabilityStats({ userId }), null),
    ]);

    return {
      subscriptions: subRes.subscriptions || [],
      budgetProjects: budgetRes.projects || [],
      savingsStats,
      sustainabilityStats,
    };
  }
);

/**
 * Aggregates data for the "Life" tab
 */
export const getLifeWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets/life" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<LifeWidgetsResponse> => {
    if (!userId) return { suggestions: [], activities: [], sustainabilityStats: null };
    
    const [suggestRes, activityRes, sustainabilityStats] = await Promise.all([
      fetchWithFallback(getInbox({ userId }), { suggestions: [] }),
      fetchWithFallback(getActivities({ userId }), { activities: [] }),
      fetchWithFallback(getSustainabilityStats({ userId }), null),
    ]);

    return {
      suggestions: suggestRes.suggestions || [],
      activities: activityRes.activities || [],
      sustainabilityStats,
    };
  }
);

/**
 * Aggregates data for the home page widgets from various services
 */
export const getHomeWidgets = api(
  { expose: true, method: "GET", path: "/hub/widgets" },
  async ({ userId }: GetHomeWidgetsRequest): Promise<HomeWidgetsResponse> => {
    // Individual error handling for each request to ensure partial success
    const fetchWithFallback = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
      try {
        return await promise;
      } catch (e) {
        console.error("Hub aggregate fetch error:", e);
        return fallback;
      }
    };

    const [placesRes, eventsRes, seriesRes, subRes, budgetRes, savingsStats, sustainabilityStats, suggestRes, activityRes] = await Promise.all([
      fetchWithFallback(listPlaces({ userId }), { places: [] }),
      fetchWithFallback(getEvents({ userId }), { events: [] }),
      fetchWithFallback(userId ? getUserSeries({ userId }) : Promise.resolve({ series: [] }), { series: [] }),
      fetchWithFallback(userId ? getUserSubscriptions({ userId }) : Promise.resolve({ subscriptions: [] }), { subscriptions: [] }),
      fetchWithFallback(userId ? getUserProjects({ userId }) : Promise.resolve({ projects: [] }), { projects: [] }),
      fetchWithFallback(userId ? getTasarrufStats({ userId }) : Promise.resolve(null), null),
      fetchWithFallback(userId ? getSustainabilityStats({ userId }) : Promise.resolve(null), null),
      fetchWithFallback(userId ? getInbox({ userId }) : Promise.resolve({ suggestions: [] }), { suggestions: [] }),
      fetchWithFallback(userId ? getActivities({ userId }) : Promise.resolve({ activities: [] }), { activities: [] })
    ]);

    return {
      places: placesRes.places || [],
      events: eventsRes.events || [],
      series: seriesRes.series || [],
      subscriptions: subRes.subscriptions || [],
      budgetProjects: budgetRes.projects || [],
      savingsStats: savingsStats,
      sustainabilityStats: sustainabilityStats,
      suggestions: suggestRes.suggestions || [],
      activities: activityRes.activities || []
    };
  }
);
