import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import DailyWeatherDirectoryPage from "@/components/landing/directory/apps/daily-weather";

export const metadata: Metadata = {
  title: "Daily Weather | Everything",
  description: "Her sabah İstanbul hava durumu bildirimi al.",
  alternates: { canonical: "https://allminiapps.com/directory/daily-weather" },
  openGraph: {
    title: "Daily Weather | Everything",
    description: "Her sabah İstanbul hava durumu bildirimi al.",
    url: "https://allminiapps.com/directory/daily-weather",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="daily-weather">
      <DailyWeatherDirectoryPage />
    </DirectoryAppShell>
  );
}
