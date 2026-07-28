import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import WorkplacesDirectoryPage from "@/components/landing/directory/apps/workplaces";

export const metadata: Metadata = {
  title: "Workplaces | Everything",
  description: "Çalışmaya uygun kütüphane ve kafeleri keşfet, yenilerini öner.",
  alternates: { canonical: "https://allminiapps.com/directory/workplaces" },
  openGraph: {
    title: "Workplaces | Everything",
    description: "Çalışmaya uygun kütüphane ve kafeleri keşfet, yenilerini öner.",
    url: "https://allminiapps.com/directory/workplaces",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="workplaces">
      <WorkplacesDirectoryPage />
    </DirectoryAppShell>
  );
}
