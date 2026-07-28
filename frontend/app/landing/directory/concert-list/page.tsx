import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import ConcertListDirectoryPage from "@/components/landing/directory/apps/concert-list";

export const metadata: Metadata = {
  title: "My Concert List | Everything",
  description: "Gittiğin konserleri tarihleri ve notlarınla takip et.",
  alternates: { canonical: "https://allminiapps.com/directory/concert-list" },
  openGraph: {
    title: "My Concert List | Everything",
    description: "Gittiğin konserleri tarihleri ve notlarınla takip et.",
    url: "https://allminiapps.com/directory/concert-list",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="concert-list">
      <ConcertListDirectoryPage />
    </DirectoryAppShell>
  );
}
