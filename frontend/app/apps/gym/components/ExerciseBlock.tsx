"use client";

import { Plus, Check, DotsThreeVertical } from "@phosphor-icons/react";
import { AnimatePresence } from "framer-motion";
import {
  exerciseUsesDuration,
  exerciseUsesWeight,
  formatPreviousSet,
  getExerciseBySlug,
  resolveExerciseName,
  showExerciseDetail,
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
}: {
  exercise: WorkoutExercise;
  catalog: ExerciseCatalogItem[];
  previousSets: WorkoutSet[];
  onChange: (ex: WorkoutExercise) => void;
  variant?: "sheet" | "page";
}) {
  const catalogItem = getExerciseBySlug(catalog, exercise.slug);
  const usesWeight = exerciseUsesWeight(catalogItem?.equipment);
  const usesDuration = exerciseUsesDuration(catalogItem);
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
    <div
      className={`bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden ${
        isSheet ? "hover:border-gray-300 transition-colors" : ""
      }`}
    >
      <div className={`flex items-center ${isSheet ? "justify-between" : "gap-3"} px-4 pt-4 pb-2`}>
        <div
          onClick={() => catalogItem && showExerciseDetail(catalogItem)}
          className={`flex-1 flex items-center gap-3 min-w-0 ${catalogItem ? "cursor-pointer group" : ""}`}
        >
          {catalogItem ? (
            <ExerciseThumbnail exercise={catalogItem} />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-lg">
              🏋️
            </div>
          )}
          <h3
            className={`flex-1 text-sm font-black truncate ${
              isSheet
                ? "text-violet-600 group-hover:text-violet-700 transition-colors"
                : "text-violet-500"
            }`}
          >
            {resolveExerciseName(catalog, exercise.slug, exercise.name)}
          </h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <DotsThreeVertical size={18} weight="bold" />
        </button>
      </div>

      <div
        className={`mx-4 mb-3 rounded-xl overflow-hidden border border-gray-100 ${
          isSheet ? "bg-gray-50/30" : ""
        }`}
      >
        <div
          className={`grid ${gridClass} ${
            isSheet ? "bg-gray-50/80 border-b border-gray-100" : "bg-gray-50"
          } text-[9px] font-black text-gray-400 uppercase tracking-wide`}
        >
          <div className="px-2 py-2 text-center">Set</div>
          <div className="px-1 py-2">Önceki</div>
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
              className="border-b border-gray-100 last:border-0"
            >
            <div
              className={`grid ${gridClass} items-center ${
                isSheet
                  ? set.completed
                    ? "bg-emerald-50/10"
                    : setIdx % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50/30"
                  : setIdx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50/80"
              }`}
            >
              <div className="px-2 py-2.5 text-center text-xs font-bold text-gray-500 tabular-nums">
                {setIdx + 1}
              </div>
              <div className={`px-1 py-2.5 text-[10px] text-gray-400 ${isSheet ? "font-bold" : "font-medium"}`}>
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
                    className={`w-full text-center text-xs font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums placeholder:text-gray-300 ${
                      isSheet ? "bg-white shadow-sm" : "bg-transparent border-gray-200/60 py-1.5 focus:ring-1"
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
                    className={`w-full text-center text-xs font-bold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums placeholder:text-gray-300 ${
                      isSheet ? "bg-white shadow-sm" : "bg-transparent border-gray-200/60 py-1.5 focus:ring-1"
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
                        : "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-300 hover:bg-gray-200"
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
              ? "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200/50"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }`}
        >
          <Plus size={14} weight="bold" />
          Set Ekle
        </button>
      </div>
    </div>
  );
}
