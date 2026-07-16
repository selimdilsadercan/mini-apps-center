"use client";

import { useEffect, useMemo, useState } from "react";
import { X, MagnifyingGlass, CaretLeft } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import COMMON_CHORES from "../common_chores.json";
import type { BoardMember, ChoreTemplate, RecurrenceType } from "../types";
import {
  DAY_LABELS,
  FULL_DAY_LABELS,
  RECURRENCE_OPTIONS,
  getIsoWeekday,
} from "../types";

const ALL_CHORES: ChoreTemplate[] = COMMON_CHORES.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    category: group.category,
  }))
);

type Step = "chore" | "recurrence" | "assignee";

export default function AssignChoreDrawer({
  open,
  onClose,
  members,
  onAssign,
}: {
  open: boolean;
  onClose: () => void;
  members: BoardMember[];
  onAssign: (
    chore: ChoreTemplate,
    assigneeClerkId: string,
    recurrenceType: RecurrenceType,
    scheduleDay: number
  ) => void;
}) {
  const [step, setStep] = useState<Step>("chore");
  const [query, setQuery] = useState("");
  const [selectedChore, setSelectedChore] = useState<ChoreTemplate | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("weekly");
  const [scheduleDay, setScheduleDay] = useState(getIsoWeekday());

  useEffect(() => {
    if (!open) return;
    setStep("chore");
    setQuery("");
    setSelectedChore(null);
    setRecurrenceType("weekly");
    setScheduleDay(getIsoWeekday());
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return ALL_CHORES;
    return ALL_CHORES.filter(
      (c) =>
        c.name.toLocaleLowerCase("tr-TR").includes(q) ||
        (c.category ?? "").toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChoreTemplate[]>();
    for (const chore of filtered) {
      const cat = chore.category ?? "Diğer";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(chore);
    }
    return [...map.entries()];
  }, [filtered]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  function handleRecurrenceTypeChange(type: RecurrenceType) {
    setRecurrenceType(type);
    if (type === "daily") {
      setScheduleDay(0);
    } else if (type === "weekly") {
      setScheduleDay(getIsoWeekday());
    } else {
      setScheduleDay(new Date().getDate());
    }
  }

  function titleForStep() {
    if (step === "assignee") return "Kime atanacak?";
    if (step === "recurrence") return "Ne sıklıkla?";
    return "Görev seç";
  }

  function handleBack() {
    if (step === "assignee") {
      setStep("recurrence");
      return;
    }
    if (step === "recurrence") {
      setStep("chore");
      setSelectedChore(null);
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center gap-2">
            {step !== "chore" && (
              <button
                type="button"
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95 shrink-0"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight truncate">
                {titleForStep()}
              </DrawerTitle>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95 shrink-0"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
        </DrawerHeader>

        {step === "chore" && (
          <div className="px-4 pb-6 pt-3 max-h-[65vh] overflow-y-auto">
            <div className="relative mb-3">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Görev ara..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-app-surface-muted border border-app-border text-sm font-medium text-app-text outline-none focus:border-teal-500/40 placeholder:text-app-muted"
              />
            </div>

            <div className="space-y-4">
              {grouped.map(([category, chores]) => (
                <div key={category}>
                  <p className="text-[9px] font-black uppercase tracking-wider text-app-muted mb-2">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chores.map((chore) => (
                      <button
                        key={chore.slug}
                        type="button"
                        onClick={() => {
                          setSelectedChore(chore);
                          setStep("recurrence");
                        }}
                        className="px-3 py-2 rounded-xl bg-app-surface-muted border border-app-border text-xs font-bold text-app-text active:scale-95 transition-all hover:border-teal-500/30"
                      >
                        <span className="mr-1">{chore.icon}</span>
                        {chore.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "recurrence" && selectedChore && (
          <div className="px-4 pb-6 pt-3 max-h-[65vh] overflow-y-auto">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-app-text mb-4">
              {selectedChore.icon} {selectedChore.name}
            </div>

            <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
              Tekrar
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
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
                <div className="grid grid-cols-4 gap-2 mb-4">
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
                <p className="text-[10px] font-bold text-app-muted mb-4">
                  {FULL_DAY_LABELS[scheduleDay - 1]} günleri tekrarlanır.
                </p>
              </>
            )}

            {recurrenceType === "monthly" && (
              <>
                <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-2">
                  Ayın günü
                </p>
                <div className="grid grid-cols-7 gap-1.5 mb-4 max-h-40 overflow-y-auto">
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
                <p className="text-[10px] font-bold text-app-muted mb-4">
                  Her ayın {scheduleDay}. günü tekrarlanır.
                </p>
              </>
            )}

            {recurrenceType === "daily" && (
              <p className="text-[10px] font-bold text-app-muted mb-4">
                Bu görev her gün tekrarlanır.
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep("assignee")}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wide active:scale-[0.98]"
            >
              Devam
            </button>
          </div>
        )}

        {step === "assignee" && selectedChore && (
          <div className="px-4 pb-6 pt-3 max-h-[65vh] overflow-y-auto space-y-2">
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs font-bold text-app-text mb-3">
              {selectedChore.icon} {selectedChore.name}
            </div>
            {members.map((member) => (
              <button
                key={member.clerkId}
                type="button"
                onClick={() => {
                  onAssign(selectedChore, member.clerkId, recurrenceType, scheduleDay);
                  handleOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-app-surface border border-app-border hover:border-teal-500/30 active:scale-[0.99] transition-all"
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
        )}
      </DrawerContent>
    </Drawer>
  );
}
