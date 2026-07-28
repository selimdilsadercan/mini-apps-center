import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import DigitalMenuDirectoryPage from "@/components/landing/directory/apps/digital-menu";

export const metadata: Metadata = {
  title: "Dijital Menü | Everything",
  description: "Kafelerin QR menülerini görüntüle, siparişini planla ve masadan garson çağır.",
  alternates: { canonical: "https://allminiapps.com/directory/digital-menu" },
  openGraph: {
    title: "Dijital Menü | Everything",
    description: "Kafelerin QR menülerini görüntüle, siparişini planla ve masadan garson çağır.",
    url: "https://allminiapps.com/directory/digital-menu",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="digital-menu">
      <DigitalMenuDirectoryPage />
    </DirectoryAppShell>
  );
}
