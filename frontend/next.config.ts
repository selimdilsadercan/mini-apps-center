import type { NextConfig } from "next";

// Static export is only needed for Capacitor (Android) builds.
// Middleware requires the default Next.js server mode.
const isCapacitorBuild = process.env.NEXT_PUBLIC_CAPACITOR === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isCapacitorBuild ? { output: "export" } : {}),
};

export default nextConfig;
