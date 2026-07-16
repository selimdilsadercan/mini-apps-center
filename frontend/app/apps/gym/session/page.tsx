"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "../types";
import { calcVolume } from "../exercises";
import { saveWorkoutAction, getPreviousSetsAction } from "../actions";
import { invalidateGymStats, prependWorkoutToCache, syncTodayGymCompletionInDiscoverCache, syncGymDiscoverWidgets } from "@/lib/gymCache";
import type { ExerciseRef } from "../types";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExercisePicker from "../components/ExercisePicker";
import SessionStatsEditSheet, { SessionStatsBar } from "../components/SessionStatsEditSheet";
import ExerciseBlock from "../components/ExerciseBlock";

function SessionContent() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const queryClient = useQueryClient();
  const { catalog, loading: catalogLoading } = useExerciseCatalog();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousMap, setPreviousMap] = useState<Record<string, WorkoutSet[]>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showStatsEditor, setShowStatsEditor] = useState(false);
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
      setElapsed(getActiveSessionElapsed(parsed));
    } catch {
      router.replace("/apps/gym");
    }
  }, [router]);

  useEffect(() => {
    if (!session) return;
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
  }, [session?.startedAt, session?.manualDurationSeconds]);

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
    const durationSeconds = session.manualDurationSeconds ?? elapsed;
    const finishedAt = buildActiveSessionFinishedAt(session.startedAt, durationSeconds);
    const volume = calcVolume(session.exercises);
    const result = await saveWorkoutAction(user.id, {
      name: session.name,
      routineId: session.routineId,
      exercises: session.exercises,
      startedAt: session.startedAt,
      finishedAt,
      durationSeconds,
      totalVolumeKg: volume,
    });
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    if (result.data) {
      prependWorkoutToCache(queryClient, user.id, result.data);
      invalidateGymStats(queryClient, user.id);
      syncTodayGymCompletionInDiscoverCache(queryClient, user.id, result.data);
      syncGymDiscoverWidgets(queryClient, user.id);
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

  if (!isLoaded || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
      {/* Header */}
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="flex items-center gap-2 px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="shrink-0 w-8 h-8 flex items-center justify-center bg-app-surface rounded-lg border border-app-border"
          >
            <CaretDown size={14} weight="bold" className="text-violet-500" />
          </button>
          <h1 className="flex-1 text-center text-sm font-black text-app-text">Antrenman Kaydet</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFinish}
              disabled={saving}
              className="bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "..." : "Bitir"}
            </button>
          </div>
        </div>

        <SessionStatsBar
          elapsed={elapsed}
          volume={volume}
          completedSets={completedSets}
          onEditDuration={() => setShowStatsEditor(true)}
          durationAccent="violet-500"
        />
      </header>

      <main className="flex-1 px-4 py-4 pb-8 max-w-xl mx-auto w-full space-y-4">
        {session.exercises.map((exercise, exIdx) => (
          <ExerciseBlock
            key={`${exercise.slug}-${exIdx}`}
            exercise={exercise}
            catalog={catalog}
            previousSets={previousMap[exercise.slug] ?? []}
            onChange={(ex) => updateExercise(exIdx, ex)}
            variant="page"
          />
        ))}

        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full flex items-center justify-center gap-2 bg-app-surface rounded-2xl border border-dashed border-app-border py-3 text-sm font-bold text-app-muted hover:border-violet-300 hover:text-violet-500 transition-all"
        >
          <Plus size={16} weight="bold" />
          Egzersiz Ekle
        </button>
      </main>

      {showStatsEditor && (
        <SessionStatsEditSheet
          open={showStatsEditor}
          onClose={() => setShowStatsEditor(false)}
          startedAt={session.startedAt}
          elapsed={elapsed}
          onSave={handleStatsSave}
        />
      )}

      {showAddExercise && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddExercise(false)} />
          <div className="relative w-full max-w-xl bg-app-bg rounded-t-3xl max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-app-border">
              <h2 className="text-sm font-black uppercase">Egzersiz Ekle</h2>
              <button onClick={() => setShowAddExercise(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-app-surface border border-app-border">
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {catalogLoading ? (
                <p className="text-center py-8 text-xs font-bold text-app-muted animate-pulse">
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

export default function GymSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-app-bg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
