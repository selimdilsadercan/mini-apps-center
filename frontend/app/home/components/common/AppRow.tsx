"use client";

import { motion } from "framer-motion";
import { Heart } from "@phosphor-icons/react";
import type { MiniApp } from "@/lib/apps";

export function AppRow({
  app,
  index,
  tApps,
  isPinned,
  onPin,
  onClick,
}: {
  app: MiniApp;
  index: number;
  tApps: any;
  isPinned: boolean;
  onPin: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const Icon = app.icon;
  const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="relative group"
    >
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 py-3 px-1 transition-all active:scale-[0.98] text-left border-b border-app-border last:border-0 cursor-pointer"
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
          style={{ backgroundColor: app.color }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <Icon size={22} weight="fill" className="text-white relative z-10" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-app-text text-[15px] tracking-tight truncate group-hover:text-app-muted transition-colors mb-0.5">
            {app.cta || app.description}
          </h3>
          <p className="text-[11px] font-medium text-app-muted line-clamp-1 leading-tight">
            {appName}
          </p>
        </div>

        <button
          onClick={onPin}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            isPinned
              ? "text-app-muted hover:text-app-text hover:scale-110"
              : "text-app-muted/30 hover:text-app-muted hover:scale-110"
          }`}
          title={isPinned ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        >
          <Heart size={16} weight={isPinned ? "fill" : "bold"} />
        </button>
      </div>
    </motion.div>
  );
}
