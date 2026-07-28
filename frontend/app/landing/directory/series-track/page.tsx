import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import SeriesTrackDirectoryPage from "@/components/landing/directory/apps/series-track";

export const metadata: Metadata = {
  title: "SeriesTrack | Everything",
  description: "İzlediğin dizileri takip et, bölümleri işaretle ve ilerlemeni gör.",
  alternates: { canonical: "https://allminiapps.com/directory/series-track" },
  openGraph: {
    title: "SeriesTrack | Everything",
    description: "İzlediğin dizileri takip et, bölümleri işaretle ve ilerlemeni gör.",
    url: "https://allminiapps.com/directory/series-track",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="series-track">
      <SeriesTrackDirectoryPage />
    </DirectoryAppShell>
  );
}
