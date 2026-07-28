import { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 YKS Taban Puanları ve Tercih Robotu | SuperApp",
  description:
    "YKS (TYT, SAY, EA, SÖZ, DİL) üniversite taban puanları, başarı sıralamaları ve gelişmiş tercih listesi hazırlama motoru.",
  keywords: [
    "YKS tercih robotu",
    "YKS taban puanları",
    "üniversite başarı sıralamaları",
    "TYT AYT tercih motoru",
    "2026 ÖSYM tercih",
  ],
};

export default function YKSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
