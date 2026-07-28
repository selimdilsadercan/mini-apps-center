"use client";

import React from "react";

export function LandingPhonePreviewFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="dark h-full w-full overflow-hidden bg-app-bg text-app-text select-none pointer-events-none">
      <div
        className={`origin-top-left scale-[0.68] w-[390px] px-5 pt-16 pb-6 ${className}`}
        style={{ transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
