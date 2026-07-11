import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export type PeriodType = "daily" | "weekly" | "monthly";
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
  is_completed: boolean;
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
    is_completed: Boolean(row.is_completed),
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
