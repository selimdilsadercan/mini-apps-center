import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import EksikVarDirectoryPage from "@/components/landing/directory/apps/eksik-var";

export const metadata: Metadata = {
  title: "Eksik Var | Everything",
  description: "Alışveriş listenizi ve evinizin eksiklerini kolayca yönetin.",
  alternates: { canonical: "https://allminiapps.com/directory/eksik-var" },
  openGraph: {
    title: "Eksik Var | Everything",
    description: "Alışveriş listenizi ve evinizin eksiklerini kolayca yönetin.",
    url: "https://allminiapps.com/directory/eksik-var",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="eksik-var">
      <EksikVarDirectoryPage />
    </DirectoryAppShell>
  );
}
