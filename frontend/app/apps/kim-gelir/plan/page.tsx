"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, Spinner } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import type { kim_gelir } from "@/lib/client";
import { ActivityCard } from "../components/ActivityCard";
import { useMarasSources } from "../hooks/useMarasSources";
import { NE_YAPSAK_ACCENT } from "../lib/theme";

const client = createBrowserClient();

function PlanDetailContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");
  const maras = useMarasSources(user?.id);

  const [activity, setActivity] = useState<kim_gelir.Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!user || !planId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.kim_gelir.getActivities(user.id);
      const found = res.activities.find((a) => a.id === planId) ?? null;
      setActivity(found);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, planId]);

  useEffect(() => {
    if (isLoaded) fetchPlan();
  }, [isLoaded, fetchPlan]);

  const handleRespond = async (activityId: string, status: string, selectedOptions: string[]) => {
    if (!user || !activity) return;
    try {
      setActionLoading(activityId);
      await client.kim_gelir.respondToActivity({
        activityId,
        userId: user.id,
        status,
        selectedOptions,
      });
      setActivity((prev) => {
        if (!prev) return prev;
        const updated = prev.responses.map((resp) =>
          resp.userId === user.id ? { ...resp, status: status as any, selectedOptions } : resp
        );
        if (!updated.some((r) => r.userId === user.id)) {
          updated.push({
            userId: user.id,
            username: user.username || user.fullName || "Ben",
            avatar: user.imageUrl || null,
            status: status as any,
            selectedOptions,
            updatedAt: new Date().toISOString(),
          });
        }
        return { ...prev, responses: updated };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddOption = async (activityId: string, optionText: string) => {
    if (!user) return;
    try {
      setActionLoading(`add-option-${activityId}`);
      await client.kim_gelir.addActivityOption({ activityId, option: optionText.trim() });
      await fetchPlan();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
        <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border/60">
          <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex items-center gap-2">
            <button
              onClick={() => router.push("/apps/kim-gelir")}
              className="shrink-0 flex items-center justify-center w-8 h-8 bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />
            </button>
            <h1 className="font-black text-base text-app-text">Plan Detayı</h1>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-app-muted text-sm">Plan bulunamadı.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text pb-24">
      <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex items-center gap-2">
          <button
            onClick={() => router.push("/apps/kim-gelir")}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />
          </button>
          <h1 className="font-black text-base text-app-text">Plan Detayı</h1>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-xl mx-auto w-full pt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={28} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
          </div>
        ) : !activity ? (
          <p className="text-center text-app-muted text-sm py-20">Plan bulunamadı.</p>
        ) : (
          <ActivityCard
            activity={activity}
            currentUserId={user.id}
            maras={maras}
            onRespond={handleRespond}
            onAddOption={handleAddOption}
            actionLoading={actionLoading}
          />
        )}
      </main>
    </div>
  );
}

export default function PlanDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-app-bg">
          <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
        </div>
      }
    >
      <PlanDetailContent />
    </Suspense>
  );
}
