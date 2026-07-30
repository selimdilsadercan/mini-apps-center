"use client";

import Link from "next/link";
import { MINI_APPS } from "@/lib/apps";
import { useTranslations } from "@/contexts/LanguageContext";

const LINKED_MINI_APP_IDS = ["outdoor-activities", "places-ranked"] as const;

export default function VenueRelatedAppsBadges() {
  const tApps = useTranslations("apps");

  const apps = LINKED_MINI_APP_IDS.map((id) => MINI_APPS.find((app) => app.id === id)).filter(
    (app): app is NonNullable<typeof app> => Boolean(app),
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      {apps.map((app) => {
        const AppIcon = app.icon;
        const fromLocale = tApps(`${app.id}.name`);
        const appName = fromLocale !== `apps.${app.id}.name` ? fromLocale : app.name;

        return (
          <Link
            key={app.id}
            href={app.href}
            className="inline-flex w-fit max-w-[11rem] items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg border border-app-border bg-app-surface hover:bg-app-surface-muted/50 transition-colors no-underline"
          >
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center relative overflow-hidden shrink-0"
              style={{ backgroundColor: app.color }}
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <AppIcon size={11} weight="fill" className="text-white relative z-10" />
            </span>
            <span className="text-[9px] font-bold text-app-text leading-tight line-clamp-2 min-w-0">
              {appName}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
