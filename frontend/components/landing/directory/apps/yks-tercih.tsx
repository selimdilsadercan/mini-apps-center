"use client";

import React from "react";
import { MagnifyingGlass, ListChecks, ChartLineUp } from "@phosphor-icons/react";
import { DirectoryAppIcon } from "@/components/landing/directory/DirectoryAppIcon";

/** YKS Tercih — özel tanıtım sayfası tasarımı. */
export default function YksTercihDirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-16">
      <section className="space-y-6">
        <div className="flex items-start gap-5">
          <DirectoryAppIcon appId="yks-tercih" />
          <div className="min-w-0 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
              Kampüs & Yaşam
            </p>
            <h1 className="text-4xl md:text-6xl font-[1000] tracking-tight text-white leading-[1.05]">
              YKS taban puanları ve{" "}
              <span className="text-blue-400">tercih robotu</span>
            </h1>
          </div>
        </div>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          Üniversite programlarını filtrele, başarı sıralamana göre uygun bölümleri keşfet ve
          tercih listeni oluştur. Güncel taban puan verileriyle çalışır.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: MagnifyingGlass,
            title: "Akıllı arama",
            text: "Şehir, üniversite türü ve puan türüne göre programları filtrele.",
          },
          {
            icon: ChartLineUp,
            title: "Sıralama analizi",
            text: "Başarı sıralamanı gir; uygun programları anında gör.",
          },
          {
            icon: ListChecks,
            title: "Tercih listem",
            text: "Beğendiğin programları kaydet, listeni düzenle.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3"
          >
            <item.icon size={28} className="text-blue-400" weight="duotone" />
            <h2 className="text-base font-black text-white">{item.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-blue-600/20 to-zinc-900/80 p-8 md:p-12">
        <h2 className="text-2xl font-black text-white mb-3">Ücretsiz, tarayıcıda çalışır</h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          YKS Tercih, Everything ekosisteminin bir parçasıdır. Tek hesapla web ve mobilde
          erişebilirsin; tercih listen cihazlar arasında senkronize kalır.
        </p>
      </section>
    </div>
  );
}
