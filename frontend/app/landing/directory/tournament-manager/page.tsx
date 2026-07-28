import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TournamentManagerDirectoryPage from "@/components/landing/directory/apps/tournament-manager";

export const metadata: Metadata = {
  title: "Turnuva Merkezi | Everything",
  description: "Lig ve Eleme usulü turnuvalar oluştur ve yönet",
  alternates: { canonical: "https://allminiapps.com/directory/tournament-manager" },
  openGraph: {
    title: "Turnuva Merkezi | Everything",
    description: "Lig ve Eleme usulü turnuvalar oluştur ve yönet",
    url: "https://allminiapps.com/directory/tournament-manager",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tournament-manager">
      <TournamentManagerDirectoryPage />
    </DirectoryAppShell>
  );
}
