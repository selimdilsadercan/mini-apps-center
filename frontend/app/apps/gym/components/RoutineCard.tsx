"use client";

import { useState } from "react";
import { DotsThree, ClipboardText } from "@phosphor-icons/react";
import type { Routine } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function RoutineCard({
  routine,
  onStart,
  onDelete,
}: {
  routine: Routine;
  onStart: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const exerciseNames = routine.exercises.map((e) => e.name).join(", ");

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-gray-900 truncate">{routine.name}</h3>
          {exerciseNames && (
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {exerciseNames}
            </p>
          )}
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
      <div className="px-4 pb-4">
        <button
          onClick={onStart}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
        >
          Rutini Başlat
        </button>
      </div>
    </div>
  );
}

export function RoutineActions({
  onNewRoutine,
}: {
  onNewRoutine: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-wider">Rutinler</h2>
      </div>
      <button
        onClick={onNewRoutine}
        className="w-full flex items-center justify-center gap-2 bg-white rounded-xl border border-gray-200/60 py-3 text-xs font-bold text-gray-700 hover:border-violet-300 hover:shadow-sm transition-all active:scale-[0.98]"
      >
        <ClipboardText size={16} weight="duotone" className="text-violet-500" />
        Yeni Rutin
      </button>
    </div>
  );
}
