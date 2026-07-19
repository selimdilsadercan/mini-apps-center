"use client";

import { ArrowRight } from "@phosphor-icons/react";
import type { ElementType } from "react";
import type { MiniApp } from "@/lib/apps";

export interface StudioPackage {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: ElementType;
  apps: MiniApp[];
  targetAudience: string;
  benefits: string[];
}

interface StudioTabProps {
  studioPackages: StudioPackage[];
  onSelectPackage: (pkg: StudioPackage) => void;
}

export function StudioTab({ studioPackages, onSelectPackage }: StudioTabProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        {studioPackages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectPackage(pkg)}
              className="w-full text-left rounded-2xl border border-app-border bg-app-surface p-5 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: pkg.color }}
                >
                  <Icon size={24} weight="fill" className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-app-text text-[15px] tracking-tight">{pkg.name}</h3>
                  <p className="text-app-muted text-[12px] font-medium leading-tight mt-0.5">
                    {pkg.description}
                  </p>
                </div>
                <ArrowRight size={16} weight="bold" className="text-app-muted shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex -space-x-2">
                  {pkg.apps.slice(0, 5).map((app) => {
                    const AppIcon = app.icon;
                    return (
                      <div
                        key={app.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center border-2 border-app-surface shadow-sm"
                        style={{ backgroundColor: app.color }}
                      >
                        <AppIcon size={13} weight="fill" className="text-white" />
                      </div>
                    );
                  })}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">
                  {pkg.apps.length} araç
                </span>
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}
