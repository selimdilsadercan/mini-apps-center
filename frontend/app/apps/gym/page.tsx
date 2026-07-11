"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Barbell, Plus } from "@phosphor-icons/react";
import GymShell from "./components/GymShell";
import RoutineCard from "./components/RoutineCard";
import CreateRoutineModal from "./components/CreateRoutineModal";
import {
  getRoutinesAction,
  createRoutineAction,
  deleteRoutineAction,
} from "./actions";
import type { Routine, ExerciseRef } from "./types";
import { startGymSession } from "./types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

export default function GymWorkoutPage() {
  const { user, isLoaded } = useUser();
  const { confirm } = useConfirmDialog();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

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

  function handleStartRoutine(routine: Routine) {
    startGymSession(routine.name, routine.id, routine.exercises);
    window.dispatchEvent(new Event("gym_session_started"));
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
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-dashed border-gray-300 hover:border-violet-300 hover:text-violet-600 py-3.5 text-sm font-bold text-gray-500 transition-all active:scale-[0.99] shadow-sm"
        >
          <Plus size={16} weight="bold" className="text-violet-500" />
          Rutin Oluştur
        </button>

        {error && (
          <p className="text-red-500 text-sm font-bold text-center">{error}</p>
        )}

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
              onUpdated={(updated) =>
                setRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
              }
              userId={user.id}
            />
          ))
        )}
      </div>

      <CreateRoutineModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </GymShell>
  );
}
