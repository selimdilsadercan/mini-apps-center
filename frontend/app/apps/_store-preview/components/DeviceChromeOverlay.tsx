"use client";

import { DeviceChromeConfig } from "../device-chrome";

function StatusIcons() {
  return (
    <div className="flex items-center gap-[5px]">
      <div className="flex items-end gap-[2px] h-[10px]">
        {[6, 8, 10, 12].map((h) => (
          <div
            key={h}
            className="w-[3px] rounded-[1px] bg-white"
            style={{ height: h }}
          />
        ))}
      </div>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
        <path
          d="M8 2.5C10.5 2.5 12.7 3.6 14.2 5.3L15.5 3.8C13.6 1.7 11 0.5 8 0.5C5 0.5 2.4 1.7 0.5 3.8L1.8 5.3C3.3 3.6 5.5 2.5 8 2.5Z"
          fill="white"
        />
        <path
          d="M8 5.5C9.6 5.5 11.1 6.1 12.1 7.2L13.4 5.7C12 4.4 10.1 3.5 8 3.5C5.9 3.5 4 4.4 2.6 5.7L3.9 7.2C4.9 6.1 6.4 5.5 8 5.5Z"
          fill="white"
        />
        <circle cx="8" cy="9.5" r="1.5" fill="white" />
      </svg>
      <div className="flex items-center">
        <div className="w-[22px] h-[10px] rounded-[2px] border-[1.5px] border-white relative">
          <div className="absolute inset-[1.5px] right-[3px] bg-white rounded-[1px]" />
        </div>
        <div className="w-[1.5px] h-[4px] bg-white rounded-r-sm ml-[1px]" />
      </div>
    </div>
  );
}

interface DeviceChromeOverlayProps {
  chrome: DeviceChromeConfig;
  width: number;
}

export function DeviceChromeOverlay({ chrome, width }: DeviceChromeOverlayProps) {
  const scale = width >= 768 ? width / 1024 : width / 430;

  return (
    <>
      <div
        className="absolute top-0 inset-x-0 z-20 pointer-events-none bg-black flex items-center justify-between text-white"
        style={{
          height: chrome.top,
          paddingLeft: 28 * scale,
          paddingRight: 28 * scale,
        }}
      >
        <span
          className="font-semibold leading-none"
          style={{ fontSize: 15 * scale }}
        >
          9:41
        </span>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "right center" }}>
          <StatusIcons />
        </div>
      </div>

      {chrome.bottom > 0 && (
        <div
          className="absolute bottom-0 inset-x-0 z-20 flex items-end justify-center pointer-events-none bg-black"
          style={{ height: chrome.bottom, paddingBottom: 8 * scale }}
        >
          <div
            className="bg-white/90 rounded-full"
            style={{ width: 134 * scale, height: 5 * scale }}
          />
        </div>
      )}
    </>
  );
}
