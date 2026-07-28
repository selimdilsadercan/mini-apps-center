import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import GymDirectoryPage from "@/components/landing/directory/apps/gym";

export const metadata: Metadata = {
  title: "Gym | Everything",
  description: "Antrenmanlarını kaydet, rutinler oluştur ve ilerlemeni takip et.",
  alternates: { canonical: "https://allminiapps.com/directory/gym" },
  openGraph: {
    title: "Gym | Everything",
    description: "Antrenmanlarını kaydet, rutinler oluştur ve ilerlemeni takip et.",
    url: "https://allminiapps.com/directory/gym",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="gym">
      <GymDirectoryPage />
    </DirectoryAppShell>
  );
}
