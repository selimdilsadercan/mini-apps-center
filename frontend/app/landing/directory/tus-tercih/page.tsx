import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TusTercihDirectoryPage from "@/components/landing/directory/apps/tus-tercih";

export const metadata: Metadata = {
  title: "TUS Taban Puanları ve Tercih Robotu | Everything",
  description:
    "TUS uzmanlık dalı taban puanları, kurum karşılaştırması ve tercih robotu. Branşları filtrele, tercih listeni oluştur.",
  alternates: { canonical: "https://allminiapps.com/directory/tus-tercih" },
  openGraph: {
    title: "TUS Taban Puanları | Everything",
    description: "TUS tercih robotu ve güncel taban puan verileri.",
    url: "https://allminiapps.com/directory/tus-tercih",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tus-tercih">
      <TusTercihDirectoryPage />
    </DirectoryAppShell>
  );
}
