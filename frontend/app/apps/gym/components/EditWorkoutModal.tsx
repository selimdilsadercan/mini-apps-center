"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash } from "@phosphor-icons/react";
import type { Workout, WorkoutExercise, WorkoutSet, ExerciseRef } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import {
  calcVolume,
  exerciseUsesWeight,
  getExerciseBySlug,
  resolveExerciseName,
  showExerciseDetail,
} from "../exercises";
import { selectInputOnClick, selectInputOnFocus, handleVerticalSetInputTab } from "../input-utils";
import ExerciseThumbnail from "./ExerciseThumbnail";
import ExercisePicker from "./ExercisePicker";
import { updateWorkoutAction, deleteWorkoutAction } from "../actions";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "react-hot-toast";
import {
  invalidateGymStats,
  removeWorkoutFromCache,
  syncGymDiscoverWidgets,
  upsertWorkoutInCache,
} from "@/lib/gymCache";

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function applyWorkoutDate(isoBase: string, newDateStr: string): string {
  const base = new Date(isoBase);
  const [y, mo, d] = newDateStr.split("-").map(Number);
  return new Date(y, mo - 1, d, base.getHours(), base.getMinutes(), base.getSeconds(), 0).toISOString();
}

export default function EditWorkoutModal({
  workout,
  open,
  onClose,
  onUpdated,
  userId,
}: {
  workout: Workout;
  open: boolean;
  onClose: () => void;
  onUpdated: (workout: Workout) => void;
  userId: string;
}) {
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const [name, setName] = useState(workout.name);
  const [date, setDate] = useState(
    toDateInputValue(workout.finishedAt || workout.startedAt)
  );
  const [minutes, setMinutes] = useState(Math.round(workout.durationSeconds / 60).toString());
  const [exercises, setExercises] = useState<WorkoutExercise[]>(workout.exercises);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(workout.name);
    setDate(toDateInputValue(workout.finishedAt || workout.startedAt));
    setMinutes(Math.round(workout.durationSeconds / 60).toString());
    setExercises(workout.exercises);
    setSaving(false);
  }, [open, workout]);

  if (!open) return null;

  const handleAddExercise = (ref: ExerciseRef) => {
    setExercises((prev) => [
      ...prev,
      {
        slug: ref.slug,
        name: ref.name,
        sets: [{ reps: null, weightKg: null, completed: true }],
      },
    ]);
    setShowAddExercise(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSet = (
    exIdx: number,
    setIdx: number,
    field: keyof WorkoutSet,
    value: number | boolean | null
  ) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: [...ex.sets, { reps: null, weightKg: null, completed: true }],
            }
          : ex
      )
    );
  };

  const handleRemoveSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? {
              ...ex,
              sets: ex.sets.filter((_, j) => j !== setIdx),
            }
          : ex
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !date) return;
    setSaving(true);
    const durationSeconds = Number(minutes.replace(/[^0-9]/g, "")) * 60;
    const volume = calcVolume(exercises);
    const baseFinished = workout.finishedAt || workout.startedAt;
    const finishedAt = applyWorkoutDate(baseFinished, date);
    const startedAt = new Date(new Date(finishedAt).getTime() - durationSeconds * 1000).toISOString();

    const result = await updateWorkoutAction(userId, {
      workoutId: workout.id,
      name: name.trim(),
      exercises,
      durationSeconds,
      totalVolumeKg: volume,
      startedAt,
      finishedAt,
    });

    if (result.data) {
      upsertWorkoutInCache(queryClient, userId, result.data);
      invalidateGymStats(queryClient, userId);
      toast.success("Antrenman başarıyla güncellendi!");
      onUpdated(result.data);
      onClose();
    } else {
      toast.error(`Güncelleme hatası: ${result.error}`);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Antrenmanı sil?",
      description: "Bu antrenman kalıcı olarak geçmişinizden silinecektir.",
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;

    setSaving(true);
    const result = await deleteWorkoutAction(userId, workout.id);
    if (result.data) {
      removeWorkoutFromCache(queryClient, userId, workout.id);
      invalidateGymStats(queryClient, userId);
      syncGymDiscoverWidgets(queryClient, userId);
      toast.success("Antrenman geçmişten silindi!");
      onClose();
    } else {
      toast.error(`Silme hatası: ${result.error}`);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl sm:rounded-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border bg-app-surface">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-app-text">Antrenmanı Düzenle</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 transition-colors"
              title="Antrenmanı Sil"
            >
              <Trash size={16} weight="bold" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-muted hover:text-app-text transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* General Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1 block">
                Antrenman Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1 block">
                  Tarih
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-app-muted uppercase tracking-wider mb-1 block">
                  Süre (Dakika)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-xs font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
            </div>
          </div>

          {/* Exercises */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Egzersizler</h3>
            {exercises.map((ex, exIdx) => {
              const catalogItem = getExerciseBySlug(catalog, ex.slug);
              const usesWeight = exerciseUsesWeight(catalogItem?.equipment);
              return (
                <div key={exIdx} className="bg-app-surface rounded-2xl border border-app-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {catalogItem ? (
                      <ExerciseThumbnail exercise={catalogItem} size="sm" />
                    ) : (
                      <span className="text-lg">🏋️</span>
                    )}
                    <h4 className="flex-1 text-xs font-black text-violet-600 truncate">
                      {resolveExerciseName(catalog, ex.slug, ex.name)}
                    </h4>
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
                      <div className="px-1 py-2 text-center">Tekrar</div>
                      <div />
                    </div>

                    {ex.sets.map((set, setIdx) => (
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
                                  totalSets: ex.sets.length,
                                })
                              }
                              onFocus={selectInputOnFocus}
                              onClick={selectInputOnClick}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/[^0-9.]/g, "");
                                handleUpdateSet(exIdx, setIdx, "weightKg", cleanVal ? Number(cleanVal) : null);
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
                                totalSets: ex.sets.length,
                              })
                            }
                            onFocus={selectInputOnFocus}
                            onClick={selectInputOnClick}
                            onChange={(e) => {
                              const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                              handleUpdateSet(exIdx, setIdx, "reps", cleanVal ? Number(cleanVal) : null);
                            }}
                            className="w-full text-center text-xs font-bold bg-app-surface border border-app-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm"
                          />
                        </div>
                        <div className="flex justify-center py-1">
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => handleRemoveSet(exIdx, setIdx)}
                            className="w-7 h-7 text-app-muted hover:text-red-500 rounded-full flex items-center justify-center transition-colors"
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
              className="w-full flex items-center justify-center gap-2 bg-app-surface rounded-2xl border border-dashed border-app-border py-3 text-xs font-bold text-app-muted hover:border-violet-300 hover:text-violet-600 transition-all active:scale-[0.99]"
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
            disabled={saving || !name.trim()}
            className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50"
          >
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      {showAddExercise && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl h-[70vh] flex flex-col shadow-2xl overflow-hidden">
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
