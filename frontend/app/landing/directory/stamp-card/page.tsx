import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import StampCardDirectoryPage from "@/components/landing/directory/apps/stamp-card";

export const metadata: Metadata = {
  title: "Müdavim Kartı | Everything",
  description: "Anlaşmalı işletmelerden kaşe topla, ücretsiz hediye kazan.",
  alternates: { canonical: "https://allminiapps.com/directory/stamp-card" },
  openGraph: {
    title: "Müdavim Kartı | Everything",
    description: "Anlaşmalı işletmelerden kaşe topla, ücretsiz hediye kazan.",
    url: "https://allminiapps.com/directory/stamp-card",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="stamp-card">
      <StampCardDirectoryPage />
    </DirectoryAppShell>
  );
}
