"use client";

import React from "react";
import { Checks, Camera, ImageSquare, ChatTeardropDots, Palette } from "@phosphor-icons/react";

const TOOLS = [
  { name: "Tasket", desc: "Görev ve not yönetimi", color: "#20c997", Icon: Checks },
  { name: "Store Preview", desc: "App Store ekran görüntüsü", color: "#7C3AED", Icon: Camera },
  { name: "Icon Export", desc: "Tüm ikon boyutları ZIP", color: "#0EA5E9", Icon: ImageSquare },
  { name: "Icon Set Guide", desc: "İkon seti rehberi", color: "#F59E0B", Icon: Palette },
  { name: "Feedback Board", desc: "Geri bildirim panosu", color: "#6366F1", Icon: ChatTeardropDots },
];

export default function LandingBrowserDevPreview() {
  return (
    <div className="p-5 bg-zinc-950 h-full flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-black text-white">Geliştiriciler için</h2>
        <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
          Uygulamanı yayına hazırlayan web araçları
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map((tool) => (
          <div
            key={tool.name}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-2"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: tool.color }}
            >
              <tool.Icon size={18} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-black text-zinc-100">{tool.name}</p>
              <p className="text-[9px] text-zinc-500 font-medium leading-snug mt-0.5">{tool.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Stüdyo</p>
        <p className="text-[11px] text-zinc-300 font-medium mt-1">
          Tüm geliştirici araçlarına hub üzerinden tek tıkla eriş.
        </p>
      </div>
    </div>
  );
}
