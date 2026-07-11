"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Drawer } from "vaul";
import { toast } from "react-hot-toast";
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
  type ExerciseRef,
} from "../types";
import {
  calcVolume,
  exerciseUsesWeight,
  formatPreviousSet,
  getExerciseBySlug,
  resolveExerciseName,
  showExerciseDetail,
  type ExerciseCatalogItem,
} from "../exercises";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExerciseThumbnail from "./ExerciseThumbnail";
import ExercisePicker from "./ExercisePicker";
import { saveWorkoutAction, getPreviousSetsAction } from "../actions";

export default function ActiveSessionSheet({
  open,
  onClose,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  onFinished: () => void;
}) {
  const { user } = useUser();
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousMap, setPreviousMap] = useState<Record<string, WorkoutSet[]>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state with sessionStorage when modal opens or session changes
  const loadSessionFromStorage = useCallback(() => {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveSession;
        setSession(parsed);
        const start = new Date(parsed.startedAt).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      } catch (e) {
        // ignore
      }
    } else {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadSessionFromStorage();
    }
  }, [open, loadSessionFromStorage]);

  // Keep loadSession synchronized with custom start events
  useEffect(() => {
    const handleStart = () => {
      loadSessionFromStorage();
    };
    window.addEventListener("gym_session_started", handleStart);
    return () => window.removeEventListener("gym_session_started", handleStart);
  }, [loadSessionFromStorage]);

  useEffect(() => {
    if (!session || !open) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const start = new Date(session.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, open]);

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
    // Dispatch event to let GymShell know session updated (e.g. name, sets count)
    window.dispatchEvent(new Event("gym_session_updated"));
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
      routineId: session.routineId || null,
      exercises: session.exercises,
      startedAt: session.startedAt,
      finishedAt,
      durationSeconds: elapsed,
      totalVolumeKg: volume,
    });
    
    if (result.error) {
      toast.error(`Antrenman kaydedilemedi: ${result.error}`);
      setSaving(false);
      return;
    }
    
    if (result.data) {
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      setSession(null);
      onFinished();
      onClose();
      toast.success("Antrenman başarıyla kaydedildi!");
      // Reload page state or redirect
      window.location.reload();
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

  if (!session) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(open: boolean) => !open && onClose()}>
      <Drawer.Portal>
        {/* Backdrop */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />

        {/* Drawer Container */}
        <Drawer.Content className="bg-[#FAF9F7] text-gray-900 flex flex-col fixed inset-0 outline-none z-50 max-w-xl mx-auto shadow-2xl overflow-hidden">
          
          {/* Drag handle decorator */}
          <div className="w-full bg-[#FAF9F7] pt-2 pb-1 shrink-0 flex justify-center cursor-pointer">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          <header className="bg-white border-b border-gray-200/40 shrink-0">
            <div className="flex items-center justify-between px-5 py-3.5">
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/60 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <CaretDown size={16} weight="bold" />
              </button>
              <Drawer.Title className="text-sm font-black text-gray-900 truncate max-w-[12rem]">{session.name}</Drawer.Title>
              <Drawer.Description className="sr-only">Aktif antrenman oturumu detayları.</Drawer.Description>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-500/10 disabled:opacity-50"
              >
                {saving ? "..." : "Bitir"}
              </button>
            </div>

            {/* Stats bar */}
            <div className="flex items-center justify-around px-5 pb-4 bg-white border-t border-gray-50 pt-3">
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Süre</p>
                <p className="text-sm font-black text-violet-600 tabular-nums">{formatElapsed(elapsed)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Hacim</p>
                <p className="text-sm font-black text-gray-900 tabular-nums">{volume} kg</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Setler</p>
                <p className="text-sm font-black text-gray-900 tabular-nums">{completedSets}</p>
              </div>
            </div>
          </header>

          {/* Exercises Scroll View */}
          <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
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
              className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-dashed border-gray-300 py-3.5 text-sm font-bold text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/20 transition-all active:scale-[0.99]"
            >
              <Plus size={16} weight="bold" />
              Egzersiz Ekle
            </button>
          </main>
        </Drawer.Content>
      </Drawer.Portal>

      {showAddExercise && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-[#FAF9F7] rounded-t-3xl h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 bg-white">
              <h2 className="text-sm font-black uppercase tracking-wide">Egzersiz Ekle</h2>
              <button
                onClick={() => setShowAddExercise(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200/60 text-gray-500 hover:text-gray-700"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {catalogLoading ? (
                <p className="text-center py-8 text-xs font-bold text-gray-400 animate-pulse">
                  Egzersizler yükleniyor...
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
    </Drawer.Root>
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
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div 
          onClick={() => catalogItem && showExerciseDetail(catalogItem)}
          className="flex-1 flex items-center gap-3 cursor-pointer group min-w-0"
        >
          {catalogItem ? (
            <ExerciseThumbnail exercise={catalogItem} />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-lg">🏋️</div>
          )}
          <h3 className="flex-1 text-sm font-black text-violet-600 truncate group-hover:text-violet-700 transition-colors">
            {resolveExerciseName(catalog, exercise.slug, exercise.name)}
          </h3>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <DotsThreeVertical size={18} weight="bold" />
        </button>
      </div>


      {/* Set table */}
      <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50/30">
        <div
          className={`grid ${
            usesWeight
              ? "grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem]"
              : "grid-cols-[2.5rem_1fr_4rem_2.5rem]"
          } bg-gray-50/80 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-wide`}
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
                  ? "grid-cols-[2.5rem_1fr_4rem_4rem_2.5rem]"
                  : "grid-cols-[2.5rem_1fr_4rem_2.5rem]"
              } items-center border-b border-gray-100 last:border-0 ${
                set.completed ? "bg-emerald-50/10" : setIdx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              }`}
            >
              <div className="px-2 py-2.5 text-center text-xs font-bold text-gray-500 tabular-nums">
                {setIdx + 1}
              </div>
              <div className="px-1 py-2.5 text-[10px] text-gray-400 font-bold">
                {prev ? formatPreviousSet(prev) : "—"}
              </div>
              {usesWeight && (
                <div className="px-1 py-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="—"
                    value={set.weightKg ?? ""}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^0-9.]/g, "");
                      updateSet(setIdx, "weightKg", cleanVal ? Number(cleanVal) : null);
                    }}
                    className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm"
                  />
                </div>
              )}
              <div className="px-1 py-1">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="—"
                  value={set.reps ?? ""}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "");
                    updateSet(setIdx, "reps", cleanVal ? Number(cleanVal) : null);
                  }}
                  className="w-full text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm"
                />
              </div>
              <div className="flex justify-center py-1">
                <button
                  onClick={() => toggleComplete(setIdx)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    set.completed
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
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
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-all border border-gray-200/50 flex items-center justify-center gap-1 active:scale-[0.98]"
        >
          <Plus size={14} weight="bold" />
          Set Ekle
        </button>
      </div>
    </div>
  );
}
