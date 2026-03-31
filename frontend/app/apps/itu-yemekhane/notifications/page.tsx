"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChefHat,
  Sun,
  Moon,
  Wifi,
  Battery,
  Signal,
  RefreshCw,
  Frown,
  X
} from "lucide-react";
import Link from "next/link";
import { ITUYemekhaneAppContent, ScalableITUYemekhaneTray, Menu } from "../page";

interface MockNotification {
  title: string;
  body: string;
  time: string;
  isAlert: boolean;
}

export default function NotificationSimulatorPage() {
  const [activePreview, setActivePreview] = useState<"lunch" | "dinner" | null>(null);
  const [appOpened, setAppOpened] = useState(false);
  const [dislikedDishes, setDislikedDishes] = useState<string[]>([]);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);

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

  useEffect(() => {
    const saved = localStorage.getItem("itu-disliked");
    if (saved) setDislikedDishes(JSON.parse(saved));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") {
        resetAll();
        setTimeout(() => setActivePreview("lunch"), 50);
      } else if (e.key === "2") {
        resetAll();
        setTimeout(() => setActivePreview("dinner"), 50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasDislikedDish = (dishNames: string[]) => {
    return dishNames.some(name => dislikedDishes.includes(name.toUpperCase()));
  };

  const getNotificationData = (type: "lunch" | "dinner"): MockNotification => {
    if (type === "lunch") {
      const dishes = ["YAYLA ÇORBASI", "İZMİR KÖFTE", "PİRİNÇ PİLAVI", "ELMA DİLİM PATATES"];
      const isBad = hasDislikedDish(dishes);
      return {
        title: isBad ? "Pickiness Alert! 🫣" : "ITU Cafeteria • Lunch Menu ☀️",
        body: isBad 
          ? "Heads up! Today's menu contains something you're probably not in the mood for." 
          : "Today's lunch menu: Yogurt Soup, Izmir Meatballs, Rice Pilaf and Potato Wedges are ready!",
        time: "Now",
        isAlert: isBad
      };
    } else {
      const dishes = ["TARHANA ÇORBASI", "ETLİ NOHUT", "PİRİNÇ PİLAVI", "MISIRLI YOĞURT"];
      const isBad = hasDislikedDish(dishes);
      return {
        title: isBad ? "Don't Be A Picky Eater! 🤨" : "ITU Cafeteria • Dinner Menu 🌙",
        body: isBad 
          ? "Wait! Today's dinner has a dish that you usually skip. Want to double check?" 
          : "What's for dinner? Tarhana Soup, Meat Chickpeas and Fresh Yogurt are waiting. Enjoy!",
        time: "Now",
        isAlert: isBad
      };
    }
  };

  const handleNotificationClick = () => {
    setActivePreview(null);
    setTimeout(() => {
      setAppOpened(true);
    }, 200);
  };

  const resetAll = () => {
    setAppOpened(false);
    setActivePreview(null);
    setIsTrayExpanded(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-foreground pb-20 font-sans relative overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/apps/itu-yemekhane"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium pr-2">Go Back</span>
          </Link>
          <h1 className="text-lg font-bold tracking-tight">Notification Center</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-10 flex flex-col items-center justify-center gap-24">
        
        {/* Phone Mockup Section */}
        <section className="relative w-[340px] h-[700px] bg-slate-900 rounded-[3.8rem] border-[10px] border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden scale-100">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-800 rounded-b-3xl z-50" />
          
          <div className="relative w-full h-full bg-black">
            <AnimatePresence mode="wait">
              {!appOpened ? (
                <motion.div
                  key="lockscreen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="relative w-full h-full bg-gradient-to-b from-blue-900 via-indigo-900 to-black flex flex-col"
                >
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[12px] text-white/80 font-medium pt-6 px-8 opacity-60">
                    <span>9:41</span>
                    <div className="flex items-center gap-2 font-bold">
                      <Signal className="w-4 h-4" />
                      <Wifi className="w-4 h-4" />
                      <Battery className="w-5 h-5 rotate-90" />
                    </div>
                  </div>

                  <div className="mt-16 text-center text-white px-5">
                    <h2 className="text-7xl font-extralight tracking-tighter">20:25</h2>
                    <p className="text-sm font-bold opacity-80 mt-2 uppercase tracking-widest">Tuesday, March 31</p>
                  </div>

                  <div className="mt-14 w-full px-3">
                    <AnimatePresence mode="wait">
                      {activePreview && (
                        <motion.div
                          key={activePreview}
                          initial={{ opacity: 0, y: -20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
                          onClick={handleNotificationClick}
                          className={`backdrop-blur-3xl border rounded-2xl p-5 shadow-2xl cursor-pointer active:scale-95 transition-transform w-[94%] mx-auto ${
                            getNotificationData(activePreview).isAlert 
                              ? "bg-amber-500/20 border-amber-500/50 shadow-amber-500/10" 
                              : "bg-[#2A2A40]/80 border-white/10 shadow-black/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${getNotificationData(activePreview).isAlert ? "bg-amber-500" : "bg-white"}`}>
                               {getNotificationData(activePreview).isAlert ? <Frown className="w-5 h-5 text-white" /> : <ChefHat className="w-5 h-5 text-[#1a1a2e]" />}
                            </div>
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex-1">
                              ITU MEALS
                            </span>
                            <span className="text-[10px] text-white/30 font-bold">Now</span>
                          </div>
                          <h3 className={`text-[12px] font-bold mb-1 tracking-tight ${getNotificationData(activePreview).isAlert ? "text-amber-200" : "text-white"}`}>
                            {getNotificationData(activePreview).title}
                          </h3>
                          <p className="text-[11px] text-white/70 leading-[1.5] line-clamp-2 pr-2">
                            {getNotificationData(activePreview).body}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                /* INJECTING REAL APP CONTENT IN MOCK MODE */
                <motion.div
                  key="app"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full bg-[#f0f2f5] overflow-hidden"
                >
                   <ITUYemekhaneAppContent 
                      isMock={true} 
                      onBack={() => setAppOpened(false)} 
                      onExpand={() => setIsTrayExpanded(true)}
                   />
                </motion.div>
              )}
            </AnimatePresence>

            <div 
               onClick={() => setAppOpened(false)}
               className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 rounded-full cursor-pointer z-[60] transition-colors ${appOpened ? "bg-slate-300" : "bg-white/30 hover:bg-white/50"}`} 
            />
          </div>
        </section>

        {/* Controls Section */}
        <section className="w-full max-w-2xl px-4 mt-12 pb-40">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl shadow-blue-500/5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
               <div>
                  <h2 className="text-3xl font-black mb-1 tracking-tight">Send Signal 📡</h2>
                  <p className="text-sm text-slate-400 italic">Push the notification and witness the smooth transition.</p>
               </div>
               <button onClick={resetAll} className="px-6 py-3 bg-slate-100 font-bold rounded-2xl text-slate-500 text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Reset Mock
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={() => { resetAll(); setTimeout(() => setActivePreview("lunch"), 50); }} className={`flex items-center gap-5 p-6 rounded-3xl transition-all border-2 text-left group cursor-pointer ${activePreview === "lunch" ? "border-orange-500 bg-orange-50/10 shadow-lg shadow-orange-500/10" : "border-slate-50 hover:border-orange-200"}`}>
                <div className={`p-4 rounded-2xl transition-colors ${activePreview === "lunch" ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"}`}><Sun className="w-7 h-7" /></div>
                <div className="flex-1"><h3 className="font-bold text-lg">Lunch Menu</h3><p className="text-xs text-slate-400 font-medium uppercase tracking-widest">11:30 AM - 2:00 PM</p></div>
              </button>
              <button onClick={() => { resetAll(); setTimeout(() => setActivePreview("dinner"), 50); }} className={`flex items-center gap-5 p-6 rounded-3xl transition-all border-2 text-left group cursor-pointer ${activePreview === "dinner" ? "border-blue-500 bg-blue-50/10 shadow-lg shadow-blue-500/10" : "border-slate-50 hover:border-blue-200"}`}>
                <div className={`p-4 rounded-2xl transition-colors ${activePreview === "dinner" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600"}`}><Moon className="w-7 h-7" /></div>
                <div className="flex-1"><h3 className="font-bold text-lg">Dinner Menu</h3><p className="text-xs text-slate-400 font-medium uppercase tracking-widest">5:00 PM - 7:30 PM</p></div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FULLSCREEN TRAY OVERLAY (Bursting out of phone) */}
      <AnimatePresence>
        {isTrayExpanded && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex flex-col items-center justify-start p-6 md:p-12 overflow-y-auto pointer-events-none pt-24"
           >
              {/* Invisible touch backdrop to close */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsTrayExpanded(false)}
                className="absolute inset-0 bg-transparent pointer-events-auto"
              />

              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-10 right-10 p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white rounded-full z-[110] transition-colors pointer-events-auto shadow-2xl"
                onClick={() => setIsTrayExpanded(false)}
              >
                <X className="w-8 h-8" />
              </motion.button>

              <motion.div
                initial={{ scale: 0.2, y: 350, opacity: 0 }}
                animate={{ scale: 0.85, y: 0, opacity: 1 }}
                exit={{ scale: 0.2, y: 350, opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                className="w-full max-w-5xl relative pointer-events-auto drop-shadow-[0_60px_120px_rgba(0,0,0,0.4)]"
                onClick={(e) => e.stopPropagation()}
              >
                <ScalableITUYemekhaneTray menu={mockMenu} isMock={true} />
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
