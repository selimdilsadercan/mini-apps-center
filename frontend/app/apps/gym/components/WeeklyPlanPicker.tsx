"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CaretRight, Moon, Barbell, Check } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import type { Routine, WeeklyPlanDay } from "../types";
import { WEEKDAY_LABELS, getIsoWeekday } from "../types";
import { setWeeklyPlanDayAction } from "../actions";
import {
  GYM_STALE_TIME,
  fetchGymWeeklyPlan,
  gymWeeklyPlanKey,
  patchWeeklyPlanDayInCache,
  syncGymDiscoverWidgets,
} from "@/lib/cache/gymCache";

interface WeeklyPlanPickerProps {
  userId: string;
  routines: Routine[];
}

const WEEKDAY_FULL = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export default function WeeklyPlanPicker({ userId, routines }: WeeklyPlanPickerProps) {
  const queryClient = useQueryClient();
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const today = getIsoWeekday();

  const { data: days = [], isLoading: loading } = useQuery({
    queryKey: gymWeeklyPlanKey(userId),
    queryFn: () => fetchGymWeeklyPlan(userId),
    enabled: !!userId,
    staleTime: GYM_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  async function handleChange(dayOfWeek: number, routineId: string | null) {
    setSavingDay(dayOfWeek);
    const result = await setWeeklyPlanDayAction(userId, dayOfWeek, routineId);
    if (result.data) {
      const routine = routines.find((item) => item.id === routineId) ?? null;
      patchWeeklyPlanDayInCache(queryClient, userId, {
        dayOfWeek,
        routineId,
        routineName: routine?.name ?? null,
        exercises: routine?.exercises ?? [],
      });
      syncGymDiscoverWidgets(queryClient, userId);
    }
    setSavingDay(null);
    setPickerDay(null);
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

  const pickerDayData = pickerDay
    ? planDays.find((day) => day.dayOfWeek === pickerDay) ?? null
    : null;

  const todayPlan = planDays.find((day) => day.dayOfWeek === today);
  const workoutDays = planDays.filter((day) => day.routineId).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setPlanOpen(true)}
        className="w-full bg-app-surface rounded-2xl border border-app-border shadow-sm overflow-hidden text-left hover:bg-app-surface-muted/40 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-black text-app-text tracking-tight">Haftalık Plan</p>
            {loading ? (
              <div className="h-3 w-24 bg-app-tab-track rounded animate-pulse mt-1.5" />
            ) : (
              <p className="text-[10px] font-bold text-app-muted truncate mt-0.5">
                Bugün:{" "}
                <span className="text-app-text">
                  {todayPlan?.routineName ?? "Dinlenme"}
                </span>
              </p>
            )}
          </div>
          <CaretRight size={16} weight="bold" className="text-app-muted shrink-0" />
        </div>

        {!loading && (
          <div className="px-4 pb-3.5">
            <div className="flex items-center justify-between gap-1">
              {planDays.map((day) => {
                const label = WEEKDAY_LABELS[day.dayOfWeek - 1];
                const isToday = day.dayOfWeek === today;
                const isRest = !day.routineId;
                return (
                  <div key={day.dayOfWeek} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span
                      className={`text-[8px] font-black uppercase tracking-wide ${
                        isToday ? "text-app-text" : "text-app-muted"
                      }`}
                    >
                      {label}
                    </span>
                    <div
                      className={`w-full max-w-[34px] h-7 rounded-lg flex items-center justify-center border ${
                        isToday
                          ? isRest
                            ? "bg-app-surface-muted border-app-border text-app-muted"
                            : "bg-app-text border-app-text text-app-bg shadow-sm"
                          : isRest
                            ? "bg-app-surface-muted border-app-border text-app-muted"
                            : "bg-app-tab-track border-app-border text-app-text"
                      }`}
                    >
                      {isRest ? (
                        <Moon size={11} weight="fill" />
                      ) : (
                        <Barbell size={11} weight="fill" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] font-bold text-app-muted uppercase tracking-wider text-center mt-2.5">
              {workoutDays} antrenman · {7 - workoutDays} dinlenme
            </p>
          </div>
        )}
      </button>

      <Drawer.Root open={planOpen} onOpenChange={setPlanOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-app-bg flex flex-col fixed bottom-0 left-0 right-0 z-50 rounded-t-[1.75rem] max-h-[85vh] max-w-xl mx-auto outline-none">
            <div className="mx-auto w-10 h-1 rounded-full bg-app-border mt-3 mb-1 shrink-0" />
            <div className="px-5 pt-2 pb-3 border-b border-app-border shrink-0">
              <Drawer.Title className="text-sm font-black text-app-text">Haftalık Plan</Drawer.Title>
              <Drawer.Description className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-0.5">
                Günlerine rutin ata
              </Drawer.Description>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="h-12 bg-app-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto divide-y divide-app-border pb-8">
                {planDays.map((day) => {
                  const label = WEEKDAY_LABELS[day.dayOfWeek - 1];
                  const isToday = day.dayOfWeek === today;
                  const isRest = !day.routineId;
                  const isSaving = savingDay === day.dayOfWeek;

                  return (
                    <button
                      key={day.dayOfWeek}
                      type="button"
                      onClick={() => setPickerDay(day.dayOfWeek)}
                      disabled={isSaving}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all active:scale-[0.99] disabled:opacity-50 ${
                        isToday ? "bg-app-tab-active/50" : "hover:bg-app-surface-muted/30"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isToday
                            ? "bg-app-text border-app-text text-app-bg shadow-sm"
                            : "bg-app-surface border-app-border text-app-muted"
                        }`}
                      >
                        <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                          {label}
                        </span>
                        {isToday && (
                          <span className="text-[7px] font-bold uppercase tracking-wider opacity-80 mt-0.5">
                            Bugün
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[11px] font-black truncate ${
                            isToday ? "text-app-text" : "text-app-text"
                          }`}
                        >
                          {isRest ? "Dinlenme" : day.routineName}
                        </p>
                        <p className="text-[9px] font-bold text-app-muted truncate mt-0.5">
                          {isRest
                            ? "Rutin atanmadı"
                            : `${day.exercises.length} egzersiz`}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                          isRest
                            ? "bg-app-surface border-app-border text-app-muted"
                            : "bg-app-tab-track border-app-border text-app-text"
                        }`}
                      >
                        {isRest ? (
                          <Moon size={12} weight="fill" />
                        ) : (
                          <Barbell size={12} weight="fill" />
                        )}
                        <CaretRight size={12} weight="bold" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={pickerDay !== null} onOpenChange={(open) => !open && setPickerDay(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-app-bg flex flex-col fixed bottom-0 left-0 right-0 z-[60] rounded-t-[1.75rem] max-h-[70vh] max-w-xl mx-auto outline-none">
            <div className="mx-auto w-10 h-1 rounded-full bg-app-border mt-3 mb-1 shrink-0" />
            <div className="px-5 pt-2 pb-3 border-b border-app-border">
              <Drawer.Title className="text-sm font-black text-app-text">
                {pickerDay ? WEEKDAY_FULL[pickerDay - 1] : "Gün seç"}
              </Drawer.Title>
              <Drawer.Description className="text-[10px] font-bold text-app-muted uppercase tracking-wider mt-0.5">
                Rutin ata veya dinlenme günü bırak
              </Drawer.Description>
            </div>

            <div className="overflow-y-auto p-3 space-y-1.5 pb-8">
              <button
                type="button"
                onClick={() => pickerDay && handleChange(pickerDay, null)}
                disabled={savingDay !== null}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                  pickerDayData && !pickerDayData.routineId
                    ? "bg-app-tab-active border-app-border shadow-sm"
                    : "bg-app-surface border-app-border hover:bg-app-surface-muted/30"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center text-app-muted shrink-0">
                  <Moon size={16} weight="fill" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] font-black text-app-text">Dinlenme</p>
                  <p className="text-[9px] font-bold text-app-muted">Antrenman yok</p>
                </div>
                {pickerDayData && !pickerDayData.routineId && (
                  <Check size={18} weight="bold" className="text-app-text shrink-0" />
                )}
              </button>

              {routines.map((routine) => {
                const isSelected = pickerDayData?.routineId === routine.id;
                return (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => pickerDay && handleChange(pickerDay, routine.id)}
                    disabled={savingDay !== null}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-app-tab-active border-app-border shadow-sm"
                        : "bg-app-surface border-app-border hover:bg-app-surface-muted/30"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center text-app-text shrink-0">
                      <Barbell size={16} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[11px] font-black text-app-text truncate">{routine.name}</p>
                      <p className="text-[9px] font-bold text-app-muted">
                        {routine.exercises.length} egzersiz
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={18} weight="bold" className="text-app-text shrink-0" />
                    )}
                  </button>
                );
              })}

              {routines.length === 0 && (
                <p className="text-center text-[10px] font-bold text-app-muted uppercase tracking-wider py-4">
                  Önce rutin oluştur
                </p>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
