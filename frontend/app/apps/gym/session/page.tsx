"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  CaretDown,
  Plus,
  Check,
  DotsThreeVertical,
  Timer,
  X,
} from "@phosphor-icons/react";
import {
  ACTIVE_SESSION_KEY,
  createEmptySet,
  createExerciseFromRef,
  type ActiveSession,
  type WorkoutExercise,
  type WorkoutSet,
} from "../types";
import { calcVolume, exerciseUsesWeight, formatPreviousSet, getExerciseBySlug, resolveExerciseName, type ExerciseCatalogItem } from "../exercises";
import ExerciseThumbnail from "../components/ExerciseThumbnail";
import { saveWorkoutAction, getPreviousSetsAction } from "../actions";
import type { ExerciseRef } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExercisePicker from "../components/ExercisePicker";

function SessionContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousMap, setPreviousMap] = useState<Record<string, WorkoutSet[]>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) {
      router.replace("/apps/gym");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ActiveSession;
      setSession(parsed);
      const start = new Date(parsed.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    } catch {
      router.replace("/apps/gym");
    }
  }, [router]);

  useEffect(() => {
    if (!session) return;
    timerRef.current = setInterval(() => {
      const start = new Date(session.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session]);

  const loadPrevious = useCallback(async (slug: string) => {
    if (!user || previousMap[slug]) return;
    const result = await getPreviousSetsAction(user.id, slug);
    if (result.data) {
      setPreviousMap((prev) => ({ ...prev, [slug]: result.data! }));
    }
  }, [user, previousMap]);

  useEffect(() => {
    if (!session || !user) return;
    for (const ex of session.exercises) {
      loadPrevious(ex.slug);
    }
  }, [session, user, loadPrevious]);

  const updateSession = (updated: ActiveSession) => {
    setSession(updated);
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updated));
  };

  const updateExercise = (idx: number, exercise: WorkoutExercise) => {
    if (!session) return;
    const exercises = [...session.exercises];
    exercises[idx] = exercise;
    updateSession({ ...session, exercises });
  };

  const addExercise = (ref: ExerciseRef) => {
    if (!session) return;
    updateSession({
      ...session,
      exercises: [...session.exercises, createExerciseFromRef(ref)],
    });
    setShowAddExercise(false);
  };

  const handleFinish = async () => {
    if (!session || !user || saving) return;
    setSaving(true);
    const finishedAt = new Date().toISOString();
    const volume = calcVolume(session.exercises);
    const result = await saveWorkoutAction(user.id, {
      name: session.name,
      routineId: session.routineId,
      exercises: session.exercises,
      startedAt: session.startedAt,
      finishedAt,
      durationSeconds: elapsed,
      totalVolumeKg: volume,
    });
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    if (result.data) {
      router.replace("/apps/gym/profile");
    } else {
      setSaving(false);
    }
  };

  const completedSets = session?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  ) ?? 0;

  const volume = session ? calcVolume(session.exercises) : 0;

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}s ${m}dk`;
    if (m > 0) return `${m}dk ${sec}s`;
    return `${sec}s`;
  };

  if (!isLoaded || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-gray-200/40">
        <div className="flex items-center gap-2 px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200/60"
          >
            <CaretDown size={14} weight="bold" className="text-violet-500" />
          </button>
          <h1 className="flex-1 text-center text-sm font-black text-gray-900">Antrenman Kaydet</h1>
          <div className="flex items-center gap-1.5">
            <Timer size={18} className="text-violet-500" />
            <button
              onClick={handleFinish}
              disabled={saving}
              className="bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "..." : "Bitir"}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-around px-4 pb-3 max-w-xl mx-auto w-full">
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Süre</p>
            <p className="text-sm font-black text-violet-500 tabular-nums">{formatElapsed(elapsed)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Hacim</p>
            <p className="text-sm font-black text-gray-900 tabular-nums">{volume} kg</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Set</p>
            <p className="text-sm font-black text-gray-900 tabular-nums">{completedSets}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-8 max-w-xl mx-auto w-full space-y-4">
        {session.exercises.map((exercise, exIdx) => (
          <ExerciseBlock
            key={`${exercise.slug}-${exIdx}`}
            exercise={exercise}
            catalog={catalog}
            previousSets={previousMap[exercise.slug] ?? []}
            onChange={(ex) => updateExercise(exIdx, ex)}
          />
        ))}

        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-bold text-gray-500 hover:border-violet-300 hover:text-violet-500 transition-all"
        >
          <Plus size={16} weight="bold" />
          Egzersiz Ekle
        </button>
      </main>

      {showAddExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-[#FAF9F7] rounded-t-3xl max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200/60">
              <h2 className="text-sm font-black uppercase">Egzersiz Ekle</h2>
              <button onClick={() => setShowAddExercise(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {catalogLoading ? (
                <p className="text-center py-8 text-xs font-bold text-gray-400 animate-pulse">
                  Yükleniyor...
                </p>
              ) : (
                <ExercisePicker
                  catalog={catalog}
                  onSelect={(ex) => addExercise({ slug: ex.slug, name: ex.name })}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseBlock({
  exercise,
  catalog,
  previousSets,
  onChange,
}: {
  exercise: WorkoutExercise;
  catalog: ExerciseCatalogItem[];
  previousSets: WorkoutSet[];
  onChange: (ex: WorkoutExercise) => void;
}) {
  const catalogItem = getExerciseBySlug(catalog, exercise.slug);
  const usesWeight = exerciseUsesWeight(catalogItem?.equipment);

  const updateSet = (setIdx: number, field: keyof WorkoutSet, value: number | boolean | null) => {
    const sets = exercise.sets.map((s, i) =>
      i === setIdx ? { ...s, [field]: value } : s
    );
    onChange({ ...exercise, sets });
  };

  const toggleComplete = (setIdx: number) => {
    const set = exercise.sets[setIdx];
    updateSet(setIdx, "completed", !set.completed);
  };

  const addSet = () => {
    onChange({ ...exercise, sets: [...exercise.sets, createEmptySet()] });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {catalogItem ? (
          <ExerciseThumbnail exercise={catalogItem} />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-lg">🏋️</div>
        )}
        <h3 className="flex-1 text-sm font-black text-violet-500">
          {resolveExerciseName(catalog, exercise.slug, exercise.name)}
        </h3>
        <button className="text-gray-400">
          <DotsThreeVertical size={18} weight="bold" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <input
          type="text"
          placeholder="Buraya not ekleyin..."
          value={exercise.note ?? ""}
          onChange={(e) => onChange({ ...exercise, note: e.target.value })}
          className="w-full text-xs text-gray-400 bg-transparent border-none outline-none placeholder:text-gray-300"
        />
      </div>

      <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
        <Timer size={12} className="text-violet-500" />
        Dinlenme: KAPALI
      </div>

      {/* Set table */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-gray-100">
        <div
          className={`grid ${
            usesWeight
              ? "grid-cols-[2rem_1fr_3.5rem_3.5rem_2rem]"
              : "grid-cols-[2rem_1fr_3.5rem_2rem]"
          } bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-wide`}
        >
          <div className="px-2 py-2 text-center">Set</div>
          <div className="px-1 py-2">Önceki</div>
          {usesWeight && <div className="px-1 py-2 text-center">Kg</div>}
          <div className="px-1 py-2 text-center">Tekrar</div>
          <div />
        </div>
        {exercise.sets.map((set, setIdx) => {
          const prev = previousSets[setIdx];
          return (
            <div
              key={setIdx}
              className={`grid ${
                usesWeight
                  ? "grid-cols-[2rem_1fr_3.5rem_3.5rem_2rem]"
                  : "grid-cols-[2rem_1fr_3.5rem_2rem]"
              } items-center ${setIdx % 2 === 0 ? "bg-white" : "bg-gray-50/80"}`}
            >
              <div className="px-2 py-2.5 text-center text-xs font-bold text-gray-500 tabular-nums">
                {setIdx + 1}
              </div>
              <div className="px-1 py-2.5 text-[10px] text-gray-400 font-medium">
                {prev ? formatPreviousSet(prev) : "—"}
              </div>
              {usesWeight && (
                <div className="px-1 py-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="—"
                    value={set.weightKg ?? ""}
                    onChange={(e) =>
                      updateSet(setIdx, "weightKg", e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full text-center text-xs font-bold bg-transparent border border-gray-200/60 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 tabular-nums"
                  />
                </div>
              )}
              <div className="px-1 py-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="—"
                  value={set.reps ?? ""}
                  onChange={(e) =>
                    updateSet(setIdx, "reps", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full text-center text-xs font-bold bg-transparent border border-gray-200/60 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 tabular-nums"
                />
              </div>
              <div className="flex justify-center py-1.5">
                <button
                  onClick={() => toggleComplete(setIdx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    set.completed
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  <Check size={14} weight="bold" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={addSet}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
        >
          <Plus size={14} weight="bold" />
          Set Ekle
        </button>
      </div>
    </div>
  );
}

export default function GymSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
