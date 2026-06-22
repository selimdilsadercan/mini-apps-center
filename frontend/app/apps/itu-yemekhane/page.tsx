"use client";
import { getAppRootUrl } from "@/lib/apps";

import React, { useState, useEffect, useRef } from "react";
import {
  ChefHat,
  Flame,
  Soup,
  Beef,
  UtensilsCrossed,
  CakeSlice,
  RefreshCw,
  X,
  Utensils,
  GlassWater,
  Salad,
  Leaf,
} from "lucide-react";
import { createBrowserClient } from "@/lib/api";
import { SquaresFour } from "@phosphor-icons/react";

// Reusable Interfaces
export interface Menu {
  date: string;
  mealType: string;
  dishes: TrayDish[];
  trays?: MenuTrays;
  vegan?: {
    dishes: TrayDish[];
    trays?: MenuTrays;
  };
}

export interface TrayDish {
  id: string;
  name: string;
  category: string;
  traySlot?: string;
  calories: number;
  isSelectable?: boolean;
}

export interface MenuTrays {
  soup: TrayDish[];
  main: TrayDish[];
  side: TrayDish[];
  extras: TrayDish[];
}

function resolveTrays(menu: Menu): MenuTrays {
  if (menu.trays) return menu.trays;

  const trays: MenuTrays = { soup: [], main: [], side: [], extras: [] };
  for (const dish of menu.dishes) {
    const slot =
      dish.traySlot === "soup" ||
      dish.traySlot === "main" ||
      dish.traySlot === "side" ||
      dish.traySlot === "extras"
        ? dish.traySlot
        : dish.category === "soup"
          ? "soup"
          : dish.category === "main"
            ? "main"
            : dish.category === "side"
              ? "side"
              : "extras";
    trays[slot].push(dish);
  }

  for (const slot of Object.keys(trays) as (keyof MenuTrays)[]) {
    if (trays[slot].length > 1) {
      trays[slot] = trays[slot].map((d) => ({ ...d, isSelectable: true }));
    }
  }

  return trays;
}

export const categoryIcons: Record<string, React.ReactNode> = {
  soup: <Soup className="w-8 h-8" />,
  main: <Beef className="w-10 h-10" />,
  side: <UtensilsCrossed className="w-8 h-8" />,
  dessert: <CakeSlice className="w-8 h-8" />,
  salad: <Salad className="w-7 h-7" />,
  drink: <GlassWater className="w-7 h-7" />,
  extras: <CakeSlice className="w-8 h-8" />,
};

function dishIconClass(category: string): string {
  if (category === "main") return "bg-orange-50 text-orange-600";
  if (category === "soup") return "bg-amber-50 text-amber-600";
  if (category === "side") return "bg-blue-50 text-blue-600";
  if (category === "salad") return "bg-emerald-50 text-emerald-600";
  if (category === "drink") return "bg-sky-50 text-sky-600";
  return "bg-pink-50 text-pink-500";
}

// --- SCALABLE TRAY COMPONENT ---
function MenuTypeToggle({
  showVegan,
  onChange,
  isMock,
}: {
  showVegan: boolean;
  onChange: (vegan: boolean) => void;
  isMock: boolean;
}) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center bg-[#fcfdfe] dark:bg-slate-900 rounded-full p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)] border border-slate-200/60 dark:border-slate-700 gap-0.5">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all ${
            !showVegan
              ? "bg-slate-800 text-white shadow-sm dark:bg-white dark:text-slate-900"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          {isMock ? "General" : "Genel"}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all inline-flex items-center gap-1.5 ${
            showVegan
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
        >
          <Leaf className="w-3 h-3" />
          {isMock ? "Vegan" : "Vegan"}
        </button>
      </div>
    </div>
  );
}

