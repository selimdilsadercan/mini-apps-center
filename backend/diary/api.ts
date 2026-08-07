import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { campus_events, stamp_card, friendship } from "~encore/clients";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Reaction {
  id: string;
  logId: string;
  userId: string; // clerk_id
  reactionType: string; // 'like', 'clap', 'fire'
  username?: string | null;
  avatarUrl?: string | null;
}

export interface Log {
  id: string;
  userId: string; // clerk_id
  activityType: string; // cafe, restaurant, cinema, sport, study, social, outdoor, event, custom
  title: string;
  location?: string | null;
  date: string; // ISO String
  notes?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
  isImported: boolean;
  isPrivate: boolean;
  metadata: any;
  createdAt: string;
  reactions: Reaction[];
  username?: string | null;
  avatarUrl?: string | null;
}

export interface Suggestion {
  id: string; // unique ID for frontend tracking
  source: "stamp_card" | "campus_events" | "workplaces";
  title: string;
  location?: string | null;
  activityType: string;
  date: string; // ISO String
  imageUrl?: string | null;
  metadata: any;
}

// ==================== REQ/RES INTERFACES ====================

interface GetLogsResponse {
  logs: Log[];
}

interface AddLogRequest {
  userId: string; // clerk_id
  activityType: string;
  title: string;
  location?: string;
  date: string; // ISO String
  notes?: string;
  rating?: number;
  imageUrl?: string;
  isImported?: boolean;
  isPrivate?: boolean;
  metadata?: any;
}

interface AddLogResponse {
  success: boolean;
  log: Log | null;
}

interface DeleteLogRequest {
  userId: string; // clerk_id
  logId: string;
}

interface DeleteLogResponse {
  success: boolean;
}

interface ReactLogRequest {
  userId: string; // clerk_id
  logId: string;
  reactionType: string; // 'like', 'clap', 'fire'
}

interface ReactLogResponse {
  success: boolean;
  reactions: Reaction[];
}

interface GetFeedResponse {
  feed: Log[];
}

interface GetSummaryResponse {
  totalCount: number;
  badge: string; // Ev Kuşu, Şehir Çaylağı, vb.
  badgeEmoji: string;
  categoryCounts: { category: string; count: number }[];
  highlightLog: Log | null;
}

interface GetSuggestionsResponse {
  suggestions: Suggestion[];
}

// ==================== API ENDPOINTS ====================

/**
 * Retrieve all logs for a user, including reactions
 * GET /diary/logs/:userId
 */
export const getLogs = api(
  { expose: true, method: "GET", path: "/diary/logs/:userId" },
  async ({ userId }: { userId: string }): Promise<GetLogsResponse> => {
    const internalUserId = await getInternalUserId(userId);

    // Fetch user logs
    const { data: logs, error: logsError } = await supabase
      .schema("diary")
      .from("logs")
      .select("*")
      .eq("user_id", internalUserId)
      .order("date", { ascending: false });

    if (logsError) {
      console.error("getLogs query error:", logsError);
      throw APIError.internal(`Failed to fetch logs: ${logsError.message}`);
    }

    if (!logs || logs.length === 0) {
      return { logs: [] };
    }

    // Fetch reactions for these logs
    const logIds = logs.map((l: any) => l.id);
    const reactions = await fetchReactionsForLogs(logIds);

    // Map rows to Log interface
    const formattedLogs = logs.map((row: any) => {
      const logReactions = reactions.filter((r) => r.logId === row.id);
      return formatLog(row, userId, logReactions);
    });

    return { logs: formattedLogs };
  }
);

/**
 * Add a new log entry
 * POST /diary/logs/add
 */
export const addLog = api(
  { expose: true, method: "POST", path: "/diary/logs/add" },
  async (req: AddLogRequest): Promise<AddLogResponse> => {
    const internalUserId = await getInternalUserId(req.userId);

    const insertData = {
      user_id: internalUserId,
      activity_type: req.activityType,
      title: req.title,
      location: req.location || null,
      date: req.date,
      notes: req.notes || null,
      rating: req.rating || null,
      image_url: req.imageUrl || null,
      is_imported: req.isImported || false,
      is_private: req.isPrivate || false,
      metadata: req.metadata || {},
    };

    const { data: row, error } = await supabase
      .schema("diary")
      .from("logs")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("addLog insert error:", error);
      throw APIError.internal(`Failed to add log: ${error.message}`);
    }

    return {
      success: true,
      log: formatLog(row, req.userId, []),
    };
  }
);

