"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import type { standups } from "@/lib/client";
import StandupsShell from "./components/StandupsShell";
import { StandupsPageSkeleton } from "./components/StandupsSkeleton";
import ShowListItem, { type ShowWithMeta } from "./components/ShowListItem";
import ComedianDrawer from "./components/ComedianDrawer";

const client = createBrowserClient();

export default function StandupsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<ShowWithMeta[]>([]);
  const [comedians, setComedians] = useState<standups.Comedian[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComedian, setSelectedComedian] = useState<standups.Comedian | null>(null);
  const [comedianDetails, setComedianDetails] = useState<standups.ComedianDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [showsRes, comediansRes] = await Promise.all([
          client.standups.listUpcomingShows(),
          client.standups.listComedians(),
        ]);
        if (cancelled) return;
        setShows(showsRes.shows as ShowWithMeta[]);
        setComedians(comediansRes.comedians);
      } catch (err) {
        console.error("Failed to fetch standup data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleComedianClick(comedian: standups.Comedian) {
    setSelectedComedian(comedian);
    setComedianDetails(null);
    setDetailsLoading(true);
    try {
      const details = await client.standups.getComedianDetails(comedian.id);
      setComedianDetails(details);
    } catch (err) {
      console.error("Failed to fetch comedian details:", err);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeComedianDrawer() {
    setSelectedComedian(null);
    setComedianDetails(null);
    setDetailsLoading(false);
  }

  if (loading) {
    return (
      <StandupsShell onDashboard={() => router.push("/dashboard/standups")}>
        <StandupsPageSkeleton />
      </StandupsShell>
    );
  }

  return (
    <StandupsShell onDashboard={() => router.push("/dashboard/standups")}>
      <section className="mb-8">
        <h2 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] px-1 mb-4">
          Komedyenler
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
          {comedians.map((comedian) => (
            <button
              key={comedian.id}
              type="button"
              onClick={() => handleComedianClick(comedian)}
              className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            >
              <div className="w-[72px] h-[72px] rounded-2xl bg-app-surface border border-app-border overflow-hidden shadow-sm group-hover:border-[#FF9800]/50 group-active:scale-95 transition-all">
                {comedian.image_url ? (
                  <img src={comedian.image_url} alt={comedian.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-black text-app-muted">
                    {comedian.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-app-muted max-w-[72px] text-center truncate group-hover:text-app-text transition-colors">
                {comedian.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] px-1">
          Yaklaşan gösteriler
        </h2>
        {shows.length === 0 ? (
          <div className="rounded-2xl border border-app-border bg-app-surface p-8 text-center">
            <p className="text-sm font-bold text-app-muted">Yaklaşan gösteri bulunamadı.</p>
          </div>
        ) : (
          shows.map((show) => <ShowListItem key={show.id} show={show} />)
        )}
      </section>

      <ComedianDrawer
        open={!!selectedComedian}
        onClose={closeComedianDrawer}
        comedian={selectedComedian}
        details={comedianDetails}
        loading={detailsLoading}
      />
    </StandupsShell>
  );
}
