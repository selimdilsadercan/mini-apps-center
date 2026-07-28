import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import PlacesDirectoryPage from "@/components/landing/directory/apps/places";

export const metadata: Metadata = {
  title: "Places | Everything",
  description: "Şehirdeki en iyi kafe ve restoranları keşfet, menülerini incele ve favorilerini kaydet.",
  alternates: { canonical: "https://allminiapps.com/directory/places" },
  openGraph: {
    title: "Places | Everything",
    description: "Şehirdeki en iyi kafe ve restoranları keşfet, menülerini incele ve favorilerini kaydet.",
    url: "https://allminiapps.com/directory/places",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="places">
      <PlacesDirectoryPage />
    </DirectoryAppShell>
  );
}
