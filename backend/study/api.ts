import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export type PlanItemType = "worksheet" | "reading" | "test" | "free";

export interface Student {
  id: string;
  name: string;
  grade: string | null;
  createdAt: string;
}

export interface PlanItem {
  id: string;
  planId: string;
  dayOfWeek: number;
  subject: string;
  itemType: PlanItemType;
  title: string;
  targetValue: number | null;
  targetUnit: string | null;
  completedValue: number;
  isDone: boolean;
  sortOrder: number;
}

export interface DayNote {
  dayOfWeek: number;
  note: string;
}

export interface WeeklyPlan {
  planId: string;
  weekStart: string;
  weeklyNotes: string | null;
  studentId: string | null;
  studentName: string | null;
  items: PlanItem[];
  dayNotes: DayNote[];
}

interface PlanRow {
  plan_id: string;
  week_start: string;
  weekly_notes: string | null;
  student_id: string | null;
  student_name: string | null;
  item_id: string | null;
  day_of_week: number | null;
  subject: string | null;
  item_type: string | null;
  title: string | null;
  target_value: number | null;
  target_unit: string | null;
  completed_value: number | null;
  is_done: boolean | null;
  sort_order: number | null;
  day_note: string | null;
}

function mapPlanRows(rows: PlanRow[], extraDayNotes: DayNote[] = []): WeeklyPlan {
  const first = rows[0];
  const items: PlanItem[] = [];
  const dayNotesMap = new Map<number, string>();

  for (const note of extraDayNotes) {
    dayNotesMap.set(note.dayOfWeek, note.note);
  }

  for (const row of rows) {
    if (row.item_id) {
      items.push({
        id: row.item_id,
        planId: row.plan_id,
        dayOfWeek: row.day_of_week!,
        subject: row.subject ?? "Genel",
        itemType: row.item_type as PlanItemType,
        title: row.title ?? "",
        targetValue: row.target_value != null ? Number(row.target_value) : null,
        targetUnit: row.target_unit,
        completedValue: Number(row.completed_value ?? 0),
        isDone: Boolean(row.is_done),
        sortOrder: Number(row.sort_order ?? 0),
      });
      if (row.day_note && row.day_of_week != null) {
        dayNotesMap.set(row.day_of_week, row.day_note);
      }
    }
  }

  return {
    planId: first.plan_id,
    weekStart: String(first.week_start).slice(0, 10),
    weeklyNotes: first.weekly_notes,
    studentId: first.student_id,
    studentName: first.student_name,
    items,
    dayNotes: Array.from(dayNotesMap.entries()).map(([dayOfWeek, note]) => ({
      dayOfWeek,
      note,
    })),
  };
}

async function fetchDayNotes(planId: string): Promise<DayNote[]> {
  const { data, error } = await supabase
    .schema("study")
    .from("plan_day_notes")
    .select("day_of_week, note")
    .eq("plan_id", planId);

  if (error) {
    console.error("fetchDayNotes error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    dayOfWeek: Number(row.day_of_week),
    note: String(row.note ?? ""),
  }));
}

export const getStudents = api(
  { expose: true, method: "GET", path: "/study/students/:userId" },
  async ({ userId }: { userId: string }): Promise<{ students: Student[] }> => {
    const { data, error } = await supabase.schema("study").rpc("get_students", {
      p_user_id: userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return {
      students: (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name),
        grade: row.grade ? String(row.grade) : null,
        createdAt: String(row.created_at),
      })),
    };
  }
);

