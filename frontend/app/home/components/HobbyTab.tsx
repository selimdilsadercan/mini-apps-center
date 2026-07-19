"use client";

import type { MiniApp } from "@/lib/apps";
import { AppRow } from "./common/AppRow";

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
      {/* Medya & İçerik */}
      {hobbyMediaApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Medya & İçerik
          </h3>
          <div className="space-y-0">
            {hobbyMediaApps.map((app, index) => (
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

      {/* Oyun & Etkinlik */}
      {hobbyGamesApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Oyun & Etkinlik
          </h3>
          <div className="space-y-0">
            {hobbyGamesApps.map((app, index) => (
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
