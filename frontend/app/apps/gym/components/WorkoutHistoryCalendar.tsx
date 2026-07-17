"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import type { Workout } from "../types";

interface WorkoutHistoryCalendarProps {
  workouts: Workout[];
}

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayFirstOffset(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function buildMonthCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = getMondayFirstOffset(firstDay);
  const cells: CalendarCell[] = [];

  for (let i = leading; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }

  return cells;
}

function getRecentMonths(count: number): Date[] {
  const now = new Date();
  const months: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
}

function truncateLabel(name: string, max = 11): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function useWorkoutsByDate(workouts: Workout[]) {
  return useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const workout of workouts) {
      if (!workout.finishedAt) continue;
      const key = formatDateKey(new Date(workout.finishedAt));
      const list = map.get(key) ?? [];
      list.push(workout);
      map.set(key, list);
    }
    return map;
  }, [workouts]);
}

function MonthGrid({
  year,
  month,
  workoutsByDate,
  compact = false,
}: {
  year: number;
  month: number;
  workoutsByDate: Map<string, Workout[]>;
  compact?: boolean;
}) {
  const cells = buildMonthCells(year, month);

  if (compact) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const key = formatDateKey(cell.date);
          const hasWorkout = (workoutsByDate.get(key) ?? []).length > 0;
          const isToday = formatDateKey(new Date()) === key;

          return (
            <div
              key={key}
              className={`flex items-center justify-center ${cell.inMonth ? "" : "opacity-20"}`}
            >
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full text-[9px] font-bold tabular-nums ${
                  hasWorkout && cell.inMonth
                    ? "bg-app-text text-app-bg"
                    : isToday && cell.inMonth
                      ? "bg-app-tab-active text-app-text ring-1 ring-app-border"
                      : "text-app-muted"
                }`}
              >
                {cell.inMonth ? cell.date.getDate() : ""}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-y-5 gap-x-1">
      {cells.map((cell) => {
        const key = formatDateKey(cell.date);
        const dayWorkouts = workoutsByDate.get(key) ?? [];
        const hasWorkout = dayWorkouts.length > 0;
        const label = hasWorkout
          ? dayWorkouts.length > 1
            ? `${dayWorkouts.length} antrenman`
            : truncateLabel(dayWorkouts[0].name)
          : "";

        return (
          <div
            key={key}
            className={`flex flex-col items-center min-h-[52px] ${cell.inMonth ? "" : "opacity-25"}`}
          >
            <div
              className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold tabular-nums transition-colors ${
                hasWorkout && cell.inMonth
                  ? "bg-app-text text-app-bg shadow-sm"
                  : "text-app-text"
              }`}
            >
              {cell.date.getDate()}
            </div>
            {hasWorkout && cell.inMonth && (
              <span className="mt-1 text-[8px] font-semibold text-app-muted text-center leading-tight max-w-[44px] truncate px-0.5">
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WorkoutHistoryCalendar({ workouts }: WorkoutHistoryCalendarProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const workoutsByDate = useWorkoutsByDate(workouts);
  const months = useMemo(() => getRecentMonths(6), []);
  const totalWorkouts = workouts.filter((w) => w.finishedAt).length;

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (!el) return;

    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };

    scrollToBottom();
    const raf = requestAnimationFrame(scrollToBottom);
    const timer = window.setTimeout(scrollToBottom, 150);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [open, months.length]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthLabel = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  const thisMonthCount = useMemo(() => {
    let count = 0;
    for (const [key, list] of workoutsByDate) {
      const d = new Date(key);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        count += list.length;
      }
    }
    return count;
  }, [workoutsByDate, currentYear, currentMonth]);

  const lastWorkout = useMemo(() => {
    return workouts
      .filter((w) => w.finishedAt)
      .sort((a, b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime())[0];
  }, [workouts]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl overflow-hidden bg-app-surface border border-app-border shadow-sm text-left hover:bg-app-surface-muted/40 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-app-text tracking-tight">Antrenman Takvimi</p>
            <p className="text-[10px] font-bold text-app-muted truncate mt-0.5 capitalize">
              {totalWorkouts > 0
                ? lastWorkout
                  ? `Son: ${lastWorkout.name}`
                  : `${totalWorkouts} kayıtlı gün`
                : "Henüz kayıt yok"}
            </p>
          </div>
          <CaretRight size={16} weight="bold" className="text-app-muted shrink-0" />
        </div>

        <div className="px-4 pb-3.5 border-t border-app-border">
          <p className="text-[9px] font-black text-app-muted uppercase tracking-wider mb-2 mt-3 capitalize">
            {monthLabel}
          </p>
          <MonthGrid
            year={currentYear}
            month={currentMonth}
            workoutsByDate={workoutsByDate}
            compact
          />
          <p className="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center mt-2.5">
            {thisMonthCount > 0
              ? `Bu ay ${thisMonthCount} antrenman`
              : "Bu ay antrenman yok"}
          </p>
        </div>
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-app-bg flex flex-col fixed bottom-0 left-0 right-0 z-50 rounded-t-[1.75rem] max-h-[90vh] max-w-xl mx-auto outline-none">
            <div className="mx-auto w-10 h-1 rounded-full bg-app-border mt-3 mb-1 shrink-0" />
            <div className="px-5 pt-2 pb-3 border-b border-app-border shrink-0">
              <Drawer.Title className="text-sm font-black text-app-text">Antrenman Takvimi</Drawer.Title>
              <Drawer.Description className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-0.5">
                {totalWorkouts > 0 ? `${totalWorkouts} kayıtlı gün` : "Henüz kayıt yok"}
              </Drawer.Description>
            </div>

            <div
              ref={scrollRef}
              className="overflow-y-auto scrollbar-hide px-4 py-4 space-y-8 pb-10"
            >
              {months.map((monthStart) => {
                const year = monthStart.getFullYear();
                const month = monthStart.getMonth();
                const label = monthStart.toLocaleDateString("tr-TR", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div key={`${year}-${month}`}>
                    <h3 className="text-lg font-black text-app-text capitalize mb-4 tracking-tight">
                      {label}
                    </h3>
                    <MonthGrid
                      year={year}
                      month={month}
                      workoutsByDate={workoutsByDate}
                    />
                  </div>
                );
              })}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
