import React from "react";
import AppBar, { ActivePage } from "@/components/AppBar";

export default function YouTubeDiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-red-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#3b0764,transparent)] pointer-events-none opacity-40" />
      <div className="relative z-10">
        {children}
      </div>
      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}
