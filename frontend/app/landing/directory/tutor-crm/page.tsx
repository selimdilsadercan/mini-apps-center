import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TutorCrmDirectoryPage from "@/components/landing/directory/apps/tutor-crm";

export const metadata: Metadata = {
  title: "Tutor Place | Everything",
  description: "Öğrenci kayıtlarını, ders programlarını ve ödemeleri organize edin.",
  alternates: { canonical: "https://allminiapps.com/directory/tutor-crm" },
  openGraph: {
    title: "Tutor Place | Everything",
    description: "Öğrenci kayıtlarını, ders programlarını ve ödemeleri organize edin.",
    url: "https://allminiapps.com/directory/tutor-crm",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tutor-crm">
      <TutorCrmDirectoryPage />
    </DirectoryAppShell>
  );
}
