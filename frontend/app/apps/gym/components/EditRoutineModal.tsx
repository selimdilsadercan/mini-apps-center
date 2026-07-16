"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash } from "@phosphor-icons/react";
import type { Routine, ExerciseRef, RoutineSet } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExercisePicker from "./ExercisePicker";
import { getExerciseBySlug, resolveExerciseName, exerciseUsesWeight, exerciseUsesDuration, showExerciseDetail } from "../exercises";
import { selectInputOnClick, selectInputOnFocus, handleVerticalSetInputTab } from "../input-utils";
import ExerciseThumbnail from "./ExerciseThumbnail";
import { updateRoutineAction } from "../actions";
import { toast } from "react-hot-toast";
import {
  syncGymDiscoverWidgets,
  syncRoutineInWeeklyPlanCache,
  upsertRoutineInCache,
} from "@/lib/cache/gymCache";

export default function EditRoutineModal({
  routine,
  open,
  onClose,
  onUpdated,
  userId,
}: {
  routine: Routine;
  open: boolean;
  onClose: () => void;
  onUpdated: (updated: Routine) => void;
  userId: string;
}) {
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const queryClient = useQueryClient();
  const [name, setName] = useState(routine.name);
  const [exercises, setExercises] = useState<ExerciseRef[]>(
    routine.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets || [
        { reps: null, weightKg: null },
        { reps: null, weightKg: null },
        { reps: null, weightKg: null },
      ], // fallback to 3 sets if not present
    }))
  );
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleAddExercise = (ref: { slug: string; name: string }) => {
    setExercises((prev) => [
      ...prev,
      {
        slug: ref.slug,
        name: ref.name,
        sets: [
          { reps: null, weightKg: null },
          { reps: null, weightKg: null },
          { reps: null, weightKg: null },
        ], // default to 3 empty sets
      },
    ]);
    setShowAddExercise(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSetField = (
    exIdx: number,
    setIdx: number,
    field: keyof RoutineSet,
    value: number | null
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const currentSets = ex.sets || [];
        const updatedSets = currentSets.map((s, j) =>
          j === setIdx ? { ...s, [field]: value } : s
        );
        return { ...ex, sets: updatedSets };
      })
    );
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const currentSets = ex.sets || [];
        return { ...ex, sets: [...currentSets, { reps: null, weightKg: null }] };
      })
    );
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const currentSets = ex.sets || [];
        return { ...ex, sets: currentSets.filter((_, j) => j !== setIdx) };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return;
    setSaving(true);

    const result = await updateRoutineAction(userId, {
      routineId: routine.id,
      name: name.trim(),
      exercises,
    });

    if (result.data) {
      upsertRoutineInCache(queryClient, userId, result.data);
      syncRoutineInWeeklyPlanCache(queryClient, userId, result.data);
      syncGymDiscoverWidgets(queryClient, userId);
      toast.success("Rutin başarıyla güncellendi!");
      onUpdated(result.data);
      onClose();
    } else {
      toast.error(`Güncelleme hatası: ${result.error}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl sm:rounded-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border bg-app-surface">
          <h2 className="text-sm font-black uppercase tracking-wide text-app-text">Rutini Düzenle</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-muted hover:text-app-text transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1 block">
              Rutin Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Push Day"
              className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Egzersizler</h3>
            {exercises.map((ex, exIdx) => {
              const catalogItem = getExerciseBySlug(catalog, ex.slug);
              const usesWeight = exerciseUsesWeight(catalogItem?.equipment);
              const usesDuration = exerciseUsesDuration(catalogItem);
              const sets = ex.sets || [];
              return (
                <div key={exIdx} className="bg-app-surface rounded-2xl border border-app-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => catalogItem && showExerciseDetail(catalogItem)}
                      className="flex-1 flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      {catalogItem ? (
                        <ExerciseThumbnail exercise={catalogItem} size="sm" />
                      ) : (
                        <span className="text-lg">🏋️</span>
                      )}
                      <h4 className="flex-1 text-xs font-black text-violet-600 truncate group-hover:text-violet-700 transition-colors">
                        {resolveExerciseName(catalog, ex.slug, ex.name)}
                      </h4>
                    </div>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>

                  {/* Set table */}
                  <div className="rounded-xl overflow-hidden border border-app-border bg-app-surface-muted/30" data-set-table>
                    <div
                      className={`grid ${
                        usesWeight
                          ? "grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem]"
                          : "grid-cols-[2.5rem_1fr_4rem_2.5rem]"
                      } bg-app-surface-muted/80 border-b border-app-border text-[9px] font-black text-app-muted uppercase tracking-wide`}
                    >
                      <div className="px-2 py-2 text-center">Set</div>
                      <div />
                      {usesWeight && <div className="px-1 py-2 text-center">Kg</div>}
                      <div className="px-1 py-2 text-center">{usesDuration ? "Süre (sn)" : "Tekrar"}</div>
                      <div />
                    </div>

                    {sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className={`grid ${
                          usesWeight
                            ? "grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem]"
                            : "grid-cols-[2.5rem_1fr_4rem_2.5rem]"
                        } items-center border-b border-app-border last:border-0 bg-app-surface`}
                      >
                        <div className="px-2 py-2.5 text-center text-xs font-bold text-app-muted tabular-nums">
                          {setIdx + 1}
                        </div>
                        <div />
                        {usesWeight && (
                          <div className="px-1 py-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="—"
                              value={set.weightKg ?? ""}
                              data-ex-idx={exIdx}
                              data-set-idx={setIdx}
                              data-set-field="weightKg"
                              onKeyDown={(e) =>
                                handleVerticalSetInputTab(e, {
                                  exIdx,
                                  setIdx,
                                  field: "weightKg",
                                  totalSets: sets.length,
                                })
                              }
                              onFocus={selectInputOnFocus}
                              onClick={selectInputOnClick}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, "");
                                handleUpdateSetField(exIdx, setIdx, "weightKg", cleanVal ? Number(cleanVal) : null);
                              }}
                              className="w-full text-center text-xs font-bold bg-app-surface border border-app-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm"
                            />
                          </div>
                        )}
                        <div className="px-1 py-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="—"
                            value={set.reps ?? ""}
                            data-ex-idx={exIdx}
                            data-set-idx={setIdx}
                            data-set-field="reps"
                            onKeyDown={(e) =>
                              handleVerticalSetInputTab(e, {
                                exIdx,
                                setIdx,
                                field: "reps",
                                totalSets: sets.length,
                              })
                            }
                            onFocus={selectInputOnFocus}
                            onClick={selectInputOnClick}
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                              handleUpdateSetField(exIdx, setIdx, "reps", cleanVal ? Number(cleanVal) : null);
                            }}
                            className="w-full text-center text-xs font-bold bg-app-surface border border-app-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm"
                          />
                        </div>
                        <div className="flex justify-center py-1">
                          <button
                            type="button"
                            tabIndex={-1}
                            disabled={sets.length <= 1}
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="w-7 h-7 text-app-muted hover:text-red-500 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleAddSet(exIdx)}
                    className="w-full bg-app-surface-muted hover:bg-app-border/30 text-app-muted font-bold text-xs py-2 rounded-xl transition-all border border-app-border/50 flex items-center justify-center gap-1 active:scale-[0.98]"
                  >
                    <Plus size={12} weight="bold" />
                    Set Ekle
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full flex items-center justify-center gap-2 bg-app-surface rounded-2xl border border-dashed border-app-border py-3.5 text-xs font-bold text-app-muted hover:border-violet-300 hover:text-violet-600 transition-all active:scale-[0.99]"
            >
              <Plus size={14} weight="bold" />
              Egzersiz Ekle
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-app-border bg-app-surface flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || exercises.length === 0}
            className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      {showAddExercise && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-app-border bg-app-surface">
              <h2 className="text-sm font-black uppercase tracking-wide">Egzersiz Ekle</h2>
              <button
                onClick={() => setShowAddExercise(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-muted"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {catalogLoading ? (
                <p className="text-center py-8 text-xs font-bold text-app-muted animate-pulse">
                  Yükleniyor...
                </p>
              ) : (
                <ExercisePicker
                  catalog={catalog}
                  onSelect={handleAddExercise}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
