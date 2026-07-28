import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import IconSetGuideDirectoryPage from "@/components/landing/directory/apps/icon-set-guide";

export const metadata: Metadata = {
  title: "Icon Set Guide | Everything",
  description: "Compare open-source icon sets in real UI previews",
  alternates: { canonical: "https://allminiapps.com/directory/icon-set-guide" },
  openGraph: {
    title: "Icon Set Guide | Everything",
    description: "Compare open-source icon sets in real UI previews",
    url: "https://allminiapps.com/directory/icon-set-guide",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="icon-set-guide">
      <IconSetGuideDirectoryPage />
    </DirectoryAppShell>
  );
}
