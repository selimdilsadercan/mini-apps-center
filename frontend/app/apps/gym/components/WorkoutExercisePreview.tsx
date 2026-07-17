"use client";

import { useEffect, useRef, useState } from "react";
import {
  getExerciseBySlug,
  resolveExerciseName,
  showExerciseDetail,
  type ExerciseCatalogItem,
} from "../exercises";
import type { WorkoutExercise } from "../types";
import ExerciseThumbnail from "./ExerciseThumbnail";

const THUMB_SIZE = 40;
const GAP = 8;

function calcMaxVisible(width: number, total: number): number {
  if (total === 0) return 0;

  const allFit = total * THUMB_SIZE + (total - 1) * GAP <= width;
  if (allFit) return total;

  for (let visible = total - 1; visible >= 1; visible--) {
    const rowWidth = (visible + 1) * THUMB_SIZE + visible * GAP;
    if (rowWidth <= width) return visible;
  }

  return 1;
}

export default function WorkoutExercisePreview({
  exercises,
  catalog,
}: {
  exercises: WorkoutExercise[];
  catalog: ExerciseCatalogItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(exercises.length);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setMaxVisible(calcMaxVisible(container.clientWidth, exercises.length));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [exercises.length]);

  if (exercises.length === 0) return null;

  const visible = exercises.slice(0, maxVisible);
  const remaining = exercises.length - maxVisible;

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 overflow-hidden bg-app-surface-muted/50 rounded-lg p-2 border border-app-border"
    >
      {visible.map((ex, idx) => {
        const item = getExerciseBySlug(catalog, ex.slug);
        return (
          <div
            key={`${ex.slug}-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              if (item) showExerciseDetail(item);
            }}
            className={`shrink-0 transition-transform active:scale-95 ${
              item ? "cursor-pointer" : ""
            }`}
            title={resolveExerciseName(catalog, ex.slug, ex.name)}
          >
            {item ? (
              <ExerciseThumbnail exercise={item} size="sm" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-[10px] shrink-0">
                🏋️
              </div>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <div
          className="w-10 h-10 rounded-lg bg-app-surface border border-app-border flex items-center justify-center shrink-0 text-[10px] font-black text-app-muted"
          title={`${remaining} egzersiz daha`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
