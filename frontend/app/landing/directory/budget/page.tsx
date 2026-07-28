import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import BudgetDirectoryPage from "@/components/landing/directory/apps/budget";

export const metadata: Metadata = {
  title: "Budget | Everything",
  description: "Bireysel ve ortak bütçe takibi, arkadaşlarınla kolay borç bölüşümü.",
  alternates: { canonical: "https://allminiapps.com/directory/budget" },
  openGraph: {
    title: "Budget | Everything",
    description: "Bireysel ve ortak bütçe takibi, arkadaşlarınla kolay borç bölüşümü.",
    url: "https://allminiapps.com/directory/budget",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="budget">
      <BudgetDirectoryPage />
    </DirectoryAppShell>
  );
}
