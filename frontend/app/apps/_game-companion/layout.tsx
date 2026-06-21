import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import StatusBarComponent from "./components/StatusBar";
import BackButtonHandler from "./components/BackButtonHandler";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Eşlikçi - Board Games Companion",
  description: "Your companion app for table games",
};

export default function GameCompanionLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="game-companion-root min-h-screen bg-background">
      <ThemeProvider>{children}</ThemeProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 1500,
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            duration: 2500,
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