/**
 * Delete a log entry
 * POST /diary/logs/delete
 */
export const deleteLog = api(
  { expose: true, method: "POST", path: "/diary/logs/delete" },
  async (req: DeleteLogRequest): Promise<DeleteLogResponse> => {
    const internalUserId = await getInternalUserId(req.userId);

    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .schema("diary")
      .from("logs")
      .select("id")
      .eq("id", req.logId)
      .eq("user_id", internalUserId)
      .maybeSingle();

    if (findError || !existing) {
      throw APIError.notFound("Log not found or not owned by user");
    }

    const { error: deleteError } = await supabase
      .schema("diary")
      .from("logs")
      .delete()
      .eq("id", req.logId);

    if (deleteError) {
      console.error("deleteLog error:", deleteError);
      throw APIError.internal(`Failed to delete log: ${deleteError.message}`);
    }

    return { success: true };
  }
);

/**
 * Get social feed: recent public logs from friends
 * GET /diary/feed/:userId
 */
export const getFeed = api(
  { expose: true, method: "GET", path: "/diary/feed/:userId" },
  async ({ userId }: { userId: string }): Promise<GetFeedResponse> => {
    // 1. Get friends using friendship service
    let friends: any[] = [];
    try {
      const res = await friendship.getFriends({ userId });
      friends = res.friends || [];
    } catch (e) {
      console.warn("Failed to fetch friends from friendship service:", e);
      return { feed: [] };
    }

    if (friends.length === 0) {
      return { feed: [] };
    }

    const friendClerkIds = friends.map((f) => f.id);

    // 2. Fetch internal UUIDs, usernames, and avatars of these friends
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, clerk_id, username, avatar")
      .in("clerk_id", friendClerkIds);

    if (usersError || !usersData || usersData.length === 0) {
      return { feed: [] };
    }

    const friendIdMap = new Map<string, { clerkId: string; username: string | null; avatar: string | null }>();
    const friendUuidList: string[] = [];

    usersData.forEach((u: any) => {
      friendIdMap.set(u.id, {
        clerkId: u.clerk_id,
        username: u.username,
        avatar: u.avatar,
      });
      friendUuidList.push(u.id);
    });

    // 3. Fetch public logs of these friends
    const { data: logs, error: logsError } = await supabase
      .schema("diary")
      .from("logs")
      .select("*")
      .in("user_id", friendUuidList)
      .eq("is_private", false)
      .order("date", { ascending: false })
      .limit(50);

    if (logsError) {
      console.error("getFeed query error:", logsError);
      throw APIError.internal(`Failed to fetch feed: ${logsError.message}`);
    }

    if (!logs || logs.length === 0) {
      return { feed: [] };
    }

    // 4. Fetch reactions for these logs
    const logIds = logs.map((l: any) => l.id);
    const reactions = await fetchReactionsForLogs(logIds);

    // 5. Format logs with user profile info and reactions
    const formattedFeed = logs.map((row: any) => {
      const userProfile = friendIdMap.get(row.user_id)!;
      const logReactions = reactions.filter((r) => r.logId === row.id);
      return {
        ...formatLog(row, userProfile.clerkId, logReactions),
        username: userProfile.username,
        avatarUrl: userProfile.avatar,
      };
    });

    return { feed: formattedFeed };
  }
);

/**
 * Add or remove a reaction to a log
 * POST /diary/logs/react
 */
export const reactLog = api(
  { expose: true, method: "POST", path: "/diary/logs/react" },
  async (req: ReactLogRequest): Promise<ReactLogResponse> => {
    const internalUserId = await getInternalUserId(req.userId);

    // Check if reaction already exists
    const { data: existing, error: selectError } = await supabase
      .schema("diary")
      .from("reactions")
      .select("id")
      .eq("log_id", req.logId)
      .eq("user_id", internalUserId)
      .eq("reaction_type", req.reactionType)
      .maybeSingle();

    if (selectError) {
      console.error("reactLog read error:", selectError);
      throw APIError.internal(`Database read error: ${selectError.message}`);
    }

    if (existing) {
      // Toggle off: Delete reaction
      const { error: deleteError } = await supabase
        .schema("diary")
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (deleteError) {
        throw APIError.internal(`Failed to delete reaction: ${deleteError.message}`);
      }
    } else {
      // Toggle on: Insert reaction
      const { error: insertError } = await supabase
        .schema("diary")
        .from("reactions")
        .insert([{
          log_id: req.logId,
          user_id: internalUserId,
          reaction_type: req.reactionType
        }]);
      if (insertError) {
        throw APIError.internal(`Failed to add reaction: ${insertError.message}`);
      }
    }

    // Return the updated list of reactions for this log
    const reactions = await fetchReactionsForLogs([req.logId]);
    return { success: true, reactions };
  }
);

