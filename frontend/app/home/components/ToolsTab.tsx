"use client";

import type { MiniApp } from "@/lib/apps";
import { AppListSection } from "./common/AppListSection";

interface ToolsTabProps {
  yksApp?: MiniApp;
  tusApp?: MiniApp;
  tusKitapApp?: MiniApp;
  practicalApps: MiniApp[];
  devApps: MiniApp[];
  tApps: any;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

export function ToolsTab({
  yksApp,
  tusApp,
  tusKitapApp,
  practicalApps,
  devApps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: ToolsTabProps) {
  return (
    <div className="space-y-8">
      {(yksApp || tusApp || tusKitapApp) && (
        <AppListSection
          title="Sınav Araçları"
          apps={[yksApp, tusApp, tusKitapApp].filter((a): a is MiniApp => Boolean(a))}
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
