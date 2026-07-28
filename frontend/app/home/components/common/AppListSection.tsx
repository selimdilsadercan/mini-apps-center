"use client";

import { motion } from "framer-motion";
import { Heart } from "@phosphor-icons/react";
import type { MiniApp } from "@/lib/apps";
import { AppRow } from "./AppRow";

interface AppListSectionProps {
  title: string;
  apps: MiniApp[];
  tApps: (key: string) => string;
  pinnedIds: string[];
  togglePin: (e: React.MouseEvent, appId: string) => void;
  handleAppClick: (app: MiniApp) => void;
}

function AppGridCard({
  app,
  index,
  tApps,
  isPinned,
  onPin,
  onClick,
}: {
  app: MiniApp;
  index: number;
  tApps: (key: string) => string;
  isPinned: boolean;
  onPin: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const Icon = app.icon;
  const appName =
    tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group flex items-center gap-3 p-3.5 rounded-2xl border border-app-border bg-app-surface hover:bg-app-surface-muted/40 transition-all cursor-pointer text-left"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
        style={{ backgroundColor: app.color }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <Icon size={20} weight="fill" className="text-white relative z-10" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-app-text text-[13px] tracking-tight truncate leading-snug">
          {appName}
        </h3>
        <p className="text-[10px] font-medium text-app-muted line-clamp-2 leading-snug mt-0.5">
          {app.cta || app.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onPin}
        className={`p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
          isPinned
            ? "text-app-muted hover:text-app-text"
            : "text-app-muted/30 hover:text-app-muted"
        }`}
        title={isPinned ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      >
        <Heart size={15} weight={isPinned ? "fill" : "bold"} />
      </button>
    </motion.div>
  );
}

export function AppListSection({
  title,
  apps,
  tApps,
  pinnedIds,
  togglePin,
  handleAppClick,
}: AppListSectionProps) {
  if (apps.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted px-1">
        {title}
      </h3>

      {/* Mobile — full-width list */}
      <div className="md:hidden rounded-2xl border border-app-border bg-app-surface overflow-hidden divide-y divide-app-border/60">
        {apps.map((app, index) => (
          <div key={app.id} className="px-2">
            <AppRow
              app={app}
              index={index}
              tApps={tApps}
              isPinned={pinnedIds.includes(app.id)}
              onPin={(e) => togglePin(e, app.id)}
              onClick={() => handleAppClick(app)}
            />
          </div>
        ))}
      </div>

      {/* Desktop — 2-column card grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-3">
        {apps.map((app, index) => (
          <AppGridCard
            key={app.id}
            app={app}
            index={index}
            tApps={tApps}
            isPinned={pinnedIds.includes(app.id)}
            onPin={(e) => {
              e.stopPropagation();
              togglePin(e, app.id);
            }}
            onClick={() => handleAppClick(app)}
          />
        ))}
      </div>
    </section>
  );
}
