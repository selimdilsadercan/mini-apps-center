import UpdatesPage from "@/components/landing/UpdatesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Güncellemeler | Everything",
  description:
    "Everything'deki yeni özellikler, iyileştirmeler ve duyurular. Şehir keşfi, günlük araçlar ve işletme modüllerindeki son gelişmeler.",
  openGraph: {
    title: "Güncellemeler | Everything",
    description: "Everything platformundaki son güncellemeler ve yeni özellikler.",
    url: "https://allminiapps.com/updates",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
  alternates: {
    canonical: "https://allminiapps.com/updates",
  },
};

export default function Page() {
  return <UpdatesPage />;
}
