import { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 TUS Taban Puanları ve Tercih Robotu | SuperApp",
  description:
    "TUS uzmanlık dalı taban puanları, kurum bazlı karşılaştırma ve tercih listesi hazırlama motoru.",
  keywords: [
    "TUS tercih robotu",
    "TUS taban puanları",
    "uzmanlık dalı taban puanları",
    "TUS tercih motoru",
    "2026 TUS tercih",
  ],
};

export default function TUSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
