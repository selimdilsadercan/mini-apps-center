"use client";

import React from "react";
import {
  Compass,
  CalendarCheck,
  Coffee,
  Megaphone,
  Ticket,
  Waves,
  UserCircle,
} from "@phosphor-icons/react";
import {
  HomeSummaryCard,
  HomeGroupHeader,
} from "@/app/home/components/common/HomeSummaryCard";
import { LandingPhonePreviewFrame } from "./LandingPhonePreviewFrame";

const MASONRY = "flex flex-col gap-3";
const MASONRY_ITEM = "w-full";

export default function LandingPhoneAppPreview() {
  return (
    <LandingPhonePreviewFrame className="space-y-3">
        {/* HomeHeader */}
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

        {/* Şehirde / Günlük tabs */}
        <div className="flex justify-start">
          <div className="relative inline-flex items-center gap-0.5 rounded-xl border border-app-border/70 bg-app-tab-track p-0.5">
            <span className="relative z-10 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-app-text">
              <span className="absolute inset-0 rounded-lg bg-app-tab-active shadow-sm ring-1 ring-app-border/40" />
              <span className="relative z-10 flex items-center gap-1">
                <Compass size={12} weight="fill" />
                Şehirde
              </span>
            </span>
            <span className="relative z-10 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-app-muted">
              <CalendarCheck size={12} weight="bold" />
              Günlük
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <HomeGroupHeader title="Bugün Şehirde" />
          <div className={MASONRY}>
            {/* Dışarıda Ne Yapılır? */}
            <div className={MASONRY_ITEM}>
              <HomeSummaryCard
                href="/apps/outdoor-activities"
                icon={Compass}
                color="#0F766E"
                title="Dışarıda Ne Yapılır?"
                subtitle="Aktif Doğa ve Spor Seçenekleri"
                loading={false}
                emptyText=""
                hasContent
                onHideToday={() => {}}
                onHidePermanent={() => {}}
              >
                {[
                  {
                    action: "Ata Binmeye Git 🏇",
                    place: "Kahramanmaraş Binicilik Kulübü (Merkez)",
                    Icon: Compass,
                  },
                  {
                    action: "Kano Yapmaya Git 🚣",
                    place: "Kılavuzlu Barajı Kano Alanı (Dulkadiroğlu)",
                    Icon: Waves,
                  },
                ].map((item) => (
                  <div
                    key={item.action}
                    className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-[36px] h-[36px] rounded-xl bg-[#0F766E]/10 flex items-center justify-center shrink-0">
                        <item.Icon size={18} className="text-[#0F766E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-app-text truncate">{item.action}</p>
                        <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                          📍 {item.place}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </HomeSummaryCard>
            </div>

            {/* Bugün Sinemada */}
            <div className={MASONRY_ITEM}>
              <HomeSummaryCard
                href="/apps/film-graph"
                icon={Ticket}
                color="#D97706"
                title="Bugün Sinemada"
                subtitle="Paribu Cineverse Piazza"
                loading={false}
                emptyText=""
                hasContent
                onHideToday={() => {}}
                onHidePermanent={() => {}}
              >
                <div className="px-4 py-3 border-t border-app-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                      <Ticket size={16} className="text-app-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-app-text truncate">The Odyssey</p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {["10:30", "14:05", "19:40"].map((time) => (
                          <span
                            key={time}
                            className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-app-surface border border-app-border text-app-text"
                          >
                            {time}
                          </span>
                        ))}
                        <span className="text-[9px] text-app-muted font-bold">+5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </HomeSummaryCard>
            </div>

            {/* Nereye Gitsek? */}
            <div className={MASONRY_ITEM}>
              <HomeSummaryCard
                href="/apps/places"
                icon={Coffee}
                color="#D97706"
                title="Nereye Gitsek?"
                subtitle="Places"
                loading={false}
                emptyText=""
                hasContent
                onHideToday={() => {}}
                onHidePermanent={() => {}}
              >
                {[
                  { name: "Viyana Kahvesi Galata", meta: "Merkez · Kafe · ★ 4.7" },
                  { name: "Espressolab Karaköy", meta: "Merkez · Kafe · ★ 4.6" },
                ].map((place) => (
                  <div
                    key={place.name}
                    className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                        <Coffee size={16} className="text-app-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-app-text truncate">{place.name}</p>
                        <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">{place.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </HomeSummaryCard>
            </div>

            {/* Bugünün Etkinlikleri */}
            <div className={MASONRY_ITEM}>
              <HomeSummaryCard
                href="/apps/campus-events"
                icon={Megaphone}
                color="#00aeef"
                title="Bugünün Etkinlikleri"
                subtitle="Şehirde Neler Var?"
                loading={false}
                emptyText=""
                hasContent
                onHideToday={() => {}}
                onHidePermanent={() => {}}
              >
                <div className="px-4 py-3 border-t border-app-border flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-[48px] h-[36px] rounded-lg overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                      <Megaphone size={16} className="text-app-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black text-app-text truncate">Meydan Konseri</p>
                      <p className="text-[9px] text-app-muted font-bold truncate mt-0.5">
                        Şehir Meydanı · 20:00
                      </p>
                    </div>
                  </div>
                </div>
              </HomeSummaryCard>
            </div>
          </div>
        </div>
    </LandingPhonePreviewFrame>
  );
}