export const addStudent = api(
  { expose: true, method: "POST", path: "/study/students" },
  async (req: {
    userId: string;
    name: string;
    grade?: string;
  }): Promise<{ student: Student | null }> => {
    const { data, error } = await supabase.schema("study").rpc("add_student", {
      p_user_id: req.userId,
      p_name: req.name,
      p_grade: req.grade ?? null,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { student: null };

    return {
      student: {
        id: String(row.id),
        name: String(row.name),
        grade: row.grade ? String(row.grade) : null,
        createdAt: String(row.created_at),
      },
    };
  }
);

export const deleteStudent = api(
  { expose: true, method: "DELETE", path: "/study/students/:id" },
  async ({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("study").rpc("delete_student", {
      p_student_id: id,
      p_user_id: userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const getWeeklyPlan = api(
  { expose: true, method: "GET", path: "/study/plan/:userId" },
  async ({
    userId,
    weekStart,
    studentId,
  }: {
    userId: string;
    weekStart: string;
    studentId?: string;
  }): Promise<{ plan: WeeklyPlan | null }> => {
    const { data, error } = await supabase.schema("study").rpc("get_weekly_plan", {
      p_user_id: userId,
      p_week_start: weekStart,
      p_student_id: studentId ?? null,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    const rows = (data ?? []) as PlanRow[];
    if (rows.length === 0) {
      return { plan: null };
    }

    const extraDayNotes = await fetchDayNotes(rows[0].plan_id);
    return { plan: mapPlanRows(rows, extraDayNotes) };
  }
);

export const setWeeklyNotes = api(
  { expose: true, method: "POST", path: "/study/plan/weekly-notes" },
  async (req: {
    userId: string;
    weekStart: string;
    studentId?: string;
    notes: string;
  }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("study").rpc("set_weekly_notes", {
      p_user_id: req.userId,
      p_week_start: req.weekStart,
      p_student_id: req.studentId ?? null,
      p_notes: req.notes,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const setDayNote = api(
  { expose: true, method: "POST", path: "/study/plan/day-note" },
  async (req: {
    userId: string;
    weekStart: string;
    studentId?: string;
    dayOfWeek: number;
    note: string;
  }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("study").rpc("set_day_note", {
      p_user_id: req.userId,
      p_week_start: req.weekStart,
      p_student_id: req.studentId ?? null,
      p_day_of_week: req.dayOfWeek,
      p_note: req.note,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const addPlanItem = api(
  { expose: true, method: "POST", path: "/study/plan/items" },
  async (req: {
    userId: string;
    weekStart: string;
    studentId?: string;
    dayOfWeek: number;
    subject: string;
    itemType: PlanItemType;
    title: string;
    targetValue?: number;
    targetUnit?: string;
  }): Promise<{ item: PlanItem | null }> => {
    const { data, error } = await supabase.schema("study").rpc("add_plan_item", {
      p_user_id: req.userId,
      p_week_start: req.weekStart,
      p_student_id: req.studentId ?? null,
      p_day_of_week: req.dayOfWeek,
      p_subject: req.subject,
      p_item_type: req.itemType,
      p_title: req.title,
      p_target_value: req.targetValue ?? null,
      p_target_unit: req.targetUnit ?? null,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { item: null };

    return {
      item: {
        id: String(row.id),
        planId: String(row.plan_id),
        dayOfWeek: Number(row.day_of_week),
        subject: String(row.subject),
        itemType: row.item_type as PlanItemType,
        title: String(row.title),
        targetValue: row.target_value != null ? Number(row.target_value) : null,
        targetUnit: row.target_unit ? String(row.target_unit) : null,
        completedValue: Number(row.completed_value ?? 0),
        isDone: Boolean(row.is_done),
        sortOrder: Number(row.sort_order ?? 0),
      },
    };
  }
);

export const updatePlanItem = api(
  { expose: true, method: "POST", path: "/study/plan/items/update" },
  async (req: {
    userId: string;
    itemId: string;
    subject?: string;
    itemType?: PlanItemType;
    title?: string;
    targetValue?: number;
    targetUnit?: string;
    completedValue?: number;
    isDone?: boolean;
  }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("study").rpc("update_plan_item", {
      p_item_id: req.itemId,
      p_user_id: req.userId,
      p_subject: req.subject ?? null,
      p_item_type: req.itemType ?? null,
      p_title: req.title ?? null,
      p_target_value: req.targetValue ?? null,
      p_target_unit: req.targetUnit ?? null,
      p_completed_value: req.completedValue ?? null,
      p_is_done: req.isDone ?? null,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);

export const deletePlanItem = api(
  { expose: true, method: "DELETE", path: "/study/plan/items/:id" },
  async ({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const { error } = await supabase.schema("study").rpc("delete_plan_item", {
      p_item_id: id,
      p_user_id: userId,
    });

    if (error) {
      throw APIError.internal(`Supabase error: ${error.message}`);
    }

    return { success: true };
  }
);
