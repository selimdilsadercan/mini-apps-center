import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import BoardGameClubsDirectoryPage from "@/components/landing/directory/apps/board-game-clubs";

export const metadata: Metadata = {
  title: "Board Game Clubs | Everything",
  description: "Oyun kütüphanenizi yönetin ve kulüp üyeleriyle etkileşime geçin.",
  alternates: { canonical: "https://allminiapps.com/directory/board-game-clubs" },
  openGraph: {
    title: "Board Game Clubs | Everything",
    description: "Oyun kütüphanenizi yönetin ve kulüp üyeleriyle etkileşime geçin.",
    url: "https://allminiapps.com/directory/board-game-clubs",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="board-game-clubs">
      <BoardGameClubsDirectoryPage />
    </DirectoryAppShell>
  );
}
