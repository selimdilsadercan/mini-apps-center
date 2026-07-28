import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import MemedexDirectoryPage from "@/components/landing/directory/apps/memedex";

export const metadata: Metadata = {
  title: "Memedex | Everything",
  description: "Trend meme'ler, doğru kullanım bağlamları ve hazır Giphy template'leri.",
  alternates: { canonical: "https://allminiapps.com/directory/memedex" },
  openGraph: {
    title: "Memedex | Everything",
    description: "Trend meme'ler, doğru kullanım bağlamları ve hazır Giphy template'leri.",
    url: "https://allminiapps.com/directory/memedex",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="memedex">
      <MemedexDirectoryPage />
    </DirectoryAppShell>
  );
}
