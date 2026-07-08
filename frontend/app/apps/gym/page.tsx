"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { Barbell, CaretDown } from "@phosphor-icons/react";
import GymShell from "./components/GymShell";
import RoutineCard, { RoutineActions } from "./components/RoutineCard";
import CreateRoutineModal from "./components/CreateRoutineModal";
import {
  getRoutinesAction,
  createRoutineAction,
  deleteRoutineAction,
} from "./actions";
import type { Routine, ExerciseRef, ActiveSession } from "./types";
import { ACTIVE_SESSION_KEY, createExerciseFromRef } from "./types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

export default function GymWorkoutPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { confirm } = useConfirmDialog();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadRoutines();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  async function loadRoutines() {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getRoutinesAction(user.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRoutines(result.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function startSession(name: string, routineId: string | null, exercises: ExerciseRef[]) {
    const session: ActiveSession = {
      name,
      routineId,
      exercises: exercises.map((e) => createExerciseFromRef(e)),
      startedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    router.push("/apps/gym/session");
  }

  function handleStartRoutine(routine: Routine) {
    startSession(routine.name, routine.id, routine.exercises);
  }

  async function handleCreate(name: string, exercises: ExerciseRef[]) {
    if (!user) return;
    const result = await createRoutineAction(user.id, name, exercises);
    if (result.data) {
      setRoutines((prev) => [result.data!, ...prev]);
    }
  }

  async function handleDelete(routine: Routine) {
    if (!user) return;
    const ok = await confirm({
      title: "Rutini sil?",
      description: `"${routine.name}" kalıcı olarak silinecek.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const result = await deleteRoutineAction(user.id, routine.id);
    if (result.data) {
      setRoutines((prev) => prev.filter((r) => r.id !== routine.id));
    }
  }

  if (!isLoaded || loading) {
    return (
      <GymShell activeTab="workout">
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </GymShell>
    );
  }

  if (!user) {
    return (
      <GymShell activeTab="workout">
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
          <Barbell size={40} className="text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-400">Antrenmanlarını kaydetmek için giriş yap.</p>
        </div>
      </GymShell>
    );
  }

  return (
    <GymShell activeTab="workout">
      <div className="space-y-5">
        <RoutineActions onNewRoutine={() => setShowCreate(true)} />

        {error && (
          <p className="text-red-500 text-sm font-bold text-center">{error}</p>
        )}

        <div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 text-xs font-black text-gray-500 uppercase tracking-wider mb-3"
          >
            <CaretDown
              size={12}
              weight="bold"
              className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
            />
            Rutinlerim ({routines.length})
          </button>

          {!collapsed && (
            <div className="space-y-3">
              {routines.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                  <p className="text-xs font-bold text-gray-400">Henüz rutin yok</p>
                </div>
              ) : (
                routines.map((routine) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onStart={() => handleStartRoutine(routine)}
                    onDelete={() => handleDelete(routine)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreateRoutineModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </GymShell>
  );
}
