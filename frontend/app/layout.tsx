import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProviderWrapper } from "@/components/ClerkProvider";
import { NotificationHandler } from "@/components/notifications/notification-handler";
import { Toaster } from "react-hot-toast";
import { GreetingHandler } from "@/components/GreetingHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Everything - Mini Apps Center",
  description: "One hub for all your daily digital needs - Games, Utilities, Productivity and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProviderWrapper>
          <NotificationHandler />
          <GreetingHandler />
          {children}
          <Toaster position="top-center" />
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}

