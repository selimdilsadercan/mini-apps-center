import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import IconExportDirectoryPage from "@/components/landing/directory/apps/icon-export";

export const metadata: Metadata = {
  title: "Icon Export | Everything",
  description: "Tek PNG'den iOS, Android ve web için tüm ikon boyutlarını ZIP olarak indir.",
  alternates: { canonical: "https://allminiapps.com/directory/icon-export" },
  openGraph: {
    title: "Icon Export | Everything",
    description: "Tek PNG'den iOS, Android ve web için tüm ikon boyutlarını ZIP olarak indir.",
    url: "https://allminiapps.com/directory/icon-export",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="icon-export">
      <IconExportDirectoryPage />
    </DirectoryAppShell>
  );
}
