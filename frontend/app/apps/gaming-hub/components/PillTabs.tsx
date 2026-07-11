"use client";

import type { Icon } from "@phosphor-icons/react";

export function pillTabClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
    active
      ? "bg-white text-gray-900 shadow-sm"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
  }`;
}

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon: Icon }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 w-full">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`${pillTabClass(isActive)} flex-1`}
          >
            <Icon size={14} weight={isActive ? "fill" : "duotone"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PillFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 overflow-x-auto max-w-full">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`${pillTabClass(isActive)} shrink-0`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
