import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import BuyukMaclarDirectoryPage from "@/components/landing/directory/apps/buyuk-maclar";

export const metadata: Metadata = {
  title: "Büyük Maçlar | Everything",
  description: "Dünya Kupası ve diğer büyük turnuvaların canlı / yaklaşan maçları.",
  alternates: { canonical: "https://allminiapps.com/directory/buyuk-maclar" },
  openGraph: {
    title: "Büyük Maçlar | Everything",
    description: "Dünya Kupası ve diğer büyük turnuvaların canlı / yaklaşan maçları.",
    url: "https://allminiapps.com/directory/buyuk-maclar",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="buyuk-maclar">
      <BuyukMaclarDirectoryPage />
    </DirectoryAppShell>
  );
}
