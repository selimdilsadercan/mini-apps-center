"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import Header from "../Header";
import Footer from "../Footer";
import { DirectoryOpenAppButton } from "./DirectoryOpenAppButton";
import { getPublishedAppById } from "@/lib/app-catalog";

interface DirectoryAppShellProps {
  appId: string;
  children: React.ReactNode;
}

/** Statik uygulama tanıtım sayfaları için ortak kabuk (Header + Footer). */
export default function DirectoryAppShell({ appId, children }: DirectoryAppShellProps) {
  const app = getPublishedAppById(appId);

  // Google için Structured Data (JSON-LD)
  const jsonLd = app ? {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": app.name,
    "description": app.description,
    "applicationCategory": app.category,
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Everything",
      "url": "https://allminiapps.com"
    }
  } : null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Everything",
        "item": "https://allminiapps.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Uygulamalar",
        "item": "https://allminiapps.com/directory"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": app?.name || "Uygulama",
        "item": `https://allminiapps.com/directory/${appId}`
      }
    ]
  };

  // FAQ Schema (Eğer .md dosyasından gelen SSS'ler varsa buraya eklenebilir)
  // Şimdilik genel uygulama SSS'lerini ekliyoruz
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `${app?.name} ücretsiz mi?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Evet, Everything platformundaki ${app?.name} uygulaması tamamen ücretsizdir.`
        }
      },
      {
        "@type": "Question",
        "name": `${app?.name} nasıl kullanılır?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Uygulamayı aç butonuna basarak tarayıcı üzerinden anında kullanmaya başlayabilirsiniz."
        }
      }
    ]
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-x-hidden antialiased">
      {/* SEO Schemas */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <Header />

      <main className="pt-28">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-white mb-10 transition-colors"
          >
            <ArrowLeft size={16} />
            Kataloğa dön
          </Link>
        </div>

        {children}

        <div className="max-w-5xl mx-auto px-6 pb-16 pt-8">
          <DirectoryOpenAppButton appId={appId} />
        </div>
      </main>

      <Footer hideCTA />
    </div>
  );
}
