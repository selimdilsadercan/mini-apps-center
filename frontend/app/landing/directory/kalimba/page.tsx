import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import KalimbaDirectoryPage from "@/components/landing/directory/apps/kalimba";

export const metadata: Metadata = {
  title: "Kalimba | Everything",
  description: "Kalimba notalarını interaktif olarak görüntüleyin, dinleyin ve çalın.",
  alternates: { canonical: "https://allminiapps.com/directory/kalimba" },
  openGraph: {
    title: "Kalimba | Everything",
    description: "Kalimba notalarını interaktif olarak görüntüleyin, dinleyin ve çalın.",
    url: "https://allminiapps.com/directory/kalimba",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="kalimba">
      <KalimbaDirectoryPage />
    </DirectoryAppShell>
  );
}
