import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProviderWrapper } from "@/components/ClerkProvider";
import { NotificationHandler } from "@/components/notifications/notification-handler";
import { Toaster } from "react-hot-toast";
import { GreetingHandler } from "@/components/GreetingHandler";
import { LanguageProvider } from "@/contexts/LanguageContext";
import trMessages from "@/locales/tr/index";

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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider messages={trMessages}>
          <ClerkProviderWrapper>
            <NotificationHandler />
            <GreetingHandler />
            {children}
            <Toaster position="top-center" />
          </ClerkProviderWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}

