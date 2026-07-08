"use client";

import { getExerciseEmoji, type ExerciseCatalogItem } from "../exercises";

export default function ExerciseThumbnail({
  exercise,
  size = "md",
}: {
  exercise: Pick<ExerciseCatalogItem, "name" | "muscleSlug" | "imageUrl">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm" ? "w-10 h-10 rounded-lg" : size === "lg" ? "w-14 h-14 rounded-xl" : "w-11 h-11 rounded-xl";

  if (exercise.imageUrl) {
    return (
      <img
        src={exercise.imageUrl}
        alt={exercise.name}
        className={`${sizeClass} object-cover bg-gray-100 border border-gray-200/60 shrink-0`}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 text-lg`}
    >
      {getExerciseEmoji(exercise)}
    </div>
  );
}
