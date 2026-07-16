"use client";

import { useEffect, useState } from "react";
import { X, Trash } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { BoardMember, RecurrenceType, WeekAssignment } from "../types";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  RECURRENCE_OPTIONS,
  formatRecurrenceLabel,
  getIsoWeekday,
} from "../types";

export default function EditRoutineDrawer({
  open,
  onClose,
  assignment,
  members,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  assignment: WeekAssignment | null;
  members: BoardMember[];
  onSave: (
    assignment: WeekAssignment,
    params: {
      recurrenceType: RecurrenceType;
      scheduleDay: number;
      assigneeClerkId: string;
    }
  ) => Promise<void>;
  onDelete: (assignmentId: string) => Promise<void>;
}) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [scheduleDay, setScheduleDay] = useState(getIsoWeekday());
  const [assigneeClerkId, setAssigneeClerkId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !assignment) return;
    const type = assignment.recurrenceType ?? "weekly";
    setRecurrenceType(type);
    setScheduleDay(assignment.dayOfWeek);
    setAssigneeClerkId(assignment.assigneeClerkId);
  }, [open, assignment]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  function handleRecurrenceTypeChange(type: RecurrenceType) {
    setRecurrenceType(type);
    if (type === "daily") {
      setScheduleDay(0);
    } else if (type === "weekly") {
      setScheduleDay(assignment?.dayOfWeek && assignment.dayOfWeek >= 1 && assignment.dayOfWeek <= 7
        ? assignment.dayOfWeek
        : getIsoWeekday());
    } else {
      setScheduleDay(
        assignment?.dayOfWeek && assignment.dayOfWeek >= 1 && assignment.dayOfWeek <= 31
          ? assignment.dayOfWeek
          : new Date().getDate()
      );
    }
  }

  async function handleSave() {
    if (!assignment || !assigneeClerkId) return;
    setSaving(true);
    try {
      await onSave(assignment, { recurrenceType, scheduleDay, assigneeClerkId });
      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!assignment) return;
    setDeleting(true);
    try {
      await onDelete(assignment.id);
      handleOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  if (!assignment) return null;

  const recurrenceTypeValue = assignment.recurrenceType ?? "weekly";

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              Görev düzenle
            </DrawerTitle>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 pt-3 max-h-[70vh] overflow-y-auto space-y-4">
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <p className="text-sm font-black text-app-text">
              {assignment.choreIcon ? `${assignment.choreIcon} ` : ""}
              {assignment.choreName}
            </p>
            <p className="text-[10px] font-bold text-app-muted mt-1">
              Şu an: {formatRecurrenceLabel(recurrenceTypeValue, assignment.dayOfWeek)}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
              Tekrar
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {RECURRENCE_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleRecurrenceTypeChange(option.type)}
                  className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                    recurrenceType === option.type
                      ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                      : "border-app-border bg-app-surface-muted text-app-text"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {recurrenceType === "weekly" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
                  Haftanın günü
                </p>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {DAY_LABELS.map((label, index) => {
                    const day = index + 1;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setScheduleDay(day)}
                        className={`py-2 rounded-xl border text-[10px] font-black uppercase ${
                          scheduleDay === day
                            ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                            : "border-app-border bg-app-surface-muted text-app-text"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-app-muted">
                  {FULL_DAY_LABELS[scheduleDay - 1]} günleri tekrarlanır.
                </p>
              </>
            )}

            {recurrenceType === "monthly" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
                  Ayın günü
                </p>
                <div className="grid grid-cols-7 gap-1.5 mb-2 max-h-36 overflow-y-auto">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setScheduleDay(day)}
                      className={`py-2 rounded-lg border text-[10px] font-black ${
                        scheduleDay === day
                          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                          : "border-app-border bg-app-surface-muted text-app-text"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-app-muted">
                  Her ayın {scheduleDay}. günü tekrarlanır.
                </p>
              </>
            )}

            {recurrenceType === "daily" && (
              <p className="text-[10px] font-bold text-app-muted">
                Bu görev her gün tekrarlanır.
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
              Atanan kişi
            </p>
            <div className="space-y-2">
              {members.map((member) => (
                <button
                  key={member.clerkId}
                  type="button"
                  onClick={() => setAssigneeClerkId(member.clerkId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.99] ${
                    assigneeClerkId === member.clerkId
                      ? "border-teal-500 bg-teal-500/5"
                      : "border-app-border bg-app-surface hover:border-teal-500/30"
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-app-surface-muted overflow-hidden shrink-0 border border-app-border">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-app-muted text-sm font-black">
                        {(member.username ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-app-text truncate">
                    {member.username ?? "Kullanıcı"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !assigneeClerkId}
            className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wide disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide text-red-500 hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash size={14} />
            {deleting ? "Siliniyor..." : "Görevi sil"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
