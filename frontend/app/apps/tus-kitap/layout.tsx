import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TUS Kitap Takibi | SuperApp",
  description: "Infotus TUS konu kitapları çalışma takibi, bölüm tekrar sayacı ve ilerleme özeti.",
  keywords: ["TUS kitap", "Infotus", "TUS çalışma takibi", "temel bilimler", "klinik bilimler"],
};

export default function TUSKitapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
