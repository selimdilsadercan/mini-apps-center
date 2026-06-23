"use client";

import { BusinessPageProvider } from "./context";

export default function BusinessPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessPageProvider>
      {children}
    </BusinessPageProvider>
  );
}
