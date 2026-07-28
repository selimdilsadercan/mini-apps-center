"use client";

import React from "react";
import { getPublishedAppById } from "@/lib/app-catalog";

interface DirectoryAppIconProps {
  appId: string;
  size?: "md" | "lg";
}

export function DirectoryAppIcon({ appId, size = "lg" }: DirectoryAppIconProps) {
  const app = getPublishedAppById(appId);
  if (!app) return null;

  const Icon = app.icon;
  const box = size === "lg" ? "w-16 h-16 rounded-2xl" : "w-12 h-12 rounded-xl";
  const iconSize = size === "lg" ? 32 : 24;

  return (
    <div
      className={`${box} flex items-center justify-center text-white shadow-lg shrink-0`}
      style={{ backgroundColor: app.color }}
    >
      <Icon size={iconSize} weight="fill" />
    </div>
  );
}
