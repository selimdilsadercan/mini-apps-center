import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import GamingHubDirectoryPage from "@/components/landing/directory/apps/gaming-hub";

export const metadata: Metadata = {
  title: "Gaming Hub | Everything",
  description: "Oynayacak oyun bul, arkadaşlarınla keşfet, fiyat takibi yap ve sağlıklı oyun alışkanlıkları oluştur.",
  alternates: { canonical: "https://allminiapps.com/directory/gaming-hub" },
  openGraph: {
    title: "Gaming Hub | Everything",
    description: "Oynayacak oyun bul, arkadaşlarınla keşfet, fiyat takibi yap ve sağlıklı oyun alışkanlıkları oluştur.",
    url: "https://allminiapps.com/directory/gaming-hub",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="gaming-hub">
      <GamingHubDirectoryPage />
    </DirectoryAppShell>
  );
}
