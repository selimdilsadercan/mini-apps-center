import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import FilmGraphDirectoryPage from "@/components/landing/directory/apps/film-graph";

export const metadata: Metadata = {
  title: "Film Keşfet | Everything",
  description: "Popüler filmleri keşfet, listene ekle ve oyuncu bağlantılarını graph'ta gör.",
  alternates: { canonical: "https://allminiapps.com/directory/film-graph" },
  openGraph: {
    title: "Film Keşfet | Everything",
    description: "Popüler filmleri keşfet, listene ekle ve oyuncu bağlantılarını graph'ta gör.",
    url: "https://allminiapps.com/directory/film-graph",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="film-graph">
      <FilmGraphDirectoryPage />
    </DirectoryAppShell>
  );
}
