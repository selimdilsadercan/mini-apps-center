"use client";

import Link from "next/link";
import { ArrowRight, CalendarStar } from "@phosphor-icons/react";
import type { kim_gelir } from "@/lib/client";
import { PLAN_OPEN_LOCATION, PLAN_OPEN_TIME } from "../lib/theme";

function planSubtitle(activity: kim_gelir.Activity): string {
  const parts: string[] = [];
  if (activity.location && activity.location !== PLAN_OPEN_LOCATION) {
    parts.push(activity.location);
  } else if (activity.location === PLAN_OPEN_LOCATION) {
    parts.push("Yer açık");
  }
  if (activity.timeOption && activity.timeOption !== PLAN_OPEN_TIME) {
    parts.push(
      activity.customTime
        ? `${activity.timeOption} · ${activity.customTime}`
        : activity.timeOption
    );
  } else if (activity.timeOption === PLAN_OPEN_TIME) {
    parts.push("Zaman açık");
  }
  return parts.join(" · ") || "Detayları gör";
}

export function ActivePlanRow({
  activity,
  currentUserId,
  compact = true,
}: {
  activity: kim_gelir.Activity;
  currentUserId?: string;
  compact?: boolean;
}) {
  const isMine = activity.creatorId === currentUserId;
  const myStatus = activity.responses.find((r) => r.userId === currentUserId)?.status;
  const goingCount = activity.responses.filter((r) => r.status === "gelirim").length;

  return (
    <Link
      href={`/apps/kim-gelir/plan/${activity.id}`}
      className={`group flex items-center gap-3 transition-all active:scale-[0.99] ${
        compact
          ? "px-4 py-3 hover:bg-app-surface-muted/40"
          : "p-3 rounded-2xl border border-app-border bg-app-surface hover:border-app-muted/50"
      }`}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-app-surface-muted border border-app-border text-app-muted">
        <CalendarStar size={16} weight="duotone" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black text-app-text truncate">{activity.title}</p>
        <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
          {planSubtitle(activity)}
          {goingCount > 0 && ` · ${goingCount} geliyor`}
        </p>
        {isMine && (
          <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5 text-app-muted">
            Senin planın
          </p>
        )}
        {!isMine && myStatus && myStatus !== "bekliyor" && (
          <p className="text-[8px] font-bold uppercase tracking-wide mt-0.5 text-app-muted">
            {myStatus === "gelirim" ? "Geliyorsun" : myStatus === "belki" ? "Belki" : "Gelemiyorsun"}
          </p>
        )}
      </div>
      <ArrowRight
        size={14}
        weight="bold"
        className="shrink-0 text-app-muted group-hover:text-app-text group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}

export function isActivePlan(activity: kim_gelir.Activity): boolean {
  if (!activity.expiresAt) return true;
  return new Date(activity.expiresAt).getTime() > Date.now();
}
