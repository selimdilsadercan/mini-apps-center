import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationHandler } from "@/components/notifications/notification-handler";
import { Toaster } from "react-hot-toast";
import { GreetingHandler } from "@/components/GreetingHandler";
import { LanguageProvider } from "@/contexts/LanguageContext";
import trMessages from "@/locales/tr/index";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import OTAProvider from "@/components/OTAProvider";
import { MobileThemeProvider } from "@/components/MobileThemeManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Everything",
  description: "Your unified toolkit for daily life - Productivity, Utilities, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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
        <OTAProvider>
          <LanguageProvider messages={trMessages}>
            <AuthProvider>
              <ConfirmDialogProvider>
                <MobileThemeProvider>
                  <NotificationHandler />
                  <GreetingHandler />
                  {children}
                  <Toaster position="top-center" />
                </MobileThemeProvider>
              </ConfirmDialogProvider>
            </AuthProvider>
          </LanguageProvider>
        </OTAProvider>
      </body>
    </html>
  );
}

