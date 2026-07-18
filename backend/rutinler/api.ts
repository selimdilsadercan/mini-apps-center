import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { isPostponedUntilFutureDay } from "../lib/istanbul-date";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export type PeriodType = "daily" | "weekly" | "monthly" | "once";
export type DailySlot = "morning" | "afternoon" | "evening";

export interface RoutineEntry {
  id: string;
  user_id: string;
  period_type: PeriodType;
  item_slug: string | null;
  item_name: string;
  item_emoji: string;
  daily_slot: DailySlot | null;
  day_of_week: number | null;
  day_of_month: number | null;
  sort_order: number;
  created_at: string;
  postponed_until: string | null;
  is_completed: boolean;
  is_next_completed: boolean;
  is_completed_today: boolean;
  completed_at: string | null;
}

interface GetEntriesRequest {
  userId: string;
}

interface GetEntriesResponse {
  entries: RoutineEntry[];
}

interface AddEntryRequest {
  userId: string;
  periodType: PeriodType;
  itemName: string;
  itemEmoji: string;
  itemSlug?: string;
  dailySlot?: DailySlot;
  /** "0" = unset, "1"-"7" = weekday */
  dayOfWeek: string;
  /** "0" = unset, "1"-"31" = day of month */
  dayOfMonth: string;
}

interface AddEntryResponse {
  entry: RoutineEntry | null;
}

interface DeleteEntryRequest {
  id: string;
  userId: string;
}

interface DeleteEntryResponse {
  success: boolean;
}

interface ToggleCompletionRequest {
  entryId: string;
  userId: string;
  completed: boolean;
  isNextPeriod?: boolean;
}

interface ToggleCompletionResponse {
  success: boolean;
}

interface UpdateEntryRequest {
  entryId: string;
  userId: string;
  itemName: string;
  itemEmoji: string;
  dailySlot?: DailySlot;
  /** "0" = unset, "1"-"7" = weekday */
  dayOfWeek: string;
  /** "0" = unset, "1"-"31" = day of month */
  dayOfMonth: string;
}

interface UpdateEntryResponse {
  entry: RoutineEntry | null;
}

interface PostponeEntryRequest {
  entryId: string;
  userId: string;
}

interface PostponeEntryResponse {
  success: boolean;
}

interface ClearPostponeRequest {
  entryId: string;
  userId: string;
}

interface ClearPostponeResponse {
  success: boolean;
}

function parseScheduleInt(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function rpcRow(data: unknown): Record<string, unknown> | null {
  if (Array.isArray(data)) return (data[0] as Record<string, unknown>) ?? null;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return null;
}

function mapEntry(row: Record<string, unknown>): RoutineEntry {
  const dayOfWeek = row.day_of_week != null ? Number(row.day_of_week) : null;
  const dayOfMonth = row.day_of_month != null ? Number(row.day_of_month) : null;
  const sortOrder = Number(row.sort_order);
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    period_type: row.period_type as PeriodType,
    item_slug: row.item_slug ? String(row.item_slug) : null,
    item_name: String(row.item_name),
    item_emoji: String(row.item_emoji),
    daily_slot: (row.daily_slot as DailySlot | null) ?? null,
    day_of_week: dayOfWeek != null && Number.isFinite(dayOfWeek) ? dayOfWeek : null,
    day_of_month: dayOfMonth != null && Number.isFinite(dayOfMonth) ? dayOfMonth : null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    created_at: String(row.created_at),
    postponed_until: row.postponed_until ? String(row.postponed_until) : null,
    is_completed: Boolean(row.is_completed),
    is_next_completed: Boolean(row.is_next_completed),
    is_completed_today: Boolean(row.is_completed_today),
    completed_at: row.completed_at ? String(row.completed_at) : null,
  };
}

