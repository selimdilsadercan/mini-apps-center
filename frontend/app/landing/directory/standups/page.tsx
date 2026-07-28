import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import StandupsDirectoryPage from "@/components/landing/directory/apps/standups";

export const metadata: Metadata = {
  title: "Standups | Everything",
  description: "Komedyenleri ve gösterileri yönetin, içerik ekleyin.",
  alternates: { canonical: "https://allminiapps.com/directory/standups" },
  openGraph: {
    title: "Standups | Everything",
    description: "Komedyenleri ve gösterileri yönetin, içerik ekleyin.",
    url: "https://allminiapps.com/directory/standups",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="standups">
      <StandupsDirectoryPage />
    </DirectoryAppShell>
  );
}
