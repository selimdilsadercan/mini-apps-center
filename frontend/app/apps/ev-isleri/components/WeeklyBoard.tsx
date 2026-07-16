"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  CheckCircle,
  Trash,
  ShareNetwork,
  UserMinus,
  CalendarBlank,
} from "@phosphor-icons/react";
import type { BoardMember, WeekAssignment, ChoreTemplate, RecurrenceType } from "../types";
import {
  formatRecurrenceLabel,
  getIsoWeekday,
  isRoutineDueToday,
} from "../types";
import AssignChoreDrawer from "./AssignChoreDrawer";
import EditRoutineDrawer from "./EditRoutineDrawer";

export default function RoutineList({
  assignments,
  members,
  currentUserId,
  onAssign,
  onUpdate,
  onToggleComplete,
  onRemove,
}: {
  weekStart: string;
  weekLabel: string;
  assignments: WeekAssignment[];
  members: BoardMember[];
  currentUserId?: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onAssign: (
    recurrenceType: RecurrenceType,
    scheduleDay: number,
    chore: ChoreTemplate,
    assigneeClerkId: string
  ) => Promise<void>;
  onUpdate: (
    assignment: WeekAssignment,
    params: {
      recurrenceType: RecurrenceType;
      scheduleDay: number;
      assigneeClerkId: string;
    }
  ) => Promise<void>;
  onToggleComplete: (assignmentId: string) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WeekAssignment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...assignments].sort((a, b) => {
      const aType = a.recurrenceType ?? "weekly";
      const bType = b.recurrenceType ?? "weekly";
      const aDue = isRoutineDueToday(aType, a.dayOfWeek);
      const bDue = isRoutineDueToday(bType, b.dayOfWeek);
      if (aDue !== bDue) return aDue ? -1 : 1;
      if (aType !== bType) {
        const order = { daily: 0, weekly: 1, monthly: 2 };
        return order[aType] - order[bType];
      }
      return a.choreName.localeCompare(b.choreName, "tr");
    });
  }, [assignments]);

  const dueTodayCount = sorted.filter((item) =>
    isRoutineDueToday(item.recurrenceType ?? "weekly", item.dayOfWeek)
  ).length;

  async function handleToggle(id: string) {
    setBusyId(id);
    try {
      await onToggleComplete(id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(id: string) {
    setBusyId(id);
    try {
      await onRemove(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-app-muted">Görevler</p>
          <p className="text-xs font-bold text-app-text mt-0.5">
            {dueTodayCount > 0 ? `Bugün ${dueTodayCount} görev` : "Bugün görev yok"}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wide active:scale-95"
        >
          <Plus size={14} weight="bold" />
          Ekle
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-app-border bg-app-surface px-4 py-10 text-center">
          <CalendarBlank size={32} className="mx-auto text-app-muted mb-3" />
          <p className="text-sm font-bold text-app-text">Henüz görev yok</p>
          <p className="text-xs text-app-muted mt-1">Günlük, haftalık veya aylık tekrarlayan görev ekle.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => {
            const recurrenceType = item.recurrenceType ?? "weekly";
            const done = !!item.completedAt;
            const dueToday = isRoutineDueToday(recurrenceType, item.dayOfWeek);
            const isMine = item.assigneeClerkId === currentUserId;
            const canToggle = dueToday;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-3 ${
                  done
                    ? "border-app-border bg-app-surface-muted/60 opacity-75"
                    : dueToday
                      ? "border-teal-500/30 bg-app-surface shadow-sm"
                      : "border-app-border bg-app-surface"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    disabled={busyId === item.id || !canToggle}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleToggle(item.id);
                    }}
                    title={canToggle ? undefined : "Bugün değil"}
                    className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : canToggle
                          ? "bg-app-bg border-app-border text-app-muted hover:border-emerald-500/40 hover:text-emerald-500"
                          : "bg-app-surface-muted border-app-border text-app-muted/40 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle size={16} weight={done ? "fill" : "regular"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAssignment(item)}
                    className="flex-1 min-w-0 text-left active:opacity-80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-black leading-tight ${
                            done ? "line-through text-app-muted" : "text-app-text"
                          }`}
                        >
                          {item.choreIcon ? `${item.choreIcon} ` : ""}
                          {item.choreName}
                        </p>
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-1">
                          {formatRecurrenceLabel(recurrenceType, item.dayOfWeek)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <div className="w-6 h-6 rounded-lg bg-app-surface-muted border border-app-border overflow-hidden shrink-0">
                        {item.assigneeAvatarUrl ? (
                          <img
                            src={item.assigneeAvatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-app-muted">
                            {(item.assigneeUsername ?? "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-app-muted truncate">
                        {item.assigneeUsername ?? "Üye"}
                        {isMine ? " · Sen" : ""}
                      </p>
                      {dueToday && !done && (
                        <span className="ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-500">
                          Bugün
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRemove(item.id);
                    }}
                    className="shrink-0 text-app-muted hover:text-red-500 p-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignChoreDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        members={members}
        onAssign={(chore, assigneeClerkId, recurrenceType, scheduleDay) => {
          void onAssign(recurrenceType, scheduleDay, chore, assigneeClerkId);
        }}
      />

      <EditRoutineDrawer
        open={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        members={members}
        onSave={onUpdate}
        onDelete={onRemove}
      />
    </>
  );
}

export function MembersBar({
  members,
  isOwner,
  onInvite,
  onRemoveMember,
}: {
  members: BoardMember[];
  isOwner: boolean;
  onInvite: () => Promise<void>;
  onRemoveMember: (clerkId: string) => Promise<void>;
}) {
  const [inviting, setInviting] = useState(false);

  async function handleInvite() {
    setInviting(true);
    try {
      await onInvite();
    } finally {
      setInviting(false);
    }
  }

  return (
    <section className="mb-5 p-4 rounded-2xl bg-app-surface border border-app-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-app-muted">
          Üyeler ({members.length})
        </p>
        <button
          onClick={() => void handleInvite()}
          disabled={inviting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500/10 text-teal-500 text-[10px] font-black uppercase tracking-wide active:scale-95 disabled:opacity-50"
        >
          <ShareNetwork size={12} weight="bold" />
          Davet
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {members.map((member) => (
          <div
            key={member.clerkId}
            className="shrink-0 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-app-surface-muted border border-app-border"
          >
            <div className="w-7 h-7 rounded-lg bg-app-surface overflow-hidden border border-app-border">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-app-muted">
                  {(member.username ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-app-text truncate max-w-[72px]">
                {member.username ?? "Üye"}
              </p>
              {member.role === "owner" && (
                <p className="text-[8px] font-black text-teal-500 uppercase">Sahip</p>
              )}
            </div>
            {isOwner && member.role !== "owner" && (
              <button
                onClick={() => void onRemoveMember(member.clerkId)}
                className="text-app-muted hover:text-red-500 p-1"
              >
                <UserMinus size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
