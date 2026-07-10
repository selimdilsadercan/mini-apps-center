"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@phosphor-icons/react";
import type { Routine, WeeklyPlanDay } from "../types";
import { WEEKDAY_LABELS, getIsoWeekday } from "../types";
import { getWeeklyPlanAction, setWeeklyPlanDayAction } from "../actions";

interface WeeklyPlanPickerProps {
  userId: string;
  routines: Routine[];
}

export default function WeeklyPlanPicker({ userId, routines }: WeeklyPlanPickerProps) {
  const [days, setDays] = useState<WeeklyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const today = getIsoWeekday();

  useEffect(() => {
    loadPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function loadPlan() {
    try {
      setLoading(true);
      const result = await getWeeklyPlanAction(userId);
      if (result.data) {
        setDays(result.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(dayOfWeek: number, routineId: string | null) {
    setSavingDay(dayOfWeek);
    const result = await setWeeklyPlanDayAction(userId, dayOfWeek, routineId);
    if (result.data) {
      const routine = routines.find((item) => item.id === routineId) ?? null;
      setDays((prev) =>
        prev.map((day) =>
          day.dayOfWeek === dayOfWeek
            ? {
                dayOfWeek,
                routineId,
                routineName: routine?.name ?? null,
                exercises: routine?.exercises ?? [],
              }
            : day
        )
      );
    }
    setSavingDay(null);
  }

  const planDays =
    days.length === 7
      ? days
      : WEEKDAY_LABELS.map((_, index) => ({
          dayOfWeek: index + 1,
          routineId: null,
          routineName: null,
          exercises: [],
        }));

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm">
          <Calendar size={20} weight="fill" />
        </div>
        <div>
          <p className="text-[12px] font-black text-gray-900 tracking-tight">Haftalık Plan</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Günlerine rutin ata
          </p>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-4 space-y-2">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="h-10 bg-gray-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {planDays.map((day) => {
            const label = WEEKDAY_LABELS[day.dayOfWeek - 1];
            const isToday = day.dayOfWeek === today;
            return (
              <div
                key={day.dayOfWeek}
                className={`flex items-center gap-3 px-4 py-2.5 ${isToday ? "bg-violet-50/40" : ""}`}
              >
                <span
                  className={`w-9 text-[10px] font-black uppercase tracking-wider shrink-0 ${
                    isToday ? "text-violet-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                <select
                  value={day.routineId ?? ""}
                  onChange={(event) =>
                    handleChange(day.dayOfWeek, event.target.value || null)
                  }
                  disabled={savingDay === day.dayOfWeek}
                  className="flex-1 min-w-0 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[11px] font-bold text-gray-900 outline-none focus:border-violet-300 disabled:opacity-50"
                >
                  <option value="">Dinlenme</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
