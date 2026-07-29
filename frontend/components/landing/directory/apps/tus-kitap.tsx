"use client";

import React from "react";
import { Books, ChartLineUp, ArrowsClockwise } from "@phosphor-icons/react";
import { DirectoryAppIcon } from "@/components/landing/directory/DirectoryAppIcon";

/** TUS Kitap — özel tanıtım sayfası tasarımı. */
export default function TusKitapDirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-16">
      <section className="space-y-6">
        <div className="flex items-start gap-5">
          <DirectoryAppIcon appId="tus-kitap" />
          <div className="min-w-0 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              Kampüs & Yaşam
            </p>
            <h1 className="text-4xl md:text-6xl font-[1000] tracking-tight text-white leading-[1.05]">
              TUS kitap takibi ve{" "}
              <span className="text-red-400">bölüm sayacı</span>
            </h1>
          </div>
        </div>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          Infotus TUS konu kitaplarını bölüm bölüm takip et, tamamladığın konuları işaretle ve
          her bölüm için kaç kez tekrar ettiğini say. Temel ve klinik bilimler tek ekranda.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Books,
            title: "12 konu kitabı",
            text: "Anatomi'den Pediatri'ye temel ve klinik bilimlerin tüm Infotus kitapları.",
          },
          {
            icon: ChartLineUp,
            title: "İlerleme takibi",
            text: "Kitap ve bölüm bazında tamamlanma yüzdesi ile genel ilerleme özeti.",
          },
          {
            icon: ArrowsClockwise,
            title: "Tekrar sayacı",
            text: "Her bölüm için kaç kez çalıştığını kaydet; tekrarlarını artır.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3"
          >
            <item.icon size={28} className="text-red-400" weight="duotone" />
            <h2 className="text-base font-black text-white">{item.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-red-600/20 to-zinc-900/80 p-8 md:p-12">
        <h2 className="text-2xl font-black text-white mb-3">Ücretsiz, tarayıcıda çalışır</h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
          TUS Kitap, Everything ekosisteminin bir parçasıdır. Giriş yapmadan kullanabilir;
          ilerlemen cihazında saklanır.
        </p>
      </section>
    </div>
  );
}
