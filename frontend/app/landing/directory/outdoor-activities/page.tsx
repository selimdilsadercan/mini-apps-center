import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import OutdoorActivitiesDirectoryPage from "@/components/landing/directory/apps/outdoor-activities";

export const metadata: Metadata = {
  title: "Aktiviteler | Everything",
  description: "At binme, kano, paintball, gokart gibi açık hava aktivitelerini ve şehirdeki mekanları keşfet.",
  alternates: { canonical: "https://allminiapps.com/directory/outdoor-activities" },
  openGraph: {
    title: "Aktiviteler | Everything",
    description: "At binme, kano, paintball, gokart gibi açık hava aktivitelerini ve şehirdeki mekanları keşfet.",
    url: "https://allminiapps.com/directory/outdoor-activities",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="outdoor-activities">
      <OutdoorActivitiesDirectoryPage />
    </DirectoryAppShell>
  );
}
