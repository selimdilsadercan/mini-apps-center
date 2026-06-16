import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ChocolateDB | Dünyanın En Büyük Çikolata Arşivi & Puanlama Platformu",
  description: "En sevdiğiniz çikolataları keşfedin, puanlayın ve yorumlayın. Çokonat, Tadelle, Ülker, Eti ve dünya markalarının çikolata arşivi. Kendi çikolata listenizi oluşturun.",
  keywords: [
    "çikolata", 
    "chocolate", 
    "çokonat", 
    "tadelle", 
    "ülker", 
    "eti", 
    "çikolata puanlama", 
    "çikolata yorumları", 
    "çikolata arşivi", 
    "tatlı rehberi",
    "en iyi çikolatalar"
  ],
  alternates: {
    canonical: "https://allminiapps.com/apps/chocolate-db",
  },
  openGraph: {
    title: "ChocolateDB - Çikolata Tutkunlarının Buluşma Noktası",
    description: "Binlerce çikolata arasından favorini bul, puanla ve yorumla. Çikolata dünyasını keşfet.",
    url: "https://allminiapps.com/apps/chocolate-db",
    siteName: "Everything Mini Apps Center",
    images: [
      {
        url: "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=1200&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "ChocolateDB - Çikolata Arşivi",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChocolateDB | Çikolata Arşivi & Puanlama",
    description: "Çikolataları keşfet, puanla ve listele. En sevdiğin lezzetleri kaçırma.",
    images: ["https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=1200&auto=format&fit=crop"],
  },
};

export default function ChocolateDBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
