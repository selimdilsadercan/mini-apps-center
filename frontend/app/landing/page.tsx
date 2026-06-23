import LandingPage from "@/components/landing/LandingPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Everything | Tüm Günlük Araçlarınız Tek Bir Yerde",
  description: "Verimlilik araçlarından finans takipçilerine, kişisel yaşam asistanlarına kadar her şey tek bir noktada. Everything ile dijital hayatınızı sadeleştirin.",
  keywords: ["toolkit", "araç kutusu", "verimlilik araçları", "günlük araçlar", "everything center"],
  openGraph: {
    title: "Everything",
    description: "Tüm günlük dijital ihtiyaçlarınız için tek merkez - Araçlar, Verimlilik ve daha fazlası.",
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
