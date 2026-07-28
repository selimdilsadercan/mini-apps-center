"use client";

import React from "react";

/** iPhone 15 Pro logical width — used to scale chrome for smaller mockups */
export const IOS_REFERENCE_WIDTH = 430;

export function IosStatusIcons({ theme }: { theme: "light" | "dark" }) {
  const color = theme === "light" ? "bg-black" : "bg-white";
  const borderCol = theme === "light" ? "border-black/30" : "border-white/40";
  const fillCol = theme === "light" ? "#000000" : "#FFFFFF";
  const capCol = theme === "light" ? "bg-black/30" : "bg-white/40";

  return (
    <div className="flex items-center gap-[6px]">
      <div className="flex items-end gap-[1.5px] h-[10px] pb-[0.5px]">
        <div className={`w-[3px] h-[3px] rounded-[0.8px] ${color}`} />
        <div className={`w-[3px] h-[5px] rounded-[0.8px] ${color}`} />
        <div className={`w-[3px] h-[7.5px] rounded-[0.8px] ${color}`} />
        <div className={`w-[3px] h-[10px] rounded-[0.8px] ${color}`} />
      </div>

      <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.5 11C8.2 11 8.7 10.5 8.7 9.8C8.7 9.1 8.2 8.6 7.5 8.6C6.8 8.6 6.3 9.1 6.3 9.8C6.3 10.5 6.8 11 7.5 11ZM11.1 7.4C9.1 5.4 5.9 5.4 3.9 7.4L5.1 8.6C6.4 7.3 8.6 7.3 9.9 8.6L11.1 7.4ZM13.5 5C10.2 1.7 4.8 1.7 1.5 5L2.7 6.2C5.3 3.6 9.7 3.6 12.3 6.2L13.5 5ZM15 2.5C10.9 -1.6 4.1 -1.6 0 2.5L1.2 3.7C4.6 0.3 10.4 0.3 13.8 3.7L15 2.5Z"
          fill={fillCol}
        />
      </svg>

      <div className="relative w-[22px] h-[11.5px] flex items-center">
        <div className={`absolute inset-0 rounded-[3.5px] border ${borderCol}`} />
        <div className={`absolute inset-[2px] rounded-[1.5px] ${color}`} />
        <div className={`absolute -right-[2.5px] top-[3.75px] w-[1.5px] h-[4px] rounded-r-[1px] ${capCol}`} />
      </div>
    </div>
  );
}

export function IosDynamicIsland({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-full z-30 pointer-events-none flex items-center justify-start"
      style={{
        width: 110 * scale,
        height: 30 * scale,
        marginTop: 11 * scale,
        paddingLeft: 18 * scale,
      }}
    >
      <div
        className="rounded-full bg-radial from-[#1e293b] via-[#0f172a] to-[#020617] border border-white/12 relative flex items-center justify-center shadow-inner"
        style={{
          width: 8.5 * scale,
          height: 8.5 * scale,
        }}
      >
        <div
          className="absolute rounded-full bg-[#38bdf8]/60 blur-[0.1px]"
          style={{
            width: 2 * scale,
            height: 2 * scale,
            top: 1.5 * scale,
            left: 1.5 * scale,
          }}
        />
        <div
          className="absolute rounded-full bg-[#818cf8]/50"
          style={{
            width: 1.5 * scale,
            height: 1.5 * scale,
            bottom: 1.5 * scale,
            right: 1.5 * scale,
          }}
        />
      </div>
    </div>
  );
}

export function IosStatusBar({
  theme = "dark",
  scale = 1,
  top = 47,
}: {
  theme?: "light" | "dark";
  scale?: number;
  top?: number;
}) {
  const textColorClass = theme === "light" ? "text-black" : "text-white";

  return (
    <div
      className={`absolute top-0 inset-x-0 z-20 pointer-events-none bg-transparent flex items-center justify-between ${textColorClass}`}
      style={{
        height: top * scale,
        paddingLeft: 32 * scale,
        paddingRight: 32 * scale,
      }}
    >
      <span className="font-semibold leading-none" style={{ fontSize: 14.5 * scale }}>
        9:41
      </span>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "right center" }}>
        <IosStatusIcons theme={theme} />
      </div>
    </div>
  );
}

export function IosHomeIndicator({
  theme = "dark",
  scale = 1,
  bottom = 34,
}: {
  theme?: "light" | "dark";
  scale?: number;
  bottom?: number;
}) {
  const barColor = theme === "light" ? "bg-black/80" : "bg-white/90";

  return (
    <div
      className="absolute bottom-0 inset-x-0 z-20 flex items-end justify-center pointer-events-none bg-transparent"
      style={{ height: bottom * scale, paddingBottom: 8 * scale }}
    >
      <div
        className={`rounded-full ${barColor}`}
        style={{ width: 134 * scale, height: 5 * scale }}
      />
    </div>
  );
}

export const STORE_PREVIEW_BEZEL = 6;

/** Outer device bezel — matches Store Preview app frame */
export function StorePreviewDeviceFrame({
  children,
  screenWidth,
  screenHeight,
  className = "",
}: {
  children: React.ReactNode;
  screenWidth: number;
  screenHeight: number;
  className?: string;
}) {
  const bezel = STORE_PREVIEW_BEZEL;

  return (
    <div
      className={`shrink-0 rounded-[2rem] bg-zinc-950 p-[6px] shadow-2xl ring-1 ring-zinc-800 ${className}`}
      style={{
        width: screenWidth + bezel * 2,
        height: screenHeight + bezel * 2,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[1.5rem] bg-black"
        style={{ width: screenWidth, height: screenHeight }}
      >
        {children}
      </div>
    </div>
  );
}

/** Landing phone mockup screen size (inner) */
export const LANDING_PHONE_SCREEN = { width: 268, height: 548 } as const;
