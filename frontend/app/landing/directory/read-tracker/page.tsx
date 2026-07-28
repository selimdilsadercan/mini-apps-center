import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import ReadTrackerDirectoryPage from "@/components/landing/directory/apps/read-tracker";

export const metadata: Metadata = {
  title: "Oku Oku | Everything",
  description: "Kitap okuma alışkanlığı kazan, kitaplarını listele ve haftalık okuma hedefleri belirle.",
  alternates: { canonical: "https://allminiapps.com/directory/read-tracker" },
  openGraph: {
    title: "Oku Oku | Everything",
    description: "Kitap okuma alışkanlığı kazan, kitaplarını listele ve haftalık okuma hedefleri belirle.",
    url: "https://allminiapps.com/directory/read-tracker",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="read-tracker">
      <ReadTrackerDirectoryPage />
    </DirectoryAppShell>
  );
}
