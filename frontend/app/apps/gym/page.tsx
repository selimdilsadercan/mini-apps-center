"use client";

import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Barbell, Plus } from "@phosphor-icons/react";
import GymShell from "./components/GymShell";
import RoutineCard from "./components/RoutineCard";
import CreateRoutineModal from "./components/CreateRoutineModal";
import {
  createRoutineAction,
  deleteRoutineAction,
} from "./actions";
import type { Routine, ExerciseRef } from "./types";
import { startGymSession } from "./types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  GYM_STALE_TIME,
  fetchGymRoutines,
  gymRoutinesKey,
  removeRoutineFromCache,
  clearRoutineFromWeeklyPlanCache,
  syncGymDiscoverWidgets,
  syncRoutineInWeeklyPlanCache,
  upsertRoutineInCache,
} from "@/lib/gymCache";

export default function GymWorkoutPage() {
  const { user, isLoaded } = useUser();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const {
    data: routines = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: gymRoutinesKey(user?.id ?? ""),
    queryFn: () => fetchGymRoutines(user!.id),
    enabled: isLoaded && !!user?.id,
    staleTime: GYM_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  function handleStartRoutine(routine: Routine) {
    startGymSession(routine.name, routine.id, routine.exercises);
    window.dispatchEvent(new Event("gym_session_started"));
  }

  async function handleCreate(name: string, exercises: ExerciseRef[]) {
    if (!user) return;
    const result = await createRoutineAction(user.id, name, exercises);
    if (result.data) {
      upsertRoutineInCache(queryClient, user.id, result.data);
      syncGymDiscoverWidgets(queryClient, user.id);
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
      removeRoutineFromCache(queryClient, user.id, routine.id);
      clearRoutineFromWeeklyPlanCache(queryClient, user.id, routine.id);
      syncGymDiscoverWidgets(queryClient, user.id);
    }
  }

  function handleRoutineUpdated(updated: Routine) {
    if (!user) return;
    upsertRoutineInCache(queryClient, user.id, updated);
    syncRoutineInWeeklyPlanCache(queryClient, user.id, updated);
    syncGymDiscoverWidgets(queryClient, user.id);
  }

  if (!isLoaded || (isLoading && routines.length === 0)) {
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
          <p className="text-red-500 text-sm font-bold text-center">{error.message}</p>
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
              onUpdated={handleRoutineUpdated}
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
