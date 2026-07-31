"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import ACTIVITIES_DATA from "../../activities.json";
import {
  accentHighlightClass,
  drawerHandleClass,
  fieldClass,
  iconBtnClass,
  NE_YAPSAK_ACCENT,
  pickerItemClass,
  sectionLabelClass,
} from "../../lib/theme";

export interface ActivityPreset {
  id: string;
  label: string;
  icon: string;
}

interface ActivityCategory {
  category: string;
  items: ActivityPreset[];
}

const ACTIVITIES = ACTIVITIES_DATA as ActivityCategory[];

export interface ActivityPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: ActivityPreset) => void;
  title?: string;
  subtitle?: string;
}

export function ActivityPickerDrawer({
  open,
  onOpenChange,
  onSelect,
  title = "Aktivite Seç",
  subtitle = "Ne yapmak istediğini seç",
}: ActivityPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleSelect = (item: ActivityPreset) => {
    onSelect(item);
    onOpenChange(false);
    setSearch("");
  };

  const filteredData = ACTIVITIES.map((cat: ActivityCategory) => {
    const items = cat.items.filter((item: ActivityPreset) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    );
    return { ...cat, items };
  }).filter((cat: ActivityCategory & { items: ActivityPreset[] }) => cat.items.length > 0);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch("");
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
        <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-xl mx-auto border-t border-app-border shadow-2xl flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto flex flex-col">
            <div className={drawerHandleClass} />
            <header className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <Drawer.Title className="font-black text-base text-app-text">{title}</Drawer.Title>
                <p className="text-[10px] text-app-muted font-medium mt-0.5">{subtitle}</p>
              </div>
              <button type="button" onClick={() => onOpenChange(false)} className={iconBtnClass}>
                <X size={18} weight="bold" />
              </button>
            </header>

            <div className="relative mb-3 shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Aktivite ara… (örn: Sinema, Kahve)"
                className={fieldClass}
              />
            </div>

            {search.trim() && (
              <button
                type="button"
                onClick={() => handleSelect({ id: "", label: search.trim(), icon: "✍️" })}
                className={`${accentHighlightClass} mb-3`}
              >
                <div className="flex items-center gap-2">
                  <span>✍️</span>
                  <span>Özel: &quot;{search.trim()}&quot;</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: NE_YAPSAK_ACCENT }}>
                  Seç
                </span>
              </button>
            )}

            <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
              {filteredData.length === 0 ? (
                <p className="text-sm font-bold text-app-muted text-center py-12">Aktivite bulunamadı.</p>
              ) : (
                filteredData.map((cat: ActivityCategory & { items: ActivityPreset[] }) => {
                  const isSearching = search.trim() !== "";
                  const isExpanded = expanded[cat.category] || false;
                  const visibleItems = isExpanded || isSearching ? cat.items : cat.items.slice(0, 4);

                  return (
                    <div key={cat.category} className="space-y-2">
                      <h4 className={sectionLabelClass}>{cat.category}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {visibleItems.map((item: ActivityPreset) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            className={pickerItemClass(false)}
                          >
                            <span className="text-lg shrink-0">{item.icon}</span>
                            <span className="truncate flex-1">{item.label}</span>
                          </button>
                        ))}
                      </div>
                      {cat.items.length > 4 && !isSearching && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [cat.category]: !isExpanded }))
                          }
                          className="w-full text-center py-2 text-[10px] font-black uppercase tracking-wider text-app-muted hover:text-app-text"
                        >
                          {isExpanded ? "Daha Az" : `Daha Fazla (+${cat.items.length - 4})`}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
