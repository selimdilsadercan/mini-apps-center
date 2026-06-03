"use client";

import React from "react";
import { 
  CreditCard, 
  Trophy, 
  YoutubeLogo, 
  Timer, 
  Basket, 
  Palette,
  Sparkle,
  House,
  Compass,
  User
} from "@phosphor-icons/react";

interface PhoneScreenProps {
  children?: React.ReactNode;
}

const PhoneScreen: React.FC<PhoneScreenProps> = ({ children }) => {
  // We can render a mock dashboard if no children are provided
  const mockApps = [
    { name: "Subcenter", icon: CreditCard, color: "#339AF0" },
    { name: "Tasket", icon: CreditCard, color: "#20c997" }, // using fallback or matching icons
    { name: "Pomodoro", icon: Timer, color: "#4dabf7" },
    { name: "Kiler", icon: Basket, color: "#40C057" },
    { name: "Turnuva", icon: Trophy, color: "#FCC419" },
    { name: "Guides", icon: Palette, color: "#4C6EF5" },
    { name: "Discover", icon: YoutubeLogo, color: "#FF0000" },
  ];

  return (
    <div className="h-full w-full bg-[#FAF9F7] flex flex-col justify-between select-none relative pt-8">
      {/* Top Status Bar Mock */}
      <div className="absolute top-2 left-0 right-0 px-6 flex justify-between items-center text-[10px] text-gray-500 font-bold z-10">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-gray-500 rounded-full" />
          <span className="w-3 h-2 bg-gray-500 rounded-sm" />
        </div>
      </div>

      {children ? (
        children
      ) : (
        <>
          {/* Main Area */}
          <div className="flex-1 px-4 pt-4 overflow-y-auto pb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                Everything
                <Sparkle size={14} weight="fill" className="text-indigo-600 animate-pulse" />
              </h2>
              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <span className="text-[9px] font-bold text-indigo-600">U</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-3">
              {mockApps.map((app, index) => {
                const Icon = app.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-1.5">
                    <div 
                      className="w-12 h-12 rounded-[1rem] flex items-center justify-center relative overflow-hidden shadow-md"
                      style={{ 
                        backgroundColor: app.color,
                        boxShadow: `0 4px 12px -3px ${app.color}40`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                      <Icon size={22} weight="fill" color="white" />
                    </div>
                    <span className="text-[9px] font-black text-gray-700 truncate w-full text-center">
                      {app.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar Mock */}
          <div className="h-12 bg-white/90 backdrop-blur-md border-t border-gray-100 flex items-center justify-around px-2 shrink-0 pb-1.5 z-10">
            <div className="text-indigo-600 flex flex-col items-center">
              <House size={16} weight="fill" />
              <span className="text-[7px] font-bold mt-0.5">Hub</span>
            </div>
            <div className="text-gray-400 flex flex-col items-center">
              <Compass size={16} />
              <span className="text-[7px] font-bold mt-0.5">Explore</span>
            </div>
            <div className="text-gray-400 flex flex-col items-center">
              <User size={16} />
              <span className="text-[7px] font-bold mt-0.5">Profile</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PhoneScreen;
