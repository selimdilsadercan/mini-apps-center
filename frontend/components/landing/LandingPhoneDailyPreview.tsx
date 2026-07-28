"use client";

import React from "react";
import {
  Compass,
  CalendarCheck,
  Basket,
  VideoCamera,
  ProjectorScreen,
  BookOpen,
  UserCircle,
  CreditCard,
  Wallet,
} from "@phosphor-icons/react";
import {
  HomeSummaryCard,
  HomeGroupHeader,
} from "@/app/home/components/common/HomeSummaryCard";
import { LandingPhonePreviewFrame } from "./LandingPhonePreviewFrame";

const STACK = "flex flex-col gap-3";

export default function LandingPhoneDailyPreview() {
  return (
    <LandingPhonePreviewFrame className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-black text-app-text tracking-tight truncate leading-none">
              İyi akşamlar, selim
            </h1>
            <p className="text-[10px] font-medium text-app-muted truncate mt-1">
              28 Tem
              <span className="mx-1.5 opacity-50">·</span>
              Bugünün özeti
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-app-border bg-app-surface-muted flex items-center justify-center shrink-0">
            <UserCircle size={36} weight="fill" className="text-app-muted" />
          </div>
        </div>

        <div className="flex justify-start">
          <div className="relative inline-flex items-center gap-0.5 rounded-xl border border-app-border/70 bg-app-tab-track p-0.5">
            <span className="relative z-10 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-app-muted">
              <Compass size={12} weight="bold" />
              Şehirde
            </span>
            <span className="relative z-10 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-app-text">
              <span className="absolute inset-0 rounded-lg bg-app-tab-active shadow-sm ring-1 ring-app-border/40" />
              <span className="relative z-10 flex items-center gap-1">
                <CalendarCheck size={12} weight="fill" />
                Günlük
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <HomeGroupHeader title="Başka Ne Yapabilirim?" />
          <div className={STACK}>
            <HomeSummaryCard
              href="/apps/rutinler"
              icon={CalendarCheck}
              color="#7C3AED"
              title="Bugünün Yapılacakları"
              subtitle="Ajanda"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              {[
                { emoji: "🧘", name: "Sabah meditasyonu", period: "Sabah rutini" },
                { emoji: "📖", name: "30 dk okuma", period: "Akşam rutini" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="px-4 py-3 border-t border-app-border flex items-center gap-3 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0 text-sm">
                    {item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{item.name}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">{item.period}</p>
                  </div>
                </div>
              ))}
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/eksik-var"
              icon={Basket}
              color="#10B981"
              title="Alışveriş Listem"
              subtitle="Eksik Var"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Basket size={16} weight="fill" className="text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-app-text">Bugün Alınacaklar</p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    Süt, ekmek, +2 ürün
                  </p>
                </div>
              </div>
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/budget"
              icon={Wallet}
              color="#EC4899"
              title="Budget"
              subtitle="Bütçe & Harcamalar"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              <div className="px-4 py-3 border-t border-app-border space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-app-text">Bu Ay</p>
                    <p className="text-[9px] text-app-muted font-bold mt-0.5">₺4.280 / ₺6.000</p>
                  </div>
                  <span className="text-[10px] font-black text-pink-500">%71</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-app-surface-muted overflow-hidden">
                  <div className="h-full w-[71%] rounded-full bg-pink-500" />
                </div>
              </div>
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/subcenter"
              icon={CreditCard}
              color="#339AF0"
              title="Subcenter"
              subtitle="Abonelikler"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              {[
                { name: "Netflix", amount: "₺229", due: "3 gün" },
                { name: "Spotify", amount: "₺59", due: "12 gün" },
              ].map((sub) => (
                <div
                  key={sub.name}
                  className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{sub.name}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                      Yenileme · {sub.due}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-sky-400 shrink-0">{sub.amount}</span>
                </div>
              ))}
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/film-graph"
              icon={ProjectorScreen}
              color="#D97706"
              title="Bir Film İzle"
              subtitle="Film Keşfet"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              {[
                { title: "Interstellar", year: "2014", rating: "8.7" },
                { title: "Dune: Part Two", year: "2024", rating: "8.6" },
              ].map((movie) => (
                <div
                  key={movie.title}
                  className="px-4 py-3 border-t border-app-border flex items-center gap-3 text-left"
                >
                  <div className="w-9 h-12 rounded-lg bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                    <ProjectorScreen size={16} className="text-app-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">{movie.title}</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                      {movie.year} · ★ {movie.rating}
                    </p>
                  </div>
                </div>
              ))}
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/series-track"
              icon={VideoCamera}
              color="#EF4444"
              title="Bugünün Dizileri"
              subtitle="SeriesTrack"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              <div className="px-4 py-3 border-t border-app-border flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                  <VideoCamera size={16} weight="fill" className="text-app-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-app-text truncate">The Bear</p>
                  <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                    S3 B4 · Bugün yayınlandı
                  </p>
                </div>
              </div>
            </HomeSummaryCard>

            <HomeSummaryCard
              href="/apps/read-tracker"
              icon={BookOpen}
              color="#3B82F6"
              title="Okuma Hedefin"
              subtitle="Read Tracker"
              loading={false}
              emptyText=""
              hasContent
              onHideToday={() => {}}
              onHidePermanent={() => {}}
            >
              <div className="px-4 py-3 border-t border-app-border space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-12 rounded-lg bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-app-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black text-app-text truncate">Sapiens</p>
                    <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                      Bugün 24 sayfa · 142/498
                    </p>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-app-surface-muted overflow-hidden">
                  <div className="h-full w-[28%] rounded-full bg-blue-500" />
                </div>
              </div>
            </HomeSummaryCard>
          </div>
        </div>
    </LandingPhonePreviewFrame>
  );
}