/**
 * Get monthly summary metrics
 * GET /diary/summary/:userId/:year/:month
 */
export const getSummary = api(
  { expose: true, method: "GET", path: "/diary/summary/:userId/:year/:month" },
  async ({ userId, year, month }: { userId: string; year: number; month: number }): Promise<GetSummaryResponse> => {
    const internalUserId = await getInternalUserId(userId);

    // Calculate month boundary
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 1).toISOString();

    // Query logs in that month
    const { data: logs, error } = await supabase
      .schema("diary")
      .from("logs")
      .select("*")
      .eq("user_id", internalUserId)
      .gte("date", startDate)
      .lt("date", endDate);

    if (error) {
      console.error("getSummary error:", error);
      throw APIError.internal(`Failed to query summary logs: ${error.message}`);
    }

    const totalCount = logs?.length || 0;

    // Badge calculation
    let badge = "Ev Kuşu";
    let badgeEmoji = "🏠";
    if (totalCount >= 1 && totalCount <= 2) {
      badge = "Şehir Çaylağı";
      badgeEmoji = "🚶‍♂️";
    } else if (totalCount >= 3 && totalCount <= 5) {
      badge = "Meraklı Gezgin";
      badgeEmoji = "🗺️";
    } else if (totalCount >= 6 && totalCount <= 9) {
      badge = "Şehir Kaşifi";
      badgeEmoji = "🔍";
    } else if (totalCount >= 10) {
      badge = "Şehir Dedektifi";
      badgeEmoji = "🕵️‍♂️";
    }

    // Category Breakdown counts
    const categoryMap = new Map<string, number>();
    let highlightLog: Log | null = null;
    let highestRating = 0;

    (logs || []).forEach((row: any) => {
      const cat = row.activity_type;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);

      // Find highlight log (highest rating, latest)
      const r = Number(row.rating || 0);
      if (r > highestRating) {
        highestRating = r;
        highlightLog = formatLog(row, userId, []);
      }
    });

    // If no rated highlight, get the latest activity of the month
    if (!highlightLog && logs && logs.length > 0) {
      highlightLog = formatLog(logs[0], userId, []);
    }

    const categoryCounts = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    return {
      totalCount,
      badge,
      badgeEmoji,
      categoryCounts,
      highlightLog,
    };
  }
);

/**
 * Retrieve cross-app suggestions for logs
 * GET /diary/suggestions/:userId
 */
