import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import BusinessPageDirectoryPage from "@/components/landing/directory/apps/business-page";

export const metadata: Metadata = {
  title: "İşletme Sayfası | Everything",
  description: "İşletmenizin dijital kimliğini ve Linktree tarzı profilini yönetin.",
  alternates: { canonical: "https://allminiapps.com/directory/business-page" },
  openGraph: {
    title: "İşletme Sayfası | Everything",
    description: "İşletmenizin dijital kimliğini ve Linktree tarzı profilini yönetin.",
    url: "https://allminiapps.com/directory/business-page",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="business-page">
      <BusinessPageDirectoryPage />
    </DirectoryAppShell>
  );
}
