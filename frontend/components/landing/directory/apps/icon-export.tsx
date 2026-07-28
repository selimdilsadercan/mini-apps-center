"use client";

import React from "react";
import { DirectoryAppIcon } from "@/components/landing/directory/DirectoryAppIcon";

/**
 * Icon Export — tanıtım sayfası.
 * Bu dosyayı özgürce düzenleyin; her uygulamanın tasarımı ayrıdır.
 */
export default function IconExportDirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-10">
      <section className="space-y-4">
        <div className="flex items-start gap-4">
          <DirectoryAppIcon appId="icon-export" />
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
              Pratik Araçlar
            </p>
            <h1 className="text-4xl md:text-5xl font-[1000] tracking-tight text-white">
              Icon Export
            </h1>
          </div>
        </div>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          Tek PNG'den iOS, Android ve web için tüm ikon boyutlarını ZIP olarak indir.
        </p>
      </section>

      <div className="prose prose-invert max-w-none">
        <p className="text-zinc-400 leading-relaxed mb-4">Everything super app içindeki Icon Export uygulaması ile tek png'den ios, android ve web için tüm ikon boyutlarını zip olarak indir.</p>

<h3 className="text-xl font-bold text-white mt-8 mb-4">Özellikler</h3>
<li className="text-zinc-400 ml-4 mb-2">Tamamen ücretsiz</li>
<li className="text-zinc-400 ml-4 mb-2">Kurulum gerektirmez</li>
<li className="text-zinc-400 ml-4 mb-2">Mobil ve web uyumlu</li>
<li className="text-zinc-400 ml-4 mb-2">Hızlı ve güvenli</li>

<h3 className="text-xl font-bold text-white mt-8 mb-4">Nasıl Kullanılır?</h3>
<p className="text-zinc-400 leading-relaxed mb-4">Uygulamayı aç butonuna tıklayarak doğrudan tarayıcı üzerinden kullanmaya başlayabilirsiniz. Hesabınızla giriş yaparak verilerinizin senkronize kalmasını sağlayabilirsiniz.</p>
      </div>
    </div>
  );
}
