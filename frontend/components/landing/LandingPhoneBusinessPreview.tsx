"use client";

import React from "react";
import { QrCode, Cards, Storefront, Megaphone, ChatTeardropDots } from "@phosphor-icons/react";
import { LandingPhonePreviewFrame } from "./LandingPhonePreviewFrame";

const TOOLS = [
  {
    name: "Dijital Menü",
    desc: "QR ile menü paylaş",
    color: "#10B981",
    Icon: QrCode,
    meta: "42 ürün · 6 kategori",
  },
  {
    name: "Müdavim Kartı",
    desc: "Dijital damga kampanyası",
    color: "#F43F5E",
    Icon: Cards,
    meta: "8 kahve = 1 bedava",
  },
  {
    name: "İşletme Sayfası",
    desc: "Dijital vitrin ve profil",
    color: "#6366F1",
    Icon: Storefront,
    meta: "1.2k görüntülenme",
  },
  {
    name: "Kampanyalar",
    desc: "Uygulama içi fırsatlar",
    color: "#F59E0B",
    Icon: Megaphone,
    meta: "2 aktif kampanya",
  },
  {
    name: "Feedback",
    desc: "Müşteri yorumları",
    color: "#8B5CF6",
    Icon: ChatTeardropDots,
    meta: "★ 4.8 ortalama",
  },
];

export default function LandingPhoneBusinessPreview() {
  return (
    <LandingPhonePreviewFrame className="space-y-4">
        <div>
          <h1 className="text-base font-black text-app-text tracking-tight leading-none">
            İşletmeler için
          </h1>
          <p className="text-[10px] font-medium text-app-muted mt-1">
            Menü, müdavim kartı ve dijital vitrin
          </p>
        </div>

        <div className="rounded-2xl border border-app-border bg-app-surface p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Storefront size={24} weight="fill" className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-app-text truncate">Viyana Kahvesi</p>
              <p className="text-[10px] text-app-muted font-bold">Founder Plan · Aktif</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Görüntülenme", value: "1.2k" },
              { label: "Menü tık", value: "84" },
              { label: "Damga", value: "126" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-app-surface-muted border border-app-border p-2 text-center">
                <p className="text-[11px] font-black text-app-text">{stat.value}</p>
                <p className="text-[8px] text-app-muted font-bold uppercase mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center gap-3 p-3 rounded-2xl border border-app-border bg-app-surface"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: tool.color }}
              >
                <tool.Icon size={18} weight="fill" className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-black text-app-text truncate">{tool.name}</p>
                <p className="text-[9px] text-app-muted font-bold truncate">{tool.meta}</p>
              </div>
            </div>
          ))}
        </div>
    </LandingPhonePreviewFrame>
  );
}
