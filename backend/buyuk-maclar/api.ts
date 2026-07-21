import { api, APIError } from "encore.dev/api";
import { catalog } from "~encore/clients";
import {
  pickWatchSuggestion,
  type BigMatch,
  type MatchSport,
} from "./espn";

export type { BigMatch, MatchSport };

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
      const res = await catalog.getBigMatches({
        sport: sport ?? "all",
        liveOnly: liveOnly === true,
      });
      return {
        matches: res.matches as BigMatch[],
        fetchedAt: res.fetchedAt,
        source: "catalog",
      };
    } catch (err) {
      console.error("listMatches error:", err);
      throw APIError.unavailable("Could not fetch big matches from catalog");
    }
  },
);

export const watchSuggestion = api(
  { expose: true, method: "GET", path: "/buyuk-maclar/suggestion" },
  async (): Promise<WatchSuggestionResponse> => {
    try {
      const res = await catalog.getBigMatches({ sport: "all" });
      const matches = res.matches as BigMatch[];
      const match = pickWatchSuggestion(matches);
      let reason = "no_big_match";
      if (match?.state === "live") reason = "live_now";
      else if (match?.state === "upcoming") reason = "upcoming";
      return {
        match,
        reason,
        fetchedAt: res.fetchedAt,
      };
    } catch (err) {
      console.error("watchSuggestion error:", err);
      throw APIError.unavailable("Could not fetch watch suggestion from catalog");
    }
  },
);
