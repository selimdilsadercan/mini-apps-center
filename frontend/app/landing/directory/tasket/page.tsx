import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import TasketDirectoryPage from "@/components/landing/directory/apps/tasket";

export const metadata: Metadata = {
  title: "Tasket | Everything",
  description: "Notlarını ve görevlerini sepetinde topla, listelerle organize et",
  alternates: { canonical: "https://allminiapps.com/directory/tasket" },
  openGraph: {
    title: "Tasket | Everything",
    description: "Notlarını ve görevlerini sepetinde topla, listelerle organize et",
    url: "https://allminiapps.com/directory/tasket",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="tasket">
      <TasketDirectoryPage />
    </DirectoryAppShell>
  );
}
