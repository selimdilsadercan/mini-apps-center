"use client";
import { useState } from "react";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import { DotsThree, Plus, Barbell, PencilSimple } from "@phosphor-icons/react";
import type { Routine } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EditRoutineModal from "./EditRoutineModal";
import { showExerciseDetail, getExerciseBySlug } from "../exercises";
import ExerciseThumbnail from "./ExerciseThumbnail";

export default function RoutineCard({
  routine,
  onStart,
  onDelete,
  onUpdated,
  userId,
}: {
  routine: Routine;
  onStart: () => void;
  onDelete: () => void;
  onUpdated: (updated: Routine) => void;
  userId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { catalog } = useExerciseCatalog();

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden hover:border-gray-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-gray-900 truncate">{routine.name}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
            {routine.exercises.length} Egzersiz
          </p>
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              <DotsThree size={20} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
            >
              Rutini Sil
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Exercises Preview (Horizontal Thumbnails) */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {routine.exercises.map((ex, idx) => {
          const item = getExerciseBySlug(catalog, ex.slug);
          return (
            <div
              key={idx}
              onClick={() => item && showExerciseDetail(item)}
              className={`shrink-0 transition-transform active:scale-95 ${
                item ? "cursor-pointer" : ""
              }`}
              title={item?.name || ex.name}
            >
              {item ? (
                <ExerciseThumbnail exercise={item} size="sm" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-[10px] text-gray-500 font-bold shrink-0">
                  🏋️
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-4 pt-1 flex gap-2">
        <button
          onClick={() => setShowEdit(true)}
          className="flex-1 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] text-gray-700 font-bold text-xs py-2.5 rounded-xl transition-all border border-gray-200/60 flex items-center justify-center gap-1.5"
        >
          <PencilSimple size={16} weight="bold" />
          Düzenle
        </button>
        <button
          onClick={onStart}
          className="flex-1 bg-violet-50 hover:bg-violet-100 active:scale-[0.98] text-violet-700 font-bold text-xs py-2.5 rounded-xl transition-all border border-violet-100/60 flex items-center justify-center gap-1.5"
        >
          <Barbell size={16} weight="bold" />
          Başlat
        </button>
      </div>

      <EditRoutineModal
        routine={routine}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onUpdated={onUpdated}
        userId={userId}
      />
    </div>
  );
}

export function RoutineActions({
  onNewRoutine,
}: {
  onNewRoutine: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Rutinler</h2>
      <button
        onClick={onNewRoutine}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-gray-200/60 text-gray-700 hover:border-violet-300 hover:text-violet-600 transition-all active:scale-95"
        aria-label="Yeni rutin"
      >
        <Plus size={16} weight="bold" />
      </button>
    </div>
  );
}
