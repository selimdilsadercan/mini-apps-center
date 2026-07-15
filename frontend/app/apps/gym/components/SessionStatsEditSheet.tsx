"use client";

import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";

export function formatSessionElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  if (h > 0) return `${h}sa ${m}dk`;
  if (m > 0) return `${m}dk ${sec}s`;
  return `${sec}s`;
}

export function splitDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

interface SessionStatsEditSheetProps {
  open: boolean;
  onClose: () => void;
  startedAt: string;
  elapsed: number;
  onSave: (startedAt: string, durationSeconds: number) => void;
}

export default function SessionStatsEditSheet({
  open,
  onClose,
  startedAt,
  elapsed,
  onSave,
}: SessionStatsEditSheetProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");

  useEffect(() => {
    if (!open) return;
    setDate(toDateInputValue(startedAt));
    setTime(toTimeInputValue(startedAt));
    const parts = splitDuration(elapsed);
    setHours(String(parts.h));
    setMinutes(String(parts.m));
    setSeconds(String(parts.s));
  }, [open, startedAt, elapsed]);

  if (!open) return null;

  function handleSave() {
    const [y, mo, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    if (!y || !mo || !d || Number.isNaN(hh) || Number.isNaN(mm)) return;

    const h = Math.max(0, parseInt(hours, 10) || 0);
    const m = Math.max(0, parseInt(minutes, 10) || 0);
    const s = Math.max(0, parseInt(seconds, 10) || 0);
    const totalSeconds = h * 3600 + m * 60 + s;

    const newStartedAt = new Date(y, mo - 1, d, hh, mm, 0, 0).toISOString();
    onSave(newStartedAt, totalSeconds);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-black text-gray-900">Süre & Tarih</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
              Başlangıç ve süreyi düzenle
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-gray-500"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Tarih</p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm font-black bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Başlangıç Saati
            </p>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-sm font-black bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums"
            />
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Süre</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Saat", value: hours, set: setHours },
                { label: "Dakika", value: minutes, set: setMinutes },
                { label: "Saniye", value: seconds, set: setSeconds },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full text-center text-sm font-black bg-gray-50 border border-gray-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-black text-gray-600 active:scale-[0.98] transition-all"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-xs font-black active:scale-[0.98] transition-all shadow-md shadow-violet-500/10"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

interface SessionStatsBarProps {
  elapsed: number;
  volume: number;
  completedSets: number;
  onEditDuration: () => void;
  durationAccent?: "violet-500" | "violet-600";
}

export function SessionStatsBar({
  elapsed,
  volume,
  completedSets,
  onEditDuration,
  durationAccent = "violet-600",
}: SessionStatsBarProps) {
  const accentClass = durationAccent === "violet-500" ? "text-violet-500" : "text-violet-600";

  return (
    <div className="flex items-center justify-around px-5 pb-4 border-t border-gray-50 pt-3 max-w-xl mx-auto w-full">
      <button
        type="button"
        onClick={onEditDuration}
        className="text-center active:scale-95 transition-transform rounded-xl px-3 py-1 -my-1 hover:bg-violet-50/60"
      >
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Süre</p>
        <p className={`text-sm font-black tabular-nums ${accentClass}`}>
          {formatSessionElapsed(elapsed)}
        </p>
      </button>
      <div className="text-center px-3 py-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Hacim</p>
        <p className="text-sm font-black text-gray-900 tabular-nums">{volume} kg</p>
      </div>
      <div className="text-center px-3 py-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Setler</p>
        <p className="text-sm font-black text-gray-900 tabular-nums">{completedSets}</p>
      </div>
    </div>
  );
}
