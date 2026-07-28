import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import CampusEventsDirectoryPage from "@/components/landing/directory/apps/campus-events";

export const metadata: Metadata = {
  title: "Events | Everything",
  description: "Şehrindeki tüm etkinlikleri keşfet ve katıl.",
  alternates: { canonical: "https://allminiapps.com/directory/campus-events" },
  openGraph: {
    title: "Events | Everything",
    description: "Şehrindeki tüm etkinlikleri keşfet ve katıl.",
    url: "https://allminiapps.com/directory/campus-events",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="campus-events">
      <CampusEventsDirectoryPage />
    </DirectoryAppShell>
  );
}
