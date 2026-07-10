export type BoardRole = "owner" | "member";

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  myRole: BoardRole;
  createdAt: string;
}

export interface BoardMember {
  userId: string;
  clerkId: string;
  username: string | null;
  avatarUrl: string | null;
  role: BoardRole;
}

export interface WeekAssignment {
  id: string;
  dayOfWeek: number;
  choreSlug: string;
  choreName: string;
  choreIcon: string | null;
  assigneeId: string;
  assigneeClerkId: string;
  assigneeUsername: string | null;
  assigneeAvatarUrl: string | null;
  completedAt: string | null;
  completedBy: string | null;
}

export interface ChoreTemplate {
  slug: string;
  name: string;
  icon: string;
  category?: string;
}

export const DAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export function getIsoWeekday(date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function getMondayWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function shiftWeekStart(weekStart: string, deltaWeeks: number): string {
  const d = new Date(`${weekStart}T12:00:00`);
  d.setDate(d.getDate() + deltaWeeks * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}
