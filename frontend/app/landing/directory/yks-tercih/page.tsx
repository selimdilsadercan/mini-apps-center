import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import YksTercihDirectoryPage from "@/components/landing/directory/apps/yks-tercih";

export const metadata: Metadata = {
  title: "YKS Taban Puanları ve Tercih Robotu | Everything",
  description:
    "YKS üniversite taban puanları, başarı sıralamaları ve tercih robotu. Programları filtrele, tercih listeni oluştur.",
  alternates: { canonical: "https://allminiapps.com/directory/yks-tercih" },
  openGraph: {
    title: "YKS Taban Puanları | Everything",
    description: "YKS tercih robotu ve güncel taban puan verileri.",
    url: "https://allminiapps.com/directory/yks-tercih",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="yks-tercih">
      <YksTercihDirectoryPage />
    </DirectoryAppShell>
  );
}
