import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TasarrufChallengesDirectoryPage from "@/components/landing/directory/apps/tasarruf-challenges";

export const metadata: Metadata = {
  title: "Tasarruf | Everything",
  description: "Tasarruf önerilerini takip et, harcamalarını azalt ve hedeflerine ulaş.",
  alternates: { canonical: "https://allminiapps.com/directory/tasarruf-challenges" },
  openGraph: {
    title: "Tasarruf | Everything",
    description: "Tasarruf önerilerini takip et, harcamalarını azalt ve hedeflerine ulaş.",
    url: "https://allminiapps.com/directory/tasarruf-challenges",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tasarruf-challenges">
      <TasarrufChallengesDirectoryPage />
    </DirectoryAppShell>
  );
}
