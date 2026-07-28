import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import StudyDirectoryPage from "@/components/landing/directory/apps/study";

export const metadata: Metadata = {
  title: "Study | Everything",
  description: "Haftalık ders çalışma planını oluştur ve kendi başına takip et.",
  alternates: { canonical: "https://allminiapps.com/directory/study" },
  openGraph: {
    title: "Study | Everything",
    description: "Haftalık ders çalışma planını oluştur ve kendi başına takip et.",
    url: "https://allminiapps.com/directory/study",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="study">
      <StudyDirectoryPage />
    </DirectoryAppShell>
  );
}
