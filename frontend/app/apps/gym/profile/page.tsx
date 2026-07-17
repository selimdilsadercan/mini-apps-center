"use client";

import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon } from "@phosphor-icons/react";
import GymShell from "../components/GymShell";
import type { Workout } from "../types";
import { formatDuration } from "../exercises";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import WorkoutExercisePreview from "../components/WorkoutExercisePreview";
import WeeklyPlanPicker from "../components/WeeklyPlanPicker";
import WorkoutHistoryCalendar from "../components/WorkoutHistoryCalendar";
import EditWorkoutModal from "../components/EditWorkoutModal";
import {
  GYM_STALE_TIME,
  fetchGymRoutines,
  fetchGymStats,
  fetchGymWorkouts,
  gymRoutinesKey,
  gymStatsKey,
  gymWorkoutsKey,
} from "@/lib/cache/gymCache";

export default function GymProfilePage() {
  const { user, isLoaded } = useUser();
  const { catalog } = useExerciseCatalog();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const routinesQuery = useQuery({
    queryKey: gymRoutinesKey(user?.id ?? ""),
    queryFn: () => fetchGymRoutines(user!.id),
    enabled: isLoaded && !!user?.id,
    staleTime: GYM_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  const workoutsQuery = useQuery({
    queryKey: gymWorkoutsKey(user?.id ?? ""),
    queryFn: () => fetchGymWorkouts(user!.id),
    enabled: isLoaded && !!user?.id,
    staleTime: GYM_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  useQuery({
    queryKey: gymStatsKey(user?.id ?? ""),
    queryFn: () => fetchGymStats(user!.id),
    enabled: isLoaded && !!user?.id,
    staleTime: GYM_STALE_TIME,
    refetchOnWindowFocus: true,
  });

  const routines = routinesQuery.data ?? [];
  const workouts = workoutsQuery.data ?? [];
  const loading =
    isLoaded &&
    !!user?.id &&
    routinesQuery.isLoading &&
    workoutsQuery.isLoading &&
    routines.length === 0 &&
    workouts.length === 0;

  if (!isLoaded || loading) {
    return (
      <GymShell activeTab="profile">
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </GymShell>
    );
  }

  if (!user) {
    return (
      <GymShell activeTab="profile">
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
          <UserIcon size={40} className="text-app-muted mb-4" weight="duotone" />
          <p className="text-sm font-bold text-app-muted">Profilini görmek için giriş yap.</p>
        </div>
      </GymShell>
    );
  }

  return (
    <GymShell activeTab="profile">
      <div className="space-y-6">
        <WeeklyPlanPicker userId={user.id} routines={routines} />

        <WorkoutHistoryCalendar workouts={workouts} />

        <div className="space-y-2.5">
          <h3 className="text-xs font-black text-app-muted uppercase tracking-wider">Geçmiş Aktiviteler</h3>
          {workouts.length === 0 ? (
            <div className="text-center py-8 bg-app-surface rounded-2xl border border-app-border shadow-sm">
              <p className="text-xs font-bold text-app-muted">Henüz antrenman yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.slice(0, 5).map((workout) => {
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
                    className="bg-app-surface rounded-2xl border border-app-border shadow-sm p-4 cursor-pointer hover:bg-app-surface-muted/40 transition-colors active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-black text-app-text">{workout.name}</h4>
                      <p className="text-[10px] font-bold text-app-muted">{date}</p>
                    </div>

                    <div className="flex gap-4 mb-3">
                      <div className="flex-1 bg-app-surface-muted rounded-xl px-3 py-2">
                        <p className="text-[9px] text-app-muted font-bold uppercase tracking-wider">Süre</p>
                        <p className="text-xs font-black text-app-text">
                          {formatDuration(workout.durationSeconds)}
                        </p>
                      </div>
                      {workout.totalVolumeKg > 0 && (
                        <div className="flex-1 bg-app-surface-muted rounded-xl px-3 py-2">
                          <p className="text-[9px] text-app-muted font-bold uppercase tracking-wider">Hacim</p>
                          <p className="text-xs font-black text-app-text">
                            {workout.totalVolumeKg} kg
                          </p>
                        </div>
                      )}
                    </div>

                    <WorkoutExercisePreview exercises={workout.exercises} catalog={catalog} />
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
          onUpdated={(updated) => {
            setSelectedWorkout(updated);
          }}
          userId={user.id}
        />
      )}
    </GymShell>
  );
}
