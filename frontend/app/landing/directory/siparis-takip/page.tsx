import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import SiparisTakipDirectoryPage from "@/components/landing/directory/apps/siparis-takip";

export const metadata: Metadata = {
  title: "Sipariş Takip | Everything",
  description: "Müşterilerinizin siparişlerini, detaylarını ve ödemelerini kolayca yönetin.",
  alternates: { canonical: "https://allminiapps.com/directory/siparis-takip" },
  openGraph: {
    title: "Sipariş Takip | Everything",
    description: "Müşterilerinizin siparişlerini, detaylarını ve ödemelerini kolayca yönetin.",
    url: "https://allminiapps.com/directory/siparis-takip",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="siparis-takip">
      <SiparisTakipDirectoryPage />
    </DirectoryAppShell>
  );
}
