"use client";

import { useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  CheckCircle,
  Trash,
  ShareNetwork,
  UserMinus,
} from "@phosphor-icons/react";
import type { BoardMember, WeekAssignment, ChoreTemplate } from "../types";
import { DAY_LABELS, getMondayWeekStart, getIsoWeekday } from "../types";
import AssignChoreDrawer from "./AssignChoreDrawer";

export default function WeeklyBoard({
  weekStart,
  weekLabel,
  assignments,
  members,
  currentUserId,
  onPrevWeek,
  onNextWeek,
  onAssign,
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
  onAssign: (dayOfWeek: number, chore: ChoreTemplate, assigneeClerkId: string) => Promise<void>;
  onToggleComplete: (assignmentId: string) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}) {
  const [assignDay, setAssignDay] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const byDay = (day: number) =>
    assignments.filter((a) => a.dayOfWeek === day).sort((a, b) => a.choreName.localeCompare(b.choreName, "tr"));

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
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={onPrevWeek}
          className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 active:scale-95"
        >
          <CaretLeft size={16} weight="bold" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Haftalık Plan</p>
          <p className="text-xs font-black text-gray-900">{weekLabel}</p>
        </div>
        <button
          onClick={onNextWeek}
          className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 active:scale-95"
        >
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      <div className="space-y-3">
        {DAY_LABELS.map((label, index) => {
          const day = index + 1;
          const dayAssignments = byDay(day);
          const isToday =
            weekStart === getMondayWeekStart() && getIsoWeekday() === day;

          return (
            <section
              key={day}
              className={`rounded-2xl border bg-white overflow-hidden ${
                isToday ? "border-teal-200 shadow-sm" : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isToday ? "text-teal-600" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-600">
                      Bugün
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAssignDay(day);
                    setDrawerOpen(true);
                  }}
                  className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-teal-600 hover:border-teal-100 active:scale-95"
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>

              {dayAssignments.length === 0 ? (
                <p className="px-4 py-3 text-[10px] font-bold text-gray-300">Görev yok</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {dayAssignments.map((item) => {
                    const done = !!item.completedAt;
                    const isMine = item.assigneeClerkId === currentUserId;
                    return (
                      <div
                        key={item.id}
                        className={`px-4 py-3 flex items-center gap-3 ${done ? "opacity-60" : ""}`}
                      >
                        <button
                          disabled={busyId === item.id}
                          onClick={() => handleToggle(item.id)}
                          className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                            done
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-gray-50 border-gray-100 text-gray-300 hover:border-emerald-200 hover:text-emerald-500"
                          }`}
                        >
                          <CheckCircle size={18} weight={done ? "fill" : "regular"} />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-black truncate ${
                              done ? "line-through text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {item.choreIcon ? `${item.choreIcon} ` : ""}
                            {item.choreName}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 truncate mt-0.5">
                            {item.assigneeUsername ?? "Üye"}
                            {isMine ? " · Sen" : ""}
                          </p>
                        </div>

                        <button
                          disabled={busyId === item.id}
                          onClick={() => handleRemove(item.id)}
                          className="shrink-0 w-8 h-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center active:scale-95"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <AssignChoreDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setAssignDay(null);
        }}
        members={members}
        onAssign={(chore, assigneeClerkId) => {
          if (assignDay == null) return;
          void onAssign(assignDay, chore, assigneeClerkId);
        }}
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
    <section className="mb-5 p-4 rounded-2xl bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
          Üyeler ({members.length})
        </p>
        <button
          onClick={() => void handleInvite()}
          disabled={inviting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-wide active:scale-95 disabled:opacity-50"
        >
          <ShareNetwork size={12} weight="bold" />
          Davet
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {members.map((member) => (
          <div
            key={member.clerkId}
            className="shrink-0 flex items-center gap-2 px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div className="w-7 h-7 rounded-lg bg-white overflow-hidden border border-gray-100">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                  {(member.username ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-800 truncate max-w-[72px]">
                {member.username ?? "Üye"}
              </p>
              {member.role === "owner" && (
                <p className="text-[8px] font-black text-teal-600 uppercase">Sahip</p>
              )}
            </div>
            {isOwner && member.role !== "owner" && (
              <button
                onClick={() => void onRemoveMember(member.clerkId)}
                className="text-gray-300 hover:text-red-500 p-1"
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
