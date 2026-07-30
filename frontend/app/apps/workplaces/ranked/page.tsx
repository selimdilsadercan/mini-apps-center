"use client";

import { Suspense } from "react";
import RankedLeaderboard from "../components/RankedLeaderboard";

function RankedSkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-4 pt-4">
      <div className="h-8 w-full max-w-md rounded-full bg-app-surface-muted" />
      <div className="h-16 rounded-2xl bg-app-surface-muted" />
      <div className="h-16 rounded-2xl bg-app-surface-muted" />
      <div className="h-16 rounded-2xl bg-app-surface-muted" />
    </div>
  );
}

export default function WorkplacesRankedPage() {
  return (
    <Suspense fallback={<RankedSkeleton />}>
      <RankedLeaderboard />
    </Suspense>
  );
}
