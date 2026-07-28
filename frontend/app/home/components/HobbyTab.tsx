"use client";

import type { MiniApp } from "@/lib/apps";
import { AppListSection } from "./common/AppListSection";

interface HobbyTabProps {
  hobbyMediaApps: MiniApp[];
  hobbyGamesApps: MiniApp[];
  tApps: any;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

export function HobbyTab({
  hobbyMediaApps,
  hobbyGamesApps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: HobbyTabProps) {
  return (
    <div className="space-y-8">
      <AppListSection
        title="Medya & İçerik"
        apps={hobbyMediaApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
      <AppListSection
        title="Oyun & Etkinlik"
        apps={hobbyGamesApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
    </div>
  );
}
