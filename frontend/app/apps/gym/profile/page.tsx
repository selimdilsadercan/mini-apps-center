"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  User as UserIcon,
} from "@phosphor-icons/react";
import GymShell from "../components/GymShell";
import { getStatsAction, getWorkoutsAction } from "../actions";
import type { GymStats, Workout } from "../types";
import { formatDuration, getExerciseBySlug, resolveExerciseName } from "../exercises";
import { useExerciseCatalog } from "../hooks/useExerciseCatalog";
import ExerciseThumbnail from "../components/ExerciseThumbnail";

export default function GymProfilePage() {
  const { user, isLoaded } = useUser();
  const { catalog } = useExerciseCatalog();
  const [stats, setStats] = useState<GymStats | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [statsResult, workoutsResult] = await Promise.all([
        getStatsAction(user.id),
        getWorkoutsAction(user.id),
      ]);
      if (statsResult.data) setStats(statsResult.data);
      if (workoutsResult.data) setWorkouts(workoutsResult.data);
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

  const username = user.username || user.firstName || "Sporcu";

  return (
    <GymShell activeTab="profile">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt=""
              className="w-12 h-12 rounded-full border-2 border-violet-200 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center font-black text-violet-500">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-sm font-black text-gray-900">{username}</h2>
            <p className="text-xs text-gray-400 font-medium">
              {stats?.weekMinutes ?? 0} dk bu hafta
            </p>
          </div>
        </div>

        {/* Stats card */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500">
              {stats?.totalWorkouts ?? 0} antrenman toplam
            </p>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Son 3 ay</span>
          </div>

          {/* Simple bar chart placeholder */}
          <div className="h-24 flex items-end gap-1">
            {workouts.slice(0, 8).reverse().map((w) => {
              const maxH = 80;
              const val = w.durationSeconds / 60;
              const maxVal = Math.max(
                ...workouts.map((wo) => wo.durationSeconds / 60),
                1
              );
              const h = Math.max(4, (val / maxVal) * maxH);
              return (
                <div key={w.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-violet-500 rounded-t-md transition-all"
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
            {workouts.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-[10px] text-gray-300 font-bold">
                Henüz veri yok
              </div>
            )}
          </div>
        </div>

        {/* Recent workouts */}
        <div>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Antrenman</h3>
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
                    className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-black text-violet-500">
                          {username.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{username}</p>
                        <p className="text-[10px] text-gray-400">{date}</p>
                      </div>
                    </div>
                    <h4 className="text-sm font-black text-gray-900 mb-2">{workout.name}</h4>
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mb-2">
                      <p className="text-[10px] text-gray-400 font-bold">Süre</p>
                      <p className="text-xs font-black text-gray-900">
                        {formatDuration(workout.durationSeconds)}
                      </p>
                    </div>
                    {firstEx && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
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
    </GymShell>
  );
}
