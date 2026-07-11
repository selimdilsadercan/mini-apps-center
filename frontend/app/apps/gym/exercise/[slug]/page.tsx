"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaretLeft, Trophy, Sparkle } from "@phosphor-icons/react";
import { useExerciseCatalog } from "../../hooks/useExerciseCatalog";
import { getExerciseBySlug, getMuscleEmoji } from "../../exercises";
import ExerciseThumbnail from "../../components/ExerciseThumbnail";

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { catalog, loading, error } = useExerciseCatalog();
  const [frameIdx, setFrameIdx] = useState(0);

  const exercise = catalog ? getExerciseBySlug(catalog, slug) : null;

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
    if (frames.length < 2) return;
    const interval = setInterval(() => {
      setFrameIdx((prev) => (prev === 0 ? 1 : 0));
    }, 1000); // 1-second interval
    return () => clearInterval(interval);
  }, [frames]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center">
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
          Egzersiz Detayı Yükleniyor...
        </p>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-bold text-red-500 mb-4">Egzersiz bulunamadı.</p>
        <button
          onClick={() => router.back()}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700 shadow-sm"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 pb-12">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200/60 px-4 py-4 flex items-center gap-3 z-10">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200/60 text-gray-600 active:scale-95 transition-all"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-wide">Egzersiz Detayı</h1>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Animated Demonstration */}
        <div className="relative w-full aspect-square rounded-3xl bg-white border border-gray-200/60 shadow-sm overflow-hidden flex items-center justify-center group">
          {frames.length > 0 ? (
            <img
              src={frames[frameIdx]}
              alt={exercise.name}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="text-7xl">{getMuscleEmoji(exercise.muscleSlug)}</div>
          )}

          {frames.length >= 2 && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              Demonstrasyon
            </div>
          )}
        </div>

        {/* Names */}
        <div className="bg-white rounded-3xl border border-gray-200/60 p-5 shadow-sm space-y-1">
          <h2 className="text-xl font-black tracking-tight text-gray-900">{exercise.name}</h2>
          {exercise.nameEn && (
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {exercise.nameEn}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Muscle Group */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-4 shadow-sm space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Çalışan Kas Grubu
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getMuscleEmoji(exercise.muscleSlug)}</span>
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                {exercise.muscleGroup}
              </span>
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-white border border-gray-200/60 rounded-3xl p-4 shadow-sm space-y-2">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
              Gerekli Ekipman
            </span>
            <div className="flex flex-wrap gap-1">
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
            <div className="bg-white border border-gray-200/60 rounded-3xl p-4 shadow-sm space-y-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                Zorluk Seviyesi
              </span>
              <div className="flex items-center gap-1.5">
                <Trophy size={16} className="text-amber-500" weight="fill" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {exercise.difficultyLevel}
                </span>
              </div>
            </div>
          )}

          {/* Category */}
          {exercise.category && (
            <div className="bg-white border border-gray-200/60 rounded-3xl p-4 shadow-sm space-y-2">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                Kategori
              </span>
              <div className="flex items-center gap-1.5">
                <Sparkle size={16} className="text-violet-500" weight="fill" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {exercise.category}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
