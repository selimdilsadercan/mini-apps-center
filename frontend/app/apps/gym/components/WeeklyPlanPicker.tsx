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
        <div className="p-4 flex gap-2 overflow-x-auto">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="w-[85px] h-[72px] bg-gray-50 rounded-xl animate-pulse shrink-0" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 p-4 min-w-[680px]">
            {planDays.map((day) => {
              const label = WEEKDAY_LABELS[day.dayOfWeek - 1];
              const isToday = day.dayOfWeek === today;
              return (
                <div
                  key={day.dayOfWeek}
                  className={`flex-1 min-w-[85px] flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isToday
                      ? "bg-violet-50/50 border-violet-200 shadow-sm shadow-violet-500/5"
                      : "bg-gray-50/30 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider mb-2 shrink-0 ${
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
                    className="w-full text-center bg-white border border-gray-200/80 rounded-lg py-1 px-1.5 text-[10px] font-bold text-gray-900 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-50 cursor-pointer transition-all"
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
        </div>
      )}
    </section>
  );
}
