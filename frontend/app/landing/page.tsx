import LandingPage from "@/components/landing/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Everything - Mini Apps Center | Tüm Günlük Araçlarınız Tek Bir Yerde",
  description: "Oyunlardan verimlilik araçlarına, finans takipçilerinden kişisel yaşam asistanlarına kadar her şey tek bir süper uygulamada. Everything Mini Apps Center ile dijital hayatınızı sadeleştirin.",
  keywords: ["mini apps", "süper uygulama", "super app", "verimlilik araçları", "mini oyunlar", "günlük araçlar", "everything center"],
  openGraph: {
    title: "Everything - Mini Apps Center",
    description: "Tüm günlük dijital ihtiyaçlarınız için tek merkez - Oyunlar, Araçlar, Verimlilik ve daha fazlası.",
    url: "https://allminiapps.com",
    siteName: "Everything Mini Apps Center",
    images: [
      {
        url: "/og-image.png", // We should ensure this exists or use a placeholder
        width: 1200,
        height: 630,
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Everything - Mini Apps Center",
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
