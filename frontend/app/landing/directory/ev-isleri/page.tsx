import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import EvIsleriDirectoryPage from "@/components/landing/directory/apps/ev-isleri";

export const metadata: Metadata = {
  title: "Ev İşleri | Everything",
  description: "Haftalık ev işi board'u oluştur, görevleri kişilere ata ve tamamla.",
  alternates: { canonical: "https://allminiapps.com/directory/ev-isleri" },
  openGraph: {
    title: "Ev İşleri | Everything",
    description: "Haftalık ev işi board'u oluştur, görevleri kişilere ata ve tamamla.",
    url: "https://allminiapps.com/directory/ev-isleri",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="ev-isleri">
      <EvIsleriDirectoryPage />
    </DirectoryAppShell>
  );
}