export const getEntries = api(
  { expose: true, method: "GET", path: "/rutinler/entries/:userId" },
  async ({ userId }: GetEntriesRequest): Promise<GetEntriesResponse> => {
    const { data, error } = await supabase.schema("rutinler").rpc("get_entries", {
      clerk_id_param: userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return {
      entries: (data ?? []).map((row: Record<string, unknown>) => mapEntry(row)),
    };
  }
);

/**
 * Bugün için geçerli olan (vakti gelmiş ve henüz tamamlanmamış) rutinleri getirir
 */
export const getTodayAgenda = api(
  { expose: true, method: "GET", path: "/rutinler/today/:userId" },
  async ({ userId }: { userId: string }): Promise<{ entries: RoutineEntry[] }> => {
    const { entries } = await getEntries({ userId });
    
    const now = new Date();
    const todayDayOfWeek = now.getDay() || 7;
    const todayMonthDay = now.getDate();
    const hour = now.getHours();
    
    let currentSlot: DailySlot = "evening";
    if (hour >= 5 && hour < 12) currentSlot = "morning";
    else if (hour >= 12 && hour < 18) currentSlot = "afternoon";

    const SLOT_ORDER: Record<DailySlot, number> = {
      morning: 0,
      afternoon: 1,
      evening: 2,
    };

    const filtered = entries.filter((e) => {
      if (isPostponedUntilFutureDay(e.postponed_until, now)) return false;

      // Tek seferlik: bekleyenler veya bugün tamamlananlar
      if (e.period_type === "once") return !e.is_completed || e.is_completed_today;
      
      if (e.period_type === "daily") {
        if (!e.daily_slot) return true;
        return SLOT_ORDER[e.daily_slot] <= SLOT_ORDER[currentSlot];
      }
      if (e.period_type === "weekly") {
        if (!e.day_of_week) return true;
        return todayDayOfWeek >= e.day_of_week;
      }
      if (e.period_type === "monthly") {
        if (!e.day_of_month) return true;
        return todayMonthDay >= e.day_of_month;
      }
      return true;
    });

    return { entries: filtered };
  }
);

export const addEntry = api(
  { expose: true, method: "POST", path: "/rutinler/entries" },
  async (req: AddEntryRequest): Promise<AddEntryResponse> => {
    const { data, error } = await supabase.schema("rutinler").rpc("add_entry", {
      clerk_id_param: req.userId,
      period_type_param: req.periodType,
      item_name_param: req.itemName,
      item_emoji_param: req.itemEmoji,
      item_slug_param: req.itemSlug ?? null,
      daily_slot_param: req.dailySlot ?? null,
      day_of_week_param: parseScheduleInt(req.dayOfWeek),
      day_of_month_param: parseScheduleInt(req.dayOfMonth),
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    const row = rpcRow(data);
    return {
      entry: row ? mapEntry(row) : null,
    };
  }
);

export const deleteEntry = api(
  { expose: true, method: "DELETE", path: "/rutinler/entries/:id" },
  async ({ id, userId }: DeleteEntryRequest): Promise<DeleteEntryResponse> => {
    const { data, error } = await supabase.schema("rutinler").rpc("delete_entry", {
      entry_id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: Boolean(data) };
  }
);

export const toggleCompletion = api(
  { expose: true, method: "POST", path: "/rutinler/complete" },
  async (req: ToggleCompletionRequest): Promise<ToggleCompletionResponse> => {
    const { error } = await supabase.schema("rutinler").rpc("toggle_completion", {
      entry_id_param: req.entryId,
      clerk_id_param: req.userId,
      completed_param: req.completed,
      is_next_period_param: req.isNextPeriod ?? false,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const updateEntry = api(
  { expose: true, method: "POST", path: "/rutinler/entries/update" },
  async (req: UpdateEntryRequest): Promise<UpdateEntryResponse> => {
    const { data, error } = await supabase.schema("rutinler").rpc("update_entry", {
      entry_id_param: req.entryId,
      clerk_id_param: req.userId,
      item_name_param: req.itemName,
      item_emoji_param: req.itemEmoji,
      daily_slot_param: req.dailySlot ?? null,
      day_of_week_param: parseScheduleInt(req.dayOfWeek),
      day_of_month_param: parseScheduleInt(req.dayOfMonth),
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    const row = rpcRow(data);
    return {
      entry: row ? mapEntry(row) : null,
    };
  }
);

export const postponeEntry = api(
  { expose: true, method: "POST", path: "/rutinler/postpone" },
  async (req: PostponeEntryRequest): Promise<PostponeEntryResponse> => {
    const { error } = await supabase.schema("rutinler").rpc("postpone_entry", {
      entry_id_param: req.entryId,
      clerk_id_param: req.userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const clearPostpone = api(
  { expose: true, method: "POST", path: "/rutinler/clear-postpone" },
  async (req: ClearPostponeRequest): Promise<ClearPostponeResponse> => {
    const { error } = await supabase.schema("rutinler").rpc("clear_postpone", {
      entry_id_param: req.entryId,
      clerk_id_param: req.userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);
