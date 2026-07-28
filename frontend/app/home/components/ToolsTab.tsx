"use client";

import type { MiniApp } from "@/lib/apps";
import { AppListSection } from "./common/AppListSection";

interface ToolsTabProps {
  yksApp?: MiniApp;
  practicalApps: MiniApp[];
  devApps: MiniApp[];
  tApps: any;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

export function ToolsTab({
  yksApp,
  practicalApps,
  devApps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: ToolsTabProps) {
  return (
    <div className="space-y-8">
      {yksApp && (
        <AppListSection
          title="YKS Tercih"
          apps={[yksApp]}
          tApps={tApps}
          pinnedIds={pinnedIds}
          togglePin={togglePin}
          handleAppClick={handleAppClick}
        />
      )}
      <AppListSection
        title="Pratik Araçlar"
        apps={practicalApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
      <AppListSection
        title="Geliştirici"
        apps={devApps}
        tApps={tApps}
        pinnedIds={pinnedIds}
        togglePin={togglePin}
        handleAppClick={handleAppClick}
      />
    </div>
  );
}
