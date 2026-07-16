import { api, APIError } from "encore.dev/api";
import {
  fetchBigMatches,
  pickWatchSuggestion,
  type BigMatch,
  type MatchSport,
} from "./espn";

export type { BigMatch, MatchSport } from "./espn";

interface ListMatchesRequest {
  sport?: MatchSport | "all";
  liveOnly?: boolean;
}

interface ListMatchesResponse {
  matches: BigMatch[];
  fetchedAt: string;
  source: string;
}

interface WatchSuggestionResponse {
  match: BigMatch | null;
  reason: string;
  fetchedAt: string;
}

export const listMatches = api(
  { expose: true, method: "GET", path: "/buyuk-maclar/matches" },
  async ({ sport, liveOnly }: ListMatchesRequest): Promise<ListMatchesResponse> => {
    try {
      const matches = await fetchBigMatches({
        sport: sport ?? "all",
        liveOnly: liveOnly === true,
      });
      return {
        matches,
        fetchedAt: new Date().toISOString(),
        source: "espn",
      };
    } catch (err) {
      console.error("listMatches error:", err);
      throw APIError.unavailable("Could not fetch big matches");
    }
  },
);

export const watchSuggestion = api(
  { expose: true, method: "GET", path: "/buyuk-maclar/suggestion" },
  async (): Promise<WatchSuggestionResponse> => {
    try {
      const matches = await fetchBigMatches({ sport: "all" });
      const match = pickWatchSuggestion(matches);
      let reason = "no_big_match";
      if (match?.state === "live") reason = "live_now";
      else if (match?.state === "upcoming") reason = "upcoming";
      return {
        match,
        reason,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error("watchSuggestion error:", err);
      throw APIError.unavailable("Could not fetch watch suggestion");
    }
  },
);
