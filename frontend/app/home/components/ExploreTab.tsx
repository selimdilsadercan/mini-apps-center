"use client";

import type { MiniApp } from "@/lib/apps";
import { AppListSection } from "./common/AppListSection";

interface ExploreTabProps {
  explorePlacesApps: MiniApp[];
  exploreEventsApps: MiniApp[];
  tApps: any;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

export function ExploreTab({
  explorePlacesApps,
  exploreEventsApps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: ExploreTabProps) {
  return (
    <div className="space-y-8">
      <AppListSection
        title="Mekanlar & Rehberler"
        apps={explorePlacesApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
      <AppListSection
        title="Etkinlik & Topluluk"
        apps={exploreEventsApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
    </div>
  );
}
