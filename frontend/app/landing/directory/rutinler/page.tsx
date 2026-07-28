import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import RutinlerDirectoryPage from "@/components/landing/directory/apps/rutinler";

export const metadata: Metadata = {
  title: "Ajanda | Everything",
  description: "Günlük rutinlerini takip et ve yapılacak işlerini yönet.",
  alternates: { canonical: "https://allminiapps.com/directory/rutinler" },
  openGraph: {
    title: "Ajanda | Everything",
    description: "Günlük rutinlerini takip et ve yapılacak işlerini yönet.",
    url: "https://allminiapps.com/directory/rutinler",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="rutinler">
      <RutinlerDirectoryPage />
    </DirectoryAppShell>
  );
}
