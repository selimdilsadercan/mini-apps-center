"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Coffee, Compass, Heart, Plus, ShieldCheck, ArrowLeft } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

export default function WorkplacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("workplaces");
  const { user } = useUser();
  const client = useMemo(() => createBrowserClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    client.users.checkAdmin(user.id)
      .then((res) => setIsAdmin(res.isAdmin))
      .catch((err) => console.error("Failed to check admin status:", err));
  }, [user?.id, client]);

  const isExplore = pathname === "/apps/workplaces";
  const isForYou = pathname === "/apps/workplaces/for-you";
  const isAdminQueue = pathname === "/apps/workplaces/admin-queue";
  const isPlaceDetail = pathname.startsWith("/apps/workplaces/place");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50 text-neutral-800">

      {/* ── DESKTOP SIDEBAR (Web) ────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200 h-screen sticky top-0 px-4 py-6">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-8">
          {!isPlaceDetail && (
            <Link
              href="/"
              className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-xl transition-all"
              title="Geri Dön"
            >
              <ArrowLeft size={16} weight="bold" />
            </Link>
          )}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <Coffee className="text-amber-700" size={20} weight="fill" />
            </div>
            <div>
              <h1 className="font-bold text-neutral-900 text-sm leading-none">Workplaces</h1>
              <span className="text-[9px] text-neutral-400 font-semibold tracking-wider uppercase mt-1 block">
                SuperApp
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5 flex-1">
          <Link
            href="/apps/workplaces"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isExplore
                ? "bg-amber-50 text-amber-800 border border-amber-200/30 shadow-[0_2px_8px_rgba(180,83,9,0.04)]"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
          >
            <Compass size={20} weight={isExplore ? "fill" : "regular"} />
            <span>{t("title") || "Keşfet"}</span>
          </Link>

          <Link
            href="/apps/workplaces/for-you"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isForYou
                ? "bg-amber-50 text-amber-800 border border-amber-200/30 shadow-[0_2px_8px_rgba(180,83,9,0.04)]"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
              }`}
          >
            <Heart size={20} weight={isForYou ? "fill" : "regular"} />
            <span>For You</span>
          </Link>

          {isAdmin && (
            <Link
              href="/apps/workplaces/admin-queue"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isAdminQueue
                  ? "bg-red-50 text-red-800 border border-red-200/30 shadow-[0_2px_8px_rgba(220,38,38,0.04)]"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                }`}
            >
              <ShieldCheck size={20} weight={isAdminQueue ? "fill" : "regular"} />
              <span>Admin Queue</span>
            </Link>
          )}
        </nav>

        {/* Bottom actions (Suggest/Add Place) */}
        <div className="pt-4 border-t border-neutral-100">
          <button
            onClick={() => router.push(isExplore ? "?suggest=true" : "/apps/workplaces?suggest=true")}
            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-bold px-4 py-3 rounded-2xl text-sm transition-all"
          >
            <Plus size={16} weight="bold" />
            <span>{isAdmin ? t("addPlace") : t("suggestPlace")}</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE HEADER (Mobile App) ──────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {!isPlaceDetail && (
            <Link
              href="/"
              className="p-1.5 bg-neutral-50 text-neutral-500 rounded-lg hover:bg-neutral-100 border border-neutral-200/80 transition-colors"
              title="Geri Dön"
            >
              <ArrowLeft size={14} weight="bold" />
            </Link>
          )}
          <Coffee className="text-amber-700" size={20} weight="fill" />
          <span className="font-bold text-neutral-900 text-sm">Workplaces</span>
        </div>
        <button
          onClick={() => router.push(isExplore ? "?suggest=true" : "/apps/workplaces?suggest=true")}
          className="p-1.5 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
          title={isAdmin ? t("addPlace") : t("suggestPlace")}
        >
          <Plus size={16} weight="bold" />
        </button>
      </header>

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION (Appbar) ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-6 py-2.5 flex justify-around shadow-[0_-8px_24px_rgba(0,0,0,0.04)]">
        <Link
          href="/apps/workplaces"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${isExplore ? "text-amber-700" : "text-neutral-400 hover:text-neutral-600"
            }`}
        >
          <Compass size={22} weight={isExplore ? "fill" : "regular"} />
          <span>{t("title") || "Keşfet"}</span>
        </Link>

        <Link
          href="/apps/workplaces/for-you"
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${isForYou ? "text-amber-700" : "text-neutral-400 hover:text-neutral-600"
            }`}
        >
          <Heart size={22} weight={isForYou ? "fill" : "regular"} />
          <span>For You</span>
        </Link>

        {isAdmin && (
          <Link
            href="/apps/workplaces/admin-queue"
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${isAdminQueue ? "text-red-700" : "text-neutral-400 hover:text-neutral-600"
              }`}
          >
            <ShieldCheck size={22} weight={isAdminQueue ? "fill" : "regular"} />
            <span>Admin</span>
          </Link>
        )}
      </nav>

    </div>
  );
}
