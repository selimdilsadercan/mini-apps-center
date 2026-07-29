import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TusKitapDirectoryPage from "@/components/landing/directory/apps/tus-kitap";

export const metadata: Metadata = {
  title: "TUS Kitap Takibi ve Bölüm Sayacı | Everything",
  description:
    "Infotus TUS konu kitapları çalışma takibi, bölüm ilerlemesi ve tekrar sayacı. Temel ve klinik bilimler.",
  alternates: { canonical: "https://allminiapps.com/directory/tus-kitap" },
  openGraph: {
    title: "TUS Kitap Takibi | Everything",
    description: "Infotus TUS kitapları için bölüm takibi ve tekrar sayacı.",
    url: "https://allminiapps.com/directory/tus-kitap",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tus-kitap">
      <TusKitapDirectoryPage />
    </DirectoryAppShell>
  );
}
