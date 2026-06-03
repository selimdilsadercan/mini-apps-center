"use client";

import React from "react";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Phone Frame */}
      <div className="relative w-[280px] h-[560px] bg-slate-950 rounded-[3rem] ring-4 ring-slate-800 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
          <div className="w-28 h-6 bg-slate-950 rounded-b-2xl" />
        </div>

        {/* Screen */}
        <div className="absolute inset-1.5 rounded-[2.7rem] overflow-clip">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-600 rounded-full z-20" />
      </div>

      {/* Glow Effects */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-[3.5rem] blur-2xl opacity-50 -z-10" />
    </div>
  );
};

export default PhoneMockup;
