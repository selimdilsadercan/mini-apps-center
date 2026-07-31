"use client";

import { useState } from "react";
import { Check, MapPin, Plus, Spinner } from "@phosphor-icons/react";
import type { kim_gelir } from "@/lib/client";
import type { useMarasSources } from "../hooks/useMarasSources";
import {
  type AxisPollItem,
  type PlanAxis,
  encodePollOption,
  parsePollOption,
} from "../lib/plan-poll";
import {
  embeddedRowClass,
  NE_YAPSAK_ACCENT,
  planCardClass,
  sectionLabelClass,
} from "../lib/theme";
import { LocationPickerDrawer } from "./pickers/LocationPickerDrawer";
import type { ActivityPreset } from "./pickers/ActivityPickerDrawer";
import { WhatSuggestFlow } from "./pickers/WhatSuggestFlow";
import { WhenSuggestPanel } from "./pickers/WhenSuggestPanel";

type MarasSources = ReturnType<typeof useMarasSources>;

export interface PlanAxisSectionProps {
  axis: PlanAxis;
  label: string;
  isOpen: boolean;
  fixedValue: string;
  openHint: string;
  items: AxisPollItem[];
  activityId: string;
  currentUserId: string;
  mySelectedOptions: string[];
  myStatus: string;
  maras: MarasSources;
  locationActivity?: ActivityPreset;
  onRespond: (activityId: string, status: string, selectedOptions: string[]) => Promise<void>;
  onAddOption: (activityId: string, optionText: string) => Promise<void>;
  actionLoading: string | null;
}

export function PlanAxisSection({
  axis,
  label,
  isOpen,
  fixedValue,
  openHint,
  items,
  activityId,
  currentUserId,
  mySelectedOptions,
  myStatus,
  maras,
  locationActivity,
  onRespond,
  onAddOption,
  actionLoading,
}: PlanAxisSectionProps) {
  const [whatOpen, setWhatOpen] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);
  const busy = actionLoading !== null;

  const propose = async (displayValue: string) => {
    const text = displayValue.trim();
    if (!text) return;
    const encoded = encodePollOption(axis, text);
    await onAddOption(activityId, encoded);
    const withoutSameAxis = mySelectedOptions.filter((o) => parsePollOption(o)?.axis !== axis);
    const status = myStatus === "bekliyor" ? "gelirim" : myStatus;
    await onRespond(activityId, status, [...withoutSameAxis, encoded]);
  };

  const toggleVote = async (encoded: string) => {
    const isVoted = mySelectedOptions.includes(encoded);
    const withoutSameAxis = mySelectedOptions.filter((o) => parsePollOption(o)?.axis !== axis);
    const updated = isVoted ? withoutSameAxis : [...withoutSameAxis, encoded];
    const status = myStatus === "bekliyor" ? "gelirim" : myStatus;
    await onRespond(activityId, status, updated);
  };

  return (
    <>
      <section className={planCardClass}>
        <div className="flex items-start justify-between gap-2">
          <label className={sectionLabelClass}>{label}</label>
          {isOpen ? (
            <span className="text-[9px] font-black uppercase tracking-wide text-app-muted shrink-0">
              Açık
            </span>
          ) : (
            <span
              className="text-[9px] font-black uppercase tracking-wide shrink-0"
              style={{ color: NE_YAPSAK_ACCENT }}
            >
              Belli
            </span>
          )}
        </div>

        {!isOpen ? (
          <p className="text-sm font-black text-app-text leading-snug">{fixedValue}</p>
        ) : (
          <>
            <p className="text-[10px] text-app-muted font-medium">{openHint}</p>

            {items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map((item) => {
                  const isVoted = mySelectedOptions.includes(item.encoded);
                  return (
                    <button
                      key={item.encoded}
                      type="button"
                      disabled={busy}
                      onClick={() => toggleVote(item.encoded)}
                      className={`${embeddedRowClass(isVoted)} flex items-center gap-2 w-full`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isVoted
                            ? "border-[#FF5252]/40 bg-[#FF5252]/15"
                            : "border-app-border bg-app-surface"
                        }`}
                      >
                        {isVoted && <Check size={11} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />}
                      </span>
                      <span className="flex-1 text-left truncate">{item.value}</span>
                      <span className="text-[10px] text-app-muted font-semibold shrink-0 max-w-[45%] truncate">
                        {item.voters.length === 0
                          ? "—"
                          : item.voters
                              .map((v) => (v.userId === currentUserId ? "Sen" : v.username || "?"))
                              .join(", ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-app-muted font-medium italic">Henüz öneri yok.</p>
            )}

            {axis === "what" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setWhatOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-app-border text-app-muted text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
              >
                {busy ? <Spinner size={14} className="animate-spin" /> : <Plus size={13} weight="bold" />}
                Aktivite öner
              </button>
            )}

            {axis === "where" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setWhereOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-app-border text-app-muted text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 hover:text-app-text transition-colors"
              >
                <MapPin size={13} weight="bold" />
                Mekan seç
              </button>
            )}

            {axis === "when" && <WhenSuggestPanel busy={busy} onSubmit={propose} />}
          </>
        )}
      </section>

      {axis === "what" && (
        <WhatSuggestFlow
          pickerOpen={whatOpen}
          onPickerOpenChange={setWhatOpen}
          maras={maras}
          onConfirm={propose}
        />
      )}

      {axis === "where" && (
        <LocationPickerDrawer
          open={whereOpen}
          onOpenChange={setWhereOpen}
          maras={maras}
          activity={locationActivity}
          onConfirm={propose}
        />
      )}
    </>
  );
}
