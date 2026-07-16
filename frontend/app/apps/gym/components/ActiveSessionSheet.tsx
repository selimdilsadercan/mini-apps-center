"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { Drawer } from "vaul";
import { toast } from "react-hot-toast";
import {
  CaretDown,
  Plus,
  X,
} from "@phosphor-icons/react";
import {
  ACTIVE_SESSION_KEY,
  createExerciseFromRef,
  getActiveSessionElapsed,
  buildActiveSessionFinishedAt,
  type ActiveSession,
  type WorkoutExercise,
  type WorkoutSet,
  type ExerciseRef,
} from "../types";
import { calcVolume } from "../exercises";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExercisePicker from "./ExercisePicker";
import SessionStatsEditSheet, { SessionStatsBar } from "./SessionStatsEditSheet";
import ExerciseBlock from "./ExerciseBlock";
import { saveWorkoutAction, getPreviousSetsAction } from "../actions";
import { invalidateGymStats, prependWorkoutToCache, syncTodayGymCompletionInDiscoverCache, syncGymDiscoverWidgets } from "@/lib/cache/gymCache";

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
  const queryClient = useQueryClient();
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousMap, setPreviousMap] = useState<Record<string, WorkoutSet[]>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showStatsEditor, setShowStatsEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync state with sessionStorage when modal opens or session changes
  const loadSessionFromStorage = useCallback(() => {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveSession;
        setSession(parsed);
        setElapsed(getActiveSessionElapsed(parsed));
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

    if (session.manualDurationSeconds != null) {
      setElapsed(session.manualDurationSeconds);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      timerRef.current = setInterval(() => {
        setElapsed(getActiveSessionElapsed(session));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.startedAt, session?.manualDurationSeconds, open]);

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
    const durationSeconds = session.manualDurationSeconds ?? elapsed;
    const finishedAt = buildActiveSessionFinishedAt(session.startedAt, durationSeconds);
    const volume = calcVolume(session.exercises);
    const result = await saveWorkoutAction(user.id, {
      name: session.name,
      routineId: session.routineId || null,
      exercises: session.exercises,
      startedAt: session.startedAt,
      finishedAt,
      durationSeconds,
      totalVolumeKg: volume,
    });
    
    if (result.error) {
      toast.error(`Antrenman kaydedilemedi: ${result.error}`);
      setSaving(false);
      return;
    }
    
    if (result.data) {
      prependWorkoutToCache(queryClient, user.id, result.data);
      invalidateGymStats(queryClient, user.id);
      syncTodayGymCompletionInDiscoverCache(queryClient, user.id, result.data);
      syncGymDiscoverWidgets(queryClient, user.id);
      sessionStorage.removeItem(ACTIVE_SESSION_KEY);
      setSession(null);
      onFinished();
      onClose();
      toast.success("Antrenman başarıyla kaydedildi!");
    } else {
      setSaving(false);
    }
  };

  const completedSets = session?.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  ) ?? 0;

  const volume = session ? calcVolume(session.exercises) : 0;

  const handleStatsSave = (startedAt: string, durationSeconds: number) => {
    if (!session) return;
    const updated: ActiveSession = {
      ...session,
      startedAt,
      manualDurationSeconds: durationSeconds,
    };
    updateSession(updated);
    setElapsed(durationSeconds);
  };

  if (!session) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(open: boolean) => !open && onClose()}>
      <Drawer.Portal>
        {/* Backdrop */}
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" />

        {/* Drawer Container */}
        <Drawer.Content className="bg-app-bg text-app-text flex flex-col fixed inset-0 outline-none z-50 max-w-xl mx-auto shadow-2xl overflow-hidden">
          
          {/* Drag handle decorator */}
          <div className="w-full bg-app-bg pt-2 pb-1 shrink-0 flex justify-center cursor-pointer">
            <div className="w-12 h-1.5 bg-app-border rounded-full" />
          </div>

          {/* Header */}
          <header className="bg-app-surface border-b border-app-border shrink-0">
            <div className="flex items-center justify-between px-5 py-3.5">
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-app-surface-muted hover:bg-app-border/30 rounded-xl border border-app-border text-app-muted hover:text-app-text transition-colors"
              >
                <CaretDown size={16} weight="bold" />
              </button>
              <Drawer.Title className="text-sm font-black text-app-text truncate max-w-[12rem]">{session.name}</Drawer.Title>
              <Drawer.Description className="sr-only">Aktif antrenman oturumu detayları.</Drawer.Description>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-violet-500/10 disabled:opacity-50"
              >
                {saving ? "..." : "Bitir"}
              </button>
            </div>

            <SessionStatsBar
              elapsed={elapsed}
              volume={volume}
              completedSets={completedSets}
              onEditDuration={() => setShowStatsEditor(true)}
            />
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
                variant="sheet"
              />
            ))}

            <button
              onClick={() => setShowAddExercise(true)}
              className="w-full flex items-center justify-center gap-2 bg-app-surface rounded-2xl border border-dashed border-app-border py-3.5 text-sm font-bold text-app-muted hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/20 dark:hover:bg-violet-950/20 transition-all active:scale-[0.99]"
            >
              <Plus size={16} weight="bold" />
              Egzersiz Ekle
            </button>
          </main>
        </Drawer.Content>
      </Drawer.Portal>

      {showStatsEditor && session && (
        <SessionStatsEditSheet
          open={showStatsEditor}
          onClose={() => setShowStatsEditor(false)}
          startedAt={session.startedAt}
          elapsed={elapsed}
          onSave={handleStatsSave}
        />
      )}

      {showAddExercise && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-app-border bg-app-surface">
              <h2 className="text-sm font-black uppercase tracking-wide">Egzersiz Ekle</h2>
              <button
                onClick={() => setShowAddExercise(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-muted hover:text-app-text"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {catalogLoading ? (
                <p className="text-center py-8 text-xs font-bold text-app-muted animate-pulse">
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
