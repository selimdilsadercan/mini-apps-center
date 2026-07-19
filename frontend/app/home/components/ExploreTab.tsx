"use client";

import type { MiniApp } from "@/lib/apps";
import { AppRow } from "./common/AppRow";

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
      {/* Mekanlar & Rehberler */}
      {explorePlacesApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Mekanlar & Rehberler
          </h3>
          <div className="space-y-0">
            {explorePlacesApps.map((app, index) => (
              <AppRow
                key={app.id}
                app={app}
                index={index}
                tApps={tApps}
                isPinned={pinnedIds.includes(app.id)}
                onPin={(e) => togglePin(e, app.id)}
                onClick={() => handleAppClick(app)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Etkinlik & Topluluk */}
      {exploreEventsApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Etkinlik & Topluluk
          </h3>
          <div className="space-y-0">
            {exploreEventsApps.map((app, index) => (
              <AppRow
                key={app.id}
                app={app}
                index={index}
                tApps={tApps}
                isPinned={pinnedIds.includes(app.id)}
                onPin={(e) => togglePin(e, app.id)}
                onClick={() => handleAppClick(app)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
