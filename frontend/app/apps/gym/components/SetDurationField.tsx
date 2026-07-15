"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import { formatSetDuration } from "../exercises";
import { selectInputOnClick, selectInputOnFocus } from "../input-utils";
import { setPlaceholder } from "../types";

export default function SetDurationField({
  seconds,
  targetSeconds,
  onChange,
  className = "",
}: {
  seconds: number | null;
  targetSeconds?: number | null;
  onChange: (seconds: number | null) => void;
  className?: string;
}) {
  const [running, setRunning] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const baseSeconds = useRef(seconds ?? 0);

  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const tick = () => {
      const next = baseSeconds.current + Math.floor((Date.now() - startedAt) / 1000);
      setLiveSeconds(next);
      onChange(next);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, onChange]);

  function toggleTimer() {
    if (running) {
      setRunning(false);
      baseSeconds.current = seconds ?? liveSeconds;
      return;
    }
    baseSeconds.current = seconds ?? 0;
    setLiveSeconds(baseSeconds.current);
    onChange(baseSeconds.current);
    setRunning(true);
  }

  const placeholder =
    targetSeconds != null && targetSeconds > 0
      ? formatSetDuration(targetSeconds)
      : setPlaceholder(null);

  const elapsedDisplay = formatSetDuration(running ? liveSeconds : (seconds ?? 0));

  return (
    <div className={`flex items-center gap-1 min-w-0 ${className}`}>
      {running ? (
        <div className="w-full min-w-0 text-center text-xs font-black bg-violet-50 border border-violet-200 rounded-lg py-1 text-violet-600 tabular-nums shadow-sm">
          {elapsedDisplay}
        </div>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={seconds != null && seconds > 0 ? String(seconds) : ""}
          onPointerDown={(e) => e.stopPropagation()}
          onFocus={selectInputOnFocus}
          onClick={selectInputOnClick}
          onChange={(e) => {
            const cleanVal = e.target.value.replace(/[^0-9]/g, "");
            onChange(cleanVal ? Number(cleanVal) : null);
          }}
          className="w-full min-w-0 text-center text-xs font-bold bg-white border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums shadow-sm placeholder:text-gray-300"
        />
      )}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggleTimer}
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
          running
            ? "bg-violet-500 border-violet-500 text-white"
            : "bg-white border-gray-200 text-violet-500 hover:bg-violet-50"
        }`}
        title={running ? "Zamanlayıcıyı durdur" : "Zamanlayıcıyı başlat"}
      >
        {running ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
      </button>
    </div>
  );
}
