"use client";

import { useState } from "react";
import { CaretDown, Check, LockSimple, MapPin } from "@phosphor-icons/react";
import { Drawer } from "vaul";

const CITIES = [
  { id: "kahramanmaras", label: "Kahramanmaraş", available: true },
  { id: "gaziantep", label: "Gaziantep", available: false },
  { id: "istanbul", label: "İstanbul", available: false },
  { id: "ankara", label: "Ankara", available: false },
  { id: "izmir", label: "İzmir", available: false },
] as const;

export type CityId = (typeof CITIES)[number]["id"];

export function CitySelector({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = CITIES.find((c) => c.id === "kahramanmaras")!;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 max-w-full rounded-lg border border-app-border bg-app-surface text-app-text active:scale-[0.98] transition-transform cursor-pointer ${className || "px-2 py-1"}`}
      >
        <MapPin size={14} weight="fill" className="text-amber-600 shrink-0" />
        <span className="text-xs font-black truncate flex-1 text-left">{selected.label}</span>
        <CaretDown size={12} weight="bold" className="text-app-muted shrink-0" />
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 outline-none z-[90] max-w-xl mx-auto border-t border-app-border shadow-2xl">
            <div className="p-5 pb-8">
              <div className="w-10 h-1 rounded-full bg-app-border mx-auto mb-4" />
              <Drawer.Title className="font-black text-base text-app-text mb-1">
                Şehir seç
              </Drawer.Title>
              <p className="text-[11px] text-app-muted font-medium mb-4">
                Şimdilik yalnızca Kahramanmaraş açık. Diğer şehirler yakında.
              </p>

              <div className="space-y-1.5">
                {CITIES.map((city) => {
                  const isSelected = city.id === selected.id;
                  const disabled = !city.available;

                  return (
                    <button
                      key={city.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/30 text-app-text"
                          : disabled
                            ? "bg-app-surface-muted/40 border-app-border/50 text-app-muted cursor-not-allowed opacity-70"
                            : "bg-app-surface-muted/60 border-app-border text-app-text cursor-pointer active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin
                          size={16}
                          weight={isSelected ? "fill" : "regular"}
                          className={isSelected ? "text-amber-600 shrink-0" : "text-app-muted shrink-0"}
                        />
                        <span className="text-sm font-bold truncate">{city.label}</span>
                      </div>
                      {isSelected ? (
                        <Check size={16} weight="bold" className="text-amber-600 shrink-0" />
                      ) : disabled ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-app-muted shrink-0">
                          <LockSimple size={11} weight="bold" />
                          Yakında
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
