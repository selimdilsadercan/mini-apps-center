"use client";

import { startOTABootstrap } from "@/lib/ota-build";

if (typeof window !== "undefined") {
  startOTABootstrap();
}

export default function OtaBootstrap() {
  return null;
}
