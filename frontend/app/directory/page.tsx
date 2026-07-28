import WebDirectoryView from "@/components/directory/WebDirectoryView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web App Directory & Uygulama Kataloğu | Everything",
  description:
    "PDF araçlarından App Store ekran görüntüsü jeneratörüne, dijital QR menülerden şehir rehberlerine kadar tüm mikro web araçları ve uygulamaları tek kataloğda.",
  keywords: [
    "web araçları",
    "mikro uygulamalar",
    "pdf araçları",
    "dijital qr menü",
    "app store screenshot maker",
    "icon export",
    "everything directory",
    "uygulama kataloğu",
  ],
  openGraph: {
    title: "Web App Directory | Everything",
    description:
      "Tüm mikro web araçları, şehir rehberleri ve işletme çözümleri tek bir dizinde.",
    url: "https://allminiapps.com/directory",
    siteName: "Everything Web Directory",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everything Web App Directory",
    description:
      "Tüm mikro web araçları, şehir rehberleri ve işletme çözümleri tek dizinde.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://allminiapps.com/directory",
  },
};

export default function DirectoryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    name: "Everything Web App Directory",
    description:
      "Tüm mikro web uygulamaları, pratik araçlar ve işletme çözümleri kataloğu.",
    url: "https://allminiapps.com/directory",
    publisher: {
      "@type": "Organization",
      name: "Everything Center",
      url: "https://allminiapps.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WebDirectoryView />
    </>
  );
}
