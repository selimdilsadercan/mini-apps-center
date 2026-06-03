"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Trophy, 
  Timer, 
  Basket, 
  Sparkle,
  Checks,
  Plus
} from "@phosphor-icons/react";
import PhoneMockup from "../PhoneMockup";
import PhoneScreen from "../PhoneScreen";
import { useTranslations } from "@/contexts/LanguageContext";

interface AppData {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  descriptionKey: string;
  mockRender: () => React.ReactNode;
}

const AppPreviewSection: React.FC = () => {
  const t = useTranslations("AppPreview");
  const [selectedAppId, setSelectedAppId] = useState<string>("subcenter");

  // Define custom mock screens for apps inside the Phone
  const apps: AppData[] = [
    {
      id: "subcenter",
      name: "Subcenter",
      category: "Utilities",
      icon: CreditCard,
      color: "#339AF0",
      descriptionKey: "Subcenter",
      mockRender: () => (
        <div className="p-4 bg-gray-50 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-gray-500">Subscriptions</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">3 Active</span>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm mb-4">
              <span className="text-[10px] text-gray-400 font-bold block mb-1">Monthly Cost</span>
              <span className="text-xl font-black text-gray-900">₺189.90</span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Netflix", cost: "₺119.90", color: "#E50914" },
                { name: "Spotify", cost: "₺39.99", color: "#1DB954" },
                { name: "iCloud", cost: "₺29.99", color: "#007AFF" }
              ].map((sub, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: sub.color }}>
                      {sub.name[0]}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700">{sub.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-900">{sub.cost}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-[10px] font-bold shadow-md shadow-blue-100">
            + Add Subscription
          </button>
        </div>
      )
    },
    {
      id: "tasket",
      name: "Tasket",
      category: "Utilities",
      icon: Checks,
      color: "#20c997",
      descriptionKey: "Tasket",
      mockRender: () => (
        <div className="p-4 bg-gray-50 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-gray-500">My Tasket</span>
              <span className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-bold">2 Remaining</span>
            </div>

            <div className="space-y-2">
              {[
                { text: "Go to grocery store", done: true },
                { text: "Update subscription limits", done: false },
                { text: "Read 10 pages of book", done: false }
              ].map((todo, i) => (
                <div key={i} className={`flex items-center gap-2 bg-white border border-gray-100 p-2.5 rounded-xl shadow-xs ${todo.done ? 'opacity-60' : ''}`}>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${todo.done ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300'}`}>
                    {todo.done && <Checks size={10} weight="bold" />}
                  </div>
                  <span className={`text-[10px] font-bold ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add task..." disabled className="flex-1 bg-white border border-gray-100 px-3 py-1.5 rounded-xl text-[9px]" />
            <button className="bg-teal-500 text-white p-2 rounded-xl">
              <Plus size={12} weight="bold" />
            </button>
          </div>
        </div>
      )
    },
    {
      id: "pomodoro",
      name: "Melt & Work",
      category: "Utilities",
      icon: Timer,
      color: "#4dabf7",
      descriptionKey: "pomodoro",
      mockRender: () => (
        <div className="p-4 bg-slate-900 h-full flex flex-col justify-between text-white items-center text-center">
          <div className="w-full flex justify-between text-[9px] text-slate-400 font-bold">
            <span>Focus Mode</span>
            <span>Melt & Work</span>
          </div>

          <div className="flex flex-col items-center">
            {/* Melting Ice Box Mock */}
            <div className="w-24 h-24 rounded-3xl bg-blue-400/20 border border-blue-400/30 flex items-center justify-center relative mb-4 overflow-hidden">
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500/40 h-2/3 rounded-b-2xl animate-pulse" />
              <span className="text-xl font-black text-white relative z-10">24:59</span>
            </div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Ice is Melting</span>
          </div>

          <button className="w-full bg-blue-500 text-white py-2 rounded-xl text-[10px] font-bold shadow-md shadow-blue-900/50">
            Pause Timer
          </button>
        </div>
      )
    },
    {
      id: "tournament-manager",
      name: "Turnuva",
      category: "Board Games",
      icon: Trophy,
      color: "#FCC419",
      descriptionKey: "tournament",
      mockRender: () => (
        <div className="p-4 bg-gray-50 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-gray-500">Championship Bracket</span>
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">Semis</span>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-100 p-2.5 rounded-xl shadow-xs space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-700 border-b border-gray-100 pb-1">
                  <span>Player A</span>
                  <span className="text-emerald-500">3</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-500">
                  <span>Player B</span>
                  <span>1</span>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-2.5 rounded-xl shadow-xs space-y-2">
                <div className="flex justify-between text-[9px] font-bold text-gray-500 border-b border-gray-100 pb-1">
                  <span>Player C</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-700">
                  <span>Player D</span>
                  <span className="text-emerald-500">2</span>
                </div>
              </div>
            </div>
          </div>
          <button className="w-full bg-yellow-500 text-gray-900 py-2 rounded-xl text-[10px] font-bold shadow-md">
            Next Round
          </button>
        </div>
      )
    },
    {
      id: "kiler",
      name: "Kiler",
      category: "Lifestyle",
      icon: Basket,
      color: "#40C057",
      descriptionKey: "kiler",
      mockRender: () => (
        <div className="p-4 bg-gray-50 h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[11px] font-bold text-gray-500">Pantry Items</span>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">2 Expiring</span>
            </div>

            <div className="space-y-2">
              {[
                { name: "Milk", expiry: "Today", critical: true },
                { name: "Yogurt", expiry: "Tomorrow", critical: true },
                { name: "Eggs", expiry: "In 5 days", critical: false }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-white border border-gray-100 p-2.5 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold text-gray-700">{item.name}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${item.critical ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                    {item.expiry}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full bg-green-500 text-white py-2 rounded-xl text-[10px] font-bold shadow-md shadow-green-100">
            Open Inventory
          </button>
        </div>
      )
    }
  ];

  const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];

  return (
    <section
      id="apps"
      className="py-24 relative overflow-hidden bg-white"
    >
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-[450px] h-[450px] bg-indigo-100/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-[450px] h-[450px] bg-purple-100/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-4 shadow-sm"
          >
            {t("badge")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto font-semibold leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="flex flex-col gap-12">
          {/* Apps Horizontal Selector */}
          <div className="w-full overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar flex justify-start sm:justify-center">
            <div className="flex gap-3">
              {apps.map((app, index) => {
                const Icon = app.icon;
                const isSelected = selectedAppId === app.id;
                return (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                        : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
                    }`}
                  >
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: app.color }}
                    >
                      <Icon size={16} color="white" weight="fill" />
                    </div>
                    <span className="text-xs font-bold">{app.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Interactive Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto w-full pt-6">
            {/* Left - Phone Preview */}
            <div className="flex justify-center order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
              >
                <PhoneMockup>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedApp.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full w-full"
                    >
                      <PhoneScreen>
                        {selectedApp.mockRender()}
                      </PhoneScreen>
                    </motion.div>
                  </AnimatePresence>
                </PhoneMockup>
              </motion.div>
            </div>

            {/* Right - App Details Info */}
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-1 lg:order-2 space-y-6 text-center lg:text-left"
            >
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100"
                  style={{ backgroundColor: selectedApp.color }}
                >
                  <selectedApp.icon size={28} weight="fill" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                    {selectedApp.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold uppercase tracking-wider mt-1 justify-center lg:justify-start">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    {t("tryLive")}
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                <p className="text-gray-600 text-base leading-relaxed mb-6 font-semibold">
                  {/* Since translations are dynamically resolved: */}
                  {selectedApp.id === "subcenter" && "Track all your subscriptions & spending. Get notifications when your cards are about to be charged."}
                  {selectedApp.id === "tasket" && "Collect your thoughts, todo lists, and notes in your bucket. Organize and sweep through tasks effortlessly."}
                  {selectedApp.id === "pomodoro" && "Focus on your tasks with a gorgeous melting ice block animation helper. Work while the ice melts!"}
                  {selectedApp.id === "tournament-manager" && "Create, edit, and organize leagues, knockouts, or custom brackets. Share results instantly."}
                  {selectedApp.id === "kiler" && "Manage your home pantry, track shelf life of ingredients, and cook before they expire."}
                  {" "}{t("descriptionSuffix")}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                      {t("difficulty")}
                    </p>
                    <p className="text-gray-800 font-bold text-sm">
                      {selectedApp.category}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                      {t("players")}
                    </p>
                    <p className="text-gray-800 font-bold text-sm">
                      Everything Team
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a
                  href="/home" 
                  className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-95 text-center"
                >
                  {t("playNow")}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;
