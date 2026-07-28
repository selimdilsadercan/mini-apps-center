"use client";

import React from "react";
import { DirectoryAppIcon } from "@/components/landing/directory/DirectoryAppIcon";

/**
 * Ajanda — tanıtım sayfası.
 * Bu dosyayı özgürce düzenleyin; her uygulamanın tasarımı ayrıdır.
 */
export default function RutinlerDirectoryPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-10">
      <section className="space-y-4">
        <div className="flex items-start gap-4">
          <DirectoryAppIcon appId="rutinler" />
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
              Kampüslülere Özel
            </p>
            <h1 className="text-4xl md:text-5xl font-[1000] tracking-tight text-white">
              Ajanda
            </h1>
          </div>
        </div>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          Günlük rutinlerini takip et ve yapılacak işlerini yönet.
        </p>
      </section>

      <div className="prose prose-invert max-w-none">
        <p className="text-zinc-400 leading-relaxed mb-4">Everything super app içindeki Ajanda uygulaması ile günlük rutinlerini takip et ve yapılacak işlerini yönet.</p>

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
