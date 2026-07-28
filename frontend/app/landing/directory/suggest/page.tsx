import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import SuggestDirectoryPage from "@/components/landing/directory/apps/suggest";

export const metadata: Metadata = {
  title: "Suggest | Everything",
  description: "Arkadaşlarına film, dizi, oyun veya mekan tavsiye et.",
  alternates: { canonical: "https://allminiapps.com/directory/suggest" },
  openGraph: {
    title: "Suggest | Everything",
    description: "Arkadaşlarına film, dizi, oyun veya mekan tavsiye et.",
    url: "https://allminiapps.com/directory/suggest",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="suggest">
      <SuggestDirectoryPage />
    </DirectoryAppShell>
  );
}
