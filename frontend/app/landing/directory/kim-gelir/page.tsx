import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import KimGelirDirectoryPage from "@/components/landing/directory/apps/kim-gelir";

export const metadata: Metadata = {
  title: "Ne Yapsak? | Everything",
  description: "Hızlıca aktivite daveti veya anket oluştur, arkadaşlarını davet et.",
  alternates: { canonical: "https://allminiapps.com/directory/kim-gelir" },
  openGraph: {
    title: "Ne Yapsak? | Everything",
    description: "Hızlıca aktivite daveti veya anket oluştur, arkadaşlarını davet et.",
    url: "https://allminiapps.com/directory/kim-gelir",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="kim-gelir">
      <KimGelirDirectoryPage />
    </DirectoryAppShell>
  );
}
