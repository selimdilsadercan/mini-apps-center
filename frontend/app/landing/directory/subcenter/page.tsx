import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import SubcenterDirectoryPage from "@/components/landing/directory/apps/subcenter";

export const metadata: Metadata = {
  title: "Subcenter | Everything",
  description: "Tüm aboneliklerini ve harcamalarını takip et.",
  alternates: { canonical: "https://allminiapps.com/directory/subcenter" },
  openGraph: {
    title: "Subcenter | Everything",
    description: "Tüm aboneliklerini ve harcamalarını takip et.",
    url: "https://allminiapps.com/directory/subcenter",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="subcenter">
      <SubcenterDirectoryPage />
    </DirectoryAppShell>
  );
}
