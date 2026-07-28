import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import MealPlannerDirectoryPage from "@/components/landing/directory/apps/meal-planner";

export const metadata: Metadata = {
  title: "Meal Planner | Everything",
  description: "Tariflerini kaydet, haftalık yemek planını oluştur.",
  alternates: { canonical: "https://allminiapps.com/directory/meal-planner" },
  openGraph: {
    title: "Meal Planner | Everything",
    description: "Tariflerini kaydet, haftalık yemek planını oluştur.",
    url: "https://allminiapps.com/directory/meal-planner",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="meal-planner">
      <MealPlannerDirectoryPage />
    </DirectoryAppShell>
  );
}
