"use client";

import Link from "next/link";
import { PaperPlaneTilt, Users } from "@phosphor-icons/react";
import type { MiniApp } from "@/lib/apps";
import { AppRow } from "./common/AppRow";

interface LifeTabProps {
  suggestions: any[];
  activities: any[];
  lifeHomeApps: MiniApp[];
  lifeHealthApps: MiniApp[];
  walletApps: MiniApp[];
  tApps: any;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

export function LifeTab({
  suggestions,
  activities,
  lifeHomeApps,
  lifeHealthApps,
  walletApps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: LifeTabProps) {
  return (
    <div className="space-y-10">
      {/* Suggest Inbox Widget */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
            {suggestions.map((suggestion: any) => (
              <Link
                key={suggestion.id}
                href={`/apps/suggest/detail?id=${suggestion.shareId}`}
                className="w-48 bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-app-surface-muted shrink-0 border border-app-border shadow-inner">
                    {suggestion.imageUrl ? (
                      <img src={suggestion.imageUrl} alt={suggestion.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <PaperPlaneTilt size={20} weight="fill" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-black text-app-text uppercase tracking-tight truncate">{suggestion.title}</h3>
                    <p className="text-[9px] text-app-muted font-bold truncate">@{suggestion.senderUsername || "birisi"}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">
                    {suggestion.category === "movie" ? "Film" :
                      suggestion.category === "tv" ? "Dizi" :
                        suggestion.category === "song" ? "Şarkı" :
                          suggestion.category === "place" ? "Mekan" : "Öneri"}
                  </span>
                  {suggestion.status === "pending" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ne Yapsak Activities Widget */}
      {activities.length > 0 && (
        <section>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5">
            {activities.map((activity: any) => (
              <Link
                key={activity.id}
                href={`/apps/kim-gelir/activity?id=${activity.id}`}
                className="w-56 bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm shrink-0 active:scale-[0.98] transition-all text-left flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100 text-red-500">
                    <Users size={20} weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-black text-app-text uppercase tracking-tight truncate">{activity.title}</h3>
                    <p className="text-[9px] text-app-muted font-bold truncate">{activity.location}</p>
                  </div>
                </div>
                <div className="flex items-between justify-between">
                  <div className="flex -space-x-2">
                    {activity.responses.slice(0, 3).map((resp: any, i: number) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                        {resp.avatar ? (
                          <img src={resp.avatar} alt={resp.username || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-app-muted">
                            {(resp.username || "?")[0]}
                          </div>
                        )}
                      </div>
                    ))}
                    {activity.responses.length > 3 && (
                      <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[7px] font-black text-white">
                        +{activity.responses.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black text-app-muted uppercase tracking-widest">
                    {activity.timeOption === "custom" ? activity.customTime : activity.timeOption}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ev & Düzen */}
      {lifeHomeApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Ev & Düzen
          </h3>
          <div className="space-y-0">
            {lifeHomeApps.map((app, index) => (
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

      {/* Sağlık & Odak */}
      {lifeHealthApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Sağlık & Odak
          </h3>
          <div className="space-y-0">
            {lifeHealthApps.map((app, index) => (
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

      {/* Finans & Bütçe */}
      {walletApps.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
            Finans & Bütçe
          </h3>
          <div className="space-y-0">
            {walletApps.map((app, index) => (
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
