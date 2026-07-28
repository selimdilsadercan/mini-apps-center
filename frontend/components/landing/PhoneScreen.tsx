"use client";

import React from "react";
import LandingPhoneAppPreview from "./LandingPhoneAppPreview";
import {
  IOS_REFERENCE_WIDTH,
  IosDynamicIsland,
  IosHomeIndicator,
  IosStatusBar,
  LANDING_PHONE_SCREEN,
} from "@/components/device/IosDeviceChrome";

interface PhoneScreenProps {
  children?: React.ReactNode;
  viewportWidth?: number;
  statusBarTheme?: "light" | "dark";
}

const PhoneScreen: React.FC<PhoneScreenProps> = ({
  children,
  viewportWidth = LANDING_PHONE_SCREEN.width,
  statusBarTheme = "dark",
}) => {
  const scale = viewportWidth / IOS_REFERENCE_WIDTH;

  return (
    <div className="h-full w-full flex flex-col select-none relative font-sans overflow-hidden">
      <IosDynamicIsland scale={scale} />
      <IosStatusBar theme={statusBarTheme} scale={scale} />
      <IosHomeIndicator theme={statusBarTheme} scale={scale} />

      {children ? (
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      ) : (
        <LandingPhoneAppPreview />
      )}
    </div>
  );
};

export default PhoneScreen;
