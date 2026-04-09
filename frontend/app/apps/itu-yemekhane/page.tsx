"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Flame,
  ArrowLeft,
  Bell,
  UtensilsCrossed,
  Soup,
  Beef,
  CakeSlice,
  RefreshCw,
  X,
  Utensils,
  Maximize2,
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/api";

// Reusable Interfaces
export interface Menu {
  date: string;
  mealType: string;
  dishes: any[];
}

export const categoryIcons: Record<string, React.ReactNode> = {
  soup: <Soup className="w-8 h-8" />,
  main: <Beef className="w-10 h-10" />,
  side: <UtensilsCrossed className="w-8 h-8" />,
  dessert: <CakeSlice className="w-8 h-8" />,
};

// --- SCALABLE TRAY COMPONENT ---
export function ScalableITUYemekhaneTray({
  menu,
  isMock,
}: {
  menu: Menu;
  isMock: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const MASTER_WIDTH = 1000;
  const MASTER_HEIGHT = 680;
  const SHADOW_BUFFER = 140; 

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
    <div
      ref={containerRef}
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
                dish={menu.dishes.find((d) => d.category === "dessert")}
              />
            </div>
            <div className="col-start-1 row-start-3 row-span-3">
              <MasterTrayCompartment
                isMock={isMock}
                dish={menu.dishes.find((d) => d.category === "side")}
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
                dish={menu.dishes.find((d) => d.category === "main")}
              />
            </div>

            <div className="col-start-3 row-start-2 row-span-4">
              <MasterTrayCompartment
                isMock={isMock}
                dish={menu.dishes.find((d) => d.category === "soup")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterTrayCompartment({ dish, isMock }: any) {
  return (
    <div className="w-full h-full bg-[#fcfdfe] dark:bg-slate-900 rounded-[3.8rem] p-5.5 shadow-[inset_0_10px_25px_rgba(0,0,0,0.06),0_2px_4px_rgba(255,255,255,1)] dark:shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-800 flex flex-col justify-end transition-all duration-500">
      {dish ? (
        <div className="flex flex-col text-left items-start w-full overflow-hidden">
          <div
            className={`p-5 mb-8 rounded-[2rem] shadow-sm ${
              dish.category === "main"
                ? "bg-orange-50 text-orange-600"
                : dish.category === "soup"
                  ? "bg-amber-50 text-amber-600"
                  : dish.category === "side"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-pink-50 text-pink-500"
            }`}
          >
            {categoryIcons[dish.category] || (
              <UtensilsCrossed className="w-9 h-9" />
            )}
          </div>
          <div className="space-y-4 w-full">
            <h3 className="font-black text-slate-800 dark:text-white leading-[1.1] uppercase tracking-tight text-[25px] line-clamp-2 min-h-[55px]">
              {dish.name}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[14px] justify-start uppercase tracking-widest">
              <Flame className="w-5 h-5 opacity-40 text-orange-500" />
              <span>
                {dish.calories} {isMock ? "CAL" : "KCAL"}
              </span>
            </div>
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
export function ITUYemekhaneAppContent({
  isMock = false,
  onBack,
  onExpand,
}: {
  isMock?: boolean;
  onBack?: () => void;
  onExpand?: () => void;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const mockMenu: Menu = {
    date: "MARCH 31st DINNER",
    mealType: "dinner",
    dishes: [
      { id: "1", name: "TARHANA SOUP", category: "soup", calories: 102 },
      { id: "2", name: "CHICKPEAS WITH MEAT", category: "main", calories: 304 },
      { id: "3", name: "RICE PILAF", category: "side", calories: 363 },
      { id: "4", name: "PICKLED BEETROOTS", category: "dessert", calories: 54 },
      { id: "5", name: "YOGURT WITH CORN", category: "dessert", calories: 83 },
    ],
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

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col relative ${!isMock ? "min-h-screen pb-32" : "max-h-full overflow-hidden"}`}
    >
      <header className={`sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b flex flex-col justify-end ${isMock ? 'h-22 pb-2 px-3' : 'h-16 px-4'}`}>
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          {(!isMock) ? (
            <Link
              href="/home"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium pr-2">
                Geri Dön
              </span>
            </Link>
          ) : (
            <button
               onClick={onBack}
               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 group"
            >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 uppercase text-slate-800 dark:text-slate-100">
              <ChefHat className="w-5 h-5 text-[#EAB308]" />
              {isMock ? "ITU CAFETERIA" : "ITU YEMEKHANE"}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button 
               onClick={handleExpand}
               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative group shadow-sm active:scale-95"
            >
              <Maximize2 className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </button>
            {!isMock && (
              <Link
                href="/apps/itu-yemekhane/notifications"
                className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative group shadow-sm active:scale-95"
              >
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isMock ? 'p-1 pt-6 overflow-visible' : 'p-6 md:p-8'}`}>
        {!loading && menu && (
          <div 
            onClick={handleExpand}
            className="w-full mx-auto max-w-4xl overflow-visible cursor-zoom-in"
          >
            <ScalableITUYemekhaneTray menu={menu} isMock={isMock} />
          </div>
        )}
      </div>

      {/* FULLSCREEN TRAY OVERLAY (Only if not handled externally) */}
      <AnimatePresence>
        {isExpanded && !onExpand && menu && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
           >
              <motion.button 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setIsExpanded(false)}
                className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white z-[110] transition-colors"
              >
                <X className="w-8 h-8" />
              </motion.button>

              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 150 }}
                className="w-full max-w-7xl relative"
              >
                 <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-center w-full">
                    <h2 className="text-white font-black text-4xl tracking-tighter uppercase mb-2">Detailed Menu</h2>
                    <p className="text-white/40 font-bold tracking-[0.3em] text-sm uppercase">{menu.date}</p>
                 </div>
                 <ScalableITUYemekhaneTray menu={menu} isMock={isMock} />
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ITUYemekhanePage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0F172A] font-sans overflow-x-hidden">
      <ITUYemekhaneAppContent />
    </div>
  );
}
