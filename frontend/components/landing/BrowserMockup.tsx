"use client";

import React from "react";
import { Globe, ArrowLeft, ArrowRight, ArrowClockwise } from "@phosphor-icons/react";

interface BrowserMockupProps {
  children: React.ReactNode;
  url: string;
  className?: string;
}

const BrowserMockup: React.FC<BrowserMockupProps> = ({
  children,
  url,
  className = "",
}) => {
  return (
    <div className={`relative w-full max-w-[460px] ${className}`}>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5 w-16">
            <span className="w-3 h-3 bg-red-500/80 rounded-full" />
            <span className="w-3 h-3 bg-yellow-500/80 rounded-full" />
            <span className="w-3 h-3 bg-green-500/80 rounded-full" />
          </div>

          <div className="flex-1 flex items-center gap-3 max-w-sm">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <ArrowLeft size={12} weight="bold" />
              <ArrowRight size={12} weight="bold" />
              <ArrowClockwise size={12} weight="bold" />
            </div>

            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <Globe size={11} className="text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-400 truncate select-all">
                {url}
              </span>
            </div>
          </div>

          <div className="w-16" />
        </div>

        <div className="flex-1 bg-zinc-950 overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BrowserMockup;
