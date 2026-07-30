import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import {
  DEFAULT_RANK_CITY,
  DEFAULT_WINDOW_DAYS,
  MIN_VOTES_FOR_RANKING,
  RANK_LISTS,
  WEIGHTED_MIN_VOTES,
  getRankList,
} from "./rank-lists";
import { computeWeightedScore, roundScore } from "./ranking";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface RankList {
  id: string;
  label: string;
  emoji: string;
  title?: string;
}

export interface PlaceRatingStats {
  placeId: string;
  averageRating: number;
  voteCount: number;
  weightedScore: number;
  rankInList?: number | null;
  listSize?: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  placeId: string;
  name: string;
  district?: string | null;
  imageUrl?: string | null;
  types?: string[] | null;
  averageRating: number;
  voteCount: number;
}

// ==================== HELPERS ====================

interface PlaceRow {
  id: string;
  name: string;
  district: string | null;
  image_url: string | null;
  types: string[] | null;
  tags: string[] | null;
  city: string | null;
  approved: boolean | null;
}

function placeMatchesList(place: PlaceRow, listId: string): boolean {
  if (listId === "all") return true;
  const list = getRankList(listId);
  if (!list) return false;

  const tags = (place.tags ?? []).map((t) => t.toLowerCase());
  const name = place.name.toLowerCase();
  const venueTypes = place.types || [];

  let matchesTag = false;
  if (list.tagKeywords?.length) {
    matchesTag = list.tagKeywords.some((kw) => {
      const lowerKw = kw.toLowerCase();
      return (
        tags.some((t) => t.toLowerCase().includes(lowerKw) || lowerKw.includes(t.toLowerCase())) ||
        name.includes(lowerKw)
      );
    });
  }

  let matchesType = false;
  if (list.primaryTypes?.length) {
    matchesType = list.primaryTypes.some((type) => venueTypes.includes(type));
  }

  // If list has both, either one can match. If it only has one, that one must match.
  if (list.tagKeywords?.length && list.primaryTypes?.length) {
    return matchesTag || matchesType;
  } else if (list.tagKeywords?.length) {
    return matchesTag;
  } else if (list.primaryTypes?.length) {
    return matchesType;
  }

  return true;
}

function windowStartIso(windowDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - windowDays);
  return d.toISOString();
}

// ==================== ENDPOINTS ====================

export const getLists = api(
  { expose: true, method: "GET", path: "/places-ranked/lists" },
  async (): Promise<{ lists: RankList[] }> => {
    return {
      lists: RANK_LISTS.map((l) => ({ id: l.id, label: l.label, emoji: l.emoji, title: l.title })),
    };
  },
);

