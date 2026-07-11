"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  User as UserIcon,
} from "@phosphor-icons/react";
import GymShell from "../components/GymShell";
import { getStatsAction, getWorkoutsAction, getRoutinesAction } from "../actions";
import type { GymStats, Workout, Routine } from "../types";
import { formatDuration, getExerciseBySlug, resolveExerciseName } from "../exercises";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExerciseThumbnail from "../components/ExerciseThumbnail";
import WeeklyPlanPicker from "../components/WeeklyPlanPicker";
import EditWorkoutModal from "../components/EditWorkoutModal";

export default function GymProfilePage() {
  const { user, isLoaded } = useUser();
  const { catalog } = useExerciseCatalog();
  const [stats, setStats] = useState<GymStats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  async function loadData() {
    if (!user) return;
    try {
      setLoading(true);
      const [statsResult, workoutsResult, routinesResult] = await Promise.all([
        getStatsAction(user.id),
        getWorkoutsAction(user.id),
        getRoutinesAction(user.id),
      ]);
      if (statsResult.data) setStats(statsResult.data);
      if (workoutsResult.data) setWorkouts(workoutsResult.data);
      if (routinesResult.data) setRoutines(routinesResult.data);
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <GymShell activeTab="profile">
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </GymShell>
    );
  }

  if (!user) {
    return (
      <GymShell activeTab="profile">
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
          <UserIcon size={40} className="text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-400">Profilini görmek için giriş yap.</p>
        </div>
      </GymShell>
    );
  }

  return (
    <GymShell activeTab="profile">
      <div className="space-y-6">
        {/* Haftalık Plan */}
        <WeeklyPlanPicker userId={user.id} routines={routines} />

        {/* Recent workouts */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">Geçmiş Aktiviteler</h3>
          {workouts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
              <p className="text-xs font-bold text-gray-400">Henüz antrenman yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout) => {
                const firstEx = workout.exercises[0];
                const catalogItem = firstEx ? getExerciseBySlug(catalog, firstEx.slug) : undefined;
                const date = workout.finishedAt
                  ? new Date(workout.finishedAt).toLocaleDateString("tr-TR", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "";

                return (
                  <div
                    key={workout.id}
                    onClick={() => setSelectedWorkout(workout)}
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 hover:border-violet-300 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-gray-900">{workout.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400">{date}</p>
                    </div>
                    
                    <div className="flex gap-4 mb-3">
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Süre</p>
                        <p className="text-xs font-black text-gray-900">
                          {formatDuration(workout.durationSeconds)}
                        </p>
                      </div>
                      {workout.totalVolumeKg > 0 && (
                        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Hacim</p>
                          <p className="text-xs font-black text-gray-900">
                            {workout.totalVolumeKg} kg
                          </p>
                        </div>
                      )}
                    </div>

                    {firstEx && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/50 rounded-lg p-2 border border-gray-100/30">
                        {catalogItem ? (
                          <ExerciseThumbnail exercise={catalogItem} size="sm" />
                        ) : (
                          <span className="text-base">🏋️</span>
                        )}
                        <span className="font-medium">
                          {firstEx.sets.filter((s) => s.completed).length} set{" "}
                          {resolveExerciseName(catalog, firstEx.slug, firstEx.name)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedWorkout && (
        <EditWorkoutModal
          workout={selectedWorkout}
          open={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onUpdated={loadData}
          userId={user.id}
        />
      )}
    </GymShell>
  );
}
