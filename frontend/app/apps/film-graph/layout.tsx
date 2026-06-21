import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Film Graph | Visualization",
  description:
    "Explore connections between actors and directors in the movies you've watched",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dark contents">
      {children}
    </div>
  );
}