export const getLeaderboard = api(
  { expose: true, method: "GET", path: "/places-ranked/leaderboard" },
  async ({
    listId = "all",
    city = DEFAULT_RANK_CITY,
    district,
    windowDays = DEFAULT_WINDOW_DAYS,
    limit = 30,
  }: {
    listId?: string;
    city?: string;
    district?: string;
    windowDays?: number;
    limit?: number;
  }): Promise<{ listId: string; windowDays: number; entries: LeaderboardEntry[] }> => {
    const { data: places, error: placesErr } = await supabase
      .schema("workplaces")
      .from("places")
      .select("id, name, district, image_url, types, tags, city, approved")
      .eq("approved", true)
      .ilike("city", city);

    if (placesErr) {
      throw APIError.internal(`Failed to load places: ${placesErr.message}`);
    }

    // DEBUG LOG
    console.log(`Loaded ${places?.length || 0} places for city ${city}. First few tags:`, places?.slice(0, 3).map(p => ({ name: p.name, tags: p.tags })));

    let filtered = (places ?? []).filter((p) => placeMatchesList(p as PlaceRow, listId));
    if (district) {
      filtered = filtered.filter((p) => p.district?.trim() === district);
    }

    if (filtered.length === 0) {
      return { listId, windowDays, entries: [] };
    }

    const placeIds = filtered.map((p) => p.id);
    const since = windowStartIso(windowDays);

    const { data: ratings, error: ratingsErr } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("place_id, overall")
      .in("place_id", placeIds)
      .gte("created_at", since);

    if (ratingsErr) {
      throw APIError.internal(`Failed to load ratings: ${ratingsErr.message}`);
    }

    const allScores = (ratings ?? []).map((r) => Number(r.overall));
    const globalMean =
      allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 7;

    const byPlace = new Map<string, number[]>();
    for (const row of ratings ?? []) {
      const pid = row.place_id as string;
      const arr = byPlace.get(pid) ?? [];
      arr.push(Number(row.overall));
      byPlace.set(pid, arr);
    }

    const scored = filtered
      .map((place) => {
        const scores = byPlace.get(place.id) ?? [];
        const voteCount = scores.length;

        // Ensure we show places even if they have 0 votes if MIN_VOTES_FOR_RANKING is 0
        if (voteCount < MIN_VOTES_FOR_RANKING) return null;

        const averageRating = voteCount > 0 
          ? scores.reduce((a, b) => a + b, 0) / voteCount 
          : 0;

        const weightedScore = computeWeightedScore(
          averageRating,
          voteCount,
          globalMean,
          WEIGHTED_MIN_VOTES,
        );

        return {
          placeId: place.id,
          name: place.name,
          district: place.district,
          imageUrl: place.image_url,
          types: place.types,
          averageRating: roundScore(averageRating),
          voteCount,
          weightedScore,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, limit);

    const entries: LeaderboardEntry[] = scored.map((row, idx) => ({
      rank: idx + 1,
      placeId: row.placeId,
      name: row.name,
      district: row.district,
      imageUrl: row.imageUrl,
      types: row.types,
      averageRating: row.averageRating,
      voteCount: row.voteCount,
    }));

    return { listId, windowDays, entries };
  },
);

export const getPlaceStats = api(
  { expose: true, method: "GET", path: "/places-ranked/place/:placeId/stats" },
  async ({
    placeId,
    listId = "all",
    city = DEFAULT_RANK_CITY,
    windowDays = DEFAULT_WINDOW_DAYS,
  }: {
    placeId: string;
    listId?: string;
    city?: string;
    windowDays?: number;
  }): Promise<{
    stats: PlaceRatingStats | null;
    allTimeAverage?: number | null;
    allTimeVotes?: number;
  }> => {
    const since = windowStartIso(windowDays);

    const { data: windowRatings } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("overall")
      .eq("place_id", placeId)
      .gte("created_at", since);

    const { data: allRatings } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("overall")
      .eq("place_id", placeId);

    const windowScores = (windowRatings ?? []).map((r) => Number(r.overall));
    const allScores = (allRatings ?? []).map((r) => Number(r.overall));

    if (windowScores.length === 0) {
      return {
        stats: null,
        allTimeAverage: allScores.length
          ? roundScore(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : null,
        allTimeVotes: allScores.length,
      };
    }

    const { data: cityRatings } = await supabase
      .schema("workplaces")
      .from("place_ratings")
      .select("overall")
      .gte("created_at", since);

    const globalScores = (cityRatings ?? []).map((r) => Number(r.overall));
    const globalMean =
      globalScores.length > 0
        ? globalScores.reduce((a, b) => a + b, 0) / globalScores.length
        : 7;

    const averageRating = windowScores.reduce((a, b) => a + b, 0) / windowScores.length;
    const voteCount = windowScores.length;
    const weightedScore = computeWeightedScore(
      averageRating,
      voteCount,
      globalMean,
      WEIGHTED_MIN_VOTES,
    );

    let rankInList: number | null = null;
    let listSize: number | null = null;
    try {
      const board = await getLeaderboard({ listId, city, windowDays, limit: 200 });
      listSize = board.entries.length;
      const found = board.entries.find((e) => e.placeId === placeId);
      rankInList = found?.rank ?? null;
    } catch {
      // rank optional
    }

    return {
      stats: {
        placeId,
        averageRating: roundScore(averageRating),
        voteCount,
        weightedScore: roundScore(weightedScore),
        rankInList,
        listSize,
      },
      allTimeAverage: allScores.length
        ? roundScore(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : null,
      allTimeVotes: allScores.length,
    };
  },
);
