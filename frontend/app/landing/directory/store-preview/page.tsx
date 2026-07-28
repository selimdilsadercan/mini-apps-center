import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import StorePreviewDirectoryPage from "@/components/landing/directory/apps/store-preview";

export const metadata: Metadata = {
  title: "Store Preview | Everything",
  description: "App Store ekran görüntüleri için site önizleme ve capture aracı.",
  alternates: { canonical: "https://allminiapps.com/directory/store-preview" },
  openGraph: {
    title: "Store Preview | Everything",
    description: "App Store ekran görüntüleri için site önizleme ve capture aracı.",
    url: "https://allminiapps.com/directory/store-preview",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="store-preview">
      <StorePreviewDirectoryPage />
    </DirectoryAppShell>
  );
}
