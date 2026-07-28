"use client";

import { DeviceChromeConfig } from "../device-chrome";
import {
  IosDynamicIsland,
  IosHomeIndicator,
  IosStatusBar,
} from "@/components/device/IosDeviceChrome";

interface DeviceChromeOverlayProps {
  chrome: DeviceChromeConfig;
  width: number;
  theme?: "light" | "dark";
  presetId?: string;
}

export function DeviceChromeOverlay({ chrome, width, theme = "dark", presetId }: DeviceChromeOverlayProps) {
  const scale = width >= 768 ? width / 1024 : width / 430;

  return (
    <>
      {(presetId === "iphone-67" || presetId === "iphone-65") && (
        <IosDynamicIsland scale={scale} />
      )}

      <IosStatusBar theme={theme} scale={scale} top={chrome.top} />

      {chrome.bottom > 0 && (
        <IosHomeIndicator theme={theme} scale={scale} bottom={chrome.bottom} />
      )}
    </>
  );
}
