"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAppRootUrl } from "@/lib/apps";
import { CaretLeft, Barbell, User, Timer, ArrowRight, Sparkle } from "@phosphor-icons/react";
import { ACTIVE_SESSION_KEY, type ActiveSession, getActiveSessionElapsed } from "../types";
import ActiveSessionSheet from "./ActiveSessionSheet";

export type GymTab = "workout" | "profile" | "none";

export default function GymShell({
  activeTab,
  children,
}: {
  activeTab: GymTab;
  children: React.ReactNode;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const loadSessionFromStorage = useCallback(() => {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ActiveSession;
        setActiveSession(parsed);
        setElapsed(getActiveSessionElapsed(parsed));
      } catch (e) {
        // ignore
      }
    } else {
      setActiveSession(null);
    }
  }, []);

  useEffect(() => {
    loadSessionFromStorage();

    const handleStart = () => {
      loadSessionFromStorage();
      setIsSheetOpen(true);
    };

    const handleUpdate = () => {
      loadSessionFromStorage();
    };

    window.addEventListener("gym_session_started", handleStart);
    window.addEventListener("gym_session_updated", handleUpdate);
    
    return () => {
      window.removeEventListener("gym_session_started", handleStart);
      window.removeEventListener("gym_session_updated", handleUpdate);
    };
  }, [loadSessionFromStorage]);

  useEffect(() => {
    if (!activeSession) return;

    if (activeSession.manualDurationSeconds != null) {
      setElapsed(activeSession.manualDurationSeconds);
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      setElapsed(getActiveSessionElapsed(activeSession));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.startedAt, activeSession?.manualDurationSeconds]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
      active
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-violet-100 relative pb-20">
      {activeTab !== "none" && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={() => {
                    window.location.href = getAppRootUrl();
                  }}
                  className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-95 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
                >
                  <CaretLeft size={14} weight="bold" className="text-violet-500" />
                </button>

                <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
                  <Barbell size={18} weight="fill" className="text-violet-500 shrink-0" />
                  <span className="truncate">
                    <span className="text-violet-500">Gym</span>
                  </span>
                </h1>
              </div>

              <button
                onClick={() => {
                  window.location.href = "/apps/gym/ai-helper";
                }}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-violet-500 hover:text-violet-75 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95 shadow-sm"
                title="AI Analiz & Veri Laboratuvarı"
              >
                <Sparkle size={15} weight="fill" className="animate-pulse" />
              </button>
            </div>

            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 mt-1">
              <Link href="/apps/gym" className={tabClass(activeTab === "workout")}>
                <Barbell size={14} weight={activeTab === "workout" ? "fill" : "duotone"} />
                <span>Rutinler</span>
              </Link>
              <Link href="/apps/gym/profile" className={tabClass(activeTab === "profile")}>
                <User size={14} weight={activeTab === "profile" ? "fill" : "duotone"} />
                <span>Plan & Gelişim</span>
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">{children}</main>

      {activeSession && (
        <div 
          onClick={() => setIsSheetOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-gray-900/95 text-white rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between gap-3 backdrop-blur-md border border-gray-800 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300 cursor-pointer hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 animate-pulse">
              <Timer size={18} weight="bold" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Aktif Antrenman</p>
              <p className="text-xs font-bold truncate">{activeSession.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-black tabular-nums text-violet-400">{formatElapsed(elapsed)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSheetOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            >
              Devam Et
              <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </div>
      )}

      <ActiveSessionSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onFinished={() => {
          setActiveSession(null);
          setIsSheetOpen(false);
        }}
      />
    </div>
  );
}
