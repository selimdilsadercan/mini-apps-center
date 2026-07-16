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
    <div className="bg-app-surface rounded-2xl border border-app-border shadow-sm overflow-hidden hover:border-app-muted/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-app-text truncate">{routine.name}</h3>
          <p className="text-[10px] text-app-muted mt-0.5 font-bold uppercase tracking-wider">
            {routine.exercises.length} Egzersiz
          </p>
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button className="shrink-0 w-8 h-8 flex items-center justify-center text-app-muted hover:text-app-text rounded-lg hover:bg-app-surface-muted transition-all cursor-pointer">
              <DotsThree size={20} weight="bold" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              Rutini Sil
            </button>
          </PopoverContent>
        </Popover>
      </div>

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
                <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center text-[10px] text-app-muted font-bold shrink-0">
                  🏋️
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-4 pt-1 flex gap-2">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="flex-1 bg-app-surface-muted hover:bg-app-border/30 active:scale-[0.98] text-app-text font-bold text-xs py-2.5 rounded-xl transition-all border border-app-border flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PencilSimple size={16} weight="bold" />
          Düzenle
        </button>
        <button
          type="button"
          onClick={onStart}
          className="flex-1 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-950/60 active:scale-[0.98] text-violet-700 dark:text-violet-300 font-bold text-xs py-2.5 rounded-xl transition-all border border-violet-100 dark:border-violet-900/50 flex items-center justify-center gap-1.5 cursor-pointer"
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
      <h2 className="text-xs font-black text-app-muted uppercase tracking-wider">Rutinler</h2>
      <button
        type="button"
        onClick={onNewRoutine}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-app-surface border border-app-border text-app-text hover:border-violet-300 hover:text-violet-600 transition-all active:scale-95 cursor-pointer"
        aria-label="Yeni rutin"
      >
        <Plus size={16} weight="bold" />
      </button>
    </div>
  );
}
