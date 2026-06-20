import type { NextConfig } from "next";

const isCapacitorBuild = process.env.NEXT_PUBLIC_CAPACITOR === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isCapacitorBuild ? { 
    output: "export",
    typedRoutes: false,
    typescript: {
      ignoreBuildErrors: true,
    }
  } : {}),
};

export default nextConfig;
