"use client";

import React from "react";
import { MiniApp } from "@/lib/apps";
import { useRouter } from "next/navigation";
import { CaretRight } from "@phosphor-icons/react";

interface MiniAppCardProps {
  app: MiniApp;
}

export default function MiniAppCard({ app }: MiniAppCardProps) {
  const router = useRouter();
  const Icon = app.icon;

  return (
    <button
      onClick={() => router.push(app.href)}
      className="group relative flex flex-col items-start p-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 active:scale-[0.98] text-left overflow-hidden"
    >
      {/* Background Accent */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150"
        style={{ backgroundColor: app.color }}
      />

      {/* Icon Wrapper */}
      <div 
        className="mb-4 p-3 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        style={{ backgroundColor: `${app.color}15`, color: app.color }}
      >
        <Icon size={28} weight="duotone" />
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
            {app.name}
          </h3>
          <CaretRight size={14} weight="bold" className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {app.description}
        </p>
      </div>

      {/* Status Badge (if needed) */}
      {!app.isImplemented && (
        <div className="mt-3 px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-full border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-400 group-hover:border-indigo-100 transition-colors">
          Soon
        </div>
      )}
      {app.isImplemented && (
        <div className="mt-3 px-2 py-0.5 bg-emerald-50 text-[10px] font-bold text-emerald-600 rounded-full border border-emerald-100">
          Live
        </div>
      )}
    </button>
  );
}
