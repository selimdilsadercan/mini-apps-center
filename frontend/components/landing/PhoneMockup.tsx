"use client";

import React from "react";
import {
  LANDING_PHONE_SCREEN,
  StorePreviewDeviceFrame,
} from "@/components/device/IosDeviceChrome";

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
      <StorePreviewDeviceFrame
        screenWidth={LANDING_PHONE_SCREEN.width}
        screenHeight={LANDING_PHONE_SCREEN.height}
      >
        {children}
      </StorePreviewDeviceFrame>
    </div>
  );
};

export default PhoneMockup;
