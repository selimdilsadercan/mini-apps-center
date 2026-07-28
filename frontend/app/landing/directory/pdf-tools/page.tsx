import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import PdfToolsDirectoryPage from "@/components/landing/directory/apps/pdf-tools";

export const metadata: Metadata = {
  title: "Pdf Tools | Everything",
  description: "PDF sayfalarını düzenle, yeniden sırala ve sil. Tamamen cihazında çalışır.",
  alternates: { canonical: "https://allminiapps.com/directory/pdf-tools" },
  openGraph: {
    title: "Pdf Tools | Everything",
    description: "PDF sayfalarını düzenle, yeniden sırala ve sil. Tamamen cihazında çalışır.",
    url: "https://allminiapps.com/directory/pdf-tools",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="pdf-tools">
      <PdfToolsDirectoryPage />
    </DirectoryAppShell>
  );
}
