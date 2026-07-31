"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, Plus, Sparkle, Spinner, TrendUp } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import type { kim_gelir } from "@/lib/client";
import { PlanCard } from "./components/PlanCard";
import { NE_YAPSAK_ACCENT } from "./lib/theme";

const client = createBrowserClient();

function KimGelirHome() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activities, setActivities] = useState<kim_gelir.Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await client.kim_gelir.getActivities(user.id);
      setActivities(res.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) fetchActivities();
  }, [isLoaded, fetchActivities]);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setToast("Plan paylaşıldı!");
      fetchActivities();
      router.replace("/apps/kim-gelir");
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router, fetchActivities]);

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
        </main>
      </div>
    );
  }

  const myActivities = activities.filter((a) => a.creatorId === user.id);
  const invitedActivities = activities.filter((a) => a.creatorId !== user.id);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text pb-24">
      <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => router.push(getAppRootUrl())}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
                aria-label="Geri"
              >
                <CaretLeft size={14} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />
              </button>
              <h1 className="min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
                <Sparkle size={18} weight="fill" className="shrink-0" style={{ color: NE_YAPSAK_ACCENT }} />
                <span className="truncate">
                  Ne <span style={{ color: NE_YAPSAK_ACCENT }}>Yapsak?</span>
                </span>
              </h1>
            </div>
            <button
              type="button"
              onClick={() => router.push("/apps/kim-gelir/create")}
              className="shrink-0 text-white text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer hover:opacity-90"
              style={{ backgroundColor: NE_YAPSAK_ACCENT }}
            >
              <Plus size={12} weight="bold" />
              <span>Planla</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-xl mx-auto w-full pt-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size={28} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
          </div>
        ) : (
          <>
            {invitedActivities.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <TrendUp size={14} style={{ color: NE_YAPSAK_ACCENT }} weight="bold" />
                  <h2 className="font-black text-app-text text-[11px] uppercase tracking-[0.14em]">
                    Gelen Planlar
                  </h2>
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${NE_YAPSAK_ACCENT}14`, color: NE_YAPSAK_ACCENT }}
                  >
                    {invitedActivities.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {invitedActivities.map((act) => (
                    <PlanCard key={act.id} activity={act} currentUserId={user.id} />
                  ))}
                </div>
              </section>
            )}

            {myActivities.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkle size={14} className="text-amber-500" weight="bold" />
                  <h2 className="font-black text-app-text text-[11px] uppercase tracking-[0.14em]">
                    Benim Planlarım
                  </h2>
                  <span className="bg-amber-500/10 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {myActivities.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {myActivities.map((act) => (
                    <PlanCard key={act.id} activity={act} currentUserId={user.id} />
                  ))}
                </div>
              </section>
            )}

            {activities.length === 0 && (
              <p className="text-center text-app-muted text-[11px] font-medium py-16">
                Henüz plan yok — sağ üstten Planla ile başla.
              </p>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className="p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KimGelirPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-app-bg">
          <main className="flex-1 flex items-center justify-center">
            <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
          </main>
        </div>
      }
    >
      <KimGelirHome />
    </Suspense>
  );
}
