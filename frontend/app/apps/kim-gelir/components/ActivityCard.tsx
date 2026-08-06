"use client";

import { Check, Question, SignOut, Spinner, Trash, X } from "@phosphor-icons/react";
import type { kim_gelir } from "@/lib/client";
import {
  AXIS_META,
  formatWhenFixed,
  getAxisPollItems,
  whatIsOpen,
  whenIsOpen,
  whereIsOpen,
} from "../lib/plan-poll";
import { PlanAxisSection } from "./PlanAxisSection";
import { PlanParticipants } from "./PlanParticipants";
import type { useMarasSources } from "../hooks/useMarasSources";
import { inferActivityContext } from "../lib/infer-activity";

type MarasSources = ReturnType<typeof useMarasSources>;

export interface ActivityCardProps {
  activity: kim_gelir.Activity;
  currentUserId: string;
  maras: MarasSources;
  onRespond: (activityId: string, status: string, selectedOptions: string[]) => Promise<void>;
  onAddOption: (activityId: string, optionText: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onLeave?: () => Promise<void>;
  actionLoading: string | null;
}

export function ActivityCard({
  activity,
  currentUserId,
  maras,
  onRespond,
  onAddOption,
  onDelete,
  onLeave,
  actionLoading,
}: ActivityCardProps) {
  const isOwner = activity.creatorId === currentUserId;
  const myInviteResponse = activity.responses.find((r) => r.userId === currentUserId);
  const myResponse = myInviteResponse?.status || "bekliyor";
  const mySelectedOptions = myInviteResponse?.selectedOptions || [];

  const yesList = activity.responses.filter((r) => r.status === "gelirim");
  const maybeList = activity.responses.filter((r) => r.status === "belki");

  const locationActivity = inferActivityContext(activity.title);

  const axes = [
    {
      axis: "what" as const,
      isOpen: whatIsOpen(activity),
      fixedValue: activity.title,
      items: getAxisPollItems(activity, "what"),
      ...AXIS_META.what,
    },
    {
      axis: "where" as const,
      isOpen: whereIsOpen(activity),
      fixedValue: activity.location,
      items: getAxisPollItems(activity, "where"),
      ...AXIS_META.where,
    },
    {
      axis: "when" as const,
      isOpen: whenIsOpen(activity),
      fixedValue: formatWhenFixed(activity),
      items: getAxisPollItems(activity, "when"),
      ...AXIS_META.when,
    },
  ];

  return (
    <div className="space-y-4">
      <PlanParticipants activity={activity} currentUserId={currentUserId} />

      <div className="space-y-3">
        {axes.map((ax) => (
          <PlanAxisSection
            key={ax.axis}
            axis={ax.axis}
            label={ax.label}
            isOpen={ax.isOpen}
            fixedValue={ax.fixedValue}
            openHint={ax.openHint}
            items={ax.items}
            activityId={activity.id}
            currentUserId={currentUserId}
            mySelectedOptions={mySelectedOptions}
            myStatus={myResponse}
            maras={maras}
            locationActivity={ax.axis === "where" ? locationActivity : undefined}
            onRespond={onRespond}
            onAddOption={onAddOption}
            actionLoading={actionLoading}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-app-border bg-app-surface p-4 space-y-3">
        <p className="font-black text-[10px] text-app-muted uppercase tracking-[0.14em]">
          Katılımın?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["gelirim", "belki", "gelemem"] as const).map((status) => {
            const icons = { gelirim: Check, belki: Question, gelemem: X };
            const labels = { gelirim: "Gelirim", belki: "Belki", gelemem: "Gelemiyorum" };
            const colors = {
              gelirim: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
              belki: "bg-amber-500/10 border-amber-500/30 text-amber-600",
              gelemem: "bg-red-500/10 border-red-500/30 text-red-600",
            };
            const Icon = icons[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onRespond(activity.id, status, mySelectedOptions)}
                disabled={actionLoading !== null}
                className={`py-3 px-2 rounded-xl font-black text-[10px] flex flex-col items-center gap-1 border cursor-pointer transition-all ${
                  myResponse === status
                    ? colors[status]
                    : "bg-app-surface-muted border-app-border text-app-muted hover:text-app-text"
                }`}
              >
                {actionLoading === activity.id ? (
                  <Spinner size={14} className="animate-spin" />
                ) : (
                  <Icon size={15} weight="bold" />
                )}
                <span>{labels[status]}</span>
              </button>
            );
          })}
        </div>

        {(yesList.length > 0 || maybeList.length > 0) && (
          <div className="space-y-1 pt-2 border-t border-app-border/70">
            {yesList.length > 0 && (
              <p className="text-[11px] text-emerald-600 font-bold">
                Geliyor:{" "}
                {yesList.map((r) => (r.userId === currentUserId ? "Sen" : r.username || "?")).join(", ")}
              </p>
            )}
            {maybeList.length > 0 && (
              <p className="text-[11px] text-amber-600 font-bold">
                Belki:{" "}
                {maybeList.map((r) => (r.userId === currentUserId ? "Sen" : r.username || "?")).join(", ")}
              </p>
            )}
          </div>
        )}
      </section>

      {(isOwner ? onDelete : onLeave) && (
        <button
          type="button"
          onClick={() => (isOwner ? onDelete?.() : onLeave?.())}
          disabled={actionLoading !== null}
          className="w-full py-3 rounded-xl border border-red-500/25 bg-red-500/5 text-red-500 text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
        >
          {actionLoading === "plan-action" ? (
            <Spinner size={14} className="animate-spin" />
          ) : isOwner ? (
            <>
              <Trash size={14} weight="bold" />
              Planı Sil
            </>
          ) : (
            <>
              <SignOut size={14} weight="bold" />
              Plandan Çık
            </>
          )}
        </button>
      )}
    </div>
  );
}
