import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import FeedbackBoardDirectoryPage from "@/components/landing/directory/apps/feedback-board";

export const metadata: Metadata = {
  title: "Feedback Board | Everything",
  description: "Müşterilerinizden gelen geri bildirimleri tek bir yerden takip edin.",
  alternates: { canonical: "https://allminiapps.com/directory/feedback-board" },
  openGraph: {
    title: "Feedback Board | Everything",
    description: "Müşterilerinizden gelen geri bildirimleri tek bir yerden takip edin.",
    url: "https://allminiapps.com/directory/feedback-board",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="feedback-board">
      <FeedbackBoardDirectoryPage />
    </DirectoryAppShell>
  );
}
