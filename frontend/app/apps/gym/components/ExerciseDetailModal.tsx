"use client";

import { useState, useEffect } from "react";
import { X, Trophy, Sparkle } from "@phosphor-icons/react";
import type { ExerciseCatalogItem } from "../exercises";
import { getMuscleEmoji } from "../exercises";

export default function ExerciseDetailModal({
  exercise,
  open,
  onClose,
}: {
  exercise: ExerciseCatalogItem | null;
  open: boolean;
  onClose: () => void;
}) {
  const [frameIdx, setFrameIdx] = useState(0);

  // Get animation frames (0.jpg and 1.jpg)
  const getFrames = (url: string | null) => {
    if (!url) return [];
    if (url.includes("/0.jpg")) {
      return [url, url.replace("/0.jpg", "/1.jpg")];
    }
    return [url];
  };

  const frames = exercise ? getFrames(exercise.imageUrl) : [];

  // Animate frames
  useEffect(() => {
    if (!open || frames.length < 2) return;
    const interval = setInterval(() => {
      setFrameIdx((prev) => (prev === 0 ? 1 : 0));
    }, 1000); // 1-second interval
    return () => clearInterval(interval);
  }, [open, frames]);

  if (!open || !exercise) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#FAF9F7] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-white">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">
              Egzersiz Detayı
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Animated Demonstration */}
          <div className="relative w-full aspect-square rounded-2xl bg-white border border-gray-200/60 shadow-inner overflow-hidden flex items-center justify-center group">
            {frames.length > 0 ? (
              <img
                src={frames[frameIdx]}
                alt={exercise.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="text-6xl">{getMuscleEmoji(exercise.muscleSlug)}</div>
            )}
            
            {frames.length >= 2 && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                Demonstrasyon
              </div>
            )}
          </div>

          {/* Names */}
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">{exercise.name}</h1>
            {exercise.nameEn && (
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                {exercise.nameEn}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Muscle Group */}
            <div className="bg-white border border-gray-200/60 rounded-2xl p-3.5 shadow-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                Çalışan Kas Grubu
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMuscleEmoji(exercise.muscleSlug)}</span>
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {exercise.muscleGroup}
                </span>
              </div>
            </div>

            {/* Equipment */}
            <div className="bg-white border border-gray-200/60 rounded-2xl p-3.5 shadow-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                Gerekli Ekipman
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {exercise.equipment && exercise.equipment.length > 0 ? (
                  exercise.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="text-[9px] bg-violet-50 text-violet-700 border border-violet-100 px-1.5 py-0.5 rounded font-black uppercase tracking-wider"
                    >
                      {eq}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-gray-500">—</span>
                )}
              </div>
            </div>

            {/* Difficulty */}
            {exercise.difficultyLevel && (
              <div className="bg-white border border-gray-200/60 rounded-2xl p-3.5 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  Zorluk Seviyesi
                </span>
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-500" weight="fill" />
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    {exercise.difficultyLevel}
                  </span>
                </div>
              </div>
            )}

            {/* Category */}
            {exercise.category && (
              <div className="bg-white border border-gray-200/60 rounded-2xl p-3.5 shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                  Kategori
                </span>
                <div className="flex items-center gap-1.5">
                  <Sparkle size={14} className="text-violet-500" weight="fill" />
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    {exercise.category}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
