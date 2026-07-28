import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import IskambilDirectoryPage from "@/components/landing/directory/apps/iskambil";

export const metadata: Metadata = {
  title: "Card Game Codex | Everything",
  description: "Klasik kart oyunları için kurallar ve detaylı rehberler.",
  alternates: { canonical: "https://allminiapps.com/directory/iskambil" },
  openGraph: {
    title: "Card Game Codex | Everything",
    description: "Klasik kart oyunları için kurallar ve detaylı rehberler.",
    url: "https://allminiapps.com/directory/iskambil",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="iskambil">
      <IskambilDirectoryPage />
    </DirectoryAppShell>
  );
}
