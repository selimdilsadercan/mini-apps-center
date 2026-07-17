"use client";

import { Plus, Check, DotsThreeVertical } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import {
  formatPreviousSet,
  getExerciseBySlug,
  getExerciseTrackingType,
  resolveExerciseName,
  showExerciseDetail,
  trackingUsesDuration,
  trackingUsesWeight,
  type ExerciseCatalogItem,
} from "../exercises";
import {
  completeWorkoutSet,
  createEmptySet,
  getSetTargetReps,
  getSetTargetWeightKg,
  setPlaceholder,
  type WorkoutExercise,
  type WorkoutSet,
} from "../types";
import ExerciseThumbnail from "./ExerciseThumbnail";
import SetDurationField from "./SetDurationField";
import SwipeToDeleteRow from "./SwipeToDeleteRow";
import { selectInputOnClick, selectInputOnFocus } from "../input-utils";

const stopDragPropagation = (e: React.PointerEvent) => {
  e.stopPropagation();
};

export default function ExerciseBlock({
  exercise,
  catalog,
  previousSets,
  onChange,
  variant = "sheet",
  dragHandle,
}: {
  exercise: WorkoutExercise;
  catalog: ExerciseCatalogItem[];
  previousSets: WorkoutSet[];
  onChange: (ex: WorkoutExercise) => void;
  variant?: "sheet" | "page";
  dragHandle?: React.ReactNode;
}) {
  const catalogItem = getExerciseBySlug(catalog, exercise.slug);
  const trackingType = getExerciseTrackingType(
    { slug: exercise.slug, trackingType: exercise.trackingType },
    catalogItem,
  );
  const usesWeight = trackingUsesWeight(trackingType);
  const usesDuration = trackingUsesDuration(trackingType);
  const isSheet = variant === "sheet";

  const gridClass = (() => {
    if (isSheet) {
      if (usesWeight && usesDuration) return "grid-cols-[2.5rem_1fr_4rem_5.5rem_2.5rem]";
      if (usesWeight) return "grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem]";
      if (usesDuration) return "grid-cols-[2.5rem_1fr_5.5rem_2.5rem]";
      return "grid-cols-[2.5rem_1fr_4rem_2.5rem]";
    }
    if (usesWeight && usesDuration) return "grid-cols-[2rem_1fr_3.5rem_5rem_2rem]";
    if (usesWeight) return "grid-cols-[2rem_1fr_3.5rem_3.5rem_2rem]";
    if (usesDuration) return "grid-cols-[2rem_1fr_5rem_2rem]";
    return "grid-cols-[2rem_1fr_3.5rem_2rem]";
  })();

  const updateSet = (setIdx: number, field: keyof WorkoutSet, value: number | boolean | null) => {
    const sets = exercise.sets.map((s, i) => (i === setIdx ? { ...s, [field]: value } : s));
    onChange({ ...exercise, sets });
  };

  const toggleComplete = (setIdx: number) => {
    const set = exercise.sets[setIdx];
    if (set.completed) {
      updateSet(setIdx, "completed", false);
      return;
    }
    const sets = exercise.sets.map((s, i) =>
      i === setIdx ? completeWorkoutSet(s, setIdx, exercise.sets) : s
    );
    onChange({ ...exercise, sets });
  };

  const addSet = () => {
    onChange({ ...exercise, sets: [...exercise.sets, createEmptySet()] });
  };

  const removeSet = (setIdx: number) => {
    if (exercise.sets.length <= 1) return;
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== setIdx) });
  };

  const valueLabel = usesDuration ? "Süre" : "Tekrar";

  return (
    <div className="bg-app-surface rounded-2xl border border-app-border shadow-sm overflow-hidden hover:bg-app-surface-muted/30 transition-colors">
      <div className={`flex items-center gap-2 ${isSheet ? "justify-between" : ""} px-4 pt-4 pb-2`}>
        {dragHandle}
        <div
          onClick={() => catalogItem && showExerciseDetail(catalogItem)}
          className={`flex-1 flex items-center gap-3 min-w-0 ${catalogItem ? "cursor-pointer group" : ""}`}
        >
          {catalogItem ? (
            <ExerciseThumbnail exercise={catalogItem} />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-app-surface-muted flex items-center justify-center text-lg">
              🏋️
            </div>
          )}
          <h3
            className={`flex-1 text-sm font-black truncate ${
              isSheet
                ? "text-app-text group-hover:text-app-muted transition-colors"
                : "text-app-text"
            }`}
          >
            {resolveExerciseName(catalog, exercise.slug, exercise.name)}
          </h3>
        </div>
        <button className="text-app-muted hover:text-app-text transition-colors shrink-0">
          <DotsThreeVertical size={18} weight="bold" />
        </button>
      </div>

      <div
        className={`mx-4 mb-3 rounded-xl overflow-hidden border border-app-border ${
          isSheet ? "bg-app-surface-muted/30" : ""
        }`}
      >
        <div
          className={`grid ${gridClass} ${
            isSheet ? "bg-app-surface-muted/80 border-b border-app-border" : "bg-app-surface-muted"
          } text-[9px] font-black text-app-muted uppercase tracking-wide`}
        >
          <div className="px-2 py-2 text-center">Set</div>
          <div className="px-1 py-2 text-center">Önceki</div>
          {usesWeight && <div className="px-1 py-2 text-center">Kg</div>}
          <div className="px-1 py-2 text-center">{valueLabel}</div>
          <div />
        </div>
        <AnimatePresence initial={false}>
        {exercise.sets.map((set, setIdx) => {
          const prev = previousSets[setIdx];
          const repTarget = getSetTargetReps(set, setIdx, exercise.sets);
          const weightTarget = getSetTargetWeightKg(set, setIdx, exercise.sets);
          return (
            <SwipeToDeleteRow
              key={setIdx}
              onDelete={() => removeSet(setIdx)}
              className="border-b border-app-border last:border-0"
            >
            <div
              className={`grid ${gridClass} items-center ${
                isSheet
                  ? set.completed
                    ? "bg-emerald-50/10 dark:bg-emerald-950/20"
                    : setIdx % 2 === 0
                      ? "bg-app-surface"
                      : "bg-app-surface-muted/30"
                  : setIdx % 2 === 0
                    ? "bg-app-surface"
                    : "bg-app-surface-muted/80"
              }`}
            >
              <div className="px-2 py-2.5 text-center text-xs font-bold text-app-muted tabular-nums">
                {setIdx + 1}
              </div>
              <div className={`px-1 py-2.5 text-center text-[10px] text-app-muted tabular-nums ${isSheet ? "font-bold" : "font-medium"}`}>
                {prev ? formatPreviousSet(prev, { duration: usesDuration }) : "—"}
              </div>
              {usesWeight && (
                <div className={`px-1 ${isSheet ? "py-1" : "py-1.5"}`}>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={setPlaceholder(weightTarget)}
                    value={set.weightKg ?? ""}
                    onPointerDown={stopDragPropagation}
                    onFocus={selectInputOnFocus}
                    onClick={selectInputOnClick}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9.]/g, "");
                      updateSet(setIdx, "weightKg", cleanVal ? Number(cleanVal) : null);
                    }}
                    className={`w-full text-center text-xs font-bold border border-app-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums placeholder:text-app-muted text-app-text ${
                      isSheet ? "bg-app-surface shadow-sm" : "bg-transparent border-app-border py-1.5 focus:ring-1"
                    }`}
                  />
                </div>
              )}
              <div className={`px-1 ${isSheet ? "py-1" : "py-1.5"}`} onPointerDown={stopDragPropagation}>
                {usesDuration ? (
                  <SetDurationField
                    seconds={set.reps}
                    targetSeconds={repTarget}
                    onChange={(val) => updateSet(setIdx, "reps", val)}
                  />
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={setPlaceholder(repTarget)}
                    value={set.reps ?? ""}
                    onPointerDown={stopDragPropagation}
                    onFocus={selectInputOnFocus}
                    onClick={selectInputOnClick}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                      updateSet(setIdx, "reps", cleanVal ? Number(cleanVal) : null);
                    }}
                    className={`w-full text-center text-xs font-bold border border-app-border rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums placeholder:text-app-muted text-app-text ${
                      isSheet ? "bg-app-surface shadow-sm" : "bg-transparent border-app-border py-1.5 focus:ring-1"
                    }`}
                  />
                )}
              </div>
              <div className={`flex justify-center ${isSheet ? "py-1" : "py-1.5"}`}>
                <button
                  type="button"
                  onPointerDown={stopDragPropagation}
                  onClick={() => toggleComplete(setIdx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isSheet ? "shadow-sm" : ""
                  } ${
                    set.completed
                      ? isSheet
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-app-text dark:bg-violet-600 text-white"
                      : "bg-app-tab-track text-app-muted hover:bg-app-border/50"
                  }`}
                >
                  <Check size={14} weight="bold" />
                </button>
              </div>
            </div>
            </SwipeToDeleteRow>
          );
        })}
        </AnimatePresence>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={addSet}
          className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-[0.98] ${
            isSheet
              ? "bg-app-surface-muted hover:bg-app-border/30 text-app-muted border border-app-border"
              : "bg-app-tab-track hover:bg-app-border/50 text-app-muted"
          }`}
        >
          <Plus size={14} weight="bold" />
          Set Ekle
        </button>
      </div>
    </div>
  );
}
