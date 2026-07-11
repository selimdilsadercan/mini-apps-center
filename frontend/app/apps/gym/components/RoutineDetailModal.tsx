"use client";

import { X, Barbell, Info } from "@phosphor-icons/react";
import type { Routine } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExerciseThumbnail from "./ExerciseThumbnail";
import { getExerciseBySlug } from "../exercises";

export default function RoutineDetailModal({
  routine,
  open,
  onClose,
  onStart,
}: {
  routine: Routine;
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const { catalog } = useExerciseCatalog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#FAF9F7] rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-white">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">Rutin Detayı</h2>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{routine.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Egzersizler ({routine.exercises.length})
            </h3>
            <div className="space-y-3">
              {routine.exercises.map((ex, idx) => {
                const item = getExerciseBySlug(catalog, ex.slug);
                return (
                  <div
                    key={idx}
                    className="flex gap-3 bg-white border border-gray-200/50 rounded-2xl p-3 shadow-sm hover:border-gray-300 transition-colors"
                  >
                    {item && (
                      <ExerciseThumbnail exercise={item} size="md" />
                    )}
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {idx + 1}. {item?.name || ex.name}
                        </h4>
                        {item?.nameEn && (
                          <p className="text-[10px] text-gray-400 truncate">{item.nameEn}</p>
                        )}
                      </div>
                      
                      {/* Badge Row */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item?.muscleGroup && (
                          <span className="text-[9px] bg-violet-50 text-violet-700 border border-violet-100/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {item.muscleGroup}
                          </span>
                        )}
                        {item?.difficultyLevel && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {item.difficultyLevel}
                          </span>
                        )}
                        {item?.category && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            {item.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button at bottom */}
        <div className="px-5 py-4 border-t border-gray-200/60 bg-white flex gap-3">
          <button
            onClick={() => {
              onClose();
              onStart();
            }}
            className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
          >
            <Barbell size={18} weight="bold" />
            Antrenmanı Başlat
          </button>
        </div>
      </div>
    </div>
  );
}
