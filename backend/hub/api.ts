import { api } from "encore.dev/api";

// Import API functions directly from service API files
import { listPlaces } from "../workplaces/api";
import { getEvents } from "../campus-events/api";
import { getUserSeries } from "../series-track/api";
import { getUserSubscriptions } from "../subcenter/api";
import { getUserProjects } from "../budget/api";
import { getStats } from "../tasarruf-challenges/api";
import { getInbox } from "../suggest/api";
import { getActivities } from "../kim-gelir/api";

// Import types
import { Place } from "../workplaces/api";
import { CampusEvent } from "../campus-events/api";
import { UserSeries } from "../series-track/api";
import { Subscription } from "../subcenter/api";
import { Project } from "../budget/api";
import { StatsResponse } from "../tasarruf-challenges/api";
import { InboxSuggestion } from "../suggest/api";
import { Activity } from "../kim-gelir/api";

export interface HomeWidgetsResponse {
  places: Place[];
  events: CampusEvent[];
  series: UserSeries[];
  subscriptions: Subscription[];
  budgetProjects: Project[];
  savingsStats: StatsResponse | null;
  suggestions: InboxSuggestion[];
  activities: Activity[];
}

export interface GetHomeWidgetsRequest {
  userId?: string;
}

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

    const [placesRes, eventsRes, seriesRes, subRes, budgetRes, savingsStats, suggestRes, activityRes] = await Promise.all([
      fetchWithFallback(listPlaces({ userId }), { places: [] }),
      fetchWithFallback(getEvents({ userId }), { events: [] }),
      fetchWithFallback(userId ? getUserSeries({ userId }) : Promise.resolve({ series: [] }), { series: [] }),
      fetchWithFallback(userId ? getUserSubscriptions({ userId }) : Promise.resolve({ subscriptions: [] }), { subscriptions: [] }),
      fetchWithFallback(userId ? getUserProjects({ userId }) : Promise.resolve({ projects: [] }), { projects: [] }),
      fetchWithFallback(userId ? getStats({ userId }) : Promise.resolve(null), null),
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
      suggestions: suggestRes.suggestions || [],
      activities: activityRes.activities || []
    };
  }
);
