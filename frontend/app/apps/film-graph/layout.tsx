import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Film Keşfet",
  description: "Popüler filmleri keşfet, listene ekle ve bağlantı graph'ını incele",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