export function ScalableITUYemekhaneTray({
  menu,
  isMock,
}: {
  menu: Menu;
  isMock: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [showVegan, setShowVegan] = useState(false);
  const hasVegan = !!menu.vegan?.trays;
  const MASTER_WIDTH = 1000;
  const MASTER_HEIGHT = 680;
  const SHADOW_BUFFER = hasVegan ? 16 : 140;
  const activeMenu: Menu =
    showVegan && menu.vegan?.trays
      ? { ...menu, dishes: menu.vegan.dishes, trays: menu.vegan.trays }
      : menu;
  const trays = resolveTrays(activeMenu);

  useEffect(() => {
    if (!hasVegan) setShowVegan(false);
  }, [hasVegan, menu.date]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        if (availableWidth > 0) {
          const newScale = Math.min(availableWidth / MASTER_WIDTH, 1);
          setScale(newScale);
        }
      }
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", updateScale);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center overflow-visible">
      <div
        className="w-full relative origin-top flex justify-center overflow-visible"
        style={{ height: (MASTER_HEIGHT + SHADOW_BUFFER) * scale }}
      >
        <div
          style={{
            width: MASTER_WIDTH,
            height: MASTER_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
          className="absolute top-0 overflow-visible"
        >
          <div className="w-full h-full bg-[#CBD5E1] dark:bg-slate-800 rounded-[4.5rem] shadow-[inset_0_4px_30px_rgba(0,0,0,0.15),0_40px_80px_-20px_rgba(0,0,0,0.4)] border-t-2 border-white/40 dark:border-white/5 p-5.5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

            <div className="relative z-10 grid grid-cols-3 gap-6 h-full grid-rows-5 overflow-hidden">
            <div className="col-start-1 row-start-1 row-span-2">
              <MasterTrayCompartment
                isMock={isMock}
                dishes={trays.extras}
                compact
              />
            </div>
            <div className="col-start-1 row-start-3 row-span-3">
              <MasterTrayCompartment
                isMock={isMock}
                dishes={trays.side}
              />
            </div>

            <div className="col-start-2 col-span-2 row-start-1 row-span-1">
              <div className="w-full h-full bg-[#fcfdfe] dark:bg-slate-900 rounded-[3rem] px-12 shadow-[inset_0_10px_25px_rgba(0,0,0,0.08),0_2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
                <Utensils className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                <div className="flex flex-col items-center text-center">
                  <span className="text-[14px] font-black uppercase tracking-[0.4em] text-amber-500 opacity-60 mb-1">
                    {isMock ? "DAILY MENU" : "GÜNÜN MENÜSÜ"}
                  </span>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight truncate">
                    {menu.date}
                  </h2>
                </div>
                <RefreshCw className="w-8 h-8 text-slate-200 dark:text-slate-700" />
              </div>
            </div>

            <div className="col-start-2 row-start-2 row-span-4">
              <MasterTrayCompartment
                isMock={isMock}
                dishes={trays.main}
              />
            </div>

            <div className="col-start-3 row-start-2 row-span-4">
              <MasterTrayCompartment
                isMock={isMock}
                dishes={trays.soup}
              />
            </div>
            </div>
          </div>
        </div>
      </div>

      {hasVegan && (
        <div className="mt-1.5">
          <MenuTypeToggle
            showVegan={showVegan}
            onChange={setShowVegan}
            isMock={isMock}
          />
        </div>
      )}
    </div>
  );
}

function formatDishDisplayName(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

function DishNameLabel({ dishes, isMock }: { dishes: TrayDish[]; isMock: boolean }) {
  if (dishes.length <= 1) {
    return <>{formatDishDisplayName(dishes[0]?.name ?? "")}</>;
  }

  const joiner = isMock ? "or" : "veya";

  return (
    <>
      {dishes.map((dish, index) => (
        <React.Fragment key={dish.id}>
          {index > 0 && (
            <span className="mx-1.5 font-semibold normal-case text-slate-400 dark:text-slate-500">
              {joiner}
            </span>
          )}
          {formatDishDisplayName(dish.name)}
        </React.Fragment>
      ))}
    </>
  );
}

function StackedDishIcons({
  dishes,
  compact,
}: {
  dishes: TrayDish[];
  compact?: boolean;
}) {
  const dish = dishes[0];
  if (!dish) return null;

  const margin = compact ? "mb-3" : "mb-8";
  const pad = compact ? "p-3" : "p-5";

  if (dishes.length <= 1) {
    return (
      <div
        className={`${pad} ${margin} rounded-[1.5rem] shadow-sm ${dishIconClass(dish.category)}`}
      >
        {categoryIcons[dish.category] || categoryIcons.extras}
      </div>
    );
  }

  const [back, front] = dishes;
  const smallPad = compact ? "p-2" : "p-2.5";
  const box = compact ? "w-[4.25rem] h-[4.25rem]" : "w-[5.25rem] h-[5.25rem]";

  return (
    <div className={`relative ${margin} ${box}`}>
      <div
        className={`absolute top-0 left-0 ${smallPad} rounded-[1.25rem] shadow-sm ${dishIconClass(back.category)} -rotate-6 scale-[0.88] opacity-80 z-0`}
      >
        {categoryIcons[back.category] || categoryIcons.extras}
      </div>
      <div
        className={`absolute bottom-0 right-0 ${smallPad} rounded-[1.25rem] shadow-md ring-2 ring-white/90 dark:ring-slate-900/90 ${dishIconClass(front.category)} z-10`}
      >
        {categoryIcons[front.category] || categoryIcons.extras}
      </div>
    </div>
  );
}

function CalorieRow({ dishes, isMock }: { dishes: TrayDish[]; isMock: boolean }) {
  const unit = isMock ? "CAL" : "KCAL";
  const value =
    dishes.length <= 1
      ? `${dishes[0]?.calories ?? 0}`
      : dishes.map((d) => d.calories).join(" / ");

  return (
    <div className="mt-1.5 flex items-center gap-2 text-slate-400 font-bold text-[12px] justify-start tracking-wide">
      <Flame className="w-4 h-4 shrink-0 opacity-40 text-orange-500" />
      <span>
        {value} {unit}
      </span>
    </div>
  );
}

function MasterTrayCompartment({
  dishes,
  isMock,
  compact = false,
}: {
  dishes: TrayDish[];
  isMock: boolean;
  compact?: boolean;
}) {
  const primary = dishes[0];
  const multi = dishes.length > 1;

  return (
    <div className="w-full h-full bg-[#fcfdfe] dark:bg-slate-900 rounded-[3.8rem] p-5.5 shadow-[inset_0_10px_25px_rgba(0,0,0,0.06),0_2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-800 flex flex-col justify-end transition-all duration-500">
      {primary ? (
        <div className="flex flex-col text-left items-start w-full overflow-hidden">
          <StackedDishIcons dishes={dishes} compact={compact || multi} />
          <div className="w-full">
            <h3
              className={`h-fit font-black text-slate-800 dark:text-white leading-[1.15] tracking-tight normal-case ${
                compact && !multi
                  ? "text-[14px] line-clamp-4"
                  : compact
                    ? "text-[22px] line-clamp-4"
                    : "text-[22px] line-clamp-3"
              }`}
            >
              <DishNameLabel dishes={dishes} isMock={isMock} />
            </h3>
            <CalorieRow dishes={dishes} isMock={isMock} />
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full flex items-center justify-center opacity-10">
          <X className="w-16 h-16" />
        </div>
      )}
    </div>
  );
}

// --- APP CONTENT ---
export function ITUYemekhaneAppContent({ isMock = false }: { isMock?: boolean }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);

  const mockMenu: Menu = {
    date: "MARCH 31st DINNER",
    mealType: "dinner",
    dishes: [
      { id: "1", name: "TARHANA SOUP", category: "soup", traySlot: "soup", calories: 102 },
      { id: "2", name: "CHICKPEAS WITH MEAT", category: "main", traySlot: "main", calories: 304 },
      { id: "3", name: "RICE PILAF", category: "side", traySlot: "side", calories: 363 },
      { id: "4", name: "PICKLED BEETROOTS", category: "salad", traySlot: "extras", calories: 54, isSelectable: true },
      { id: "5", name: "YOGURT WITH CORN", category: "drink", traySlot: "extras", calories: 83, isSelectable: true },
    ],
    trays: {
      soup: [{ id: "1", name: "TARHANA SOUP", category: "soup", traySlot: "soup", calories: 102 }],
      main: [{ id: "2", name: "CHICKPEAS WITH MEAT", category: "main", traySlot: "main", calories: 304 }],
      side: [{ id: "3", name: "RICE PILAF", category: "side", traySlot: "side", calories: 363 }],
      extras: [
        { id: "4", name: "PICKLED BEETROOTS", category: "salad", traySlot: "extras", calories: 54, isSelectable: true },
        { id: "5", name: "YOGURT WITH CORN", category: "drink", traySlot: "extras", calories: 83, isSelectable: true },
      ],
    },
    vegan: {
      dishes: [
        { id: "v1", name: "BARLEY VERMICELLI SOUP", category: "soup", traySlot: "soup", calories: 98 },
        { id: "v2", name: "MEATLESS STEW", category: "main", traySlot: "main", calories: 210 },
        { id: "v3", name: "RICE PILAF", category: "side", traySlot: "side", calories: 363 },
        { id: "v4", name: "GREEN LENTIL SALAD", category: "salad", traySlot: "extras", calories: 120 },
      ],
      trays: {
        soup: [{ id: "v1", name: "BARLEY VERMICELLI SOUP", category: "soup", traySlot: "soup", calories: 98 }],
        main: [{ id: "v2", name: "MEATLESS STEW", category: "main", traySlot: "main", calories: 210 }],
        side: [{ id: "v3", name: "RICE PILAF", category: "side", traySlot: "side", calories: 363 }],
        extras: [{ id: "v4", name: "GREEN LENTIL SALAD", category: "salad", traySlot: "extras", calories: 120 }],
      },
    },
  };

  const fetchMenu = async () => {
    setLoading(true);
    if (isMock) {
      setMenu(mockMenu);
      setLoading(false);
      return;
    }
    try {
      const client = createBrowserClient();
      const data = await client.itu_yemekhane.getMenu();
      setMenu(data);
    } catch (err: any) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [isMock]);

  return (
    <div className={`w-full flex flex-col ${isMock ? "h-full overflow-hidden" : "min-h-full"}`}>
      {!isMock && (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b h-14 px-4 flex items-center shrink-0">
          <div className="max-w-lg mx-auto w-full flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-all bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-sm h-9 min-w-0 shrink-0"
            >
              <SquaresFour size={16} weight="fill" className="text-[#EAB308] shrink-0" />
              <span className="text-xs font-bold truncate">Geri Dön</span>
            </button>

            <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 uppercase text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0">
              <ChefHat className="w-5 h-5 text-[#EAB308] shrink-0" />
              ITU YEMEKHANE
            </h1>
          </div>
        </header>
      )}

      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isMock ? "p-1 pt-4" : "px-4 py-4"}`}>
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
            Menü yükleniyor...
          </div>
        )}
        {!loading && menu && (
          <div className="w-full mx-auto max-w-lg overflow-visible">
            <ScalableITUYemekhaneTray menu={menu} isMock={isMock} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ITUYemekhanePage() {
  return <ITUYemekhaneAppContent />;
}
