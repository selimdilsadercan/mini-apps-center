import DirectoryPage from "@/components/landing/DirectoryPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uygulama Kataloğu | Everything",
  description:
    "PDF araçlarından YKS tercih robotuna, dijital menülerden şehir rehberlerine kadar tüm mini uygulamalar tek katalogda.",
  keywords: [
    "web araçları",
    "mikro uygulamalar",
    "uygulama kataloğu",
    "everything directory",
    "yks tercih",
    "pdf araçları",
  ],
  openGraph: {
    title: "Uygulama Kataloğu | Everything",
    description: "Everything ekosistemindeki tüm mini uygulamalar ve web araçları.",
    url: "https://allminiapps.com/directory",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
  alternates: {
    canonical: "https://allminiapps.com/directory",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Everything Uygulama Kataloğu",
    description: "Mini uygulamalar, pratik web araçları ve işletme çözümleri.",
    url: "https://allminiapps.com/directory",
    isPartOf: {
      "@type": "WebSite",
      name: "Everything",
      url: "https://allminiapps.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DirectoryPage />
    </>
  );
}
