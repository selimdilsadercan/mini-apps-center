"use client";

import { useState } from "react";
import { Spinner } from "@phosphor-icons/react";
import { PRESET_TIMES, formatWhenSuggestion } from "../../lib/preset-times";
import { fieldClass, modeChipClass, NE_YAPSAK_ACCENT } from "../../lib/theme";

export interface WhenSuggestPanelProps {
  busy: boolean;
  onSubmit: (value: string) => void;
}

export function WhenSuggestPanel({ busy, onSubmit }: WhenSuggestPanelProps) {
  const [selectedTimeId, setSelectedTimeId] = useState("now");
  const [customTime, setCustomTime] = useState("");

  const submit = (timeId: string, custom: string) => {
    const value = formatWhenSuggestion(timeId, custom);
    if (!value) return;
    void onSubmit(value);
    setCustomTime("");
    setSelectedTimeId("now");
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TIMES.map((time) => (
          <button
            key={time.id}
            type="button"
            disabled={busy}
            onClick={() => {
              setSelectedTimeId(time.id);
              if (time.id !== "custom") submit(time.id, "");
            }}
            className={modeChipClass(selectedTimeId === time.id)}
          >
            {time.label}
          </button>
        ))}
      </div>
      {selectedTimeId === "custom" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="Örn: Cumartesi 19:30"
            className={`flex-1 ${fieldClass} bg-app-surface-muted/60 border-0 ring-1 ring-app-border`}
          />
          <button
            type="button"
            disabled={busy || !customTime.trim()}
            onClick={() => submit("custom", customTime)}
            className="px-3 py-2.5 text-white rounded-xl font-black text-[10px] uppercase shrink-0 disabled:opacity-50"
            style={{ backgroundColor: NE_YAPSAK_ACCENT }}
          >
            {busy ? <Spinner size={14} className="animate-spin" /> : "Ekle"}
          </button>
        </div>
      )}
    </div>
  );
}
