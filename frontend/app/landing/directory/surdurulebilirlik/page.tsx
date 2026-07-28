import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import SurdurulebilirlikDirectoryPage from "@/components/landing/directory/apps/surdurulebilirlik";

export const metadata: Metadata = {
  title: "Sürdürülebiliriz | Everything",
  description: "Doğa dostu adımlarını takip et, dünyamıza katkıda bulun.",
  alternates: { canonical: "https://allminiapps.com/directory/surdurulebilirlik" },
  openGraph: {
    title: "Sürdürülebiliriz | Everything",
    description: "Doğa dostu adımlarını takip et, dünyamıza katkıda bulun.",
    url: "https://allminiapps.com/directory/surdurulebilirlik",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="surdurulebilirlik">
      <SurdurulebilirlikDirectoryPage />
    </DirectoryAppShell>
  );
}
