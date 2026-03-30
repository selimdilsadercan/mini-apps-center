"use client";

import React from "react";
import { MiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";

interface MiniAppIconProps {
  app: MiniApp;
}

export default function MiniAppIcon({ app }: MiniAppIconProps) {
  const router = useRouter();
  const Icon = app.icon;

  return (
    <button
      onClick={() => router.push(app.href)}
      className="flex flex-col items-center group gap-2 active:scale-90 transition-all duration-200"
    >
      {/* Icon Container - Squircle style */}
      <div 
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-indigo-200"
        style={{ 
          backgroundColor: app.color, 
          boxShadow: `0 8px 24px -6px ${app.color}40`,
        }}
      >
        {/* Soft Inner Gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
        
        {/* White Inner Glow for premium feel */}
        <div className="absolute inset-0 border border-white/20 rounded-[1.5rem]"></div>

        <Icon size={32} weight="fill" color="white" className="relative z-10 transition-transform duration-300 group-hover:rotate-6 sm:size-40 size-32" />
      </div>

      {/* App Name */}
      <span className="text-[11px] sm:text-xs font-bold text-gray-800 text-center line-clamp-1 w-full tracking-tight px-1 group-hover:text-indigo-600 transition-colors">
        {app.name}
      </span>
    </button>
  );
}