export const getSuggestions = api(
  { expose: true, method: "GET", path: "/diary/suggestions/:userId" },
  async ({ userId }: { userId: string }): Promise<GetSuggestionsResponse> => {
    const internalUserId = await getInternalUserId(userId);
    const suggestions: Suggestion[] = [];

    // Calculate past 30 days timestamp boundary
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const dateLimitStr = dateLimit.toISOString();

    // Fetch existing log references to avoid suggesting what is already logged
    // We store external IDs in metadata: e.g. metadata.eventId, metadata.placeId, metadata.cardId
    const { data: existingLogs } = await supabase
      .schema("diary")
      .from("logs")
      .select("metadata")
      .eq("user_id", internalUserId)
      .gte("date", dateLimitStr);

    const loggedEventIds = new Set<string>();
    const loggedPlaceIds = new Set<string>();
    const loggedCardIds = new Set<string>();

    (existingLogs || []).forEach((l: any) => {
      if (l.metadata?.eventId) loggedEventIds.add(l.metadata.eventId);
      if (l.metadata?.placeId) loggedPlaceIds.add(l.metadata.placeId);
      if (l.metadata?.cardId) loggedCardIds.add(l.metadata.cardId);
    });

    // 1. Fetch suggestions from campus_events where user is 'going' and event passed
    try {
      const res = await campus_events.getEvents({ userId });
      const myEvents = (res.events || []).filter((e) => {
        const hasPassed = new Date(e.event_date) < new Date();
        const isInRange = new Date(e.event_date) > dateLimit;
        return e.user_status === "going" && hasPassed && isInRange && !loggedEventIds.has(e.id);
      });

      myEvents.forEach((e) => {
        suggestions.push({
          id: `event-${e.id}`,
          source: "campus_events",
          title: e.title,
          location: e.location || "Kampüs",
          activityType: "event",
          date: e.event_date,
          imageUrl: e.image_url,
          metadata: { eventId: e.id },
        });
      });
    } catch (e) {
      console.warn("Suggestions: Failed to query campus_events:", e);
    }

    // 2. Fetch suggestions from workplaces.visited schema table
    try {
      const { data: visitedRows } = await supabase
        .schema("workplaces")
        .from("visited")
        .select(`
          visited_at,
          place_id,
          place:workplaces.places (
            id,
            name,
            district,
            address,
            types,
            image_url
          )
        `)
        .eq("user_id", internalUserId)
        .gte("visited_at", dateLimitStr);

      if (visitedRows && visitedRows.length > 0) {
        visitedRows.forEach((row: any) => {
          const place = row.place;
          if (place && !loggedPlaceIds.has(place.id)) {
            // Determine activity category based on workplace types
            let activityType = "cafe";
            if (place.types?.includes("restaurant")) activityType = "restaurant";
            else if (place.types?.includes("study_spot") || place.types?.includes("library")) activityType = "study";
            else if (place.types?.includes("park") || place.types?.includes("natural_beauty")) activityType = "nature";

            suggestions.push({
              id: `place-${place.id}`,
              source: "workplaces",
              title: place.name,
              location: place.district || place.address || "Maraş",
              activityType,
              date: row.visited_at,
              imageUrl: place.image_url,
              metadata: { placeId: place.id },
            });
          }
        });
      }
    } catch (e) {
      console.warn("Suggestions: Failed to query workplaces visited:", e);
    }

    // 3. Fetch suggestions from stamp_card cards stamped recently
    try {
      const res = await stamp_card.getUserData({ userId });
      // filter cards that were updated in the past 30 days and not logged yet
      const recentCards = (res.cards || []).filter((c) => {
        const updated = new Date(c.updated_at);
        return updated > dateLimit && !loggedCardIds.has(c.id);
      });

      recentCards.forEach((c) => {
        suggestions.push({
          id: `card-${c.id}`,
          source: "stamp_card",
          title: c.business_name,
          location: "Müdavim Kartı",
          activityType: "cafe",
          date: c.updated_at,
          imageUrl: c.business_logo,
          metadata: { cardId: c.id, stampsCount: c.stamps_count },
        });
      });
    } catch (e) {
      console.warn("Suggestions: Failed to query stamp_card:", e);
    }

    return { suggestions };
  }
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Resolve clerk_id string to Supabase public user UUID
 */
async function getInternalUserId(clerkId: string): Promise<string> {
  if (!clerkId?.trim()) {
    throw APIError.invalidArgument("userId is required");
  }

  const { data: internalUserId, error } = await supabase.rpc("get_internal_user_id", {
    clerk_id_param: clerkId,
  });

  if (error || !internalUserId) {
    console.error("getInternalUserId error:", error);
    throw APIError.notFound(`User with clerk_id ${clerkId} not found`);
  }

  return internalUserId as string;
}

/**
 * Fetch reactions for a list of log IDs, joining user names/avatars
 */
async function fetchReactionsForLogs(logIds: string[]): Promise<Reaction[]> {
  if (logIds.length === 0) return [];

  const { data, error } = await supabase
    .schema("diary")
    .from("reactions")
    .select(`
      id,
      log_id,
      reaction_type,
      user_id,
      user:public.users (
        clerk_id,
        username,
        avatar
      )
    `)
    .in("log_id", logIds);

  if (error || !data) {
    console.error("fetchReactionsForLogs error:", error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    logId: row.log_id,
    reactionType: row.reaction_type,
    userId: row.user?.clerk_id || row.user_id,
    username: row.user?.username || null,
    avatarUrl: row.user?.avatar || null,
  }));
}

/**
 * Format raw database row to Log interface
 */
function formatLog(row: any, clerkId: string, logReactions: Reaction[]): Log {
  return {
    id: row.id,
    userId: clerkId,
    activityType: row.activity_type,
    title: row.title,
    location: row.location,
    date: row.date,
    notes: row.notes,
    rating: row.rating != null ? Number(row.rating) : null,
    imageUrl: row.image_url,
    isImported: !!row.is_imported,
    isPrivate: !!row.is_private,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    reactions: logReactions,
  };
}
