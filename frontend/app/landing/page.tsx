import LandingPage from "@/components/landing/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Everything | Şehrini Keşfet, Günlüğünü Yönet",
  description: "Kahramanmaraş ve ötesi için super app. Sinema seansları, mekan rehberleri, etkinlikler ve 60+ günlük yaşam aracı — tek hesap, tek merkez.",
  keywords: ["toolkit", "araç kutusu", "verimlilik araçları", "günlük araçlar", "everything center"],
  openGraph: {
    title: "Everything",
    description: "Şehir keşfi ve günlük yaşam araçları tek merkezde — sinema, mekanlar, rutinler ve daha fazlası.",
    url: "https://allminiapps.com",
    siteName: "Everything",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everything",
    description: "Tüm günlük dijital ihtiyaçlarınız için tek merkez.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://allminiapps.com",
  },
};

export default function Page() {
  return <LandingPage />;
}
